import os
import time
import torch
import torch.nn as nn
import torch.nn.functional as F

try:
    from unsloth import FastLanguageModel
    UNSLOTH_AVAILABLE = True
except Exception:
    UNSLOTH_AVAILABLE = False
    print("⚠️ Unsloth not available — running in simulation mode.")

# ============================================================
# RAT ARCHITECTURE — must match training exactly
# ============================================================

def safe(x):
    return torch.nan_to_num(x, nan=0.0, posinf=10.0, neginf=-10.0)

class InterpretationHead(nn.Module):
    def __init__(self, dim):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(dim, dim), nn.SiLU(), nn.Linear(dim, dim))
        self.norm = nn.LayerNorm(dim)
    def forward(self, x): return self.norm(self.net(x))

class ContradictionEngine(nn.Module):
    def __init__(self, dim):
        super().__init__()
        self.cross_attn = nn.MultiheadAttention(embed_dim=dim, num_heads=8, batch_first=True)
        self.proj = nn.Sequential(nn.Linear(dim * 4, dim * 2), nn.GELU(), nn.Linear(dim * 2, dim))
        self.output_norm = nn.LayerNorm(dim)
    def forward(self, heads):
        all_tensions = []
        for i in range(len(heads)):
            for j in range(i + 1, len(heads)):
                if i == j: continue
                a, b = F.normalize(heads[i], dim=-1), F.normalize(heads[j], dim=-1)
                seq_len = a.size(1)
                causal_mask = torch.triu(torch.ones(seq_len, seq_len, device=a.device) * float('-inf'), diagonal=1)
                attn_out, _ = self.cross_attn(a, b, b, attn_mask=causal_mask, is_causal=True, need_weights=False)
                attn_out = attn_out / (attn_out.norm(dim=-1, keepdim=True) + 1e-6)
                feat = torch.cat([attn_out, b, torch.abs(attn_out - b), attn_out * b], dim=-1)
                all_tensions.append(torch.tanh(self.proj(feat)))
        if not all_tensions: return torch.zeros_like(heads[0])
        return self.output_norm(torch.stack(all_tensions, dim=0).mean(dim=0))

class SelfStateModule(nn.Module):
    def __init__(self, dim, state_dim):
        super().__init__()
        self.energy_proj = nn.Linear(dim, dim)
        self.input_norm  = nn.LayerNorm(dim)
        self.encoder = nn.Sequential(nn.Linear(dim, dim), nn.SiLU(), nn.Linear(dim, state_dim))
        self.expand = nn.Linear(state_dim, dim)
    def forward(self, hidden, contradiction_summary):
        state = self.encoder(self.input_norm(hidden + self.energy_proj(contradiction_summary)))
        return state, self.expand(state)

class ReflectionBlock(nn.Module):
    def __init__(self, dim):
        super().__init__()
        self.update = nn.Sequential(nn.Linear(dim * 3, dim), nn.SiLU(), nn.Linear(dim, dim))
        self.gru = nn.GRUCell(dim, dim, bias=False)
        self.norm = nn.LayerNorm(dim)
    def forward(self, h, self_state_expanded, contradiction_summary):
        delta = torch.tanh(self.update(torch.cat([h, self_state_expanded, contradiction_summary], dim=-1)))
        delta = delta / (delta.std(dim=-1, keepdim=True).clamp(min=0.1))
        B, T, D = h.shape
        return self.norm(self.gru(delta.reshape(-1, D), h.reshape(-1, D)).view(B, T, D))

class ArbitrationFusion(nn.Module):
    def __init__(self, dim, n_heads, temperature=2.0):
        super().__init__()
        self.temperature = temperature
        self.router = nn.Sequential(nn.Linear(dim * 2, dim), nn.GELU(), nn.Linear(dim, n_heads))
        self.final_proj = nn.Linear(dim, dim)
        self.output_norm = nn.LayerNorm(dim)
    def forward(self, interpretations, self_state_expanded):
        stacked = torch.stack(interpretations, dim=2)
        logits = torch.clamp(self.router(torch.cat([stacked.mean(dim=2), self_state_expanded], dim=-1)), -30, 30)
        logits = logits - logits.mean(dim=-1, keepdim=True)
        weights = safe(F.softmax(logits / (self.temperature + 1e-6), dim=-1))
        return self.output_norm(self.final_proj((stacked * weights.unsqueeze(-1)).sum(dim=2))), weights

class RATBlock(nn.Module):
    def __init__(self, dim=2048, n_interpretations=4, state_dim=256, n_reflections=2):
        super().__init__()
        self.n_reflections = n_reflections
        self.heads = nn.ModuleList([InterpretationHead(dim) for _ in range(n_interpretations)])
        self.contradiction = ContradictionEngine(dim)
        self.self_state = SelfStateModule(dim, state_dim)
        self.reflection = ReflectionBlock(dim)
        self.arbitration = ArbitrationFusion(dim, n_interpretations)
    def forward(self, hidden):
        interpretations = [h(hidden) for h in self.heads]
        contradiction_summary = self.contradiction(interpretations)
        _, expanded_state = self.self_state(hidden, contradiction_summary)
        revised_heads = []
        for h in interpretations:
            revised_h = h
            for _ in range(self.n_reflections):
                revised_h = self.reflection(revised_h, expanded_state, contradiction_summary)
            revised_heads.append(revised_h)
        fused, _ = self.arbitration(revised_heads, expanded_state)
        return {"hidden": safe(fused)}

class MistralRAT(nn.Module):
    def __init__(self, base_model, rat_insert_layer=12):
        super().__init__()
        self.base_model = base_model
        self.rat_insert_layer = rat_insert_layer
        self.down_proj = nn.Linear(4096, 2048)
        self.up_proj = nn.Linear(2048, 4096)
        self.rat = RATBlock(dim=2048, n_interpretations=4, state_dim=256, n_reflections=2)

    def forward(self, input_ids, attention_mask, rat_alpha=0.05):
        transformer_layers = self.base_model.model.model.layers
        B, T = input_ids.shape
        RUNTIME_DEVICE = input_ids.device
        position_ids = torch.arange(T, device=RUNTIME_DEVICE).unsqueeze(0).expand(B, -1)
        hidden = self.base_model.model.model.embed_tokens(input_ids)

        for idx in range(self.rat_insert_layer + 1):
            LAYER_DEVICE = transformer_layers[idx].input_layernorm.weight.device
            hidden = hidden.to(LAYER_DEVICE)
            attention_mask = attention_mask.to(LAYER_DEVICE)
            position_ids = position_ids.to(LAYER_DEVICE)
            hidden = transformer_layers[idx](hidden, attention_mask=attention_mask, position_ids=position_ids, use_cache=False)[0]

        self.down_proj = self.down_proj.to(hidden.device)
        H_small = self.down_proj(hidden).to(torch.float32)
        self.rat = self.rat.to(hidden.device)
        rat_out = self.rat(H_small)
        self.up_proj = self.up_proj.to(hidden.device)
        rat_signal_4096 = self.up_proj(rat_out["hidden"]).to(hidden.dtype)
        hidden = hidden + (rat_alpha * rat_signal_4096)

        for idx in range(self.rat_insert_layer + 1, len(transformer_layers)):
            NEXT_LAYER_DEVICE = transformer_layers[idx].input_layernorm.weight.device
            hidden = hidden.to(NEXT_LAYER_DEVICE)
            attention_mask = attention_mask.to(NEXT_LAYER_DEVICE)
            position_ids = position_ids.to(NEXT_LAYER_DEVICE)
            hidden = transformer_layers[idx](hidden, attention_mask=attention_mask, position_ids=position_ids, use_cache=False)[0]

        hidden = self.base_model.model.model.norm(hidden)
        logits = self.base_model.model.lm_head(hidden)
        return logits


# ============================================================
# CHIEF JUSTICE RAT — inference class for FastAPI
# ============================================================

class ChiefJusticeRAT:
    def __init__(self):
        self.rat_model = None
        self.tokenizer = None
        self.is_loaded = False
        # Flag to indicate if we are in CPU mock mode
        self.is_mock_mode = False 

    def boot_engine(self):
        print("⚙️ Waking up Mistral-RAT Chief Justice...")

        if not UNSLOTH_AVAILABLE or not torch.cuda.is_available():
            print("⚠️ Simulation mode activated — missing Unsloth or CUDA GPU.")
            self.is_mock_mode = True
            self.is_loaded = True
            return

        current_dir = os.path.dirname(os.path.abspath(__file__))
        weights_path = os.path.join(current_dir, "weights", "mistral_rat_v6_production.pt")

        print(f"🔍 Checking for weights at: {weights_path}")
        if not os.path.exists(weights_path):
            print(f"❌ Weights not found at {weights_path}. Entering Simulation Mode.")
            self.is_mock_mode = True
            self.is_loaded = True
            return

        try:
            print("Loading base model...")
            base_model, self.tokenizer = FastLanguageModel.from_pretrained(
                model_name="unsloth/mistral-7b-instruct-v0.2-bnb-4bit",
                max_seq_length=728,
                load_in_4bit=True,
            )
            base_model = FastLanguageModel.get_peft_model(
                base_model,
                r=16,
                target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
                lora_alpha=32,
                lora_dropout=0,
                bias="none",
                use_gradient_checkpointing=False,
            )

            print("Wrapping RAT architecture...")
            self.rat_model = MistralRAT(base_model, rat_insert_layer=12)

            print(f"💉 Injecting trained weights from {weights_path}...")
            ckpt = torch.load(weights_path, map_location="cpu")
            self.rat_model.load_state_dict(ckpt["model_state_dict"], strict=False)
            self.rat_model.eval()

            self.is_loaded = True
            print("⚖️ Chief Justice is online.")

        except Exception as e:
            print(f"❌ Error loading heavy weights: {str(e)}")
            print("🛡️ Falling back to Simulation Mode.")
            self.is_mock_mode = True
            self.is_loaded = True

    def _generate(self, prompt: str) -> str:
        """Shared generation loop used by both arbitrate() and generate_chat_reply()."""
        INIT_DEVICE = self.rat_model.base_model.model.model.embed_tokens.weight.device
        input_ids = self.tokenizer(prompt, return_tensors="pt").input_ids.to(INIT_DEVICE)
        prompt_length = input_ids.shape[1]

        for _ in range(900):
            CURRENT_DEVICE = input_ids.device
            attention_mask = torch.ones_like(input_ids).to(CURRENT_DEVICE)
            with torch.no_grad():
                with torch.amp.autocast("cuda", dtype=torch.float16):
                    logits = self.rat_model(input_ids, attention_mask, rat_alpha=0.05)

                next_token_logits = logits[:, -1, :] / 0.3
                sorted_logits, sorted_indices = torch.sort(next_token_logits, descending=True)
                cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
                sorted_indices_to_remove = cumulative_probs > 0.9
                sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
                sorted_indices_to_remove[..., 0] = 0
                indices_to_remove = sorted_indices_to_remove.scatter(1, sorted_indices, sorted_indices_to_remove)
                next_token_logits[indices_to_remove] = float('-inf')
                probs = F.softmax(next_token_logits, dim=-1)
                next_token = torch.multinomial(probs, num_samples=1)

            input_ids = torch.cat([input_ids, next_token.to(CURRENT_DEVICE)], dim=-1)
            if next_token.item() == self.tokenizer.eos_token_id:
                break

        generated = input_ids[0][prompt_length:]
        return self.tokenizer.decode(generated, skip_special_tokens=True).strip()

    def arbitrate(self, testimony_evidence: str, temporal_evidence: str, spatial_evidence: str) -> str:
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Call boot_engine() first.")

        # 🛡️ THE SHIELD: If mock mode is active, intercept before hitting PyTorch
        if self.is_mock_mode:
            print("🧠 [SIMULATION MODE]: Processing arbitration request...")
            time.sleep(2.5) # Simulate processing delay
            return (
                "ANALYSIS: The architecture has successfully shredded the document.\n\n"
                "CONTRADICTION DETECTED: The testimonial record suggests parameters outside of the logged "
                "spatial constraints identified by the system.\n\n"
                "RULING: The spatial-temporal anomaly requires immediate manual verification. (Simulation Output)"
            )

        prompt = f"""### Instruction:
You are a senior Pakistani advocate conducting evidence critique.
Review the following extracted evidence. Identify any logical, temporal, or spatial contradictions between witness statements.

### Input:
[TESTIMONY]
{testimony_evidence}

[TIMELINE]
{temporal_evidence}

[SPATIAL MAP]
{spatial_evidence}

### Response:
"""
        return self._generate(prompt)

    def generate_chat_reply(self, compiled_prompt: str) -> str:
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Call boot_engine() first.")

        # 🛡️ THE SHIELD: Intercept chat follow-ups
        if self.is_mock_mode:
            print("🧠 [SIMULATION MODE]: Processing chat request...")
            time.sleep(1.5)
            return "⚖️ [SIMULATED REPLY]: I have reviewed your question against the extracted evidence parameters. Further context is required to establish definitive proof."

        return self._generate(compiled_prompt)

# Singleton — imported by FastAPI
rat_model = ChiefJusticeRAT()
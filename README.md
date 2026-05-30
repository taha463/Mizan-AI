# ⚖️ Mizan AI — Judicial Evidence Arbitration Engine

> *An AI-powered legal decision-support engine that detects logical, spatial, and temporal contradictions in witness testimonies using a custom Reflective Arbitration Transformer (RAT) injected into a fine-tuned Mistral-7B backbone.*

[![Kaggle Notebook](https://img.shields.io/badge/Kaggle-Training%20Notebook-blue?logo=kaggle)](https://www.kaggle.com/code/muhammadtaha167/notebook36951c361)
[![Python](https://img.shields.io/badge/Python-3.10%2B-yellow?logo=python)](https://python.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.x-EE4C2C?logo=pytorch)](https://pytorch.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 What It Does

Standard LLMs reason by **statistical pattern matching** — they predict what text comes next. In a legal context, this is dangerous: a model can hallucinate plausible-sounding but factually inconsistent narratives.

**Mizan** ("balance" in Arabic/Urdu) solves this. It is a specialized judicial engine that:

- **Ingests** case PDFs and shreds them into structured witness testimony blocks
- **Deploys** three specialized agents to extract temporal, spatial, and testimonial anchors
- **Arbitrates** using a custom RAT block — four parallel interpretation heads that actively compute cross-witness contradictions via cross-attention
- **Outputs** a structured critique: what each witness establishes, what is missing, and where logical friction exists

---

## 🔍 The Problem It Solves

Pakistani courts — and judicial systems worldwide — face a critical bottleneck: junior advocates and clerks must manually cross-reference dozens of witness statements for internal consistency before a case reaches the bench. Errors at this stage (missed contradictions, undetected alibi impossibilities) can result in wrongful convictions or acquittals.

Mizan automates this forensic pre-screening. It doesn't decide guilt or innocence — it maps the **logical terrain** of the evidence, surfacing contradictions that a human reviewer might miss under time pressure.

---

## 🏗️ Architecture

### System Flow

```
---
config:
  layout: fixed
  look: handDrawn
  theme: neo
---
flowchart TB
 subgraph RAT_Block["<b>Reflective Arbitration Transformer v6</b>"]
        Down["Down Projection: 4096 → 2048"]
        L12["Transformer Layers 0-12"]
        Int["4 Interpretation Heads"]
        Cont["Contradiction Engine"]
        Self["Self-State Module"]
        Ref["Reflection Block: GRUCell"]
        Arb["Arbitration Fusion"]
  end
    Input["Input Tokens"] --> Emb["Embedding Layer"]
    Emb --> L12
    L12 --> Down
    Down --> Int
    Int --> Cont
    Cont --> Self
    Self --> Ref
    Ref --> Arb
    Arb --> Up["Up Projection: 2048 → 4096"]
    Up --> Res{"Residual Addition"}
    L12 -.-> Res
    Res --> L13["Transformer Layers 13-End"]
    L13 --> Logits["LM Head / Logits"]

     Down:::process
     L12:::mainNode
     Int:::process
     Cont:::process
     Self:::process
     Ref:::process
     Arb:::process
     Input:::inputOutput
     Emb:::mainNode
     Up:::process
     Res:::mainNode
     L13:::mainNode
     Logits:::inputOutput
     RAT_Block:::ratBlock
    classDef mainNode fill:#ffffff,stroke:#333333,stroke-width:1.5px,color:#000,rx:6,ry:6
    classDef ratBlock fill:#fffaf5,stroke:#f57c00,stroke-width:2.5px,color:#333,rx:10,ry:10
    classDef process fill:#f5f5f5,stroke:#333,stroke-width:1px,color:#333,rx:4,ry:4
    classDef inputOutput fill:#ffffff,stroke:#999,stroke-width:1px,color:#666,stroke-dasharray: 4 4
    style RAT_Block fill:#fffcf9,stroke:#f57c00,stroke-width:2px,color:#f57c00
```

### RAT Block — Deep Dive

The Reflective Arbitration Transformer is injected **at layer 12** of the Mistral backbone (the midpoint of the network, where semantic representations are richest before the final generation layers).

| Component | Role |
|---|---|
| **4× Interpretation Heads** | Project hidden states into 4 legal-reasoning lenses via SiLU-activated MLPs |
| **Contradiction Engine** | Computes pairwise cross-attention between all head pairs (6 pairs total); outputs a "tension vector" for each contradiction |
| **SelfState Module** | Encodes the model's internal epistemic state into a compressed 256-dim vector |
| **Reflection Block (GRU)** | Iterates over contradiction vectors across 2 reflection steps, allowing the model to "think through" conflicts before finalizing |
| **Arbitration Fusion** | Learned temperature-scaled router that weights all 4 revised interpretations; produces one coherent output signal |

The RAT signal is added to the backbone via a **residual connection with α=0.05**, ensuring the base model's language fluency is preserved while the arbitration signal nudges the output toward logical consistency.

---

## ⚙️ How It Works

### 1. PDF Ingestion: The Hierarchical Shredder

The ingestion layer converts unstructured legal PDFs into clean, machine-readable testimony blocks.

- **Normalization:** Strips headers, footers, and OCR artifacts
- **Semantic Segmentation:** Context-aware paragraph splitting (no mid-sentence truncation)
- **Binary Stream Processing:** `BytesIO` in-memory handling — no disk I/O, files never written to disk in plaintext

### 2. The Three-Agent Pipeline

Three specialized agents map raw text to forensic requirements:

| Agent | What It Extracts |
|---|---|
| **Testimony Agent** | Witness labels (`PW-1`, `DW-4`), legal markers (`deposed`, `cross-examined`), fact vs. conjecture classification |
| **Temporal Agent** | Relative timestamps (`"at sunset"`) + absolute markers (`"23:30 PM"`) → linearized timeline for detecting chronological impossibilities |
| **Spatial Agent** | Location anchors (`"gate"`, `"courtyard"`) + directional movement (`"fled north"`) → 3D coordinate map for verifying physical observability |

### 3. The RAT Block

See architecture section above. The key innovation: instead of simply generating the next token, the model is forced to run its internal representations through a cross-attention contradiction engine before the final generation layers can proceed.

### 4. FastAPI Orchestration Layer

- **Sliding Window Memory:** Maintains a session-specific `Case Record` (the ingested document) + rotating conversation history — fits any case length within the model's context window
- **Hybrid Inference Bootstrapping:** Auto-detects GPU (CUDA) on startup. Falls back to a deterministic evidence-mapper mode in CPU environments — the system never crashes, even on a laptop
- **CORS + FormData Security:** Async multipart ingestion pipeline; case files are shredded and arbitrated within seconds

---

## 📊 Evaluation Results

### Feature-Based Framework Benchmark (Base vs. RAT)

| Metric | Base Mistral | RAT Model | Δ |
|---|---|---|---|
| **CDS** (Contradiction Detection Score) | 0.3 | **0.8** | +167% |
| **ECS** (Evidence Consistency Score) | 0.6 | **0.7** | +17% |
| **MID** (Multi-witness Inconsistency Detection) | 1.1 | **3.2** | +191% |
| **EES** (Epistemic Evidence Score) | 0.2 | **0.9** | +350% |
| **SRS** (Spatial Reasoning Score) | 0.5 | **0.9** | +80% |

*Higher is better for all metrics. The most significant gain is in MID — the RAT model's ability to detect contradictions across multiple witnesses improves nearly 3× over the base model.*

### Qualitative: Live Case Test

**Test case:** Two witnesses with a structural alibi impossibility — PW-1 claims the suspect fled north through the marketplace gate at 11:30 PM; PW-2 (the gate guard) states no one passed north between 11:15–11:45 PM and heard no gunfire.

**Base Mistral output (rat_alpha=0.0):**
> The main contradiction lies in the time frame... This contradiction raises the question of whether the suspect could have passed through the gate undetected or whether PW-1's account is inaccurate... Further investigation is required.

*(Identifies the contradiction but frames it as a general question, offers no forensic resolution pathway)*

**Mizan RAT output:**
> PW-1 establishes visual + auditory observation from a fixed vantage point with documented illumination. PW-2's security log creates a hard spatial impossibility: if the gate was the only northern exit and no one passed, the suspect could not have taken the stated route. The absence of gunfire in PW-2's statement compounds this — either the "blast" was sub-acoustic at that distance, or PW-1's timeline is displaced by ≥15 minutes. CCTV verification of gate logs and acoustic analysis of the courtyard geometry are the priority investigation vectors.

*(Identifies the exact contradiction type — spatial impossibility + acoustic discrepancy — and prescribes specific investigative actions)*

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Base Model** | Mistral-7B-Instruct-v0.2 (4-bit quantized via BnB) |
| **Fine-tuning** | Unsloth + LoRA (r=16, α=32, 7 target modules) |
| **Custom Architecture** | PyTorch 2.x — RAT block, GRUCell, MultiheadAttention |
| **Inference Optimization** | `torch.amp.autocast` (FP16), top-p nucleus sampling |
| **API Layer** | FastAPI, async/await, CORS middleware |
| **Frontend** | React (Vite) |
| **Training Environment** | Kaggle (P100/T4 GPU) |
| **Document Processing** | PyMuPDF / `BytesIO` streaming |

---

🚀 How To Run
The Mizan AI system is fully containerized using Docker for environment consistency.

1. Clone the repository:
   git clone https://github.com/taha463/Mizan-AI.git
   cd Mizan-AI

2. Launch the full stack:
   docker-compose up --build

3. Access the system:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

*Note: Ensure Docker Desktop is running before launching.*
---

## 📓 Training Notebook

Full training pipeline, dataset preparation, loss curves, and ablation experiments are available on Kaggle:

**[🔗 View Training Notebook on Kaggle](https://www.kaggle.com/code/muhammadtaha167/notebook36951c361)**

---

## 📁 Project Structure

```
mizan-ai/
├── backend/
│   ├── main.py               # FastAPI server + orchestration layer
│   ├── ingestion.py          # PDF shredder (BytesIO pipeline)
│   ├── agents/
│   │   ├── testimony_agent.py
│   │   ├── temporal_agent.py
│   │   └── spatial_agent.py
│   └── rat_model/
│       ├── architecture.py   # RATBlock, MistralRAT, all submodules
│       └── generate.py       # Inference engine with top-p sampling
├── frontend/
│   └── src/                  # React/Vite UI
├── checkpoints/              # Trained model weights (not in repo)
├── diagrams/
│   └── rat_architecture.svg  # RAT injection diagram
└── README.md
```

---

## 🔬 What Makes This Different

Most legal AI tools are RAG wrappers — they retrieve relevant laws and feed them to a general-purpose LLM. Mizan is architecturally different:

1. **The contradiction is computed, not described.** Cross-attention between interpretation heads computes a tension vector — the model doesn't just "read" about a contradiction, it represents the logical friction as a geometric signal in activation space.

2. **Reflection before generation.** The GRU cell iterates over the contradiction signal before the final transformer layers run, giving the model a form of structured "second-guessing" absent in standard autoregressive models.

3. **Domain-grounded agents.** The three-agent pipeline converts unstructured testimony into structured forensic anchors *before* the LLM ever sees the text — reducing the chance of hallucination by providing the model with pre-verified spatial and temporal scaffolding.

---

## 👤 Author

**Muhammad Taha**
Software Engineering, HITEC University Taxila
[Kaggle](https://www.kaggle.com/muhammadtaha167) · [GitHub](https://github.com/muhammadtaha167)

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

*"Mizan" (ميزان) — the Arabic and Urdu word for balance, scales of justice.*

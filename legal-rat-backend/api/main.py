from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from pydantic import BaseModel
import time

# --- IMPORTING THE ENTIRE PIPELINE ---
# (Ensure these modules exist in your project structure)
from ingestion.pdf_parser import extract_text_from_pdf_bytes
from agents.testimony_agent import testimony_agent
from agents.temporal_agent import temporal_agent
from agents.spatial_agent import spatial_agent
from model.rat_inference import rat_model

# ============================================================
# IN-MEMORY SESSION STATE MANAGER (Sliding Window Core)
# ============================================================
class SessionMemory:
    def __init__(self, max_turns: int = 4):
        self.max_turns = max_turns
        self.db = {}

    def initialize(self, session_id: str, case_context: str = ""):
        if session_id not in self.db:
            self.db[session_id] = {"context": case_context, "history": []}
        elif case_context:
            self.db[session_id]["context"] = case_context

    def add_message(self, session_id: str, role: str, content: str):
        self.initialize(session_id)
        self.db[session_id]["history"].append({"role": role, "content": content})

    def compile_sliding_prompt(self, session_id: str, current_query: str) -> str:
        session = self.db.get(session_id)
        if not session:
            return current_query

        slice_index = -(self.max_turns * 2)
        recent_history = session["history"][slice_index:] if len(session["history"]) > (self.max_turns * 2) else session["history"]

        formatted_history = ""
        for msg in recent_history:
            speaker = "User" if msg["role"] == "user" else "Chief Justice"
            formatted_history += f"[{speaker}]: {msg['content']}\n\n"

        return (
            "You are Mizan, the Chief Justice AI. Analyze the contradictions using evidence-based arbitration.\n"
            f"--- CORE CASE RECORD ---\n{session['context']}\n\n"
            f"--- RECENT CONVERSATION HISTORY ---\n{formatted_history}"
            f"[Current User Query]: {current_query}\n\n"
            "[Chief Justice Verdict]:"
        )

state_manager = SessionMemory(max_turns=3)

# ============================================================
# SERVER BOOT SEQUENCE
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting Mistral-RAT Backend System...")
    try:
        rat_model.boot_engine()
    except Exception as e:
        print(f"⚠️ Model boot warning: {str(e)}. Using safe simulation mode.")
    yield
    print("🛑 Shutting down system.")

app = FastAPI(title="Mistral-RAT Legal Arbitration API", lifespan=lifespan)

# ============================================================
# CORS SECURITY
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Your local Vite/React frontend
        "http://localhost:3000",  # Standard Next.js fallback
    ], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# ============================================================
# 422 VALIDATION DEBUGGER (Catches Form Mismatches)
# ============================================================
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print("\n🚨 FASTAPI 422 VALIDATION ERROR:")
    print(exc.errors())
    print("Make sure your frontend FormData keys exactly match 'document' and 'session_id'\n")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

class FollowUpQuery(BaseModel):
    session_id: str
    user_query: str

# ============================================================
# 1. FILE UPLOAD ENDPOINT
# ============================================================
@app.post("/api/v1/analyze-case")
async def analyze_case(
    document: UploadFile = File(...), # MUST match formData.append("document", file)
    session_id: str = Form(...)       # MUST match formData.append("session_id", id)
):
    if not document.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid format. PDFs only.")
    
    file_bytes = await document.read()
    
    try:
        raw_text = extract_text_from_pdf_bytes(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"PDF Parsing Failed: {str(e)}")

    print(f"📂 Processing document for Session: {session_id}...")
    testimony_data = testimony_agent.process_document(raw_text)
    temporal_data = temporal_agent.process_document(raw_text)
    spatial_data = spatial_agent.process_document(raw_text)
    
    consolidated_evidence = (
        f"[TESTIMONY EVIDENCE]: {testimony_data}\n"
        f"[TEMPORAL EVIDENCE]: {temporal_data}\n"
        f"[SPATIAL EVIDENCE]: {spatial_data}"
    )
    
    state_manager.initialize(session_id, case_context=consolidated_evidence)

    try:
        if hasattr(rat_model, 'is_loaded') and rat_model.is_loaded:
            final_verdict = rat_model.arbitrate(
                testimony_evidence=testimony_data,
                temporal_evidence=temporal_data,
                spatial_evidence=spatial_data
            )
        else:
            time.sleep(2)
            final_verdict = "⚖️ [SIMULATED VERDICT]: Initial processing complete. Contradictions mapped."
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model Inference Failed: {str(e)}")

    state_manager.add_message(session_id, "user", "Perform baseline case document arbitration analysis.")
    state_manager.add_message(session_id, "assistant", final_verdict)

    return {
        "status": "success",
        "session_id": session_id,
        "document": document.filename,
        "agents_summary": {
            "testimony_blocks": len(testimony_data.split('\n\n')),
            "timeline_events": len(temporal_data.split('\n\n')),
            "spatial_anchors": len(spatial_data.split('\n\n'))
        },
        "arbitration_result": final_verdict
    }

# ============================================================
# 2. CHAT INTERACTION ENDPOINT
# ============================================================
@app.post("/api/v1/chat")
async def chat_interaction(payload: FollowUpQuery = Body(...)):
    session_id = payload.session_id
    query = payload.user_query

    if session_id not in state_manager.db:
        raise HTTPException(status_code=400, detail="No active case context found. Upload a file first.")

    compiled_prompt = state_manager.compile_sliding_prompt(session_id, query)
    
    try:
        if hasattr(rat_model, 'is_loaded') and rat_model.is_loaded:
            response_text = rat_model.generate_chat_reply(compiled_prompt)
        else:
            time.sleep(1.5)
            response_text = f"⚖️ [SIMULATED REPLY]: Analyzing your question '{query}' against current timeline bounds."
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat Inference Failed: {str(e)}")

    state_manager.add_message(session_id, "user", query)
    state_manager.add_message(session_id, "assistant", response_text)

    return {
        "status": "success",
        "session_id": session_id,
        "reply": response_text
    }
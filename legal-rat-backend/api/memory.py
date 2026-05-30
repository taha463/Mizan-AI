import time
from typing import Dict, List, Any

class ChatMemoryManager:
    def __init__(self, max_turns: int = 4, max_tokens_approx: int = 2000):
        """
        max_turns: Maximum number of recent question/answer pairs to look at.
        max_tokens_approx: Safety threshold to prevent context overflow.
        """
        # Simulated database structure: { session_id: [messages] }
        self.sessions: Dict[str, List[Dict[str, str]]] = {}
        self.max_turns = max_turns

    def initialize_session(self, session_id: str):
        if session_id not in self.sessions:
            self.sessions[session_id] = []

    def add_message(self, session_id: str, role: str, content: str):
        self.initialize_session(session_id)
        self.sessions[session_id].append({
            "role": role,
            "content": content,
            "timestamp": str(time.time())
        })

    def get_compiled_context(self, session_id: str, current_query: str) -> str:
        """
        Retrieves history ONLY for this session_id, applies a sliding window,
        and compiles it into a single clean text block for the model.
        """
        self.initialize_session(session_id)
        history = self.sessions[session_id]

        # 1. Apply Sliding Window: Keep only the most recent N exchanges
        # Each turn has a 'user' and an 'assistant' message (2 messages per turn)
        slice_index = -(self.max_turns * 2)
        recent_history = history[slice_index:] if len(history) > (self.max_turns * 2) else history

        # 2. Compile into a chronological string for the Chief Justice Prompt
        formatted_history = ""
        for msg in recent_history:
            speaker = "User/Evidence" if msg["role"] == "user" else "Chief Justice"
            formatted_history += f"[{speaker}]: {msg['content']}\n\n"

        # 3. Append the brand new question at the very bottom
        final_prompt = (
            "You are Mizan, the Chief Justice AI. Analyze the case records based strictly on facts.\n"
            "Here is the relevant conversation history for this specific case context:\n\n"
            f"{formatted_history}"
            f"[Current User Query]: {current_query}\n\n"
            "[Chief Justice Verdict]:"
        )
        return final_prompt

    def clear_session(self, session_id: str):
        if session_id in self.sessions:
            self.sessions[session_id] = []
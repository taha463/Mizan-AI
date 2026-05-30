// lib/services.js

export const uploadAndAnalyzeCase = async (file, sessionId) => {
  try {
    const formData = new FormData();

    // MUST match FastAPI arguments exactly
    formData.append("document", file);
    formData.append("session_id", sessionId || `temp_${Date.now()}`);

    const response = await fetch("http://localhost:8000/api/v1/analyze-case", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Server Error Details:", errorData);
      throw new Error(
        errorData.detail
          ? JSON.stringify(errorData.detail)
          : "Upload failed on server",
      );
    }

    const data = await response.json();

    // Force the success flag so Workspace.jsx knows it worked
    // We spread (...data) so arbitration_result is passed directly to the UI
    return { success: true, ...data };
  } catch (error) {
    console.error("API Pipeline Error:", error);
    return { success: false, error: error.message };
  }
};

export const sendChatMessage = async (sessionId, query) => {
  try {
    const response = await fetch("http://localhost:8000/api/v1/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId || `temp_${Date.now()}`,
        user_query: query,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to communicate with Chief Justice");
    }

    return await response.json();
  } catch (error) {
    console.error("Chat API Error:", error);
    return { status: "error", error: error.message };
  }
};

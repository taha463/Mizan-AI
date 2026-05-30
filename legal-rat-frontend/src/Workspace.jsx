import React, { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Plus,
  Trash2,
  Settings,
  FileUp,
  Circle,
  CheckCircle2,
  File,
  AlertTriangle,
  ArrowUp,
  LogOut,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { uploadAndAnalyzeCase, sendChatMessage } from "../lib/services"; // Added sendChatMessage

const Workspace = ({ navigate, isDark, toggleTheme }) => {
  const [viewState, setViewState] = useState("empty");
  const [activeStep, setActiveStep] = useState(0);

  const [user, setUser] = useState(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [verdict, setVerdict] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // --- CHAT & SESSION STATE ---
  const [pastCases, setPastCases] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  const fetchPastCases = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setPastCases(data);
    } catch (error) {
      console.error("Error fetching cases:", error.message);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session) {
        navigate("auth");
      } else {
        setUser(session.user);
        fetchPastCases(session.user.id);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCurrentFileName(file.name);
    setIsUploading(true);
    setViewState("processing");
    setActiveStep(1);

    setTimeout(() => setActiveStep(2), 1500);
    setTimeout(() => setActiveStep(3), 3000);

    try {
      const result = await uploadAndAnalyzeCase(file, user.id);

      if (result.success) {
        setActiveStep(4);
        setVerdict(result.arbitration_result || result.verdict);

        // Lock in the session ID and clear old chats
        setCurrentSessionId(result.session_id || `temp_${Date.now()}`);
        setChatHistory([]);

        await fetchPastCases(user.id);
        setTimeout(() => setViewState("results"), 1000);
      } else {
        alert(`Analysis failed: ${result.error}`);
        resetWorkspace();
      }
    } catch (error) {
      console.error(error);
      alert("System Error. Is your Python server running?");
      resetWorkspace();
    } finally {
      setIsUploading(false);
    }
  };

  // --- CHAT SUBMISSION LOGIC ---
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatting) return;

    // Instantly update UI with user's question
    const newHistory = [...chatHistory, { role: "user", content: chatInput }];
    setChatHistory(newHistory);
    const query = chatInput;
    setChatInput("");
    setIsChatting(true);

    // Call the backend sliding-window memory endpoint
    const result = await sendChatMessage(currentSessionId, query);

    // Append the model's response
    if (result.status === "success") {
      setChatHistory([
        ...newHistory,
        { role: "assistant", content: result.reply },
      ]);
    } else {
      setChatHistory([
        ...newHistory,
        { role: "assistant", content: "⚠️ Communication error." },
      ]);
    }

    setIsChatting(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSendMessage();
  };

  const handleDeleteCase = async (caseId, e) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(
      "Permanently delete this case and its evidence?",
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from("cases").delete().eq("id", caseId);
      if (error) throw error;
      setPastCases((prevCases) => prevCases.filter((c) => c.id !== caseId));
      resetWorkspace();
    } catch (error) {
      console.error("Error deleting case:", error.message);
      alert("Failed to delete the case.");
    }
  };

  const resetWorkspace = () => {
    setViewState("empty");
    setActiveStep(0);
    setVerdict("");
    setCurrentFileName("");
    setChatHistory([]);
    setCurrentSessionId("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("auth");
  };

  const getInitials = () => {
    if (!user?.email) return "LC";
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex bg-luxury-lightBase dark:bg-luxury-base h-screen overflow-hidden w-full">
      {/* Collapsible Sidebar */}
      <aside className="w-64 md:w-72 bg-luxury-lightSurface dark:bg-luxury-surface border-r border-luxury-lightBorder dark:border-luxury-border flex flex-col h-full z-20 flex-shrink-0 transition-colors duration-300">
        <div className="h-16 flex items-center justify-between px-6 border-b border-luxury-lightBorder dark:border-luxury-border bg-luxury-lightBase dark:bg-luxury-base">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("landing")}
          >
            <div className="w-6 h-6 border border-gray-300 dark:border-luxury-border flex items-center justify-center bg-white dark:bg-black">
              <span className="font-bold tracking-widest text-[8px] text-gray-900 dark:text-white">
                M
              </span>
            </div>
            <span className="font-medium tracking-[0.2em] text-[10px] uppercase text-gray-900 dark:text-white">
              Workspace
            </span>
          </div>

          <button
            onClick={toggleTheme}
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="p-4 pb-2">
          <button
            onClick={resetWorkspace}
            className="w-full flex items-center justify-center gap-2 border border-luxury-lightBorder dark:border-luxury-border bg-luxury-lightBase dark:bg-luxury-base hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-300 text-gray-900 dark:text-white text-[10px] uppercase tracking-widest py-3 rounded-sm shadow-sm"
          >
            <Plus className="w-3 h-3" />
            New Arbitration
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4 no-scrollbar">
          <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold px-4 mb-4">
            Past Cases
          </div>
          <div className="space-y-1">
            {pastCases.length === 0 ? (
              <div className="px-4 py-2 text-xs text-gray-500 italic font-light">
                No arbitrations found.
              </div>
            ) : (
              pastCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="group flex items-center justify-between px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-luxury-hover cursor-pointer transition-colors border border-transparent hover:border-luxury-lightBorder dark:hover:border-luxury-border rounded-sm"
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="text-xs text-gray-900 dark:text-white font-medium truncate mb-1">
                      {caseItem.case_title}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(caseItem.created_at).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" },
                      )}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteCase(caseItem.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors rounded-sm text-xs font-medium uppercase tracking-wider"
          >
            <LogOut className="w-3.5 h-3.5" />
            End Session
          </button>
        </div>

        <div className="p-4 border-t border-luxury-lightBorder dark:border-luxury-border flex items-center justify-between bg-luxury-lightBase dark:bg-luxury-base">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-luxury-surface border border-luxury-lightBorder dark:border-luxury-border flex items-center justify-center text-[10px] font-bold text-gray-900 dark:text-white rounded-sm">
              {getInitials()}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-900 dark:text-white truncate w-24">
                {user?.user_metadata?.full_name || "Lead Counsel"}
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5 font-mono">
                Active
              </span>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative bg-luxury-lightBase dark:bg-luxury-base overflow-hidden">
        {viewState === "empty" && (
          <div className="absolute inset-0 flex items-center justify-center p-8 z-10 animate-fade-in">
            <label
              className={`w-full max-w-xl h-64 border-2 border-dashed border-gray-300 dark:border-luxury-border hover:border-gray-500 dark:hover:border-gray-500 bg-gray-50/50 dark:bg-luxury-surface/30 hover:bg-gray-100 dark:hover:bg-luxury-surface/80 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group rounded-sm ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <div className="w-12 h-12 rounded-full bg-white dark:bg-luxury-base border border-luxury-lightBorder dark:border-luxury-border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileUp className="w-5 h-5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 tracking-wide uppercase">
                Drop 50-page PDF Case File Here
              </h2>
              <p className="text-xs text-gray-500 font-mono">
                Click to browse local system files
              </p>
            </label>
          </div>
        )}

        {viewState === "processing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10 bg-luxury-lightBase dark:bg-luxury-base animate-fade-in">
            <div className="max-w-md w-full border border-luxury-lightBorder dark:border-luxury-border bg-luxury-lightSurface dark:bg-luxury-surface p-10 shadow-2xl rounded-sm">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-luxury-lightBorder dark:border-luxury-border">
                <div className="w-2 h-2 bg-blue-500 animate-pulse rounded-full"></div>
                <h2 className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em]">
                  Agentic MoE Active
                </h2>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {activeStep === 1 ? (
                    <Circle className="w-4 h-4 text-blue-500 animate-pulse" />
                  ) : activeStep > 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-gray-900 dark:text-white" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  )}
                  <span
                    className={`text-xs font-medium uppercase tracking-widest font-mono transition-colors ${activeStep >= 1 ? "text-gray-900 dark:text-white" : "text-gray-400"}`}
                  >
                    Shredding Document Structure...
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {activeStep === 2 ? (
                    <Circle className="w-4 h-4 text-blue-500 animate-pulse" />
                  ) : activeStep > 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-gray-900 dark:text-white" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  )}
                  <span
                    className={`text-xs font-medium uppercase tracking-widest font-mono transition-colors ${activeStep >= 2 ? "text-gray-900 dark:text-white" : "text-gray-400"}`}
                  >
                    Testimony Agent Scanning...
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {activeStep === 3 ? (
                    <Circle className="w-4 h-4 text-blue-500 animate-pulse" />
                  ) : activeStep > 3 ? (
                    <CheckCircle2 className="w-4 h-4 text-gray-900 dark:text-white" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  )}
                  <span
                    className={`text-xs font-medium uppercase tracking-widest font-mono transition-colors ${activeStep >= 3 ? "text-gray-900 dark:text-white" : "text-gray-400"}`}
                  >
                    Temporal Agent Mapping...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewState === "results" && (
          <div className="flex-1 flex flex-col h-full relative z-20 animate-fade-in">
            <div className="flex-1 overflow-y-auto px-6 py-12 pb-40 scroll-smooth no-scrollbar">
              <div className="max-w-3xl mx-auto space-y-12">
                <div className="flex gap-6 animate-slide-up">
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center border border-luxury-lightBorder dark:border-luxury-border bg-gray-100 dark:bg-luxury-surface text-[9px] font-bold text-gray-600 dark:text-gray-400 mt-1 rounded-sm">
                    DOC
                  </div>
                  <div className="bg-white dark:bg-luxury-surface border border-luxury-lightBorder dark:border-luxury-border p-4 pr-12 inline-block rounded-sm shadow-sm">
                    <div className="flex items-center gap-3">
                      <File className="w-4 h-4 text-gray-900 dark:text-white" />
                      <span className="text-xs font-semibold text-gray-900 dark:text-white tracking-wide font-mono">
                        {currentFileName}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 block mt-2 tracking-wider uppercase">
                      Successfully Processed
                    </span>
                  </div>
                </div>

                <div className="flex gap-6 animate-slide-up delay-200">
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] font-bold mt-1 rounded-sm shadow-md">
                    C-J
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900 dark:text-white">
                        Chief Justice Verdict
                      </h3>
                      <div className="h-[1px] flex-1 bg-luxury-lightBorder dark:bg-luxury-border"></div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-light mb-6">
                      Analysis complete. The Interrogator and Timekeeper agents
                      have cross-referenced testimony against the forensic
                      spatial logs.
                    </p>
                    <div className="bg-red-50 dark:bg-crimson-bg border border-red-200 dark:border-crimson-border p-6 relative rounded-sm shadow-sm">
                      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-red-200 dark:border-crimson-border/50">
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-crimson-text" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 dark:text-crimson-text">
                          Arbitration Result
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-white/90 font-light leading-relaxed whitespace-pre-wrap">
                        {verdict}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC CHAT HISTORY MAP */}
                {chatHistory.length > 0 && (
                  <div className="mt-8 space-y-6">
                    {chatHistory.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex gap-6 animate-slide-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`w-8 h-8 flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-1 rounded-sm shadow-md ${
                            msg.role === "user"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-900 dark:bg-white text-white dark:text-black"
                          }`}
                        >
                          {msg.role === "user" ? "USR" : "C-J"}
                        </div>
                        <div
                          className={`flex-1 ${msg.role === "user" ? "text-right" : ""}`}
                        >
                          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-light whitespace-pre-wrap bg-white dark:bg-luxury-surface border border-luxury-lightBorder dark:border-luxury-border p-4 rounded-sm inline-block text-left">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isChatting && (
                      <div className="flex gap-6 animate-fade-in">
                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] font-bold mt-1 rounded-sm shadow-md">
                          C-J
                        </div>
                        <div className="bg-white dark:bg-luxury-surface border border-luxury-lightBorder dark:border-luxury-border p-4 rounded-sm inline-block">
                          <div className="flex gap-1 items-center h-5">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CHAT INPUT BAR */}
            <div className="absolute bottom-0 left-0 right-0 bg-luxury-lightBase/90 dark:bg-luxury-base/90 backdrop-blur-md pt-6 pb-8 px-6 border-t border-luxury-lightBorder dark:border-luxury-border z-30">
              <div className="max-w-3xl mx-auto relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-white/5 dark:to-white/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isChatting}
                  placeholder="Query the Chief Justice... e.g. 'What time did PW-1 claim he left the gate?'"
                  className="w-full relative bg-white dark:bg-luxury-surface border border-luxury-lightBorder dark:border-luxury-border text-sm text-gray-900 dark:text-white px-6 py-4 pr-16 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors placeholder:text-gray-400 font-light shadow-lg rounded-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isChatting}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-900 dark:bg-white text-white dark:text-black flex items-center justify-center hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors rounded-sm disabled:opacity-50"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
              <p className="text-center text-[9px] text-gray-400 mt-3 font-mono">
                Mizan can make mistakes. Verify critical claims.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Workspace;

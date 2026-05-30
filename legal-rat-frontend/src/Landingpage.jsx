import React, { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  UploadCloud,
  FileText,
  Loader2,
  Users,
  Clock,
  Map as MapIcon,
  Check,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const LandingPage = ({ navigate, isDark, toggleTheme }) => {
  // 1. ADD STATE TO TRACK USER
  const [user, setUser] = useState(null);

  // 2. CHECK SESSION ON PAGE LOAD
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkSession();

    // Listen for changes (e.g., if they log out in another tab)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. THE SECURITY ROUTER FUNCTION
  const handleGetStarted = () => {
    if (user) {
      navigate("workspace");
    } else {
      navigate("auth");
    }
  };

  // 4. LOGOUT HANDLER
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="flex-col relative overflow-y-auto scroll-smooth min-h-screen flex">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full glass-nav z-50 px-6 py-4 border-b border-luxury-lightBorder dark:border-luxury-border bg-luxury-lightBase/80 dark:bg-luxury-base/80 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-4 cursor-pointer"
            onClick={() => navigate("landing")}
          >
            <div className="w-8 h-8 flex items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-black border border-transparent dark:border-luxury-border shadow-sm">
              <span className="font-bold tracking-widest text-[12px]">M</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium tracking-[0.2em] text-xs uppercase text-gray-900 dark:text-white">
                Mizan
              </span>
              <span className="text-[8px] tracking-[0.1em] text-gray-500 uppercase">
                Chief Justice Engine
              </span>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-gray-400">
            <button
              onClick={() =>
                document
                  .getElementById("features")
                  .scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Features
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("technology")
                  .scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Technology
            </button>
          </div>

          {/* Controls (Theme + Auth) */}
          <div className="flex items-center gap-6">
            <button
              onClick={toggleTheme}
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* 5. DYNAMIC AUTHENTICATION BUTTONS */}
            {user ? (
              <button
                onClick={handleLogout}
                className="text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => navigate("auth")}
                className="text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign In
              </button>
            )}

            <button
              onClick={handleGetStarted}
              className="text-xs font-medium uppercase tracking-wide bg-gray-900 dark:bg-white text-white dark:text-black px-5 py-2.5 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors rounded-sm shadow-sm"
            >
              {user ? "Open Workspace" : "Get Started"}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col lg:flex-row items-center justify-between min-h-[85vh]">
        {/* Left Content */}
        <div className="w-full lg:w-1/2 z-10 pr-0 lg:pr-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-luxury-lightSurface dark:bg-luxury-surface border border-luxury-lightBorder dark:border-luxury-border rounded-full text-[9px] tracking-widest uppercase text-gray-600 dark:text-gray-400 mb-8 opacity-0 animate-slide-up">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse-glow"></span>
            Agentic MoE Protocol v3.0
          </div>
          <h1 className="text-5xl lg:text-7xl font-semibold tracking-tighter text-gray-900 dark:text-white mb-6 leading-[1.05] opacity-0 animate-slide-up delay-100">
            Autonomous Legal Arbitration.
            <br />
            <span className="text-gray-400 dark:text-gray-500 font-light italic">
              Flawless Precision.
            </span>
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-10 max-w-lg leading-relaxed opacity-0 animate-slide-up delay-200 font-light">
            Upload complex, multi-witness case files. Our specialized Agentic
            MoE architecture extracts timelines, corroborative testimonies, and
            spatial mapping layers to identify structural contradictions in
            seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-slide-up delay-300">
            <button
              onClick={handleGetStarted}
              className="flex items-center justify-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-black px-8 py-4 text-xs font-medium uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg"
            >
              <UploadCloud className="w-4 h-4" />
              {user ? "Go to Workspace" : "Upload Case File"}
            </button>
          </div>
        </div>

        {/* Right Visual Mockup */}
        <div className="w-full lg:w-1/2 mt-16 lg:mt-0 opacity-0 animate-fade-in delay-300">
          <div className="w-full bg-luxury-lightSurface dark:bg-luxury-surface border border-luxury-lightBorder dark:border-luxury-border rounded-sm shadow-2xl p-6 relative overflow-hidden">
            {/* Mockup Header */}
            <div className="flex items-center justify-between pb-4 border-b border-luxury-lightBorder dark:border-luxury-border mb-6">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                  STATE_VS_MALIK_DEPOSITION.PDF
                </span>
              </div>
              <span className="text-[9px] uppercase tracking-widest bg-gray-200 dark:bg-luxury-hover text-gray-600 dark:text-gray-400 px-2 py-1">
                Parsing Active
              </span>
            </div>

            {/* Data Streams */}
            <div className="space-y-4">
              <div className="p-4 bg-luxury-lightBase dark:bg-luxury-base border border-luxury-lightBorder dark:border-luxury-border flex items-center justify-between relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 dark:bg-gray-700 group-hover:bg-blue-500 transition-colors"></div>
                <div className="flex items-center gap-4 pl-2">
                  <div className="text-[10px] font-mono text-gray-400">A_1</div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                      The Interrogator
                    </h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">
                      Extracting witness claims...
                    </p>
                  </div>
                </div>
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              </div>

              <div className="p-4 bg-luxury-lightBase dark:bg-luxury-base border border-luxury-lightBorder dark:border-luxury-border flex items-center justify-between relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 dark:bg-gray-700 group-hover:bg-purple-500 transition-colors"></div>
                <div className="flex items-center gap-4 pl-2">
                  <div className="text-[10px] font-mono text-gray-400">A_2</div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                      The Timekeeper
                    </h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">
                      Building chronological map...
                    </p>
                  </div>
                </div>
                <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
              </div>

              <div className="p-4 bg-luxury-lightBase dark:bg-luxury-base border border-luxury-lightBorder dark:border-luxury-border flex items-center justify-between relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 dark:bg-gray-700 group-hover:bg-emerald-500 transition-colors"></div>
                <div className="flex items-center gap-4 pl-2">
                  <div className="text-[10px] font-mono text-gray-400">A_3</div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                      The Mapper
                    </h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">
                      Anchoring spatial evidence...
                    </p>
                  </div>
                </div>
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section
        id="features"
        className="w-full border-t border-luxury-lightBorder dark:border-luxury-border bg-luxury-lightSurface dark:bg-luxury-surface/50 py-24 px-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-sm font-semibold tracking-[0.2em] uppercase text-gray-900 dark:text-white mb-2">
              The Architecture
            </h2>
            <div className="w-12 h-[1px] bg-gray-900 dark:bg-white"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 border border-luxury-lightBorder dark:border-luxury-border bg-luxury-lightBase dark:bg-luxury-surface hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-300">
              <div className="w-10 h-10 border border-luxury-lightBorder dark:border-luxury-border flex items-center justify-center mb-8 text-gray-900 dark:text-white">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold tracking-wide text-gray-900 dark:text-white uppercase mb-4">
                The Interrogator
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                Dynamically reads through legal depositions and transcripts.
                Builds complex witness semantic maps, marking inconsistencies
                between primary and secondary verbal statements.
              </p>
            </div>

            <div className="p-8 border border-luxury-lightBorder dark:border-luxury-border bg-luxury-lightBase dark:bg-luxury-surface hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-300">
              <div className="w-10 h-10 border border-luxury-lightBorder dark:border-luxury-border flex items-center justify-center mb-8 text-gray-900 dark:text-white">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold tracking-wide text-gray-900 dark:text-white uppercase mb-4">
                The Timekeeper
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                Plots relative statements onto absolute chronological time maps.
                Extracts physical timestamp anomalies, aligning clock events
                from server metadata, statements, and security logs.
              </p>
            </div>

            <div className="p-8 border border-luxury-lightBorder dark:border-luxury-border bg-luxury-lightBase dark:bg-luxury-surface hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-300">
              <div className="w-10 h-10 border border-luxury-lightBorder dark:border-luxury-border flex items-center justify-center mb-8 text-gray-900 dark:text-white">
                <MapIcon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold tracking-wide text-gray-900 dark:text-white uppercase mb-4">
                The Mapper
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                Traces witness proximity claims against building structural
                designs, security footage boundaries, or global positioning
                data. Anchors physical limitations to corroborate testimony
                claims.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Detail Section */}
      <section
        id="technology"
        className="w-full border-t border-luxury-lightBorder dark:border-luxury-border bg-luxury-lightBase dark:bg-luxury-base py-24 px-6"
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2">
            <h2 className="text-sm font-semibold tracking-[0.2em] uppercase text-gray-900 dark:text-white mb-4">
              Methodology
            </h2>
            <h3 className="text-3xl lg:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white mb-6 leading-tight">
              Specialized Legal Routing, Not General Processing.
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-light mb-8">
              Unlike standard LLMs that attempt to process entire case files
              holistically, Mizan utilizes a localized routing framework.
              Evidence arrays are divided and sent exclusively to agents trained
              for that specific data type—ensuring hallucination-free,
              verifiable outputs.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <Check className="w-4 h-4 mt-0.5 text-gray-900 dark:text-white" />
                <span>
                  Zero-Hallucination Guarantee on quantitative data points.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <Check className="w-4 h-4 mt-0.5 text-gray-900 dark:text-white" />
                <span>Direct citation linking to original uploaded PDFs.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <Check className="w-4 h-4 mt-0.5 text-gray-900 dark:text-white" />
                <span>
                  End-to-End Encrypted storage in compliance with federal
                  guidelines.
                </span>
              </li>
            </ul>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="w-full aspect-video bg-luxury-lightSurface dark:bg-luxury-surface border border-luxury-lightBorder dark:border-luxury-border rounded-sm shadow-2xl relative overflow-hidden p-4 sm:p-6 flex flex-col justify-between">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]"></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-center border-b border-luxury-lightBorder dark:border-luxury-border pb-2 mb-4 md:mb-8">
                  <span className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">
                    MoE Active Routing
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>

                <div className="flex-1 flex items-center justify-between gap-2 sm:gap-4">
                  <div className="w-12 h-16 sm:w-16 sm:h-20 bg-luxury-lightBase dark:bg-luxury-base border border-luxury-lightBorder dark:border-luxury-border rounded-sm flex flex-col items-center justify-center gap-1 sm:gap-2 relative shadow-md z-10">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <span className="text-[6px] sm:text-[7px] font-mono text-gray-500 uppercase">
                      Case.PDF
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col justify-between h-24 sm:h-32 relative">
                    <div className="absolute inset-0 flex flex-col justify-between py-2 sm:py-4">
                      <div className="w-full h-px border-t border-dashed border-gray-300 dark:border-gray-700 relative">
                        <div className="absolute left-0 top-[-3.5px] w-1.5 h-1.5 bg-blue-500 rounded-full animate-route-1"></div>
                      </div>
                      <div className="w-full h-px border-t border-dashed border-gray-300 dark:border-gray-700 relative">
                        <div className="absolute left-0 top-[-3.5px] w-1.5 h-1.5 bg-purple-500 rounded-full animate-route-2"></div>
                      </div>
                      <div className="w-full h-px border-t border-dashed border-gray-300 dark:border-gray-700 relative">
                        <div className="absolute left-0 top-[-3.5px] w-1.5 h-1.5 bg-emerald-500 rounded-full animate-route-3"></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between h-32 sm:h-40 gap-2 z-10">
                    <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-luxury-lightBase dark:bg-luxury-base border border-luxury-lightBorder dark:border-luxury-border rounded-sm text-[7px] sm:text-[8px] uppercase tracking-widest text-gray-700 dark:text-gray-300 font-mono shadow-sm flex items-center gap-1.5 sm:gap-2">
                      <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span>{" "}
                      Interrogator
                    </div>
                    <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-luxury-lightBase dark:bg-luxury-base border border-luxury-lightBorder dark:border-luxury-border rounded-sm text-[7px] sm:text-[8px] uppercase tracking-widest text-gray-700 dark:text-gray-300 font-mono shadow-sm flex items-center gap-1.5 sm:gap-2">
                      <span className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></span>{" "}
                      Timekeeper
                    </div>
                    <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-luxury-lightBase dark:bg-luxury-base border border-luxury-lightBorder dark:border-luxury-border rounded-sm text-[7px] sm:text-[8px] uppercase tracking-widest text-gray-700 dark:text-gray-300 font-mono shadow-sm flex items-center gap-1.5 sm:gap-2">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>{" "}
                      Mapper
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-luxury-lightBorder dark:border-luxury-border flex justify-center relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-3 md:h-4 border-l border-dashed border-gray-300 dark:border-gray-700"></div>
                  <div className="bg-gray-900 dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-sm text-[8px] sm:text-[9px] uppercase tracking-widest font-bold shadow-md mt-2 md:mt-3 relative z-10">
                    Mizan Consensus
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 px-6 border-t border-luxury-lightBorder dark:border-luxury-border bg-luxury-lightBase dark:bg-luxury-base flex flex-col md:flex-row items-center justify-between mt-auto">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
          © 2026 Mizan Engine
        </span>
        <div className="flex gap-6 mt-4 md:mt-0 text-[10px] uppercase tracking-widest text-gray-500 font-medium">
          <a
            href="#"
            className="hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Terms of Service
          </a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

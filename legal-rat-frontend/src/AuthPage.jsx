import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
// 1. IMPORT SUPABASE
import { supabase } from "../lib/supabase";

// Array of real, famous quotes on law and justice
const LEGAL_QUOTES = [
  {
    text: "It is the spirit and not the form of law that keeps justice alive.",
    author: "Earl Warren",
  },
  {
    text: "Injustice anywhere is a threat to justice everywhere.",
    author: "Martin Luther King Jr.",
  },
  {
    text: "The exact administration of justice is the firmest pillar of good government.",
    author: "George Washington",
  },
  {
    text: "Justice delayed is justice denied.",
    author: "William E. Gladstone",
  },
  {
    text: "The safety of the people shall be the highest law.",
    author: "Marcus Tullius Cicero",
  },
];

const AuthPage = ({ navigate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // 2. ADD STATE FOR THE FORM INPUTS
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Rotate the quote every 1 minute
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prevIndex) => (prevIndex + 1) % LEGAL_QUOTES.length);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 3. THE REAL AUTHENTICATION ENGINE
  const handleAuth = async (e) => {
    e.preventDefault(); // Stop the page from refreshing
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // --- SIGN IN LOGIC ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Success! Send to dashboard.
        navigate("workspace");
      } else {
        // --- SIGN UP LOGIC ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName, // Saves their name in the database
            },
          },
        });
        if (error) throw error;

        alert("Credentials registered successfully. You may now sign in.");
        setIsLogin(true); // Switch back to login view
        setPassword(""); // Clear password for safety
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row bg-luxury-lightBase dark:bg-luxury-base min-h-screen">
      {/* Left Visual Column */}
      <div className="hidden md:flex w-1/2 relative items-center justify-center p-12 overflow-hidden border-r border-luxury-lightBorder dark:border-luxury-border bg-gray-100 dark:bg-black">
        {/* Abstract Graphic/Gradient */}
        <div className="absolute inset-0 opacity-40 dark:opacity-100">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-gray-300 via-gray-100 to-gray-100 dark:from-[#1a1a24] dark:via-black dark:to-black"></div>
        </div>

        <div className="relative z-10 max-w-md animate-fade-in">
          <div className="w-12 h-12 flex items-center justify-center border border-gray-900 dark:border-white mb-12 shadow-sm">
            <span className="font-bold tracking-widest text-[12px] text-gray-900 dark:text-white">
              M
            </span>
          </div>

          <h2
            key={quoteIndex}
            className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-6 leading-tight tracking-tight animate-fade-in"
          >
            "{LEGAL_QUOTES[quoteIndex].text}"
            <br />
            <span className="text-gray-500 dark:text-gray-500 italic text-2xl mt-4 block">
              — {LEGAL_QUOTES[quoteIndex].author}
            </span>
          </h2>

          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] border-l border-gray-400 dark:border-gray-700 pl-4 mt-12">
            Mizan Engine • Authorization Required
          </p>
        </div>
      </div>

      {/* Right Form Column */}
      <div className="w-full md:w-1/2 flex items-center justify-center relative p-8 animate-slide-up">
        {/* Back Button */}
        <button
          onClick={() => navigate("landing")}
          className="absolute top-8 right-8 text-gray-500 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white transition-colors p-2"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 4. CHANGED DIV TO FORM */}
        <form onSubmit={handleAuth} className="w-full max-w-sm">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white tracking-wide mb-2">
              {isLogin ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-xs text-gray-500 font-light">
              {isLogin
                ? "Access the arbitration workspace."
                : "Join the elite arbitration network."}
            </p>
          </div>

          {/* 5. ADDED ERROR MESSAGE DISPLAY */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs text-center rounded-sm animate-fade-in">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-8">
            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                  Full Name
                </label>
                <input
                  type="text"
                  required={!isLogin}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-luxury-lightSurface dark:bg-luxury-surface border border-luxury-lightBorder dark:border-luxury-border px-4 py-3.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gray-900 dark:focus:border-white transition-colors rounded-sm"
                  placeholder="Counsel Name"
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-luxury-lightSurface dark:bg-luxury-surface border border-luxury-lightBorder dark:border-luxury-border px-4 py-3.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gray-900 dark:focus:border-white transition-colors rounded-sm"
                placeholder="counsel@firm.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-luxury-lightSurface dark:bg-luxury-surface border border-luxury-lightBorder dark:border-luxury-border px-4 py-3.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gray-900 dark:focus:border-white transition-colors rounded-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* 6. CHANGED TO TYPE="SUBMIT" */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-black font-medium py-3.5 text-xs uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors rounded-sm mb-6 shadow-md disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Continue"}
          </button>

          <p className="text-center text-xs text-gray-500 mt-10">
            <button
              type="button" // Prevents the form from submitting when switching modes
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null); // Clear errors when switching modes
              }}
              className="hover:text-gray-900 dark:hover:text-white transition-colors underline underline-offset-4 font-medium"
            >
              {isLogin ? "Create an Account" : "Sign In to Existing Account"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;

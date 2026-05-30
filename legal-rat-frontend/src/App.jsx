import React, { useState, useEffect } from "react";
import LandingPage from "./Landingpage";
import AuthPage from "./AuthPage";
import Workspace from "./Workspace"; // <-- Add this import

function App() {
  const [currentScreen, setCurrentScreen] = useState("landing");

  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : true;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  return (
    <div className="w-full min-h-screen transition-colors duration-300">
      {currentScreen === "landing" && (
        <LandingPage
          navigate={handleNavigate}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />
      )}
      {currentScreen === "auth" && <AuthPage navigate={handleNavigate} />}

      {/* Update this section to mount the real Workspace */}
      {currentScreen === "workspace" && (
        <Workspace
          navigate={handleNavigate}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />
      )}
    </div>
  );
}

export default App;

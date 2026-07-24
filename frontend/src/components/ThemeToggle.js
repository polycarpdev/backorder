"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");
  const [spin, setSpin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const initial = stored || "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setSpin(true);
    setTimeout(() => setSpin(false), 350);
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 flex items-center justify-center rounded hover:bg-[var(--color-steel)]/10"
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      <span className={spin ? "animate-icon-spin" : ""}>
        {theme === "light" ? (
          <Moon size={18} color="var(--color-ink)" />
        ) : (
          <Sun size={18} color="var(--color-amber)" />
        )}
      </span>
    </button>
  );
}

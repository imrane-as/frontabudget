"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeSwitcher = ({ showLabel = false }: { showLabel?: boolean }) => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(nextTheme)}
      aria-label={isDark ? "Passer au thème clair" : "Passer au thème sombre"}
      title={isDark ? "Passer au thème clair" : "Passer au thème sombre"}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <Sun size={14} />
        <Moon size={14} />
        <i className={isDark ? "is-dark" : ""} />
      </span>
      {showLabel && <span>{isDark ? "Apparence sombre" : "Apparence claire"}</span>}
    </button>
  );
};

export { ThemeSwitcher };

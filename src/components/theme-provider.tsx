import { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({ isDark: false });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const dark = mediaQuery.matches;
      root.classList.remove("light", "dark");
      root.classList.add(dark ? "dark" : "light");
      setIsDark(dark);
    };

    applyTheme();
    mediaQuery.addEventListener("change", applyTheme);

    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

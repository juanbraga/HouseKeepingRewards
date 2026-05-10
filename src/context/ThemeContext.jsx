import { createContext, useContext, useState, useEffect } from "react"

const ThemeContext = createContext(null)

const THEMES = ["purple", "ocean", "forest"]

function applyTheme(theme, dark) {
  const root = document.documentElement
  // Remove all theme classes
  root.classList.remove("theme-ocean", "theme-forest", "dark")
  // Apply theme class (purple is default, no class needed)
  if (theme === "ocean") root.classList.add("theme-ocean")
  if (theme === "forest") root.classList.add("theme-forest")
  // Apply dark mode
  if (dark) root.classList.add("dark")
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "purple")
  const [dark, setDark] = useState(() => localStorage.getItem("darkMode") === "true")

  useEffect(() => {
    applyTheme(theme, dark)
    localStorage.setItem("theme", theme)
    localStorage.setItem("darkMode", dark)
  }, [theme, dark])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, dark, setDark, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}

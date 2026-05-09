import { useTranslation } from "react-i18next"
import { LogOut, Globe, ChevronDown } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useNavigate } from "react-router-dom"
import { useHouseholdContext } from "@/context/HouseholdContext"
import { useHouseholds } from "@/hooks/useHousehold"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/Button"
import { useState, useRef, useEffect } from "react"

export function Header() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { activeHouseholdId, setActiveHouseholdId } = useHouseholdContext()
  const { data: households } = useHouseholds(user?.id)
  const [showHhMenu, setShowHhMenu] = useState(false)
  const hhRef = useRef(null)

  const activeHousehold = households?.find((h) => h.id === activeHouseholdId)

  const toggleLang = () => i18n.changeLanguage(i18n.language === "en" ? "es" : "en")

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate("/auth")
  }

  useEffect(() => {
    const handler = (e) => { if (hhRef.current && !hhRef.current.contains(e.target)) setShowHhMenu(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-6 md:pl-6">
      <div className="md:hidden w-10" />

      {/* Household switcher */}
      <div className="relative" ref={hhRef}>
        <button
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          onClick={() => setShowHhMenu((v) => !v)}
        >
          <span>{activeHousehold?.name || t("household.select")}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
        {showHhMenu && (
          <div className="absolute top-full left-0 mt-1 w-56 rounded-md border bg-card shadow-lg z-50">
            <div className="py-1">
              {households?.map((h) => (
                <button
                  key={h.id}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                  onClick={() => { setActiveHouseholdId(h.id); setShowHhMenu(false) }}
                >
                  {h.name}
                  {h.id === activeHouseholdId && <span className="text-xs text-primary font-medium">{t("household.current")}</span>}
                </button>
              ))}
              <div className="border-t my-1" />
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => { navigate("/households"); setShowHhMenu(false) }}
              >
                {t("household.title")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleLang} title={t("settings.language")}>
          <Globe className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={signOut} title={t("nav.sign_out")}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

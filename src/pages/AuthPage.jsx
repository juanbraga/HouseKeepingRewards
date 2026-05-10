import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Globe, Home } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { useToast } from "@/components/ui/Toast"

export function AuthPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const [mode, setMode] = useState("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const toggleLang = () => i18n.changeLanguage(i18n.language === "en" ? "es" : "en")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (mode === "signup" && password !== confirmPassword) {
      toast({ message: t("auth.password_mismatch"), type: "error" })
      return
    }
    setLoading(true)
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const pendingToken = sessionStorage.getItem("pendingInviteToken")
        if (pendingToken) {
          sessionStorage.removeItem("pendingInviteToken")
          navigate(`/join/${pendingToken}`)
        } else {
          navigate("/dashboard")
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        const pendingToken = sessionStorage.getItem("pendingInviteToken")
        if (pendingToken) {
          sessionStorage.removeItem("pendingInviteToken")
          navigate(`/join/${pendingToken}`)
        } else {
          navigate("/households")
        }
      }
    } catch (err) {
      toast({ message: err.message || t("auth.invalid_credentials"), type: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="icon" onClick={toggleLang}>
          <Globe className="h-4 w-4" />
        </Button>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Home className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>{mode === "signin" ? t("auth.welcome_back") : t("auth.create_account")}</CardTitle>
          <CardDescription>HomeRewards</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm">{t("auth.confirm_password")}</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? mode === "signin" ? t("auth.signing_in") : t("auth.signing_up")
                : mode === "signin" ? t("auth.sign_in") : t("auth.sign_up")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {mode === "signin" ? (
              <>
                {t("auth.no_account")}{" "}
                <button className="text-primary font-medium hover:underline" onClick={() => setMode("signup")}>
                  {t("auth.sign_up")}
                </button>
              </>
            ) : (
              <>
                {t("auth.have_account")}{" "}
                <button className="text-primary font-medium hover:underline" onClick={() => setMode("signin")}>
                  {t("auth.sign_in")}
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Home, UserPlus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useInviteByToken, useAcceptInvite } from "@/hooks/useInvites"
import { useHouseholdContext } from "@/context/HouseholdContext"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { useToast } from "@/components/ui/Toast"

export function JoinPage() {
  const { token } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { user, loading: authLoading } = useAuth()
  const { setActiveHouseholdId } = useHouseholdContext()
  const { data: invite, isLoading: loadingInvite, isError } = useInviteByToken(token)
  const acceptInvite = useAcceptInvite()

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authMode, setAuthMode] = useState("signup") // signup | signin
  const [step, setStep] = useState("auth") // auth | join (if already logged in, skip to join)
  const [submitting, setSubmitting] = useState(false)

  // If already logged in, skip straight to the join step
  const currentStep = user ? "join" : step

  const handleAuth = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      // useAuth will update and re-render with user set, moving to join step
    } catch (err) {
      toast({ message: err.message || t("auth.invalid_credentials"), type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!user || !displayName.trim()) return
    setSubmitting(true)
    try {
      const household = await acceptInvite.mutateAsync({ token, userId: user.id, displayName: displayName.trim() })
      setActiveHouseholdId(household.id)
      toast({ message: `Joined ${household.name}! 🎉` })
      navigate("/dashboard")
    } catch (err) {
      if (err.message === "already_member") {
        setActiveHouseholdId(invite?.household?.id)
        navigate("/dashboard")
      } else {
        toast({ message: "Invalid or expired invite link", type: "error" })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loadingInvite) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t("common.loading")}</div>
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-6 space-y-4">
            <p className="text-destructive font-medium">This invite link is invalid or has expired.</p>
            <Button onClick={() => navigate("/auth")}>Go to sign in</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Home className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>You're invited!</CardTitle>
          <CardDescription>
            Join <strong>{invite?.household?.name}</strong> on HomeRewards
          </CardDescription>
        </CardHeader>

        <CardContent>
          {currentStep === "auth" ? (
            <div className="space-y-4">
              {/* Step indicator */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</span>
                <span className="font-medium text-foreground">Create your account</span>
                <span className="mx-1">→</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted font-bold">2</span>
                <span>Join household</span>
              </div>

              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setAuthMode("signup")}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${authMode === "signup" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                  Sign up
                </button>
                <button
                  onClick={() => setAuthMode("signin")}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${authMode === "signin" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                  Already have account
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
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
                    autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Please wait..." : authMode === "signup" ? "Create account & continue" : "Sign in & continue"}
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Step indicator */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white font-bold">✓</span>
                <span>Account ready</span>
                <span className="mx-1">→</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</span>
                <span className="font-medium text-foreground">Join household</span>
              </div>

              <p className="text-sm text-muted-foreground">
                Logged in as <strong>{user?.email}</strong>. Choose how you'll appear in <strong>{invite?.household?.name}</strong>.
              </p>

              <form onSubmit={handleJoin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="display-name">Your name in this household</Label>
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Maria"
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting || !displayName.trim()}>
                  <UserPlus className="h-4 w-4" />
                  {submitting ? "Joining..." : `Join ${invite?.household?.name}`}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

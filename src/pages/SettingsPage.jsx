import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Globe } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useHouseholdContext } from "@/context/HouseholdContext"
import { useHouseholds } from "@/hooks/useHousehold"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { useToast } from "@/components/ui/Toast"
import { useQueryClient } from "@tanstack/react-query"

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const qc = useQueryClient()
  const { user } = useAuth()
  const { activeHouseholdId, setActiveHouseholdId } = useHouseholdContext()
  const { data: households } = useHouseholds(user?.id)
  const activeHousehold = households?.find((h) => h.id === activeHouseholdId)

  const [hhName, setHhName] = useState(activeHousehold?.name || "")
  const [saving, setSaving] = useState(false)

  const saveHouseholdName = async (e) => {
    e.preventDefault()
    if (!hhName.trim() || !activeHouseholdId) return
    setSaving(true)
    try {
      const { error } = await supabase.from("households").update({ name: hhName.trim() }).eq("id", activeHouseholdId)
      if (error) throw error
      qc.invalidateQueries({ queryKey: ["households"] })
      toast({ message: t("common.save") + " ✓" })
    } catch {
      toast({ message: t("common.error"), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const leaveHousehold = async () => {
    if (!confirm(t("settings.leave_confirm"))) return
    try {
      const { data: member } = await supabase
        .from("household_members")
        .select("id")
        .eq("household_id", activeHouseholdId)
        .eq("user_id", user.id)
        .single()
      if (member) {
        await supabase.from("household_members").delete().eq("id", member.id)
      }
      setActiveHouseholdId(null)
      qc.invalidateQueries({ queryKey: ["households"] })
      navigate("/households")
    } catch {
      toast({ message: t("common.error"), type: "error" })
    }
  }

  const deleteHousehold = async () => {
    if (!confirm(t("settings.delete_confirm"))) return
    try {
      await supabase.from("households").delete().eq("id", activeHouseholdId)
      setActiveHouseholdId(null)
      qc.invalidateQueries({ queryKey: ["households"] })
      navigate("/households")
    } catch {
      toast({ message: t("common.error"), type: "error" })
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t("settings.language")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={i18n.language === "en" ? "default" : "outline"}
              onClick={() => i18n.changeLanguage("en")}
            >
              🇺🇸 {t("settings.english")}
            </Button>
            <Button
              variant={i18n.language === "es" ? "default" : "outline"}
              onClick={() => i18n.changeLanguage("es")}
            >
              🇪🇸 {t("settings.spanish")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Household name */}
      {activeHousehold && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.household_name")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveHouseholdName} className="flex gap-2">
              <Input
                value={hhName}
                onChange={(e) => setHhName(e.target.value)}
                placeholder={activeHousehold.name}
              />
              <Button type="submit" disabled={saving || !hhName.trim()}>
                {saving ? t("settings.saving") : t("common.save")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Danger zone */}
      {activeHousehold && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base text-destructive">{t("settings.danger_zone")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t("settings.leave_household")}</p>
                <p className="text-xs text-muted-foreground">{activeHousehold.name}</p>
              </div>
              <Button variant="outline" size="sm" onClick={leaveHousehold}>
                {t("settings.leave_household")}
              </Button>
            </div>
            {activeHousehold.role === "admin" && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <p className="text-sm font-medium text-destructive">{t("settings.delete_household")}</p>
                  <p className="text-xs text-muted-foreground">{t("common.error")}</p>
                </div>
                <Button variant="destructive" size="sm" onClick={deleteHousehold}>
                  {t("settings.delete_household")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

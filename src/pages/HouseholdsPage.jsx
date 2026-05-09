import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Home, Plus, ArrowRight } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useHouseholds, useCreateHousehold } from "@/hooks/useHousehold"
import { useHouseholdContext } from "@/context/HouseholdContext"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { useToast } from "@/components/ui/Toast"

export function HouseholdsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { data: households, isLoading } = useHouseholds(user?.id)
  const createHousehold = useCreateHousehold()
  const { setActiveHouseholdId } = useHouseholdContext()
  const [name, setName] = useState("")
  const [showForm, setShowForm] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const hh = await createHousehold.mutateAsync({ name: name.trim(), userId: user.id })
      setActiveHouseholdId(hh.id)
      toast({ message: t("household.create") + " ✓" })
      navigate("/dashboard")
    } catch {
      toast({ message: t("common.error"), type: "error" })
    }
  }

  const select = (id) => {
    setActiveHouseholdId(id)
    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Home className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">{t("household.title")}</h1>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <>
            {households?.length === 0 && !showForm && (
              <p className="text-center text-muted-foreground">{t("household.no_households")}</p>
            )}

            {households?.map((h) => (
              <Card key={h.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => select(h.id)}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Home className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{h.name}</p>
                      <Badge variant="secondary" className="text-xs mt-0.5">
                        {t(`household.${h.role}`)}
                      </Badge>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}

            {showForm ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("household.create")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreate} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="hh-name">{t("household.name")}</Label>
                      <Input
                        id="hh-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("household.name_placeholder")}
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={createHousehold.isPending || !name.trim()} className="flex-1">
                        {createHousehold.isPending ? t("household.creating") : t("common.create")}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Button className="w-full" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                {t("household.create")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

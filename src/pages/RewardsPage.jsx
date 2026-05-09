import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Gift, Trash2, CheckCircle, XCircle, Star } from "lucide-react"
import { useHouseholdContext } from "@/context/HouseholdContext"
import { useAuth } from "@/hooks/useAuth"
import { useCurrentMember } from "@/hooks/useMembers"
import { useRewards, useRedemptions, useRedeemReward, useCreateReward, useDeleteReward, useUpdateRedemption } from "@/hooks/useRewards"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Modal } from "@/components/ui/Modal"
import { useToast } from "@/components/ui/Toast"

export function RewardsPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === "es" ? "es" : "en"
  const toast = useToast()
  const { activeHouseholdId } = useHouseholdContext()
  const { user } = useAuth()
  const { data: member } = useCurrentMember(activeHouseholdId, user?.id)
  const { data: rewards, isLoading } = useRewards(activeHouseholdId)
  const { data: redemptions } = useRedemptions(activeHouseholdId)
  const redeemReward = useRedeemReward()
  const createReward = useCreateReward()
  const deleteReward = useDeleteReward()
  const updateRedemption = useUpdateRedemption()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showRedeemModal, setShowRedeemModal] = useState(null)
  const [form, setForm] = useState({ name_en: "", name_es: "", description_en: "", description_es: "", points_cost: 50 })

  const pendingRedemptions = redemptions?.filter((r) => r.status === "pending") || []

  const handleRedeem = async (reward) => {
    if (!member) return
    if (member.points_balance < reward.points_cost) {
      toast({ message: t("rewards.not_enough_points"), type: "error" })
      return
    }
    try {
      await redeemReward.mutateAsync({
        rewardId: reward.id, memberId: member.id,
        householdId: activeHouseholdId, pointsCost: reward.points_cost,
      })
      toast({ message: t("rewards.redeem") + " ✓" })
      setShowRedeemModal(null)
    } catch (err) {
      toast({ message: err.message === "not_enough_points" ? t("rewards.not_enough_points") : t("common.error"), type: "error" })
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createReward.mutateAsync({
        ...form, household_id: activeHouseholdId, is_predefined: false, is_active: true,
        points_cost: Number(form.points_cost),
      })
      toast({ message: t("rewards.add") + " ✓" })
      setShowAddModal(false)
      setForm({ name_en: "", name_es: "", description_en: "", description_es: "", points_cost: 50 })
    } catch {
      toast({ message: t("common.error"), type: "error" })
    }
  }

  const handleUpdateRedemption = async (redemptionId, status) => {
    try {
      await updateRedemption.mutateAsync({ redemptionId, status, householdId: activeHouseholdId })
      toast({ message: status + " ✓" })
    } catch {
      toast({ message: t("common.error"), type: "error" })
    }
  }

  const statusVariant = { pending: "warning", approved: "success", fulfilled: "success", rejected: "destructive" }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("rewards.title")}</h1>
        <div className="flex items-center gap-2">
          {member && (
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3" />
              {member.points_balance} {t("common.points_abbr")}
            </Badge>
          )}
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            {t("rewards.add")}
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground">{t("common.loading")}</p>}

      {!isLoading && !rewards?.length && (
        <p className="text-center text-muted-foreground py-12">{t("rewards.no_rewards")}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {rewards?.map((reward) => {
          const canAfford = (member?.points_balance ?? 0) >= reward.points_cost
          return (
            <Card key={reward.id} className={canAfford ? "" : "opacity-60"}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-primary shrink-0" />
                      <p className="font-medium truncate">{reward[`name_${lang}`] || reward.name_en}</p>
                    </div>
                    {reward[`description_${lang}`] && (
                      <p className="text-sm text-muted-foreground mt-1">{reward[`description_${lang}`]}</p>
                    )}
                  </div>
                  <Badge variant={canAfford ? "default" : "outline"} className="shrink-0">
                    {reward.points_cost} {t("common.points_abbr")}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm" className="flex-1"
                    disabled={!canAfford || redeemReward.isPending}
                    onClick={() => setShowRedeemModal(reward)}
                  >
                    {t("rewards.redeem")}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteReward.mutate({ rewardId: reward.id, householdId: activeHouseholdId })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pending approvals (admin view) */}
      {pendingRedemptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("rewards.pending_approvals")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRedemptions.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{r.reward?.[`name_${lang}`] || r.reward?.name_en}</p>
                  <p className="text-xs text-muted-foreground">{r.member?.display_name} · {r.points_spent} {t("common.points_abbr")}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleUpdateRedemption(r.id, "fulfilled")}>
                    <CheckCircle className="h-3 w-3" />
                    {t("rewards.fulfill")}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleUpdateRedemption(r.id, "rejected")}>
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Redeem confirmation */}
      <Modal open={!!showRedeemModal} onClose={() => setShowRedeemModal(null)} title={t("rewards.redeem")}>
        <div className="space-y-4">
          <p className="text-sm">
            {showRedeemModal?.[`name_${lang}`] || showRedeemModal?.name_en}
            {" — "}
            <span className="font-medium">{showRedeemModal?.points_cost} {t("common.points")}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.your_balance")}: {member?.points_balance} → {(member?.points_balance ?? 0) - (showRedeemModal?.points_cost ?? 0)}
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowRedeemModal(null)}>{t("common.cancel")}</Button>
            <Button onClick={() => handleRedeem(showRedeemModal)} disabled={redeemReward.isPending}>
              {redeemReward.isPending ? t("rewards.redeeming") : t("rewards.redeem")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add reward modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={t("rewards.add")}>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name (EN)</Label>
              <Input value={form.name_en} onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Nombre (ES)</Label>
              <Input value={form.name_es} onChange={(e) => setForm((f) => ({ ...f, name_es: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Description (EN)</Label>
              <Input value={form.description_en} onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción (ES)</Label>
              <Input value={form.description_es} onChange={(e) => setForm((f) => ({ ...f, description_es: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("rewards.cost")}</Label>
            <Input type="number" min="1" value={form.points_cost} onChange={(e) => setForm((f) => ({ ...f, points_cost: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={createReward.isPending}>{t("common.create")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

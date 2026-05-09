import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Trash2, Star, Crown } from "lucide-react"
import { useHouseholdContext } from "@/context/HouseholdContext"
import { useAuth } from "@/hooks/useAuth"
import { useMembers, useCurrentMember, useAddMember, useRemoveMember, useUpdateMember } from "@/hooks/useMembers"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select } from "@/components/ui/Select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Modal } from "@/components/ui/Modal"
import { useToast } from "@/components/ui/Toast"

const AVATAR_COLORS = [
  "#7c3aed", "#db2777", "#0891b2", "#059669",
  "#d97706", "#dc2626", "#7c3aed", "#4f46e5",
]

function AvatarCircle({ name, color, size = "md" }) {
  const sizeClass = size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-sm"
  return (
    <div
      className={`flex items-center justify-center rounded-full text-white font-bold shrink-0 ${sizeClass}`}
      style={{ backgroundColor: color || "#7c3aed" }}
    >
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  )
}

export function MembersPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const { activeHouseholdId } = useHouseholdContext()
  const { user } = useAuth()
  const { data: members, isLoading } = useMembers(activeHouseholdId)
  const { data: currentMember } = useCurrentMember(activeHouseholdId, user?.id)
  const addMember = useAddMember()
  const removeMember = useRemoveMember()
  const updateMember = useUpdateMember()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(null)
  const [displayName, setDisplayName] = useState("")
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0])
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("member")

  const isAdmin = currentMember?.role === "admin"

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) return
    try {
      await addMember.mutateAsync({ householdId: activeHouseholdId, displayName: displayName.trim(), avatarColor: selectedColor })
      toast({ message: t("members.invite") + " ✓" })
      setShowAddModal(false)
      setDisplayName("")
      setSelectedColor(AVATAR_COLORS[0])
    } catch {
      toast({ message: t("common.error"), type: "error" })
    }
  }

  const handleRemove = async (memberId) => {
    if (!confirm(t("members.remove_confirm"))) return
    try {
      await removeMember.mutateAsync({ memberId, householdId: activeHouseholdId })
      toast({ message: t("members.remove") + " ✓" })
    } catch {
      toast({ message: t("common.error"), type: "error" })
    }
  }

  const openEdit = (m) => {
    setShowEditModal(m)
    setEditName(m.display_name)
    setEditRole(m.role)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    try {
      await updateMember.mutateAsync({
        memberId: showEditModal.id, householdId: activeHouseholdId,
        display_name: editName.trim(), role: editRole,
      })
      toast({ message: t("common.save") + " ✓" })
      setShowEditModal(null)
    } catch {
      toast({ message: t("common.error"), type: "error" })
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("members.title")}</h1>
        {isAdmin && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            {t("members.invite")}
          </Button>
        )}
      </div>

      {isLoading && <p className="text-muted-foreground">{t("common.loading")}</p>}

      {!isLoading && !members?.length && (
        <p className="text-center text-muted-foreground py-12">{t("members.no_members")}</p>
      )}

      <div className="space-y-3">
        {members?.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <AvatarCircle name={m.display_name} color={m.avatar_color} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{m.display_name}</p>
                  {m.role === "admin" && <Crown className="h-4 w-4 text-yellow-500" />}
                  {m.user_id === user?.id && (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{t(`household.${m.role}`)}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {m.points_balance} {t("common.points_abbr")}
                  </span>
                </div>
              </div>
              {isAdmin && m.id !== currentMember?.id && (
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
                    {t("common.edit")}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleRemove(m.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add member modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={t("members.invite")}>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="display-name">{t("members.display_name")}</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Maria"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Avatar color</Label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`h-8 w-8 rounded-full transition-all ${selectedColor === color ? "ring-2 ring-offset-2 ring-primary scale-110" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary rounded-md">
            <AvatarCircle name={displayName || "?"} color={selectedColor} />
            <span className="text-sm font-medium">{displayName || t("members.display_name")}</span>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={addMember.isPending || !displayName.trim()}>
              {addMember.isPending ? t("members.inviting") : t("common.add")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit member modal */}
      <Modal open={!!showEditModal} onClose={() => setShowEditModal(null)} title={t("common.edit")}>
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("members.display_name")}</Label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>{t("members.role")}</Label>
            <Select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
              <option value="admin">{t("household.admin")}</option>
              <option value="member">{t("household.member")}</option>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowEditModal(null)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={updateMember.isPending}>{t("common.save")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

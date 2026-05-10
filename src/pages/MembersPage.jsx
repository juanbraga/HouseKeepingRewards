import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link2, Trash2, Star, Crown, CheckSquare, Gift, X, Copy, Check } from "lucide-react"
import { useHouseholdContext } from "@/context/HouseholdContext"
import { useAuth } from "@/hooks/useAuth"
import { useMembers, useCurrentMember, useRemoveMember, useUpdateMember } from "@/hooks/useMembers"
import { useCreateInvite } from "@/hooks/useInvites"
import { useMemberActivity } from "@/hooks/useMemberActivity"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select } from "@/components/ui/Select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Modal } from "@/components/ui/Modal"
import { useToast } from "@/components/ui/Toast"

const ANIMAL_AVATARS = [
  "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯",
  "🦁","🐸","🐮","🐷","🐙","🦋","🐝","🦄","🐬","🦔",
  "🐧","🦆","🦉","🦋","🐺","🦝","🦘","🐊","🦒","🐘",
]

export function AvatarCircle({ name, color, avatarEmoji, size = "md" }) {
  const sizeClass = size === "lg" ? "h-12 w-12 text-2xl" : "h-9 w-9 text-lg"
  return (
    <div
      className={`flex items-center justify-center rounded-full shrink-0 ${sizeClass} ${avatarEmoji ? "bg-muted" : "text-white font-bold"}`}
      style={!avatarEmoji ? { backgroundColor: color || "#7c3aed" } : {}}
    >
      {avatarEmoji || name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  )
}

function MemberActivityPanel({ member, lang, onClose }) {
  const { data, isLoading } = useMemberActivity(member.id)

  const totalPoints = data?.completions?.reduce((s, c) => s + c.points_earned, 0) ?? 0
  const totalSpent = data?.redemptions?.reduce((s, r) => s + r.points_spent, 0) ?? 0

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-50 ml-auto h-full w-full max-w-sm bg-card border-l shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <AvatarCircle name={member.display_name} color={member.avatar_color} avatarEmoji={member.avatar_emoji} size="lg" />
          <div className="flex-1">
            <p className="font-semibold">{member.display_name}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3" />
              {member.points_balance} pts balance
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 p-4 border-b">
          <div className="text-center p-3 bg-green-50 rounded-md">
            <p className="text-lg font-bold text-green-700">+{totalPoints}</p>
            <p className="text-xs text-green-600">pts earned</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-md">
            <p className="text-lg font-bold text-orange-700">{data?.completions?.length ?? 0}</p>
            <p className="text-xs text-orange-600">tasks done</p>
          </div>
        </div>

        {/* Activity */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && <p className="text-center text-muted-foreground text-sm">Loading...</p>}

          {/* Completions */}
          {data?.completions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tasks completed</p>
              <div className="space-y-2">
                {data.completions.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 text-sm">
                    <CheckSquare className="h-4 w-4 text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{c.task?.[`name_${lang}`] || c.task?.name_en}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.completed_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="success">+{c.points_earned}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Redemptions */}
          {data?.redemptions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Rewards redeemed</p>
              <div className="space-y-2">
                {data.redemptions.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 text-sm">
                    <Gift className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{r.reward?.[`name_${lang}`] || r.reward?.name_en}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.redeemed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">-{r.points_spent}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && !data?.completions?.length && !data?.redemptions?.length && (
            <p className="text-center text-muted-foreground text-sm py-8">No activity yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function MembersPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === "es" ? "es" : "en"
  const toast = useToast()
  const { activeHouseholdId } = useHouseholdContext()
  const { user } = useAuth()
  const { data: members, isLoading } = useMembers(activeHouseholdId)
  const { data: currentMember } = useCurrentMember(activeHouseholdId, user?.id)
  const removeMember = useRemoveMember()
  const updateMember = useUpdateMember()
  const createInvite = useCreateInvite()

  const [showEditModal, setShowEditModal] = useState(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteLink, setInviteLink] = useState(null)
  const [copied, setCopied] = useState(false)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("member")
  const [editEmoji, setEditEmoji] = useState("")
  const [selectedMember, setSelectedMember] = useState(null)

  const isAdmin = currentMember?.role === "admin"

  const handleGenerateInvite = async () => {
    try {
      const invite = await createInvite.mutateAsync({ householdId: activeHouseholdId, userId: user.id })
      const link = `${window.location.origin}/join/${invite.token}`
      setInviteLink(link)
      setShowInviteModal(true)
    } catch {
      toast({ message: t("common.error"), type: "error" })
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
    setEditEmoji(m.avatar_emoji || "")
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    try {
      await updateMember.mutateAsync({
        memberId: showEditModal.id, householdId: activeHouseholdId,
        display_name: editName.trim(), role: editRole, avatar_emoji: editEmoji || null,
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
          <Button onClick={handleGenerateInvite} disabled={createInvite.isPending}>
            <Link2 className="h-4 w-4" />
            Invite member
          </Button>
        )}
      </div>

      {isLoading && <p className="text-muted-foreground">{t("common.loading")}</p>}

      {!isLoading && !members?.length && (
        <p className="text-center text-muted-foreground py-12">{t("members.no_members")}</p>
      )}

      <div className="space-y-3">
        {members?.map((m) => (
          <Card
            key={m.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setSelectedMember(m)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <AvatarCircle name={m.display_name} color={m.avatar_color} avatarEmoji={m.avatar_emoji} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{m.display_name}</p>
                  {m.role === "admin" && <Crown className="h-4 w-4 text-yellow-500" />}
                  {m.user_id === user?.id && (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">{t(`household.${m.role}`)}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {m.points_balance} {t("common.points_abbr")}
                  </span>
                  {m.email && (
                    <span className="text-xs text-muted-foreground">{m.email}</span>
                  )}
                  {!m.user_id && (
                    <Badge variant="warning" className="text-xs">No account</Badge>
                  )}
                </div>
              </div>
              {(isAdmin || m.id === currentMember?.id) && (
                <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
                    {t("common.edit")}
                  </Button>
                  {isAdmin && m.id !== currentMember?.id && (
                    <Button size="icon" variant="ghost" onClick={() => handleRemove(m.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invite link modal */}
      <Modal open={showInviteModal} onClose={() => { setShowInviteModal(false); setInviteLink(null) }} title="Invite member">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share this link. It expires in 7 days and can only be used once.
          </p>
          <div className="flex gap-2">
            <Input value={inviteLink || ""} readOnly className="text-xs" />
            <Button size="icon" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button className="w-full" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy invite link"}
          </Button>
        </div>
      </Modal>

      {/* Edit member modal */}
      <Modal open={!!showEditModal} onClose={() => setShowEditModal(null)} title={t("common.edit")}>
        <form onSubmit={handleEdit} className="space-y-4">
          {showEditModal?.email && (
            <p className="text-sm text-muted-foreground">{showEditModal.email}</p>
          )}

          {/* Avatar preview + picker */}
          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex items-center gap-3 mb-1">
              <AvatarCircle name={editName} color={showEditModal?.avatar_color} avatarEmoji={editEmoji} size="lg" />
              {editEmoji && (
                <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => setEditEmoji("")}>
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-10 gap-1">
              {ANIMAL_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setEditEmoji(emoji)}
                  className={`text-xl p-1 rounded-md transition-colors hover:bg-accent ${editEmoji === emoji ? "bg-primary/20 ring-2 ring-primary" : ""}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("members.display_name")}</Label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>
          {isAdmin && showEditModal?.id !== currentMember?.id && (
            <div className="space-y-1.5">
              <Label>{t("members.role")}</Label>
              <Select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                <option value="admin">{t("household.admin")}</option>
                <option value="member">{t("household.member")}</option>
              </Select>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowEditModal(null)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={updateMember.isPending}>{t("common.save")}</Button>
          </div>
        </form>
      </Modal>

      {/* Member activity panel */}
      {selectedMember && (
        <MemberActivityPanel
          member={selectedMember}
          lang={lang}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  )
}

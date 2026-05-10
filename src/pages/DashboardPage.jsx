import { useTranslation } from "react-i18next"
import { Trophy, CheckSquare, Gift, Star, User } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useHouseholdContext } from "@/context/HouseholdContext"
import { useMembers, useCurrentMember } from "@/hooks/useMembers"
import { useTaskCompletions } from "@/hooks/useTasks"
import { useMemberActivity } from "@/hooks/useMemberActivity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

function AvatarCircle({ name, color }) {
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-bold shrink-0"
      style={{ backgroundColor: color || "#7c3aed" }}
    >
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  )
}

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { activeHouseholdId } = useHouseholdContext()
  const { data: members } = useMembers(activeHouseholdId)
  const { data: currentMember } = useCurrentMember(activeHouseholdId, user?.id)
  const { data: completions } = useTaskCompletions(activeHouseholdId, 20)
  const { data: myActivity } = useMemberActivity(currentMember?.id)

  const lang = i18n.language === "es" ? "es" : "en"

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const myWeeklyCompletions = myActivity?.completions?.filter((c) => new Date(c.completed_at) > weekAgo) || []
  const myTotalPoints = myActivity?.completions?.reduce((s, c) => s + c.points_earned, 0) ?? 0
  const myPointsSpent = myActivity?.redemptions?.reduce((s, r) => s + r.points_spent, 0) ?? 0

  const householdWeeklyCompletions = completions?.filter((c) => new Date(c.completed_at) > weekAgo) || []

  return (
    <div className="space-y-8 max-w-4xl">
      <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>

      {/* ── My summary ─────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          My summary
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{currentMember?.points_balance ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("dashboard.your_balance")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{myWeeklyCompletions.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Tasks this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">+{myTotalPoints}</p>
              <p className="text-xs text-muted-foreground mt-1">Total pts earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{myActivity?.redemptions?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Rewards redeemed</p>
            </CardContent>
          </Card>
        </div>

        {/* My recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              My recent tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!myActivity?.completions?.length && (
              <p className="text-sm text-muted-foreground">{t("dashboard.no_activity")}</p>
            )}
            <div className="space-y-2">
              {myActivity?.completions?.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center gap-3 text-sm">
                  <CheckSquare className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="flex-1 truncate">{c.task?.[`name_${lang}`] || c.task?.name_en}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(c.completed_at).toLocaleString()}
                  </span>
                  <Badge variant="success">+{c.points_earned}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Household summary ───────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2 text-muted-foreground">
          <Trophy className="h-4 w-4" />
          Household summary
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{householdWeeklyCompletions.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Tasks this week (all members)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{completions?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Total tasks completed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-yellow-500" />
                {t("dashboard.leaderboard")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!members?.length && (
                <p className="text-sm text-muted-foreground">{t("dashboard.no_activity")}</p>
              )}
              {members?.map((m, idx) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-bold text-muted-foreground">{idx + 1}</span>
                  <AvatarCircle name={m.display_name} color={m.avatar_color} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {m.display_name}
                      {m.id === currentMember?.id && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                    </p>
                  </div>
                  <Badge variant="secondary">{m.points_balance} {t("common.points_abbr")}</Badge>
                  {idx === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent household activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckSquare className="h-4 w-4" />
                {t("dashboard.recent_activity")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!completions?.length && (
                <p className="text-sm text-muted-foreground">{t("dashboard.no_activity")}</p>
              )}
              {completions?.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <AvatarCircle name={c.member?.display_name} color={c.member?.avatar_color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {c.task?.[`name_${lang}`] || c.task?.name_en}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.member?.display_name} · {new Date(c.completed_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="success">+{c.points_earned}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

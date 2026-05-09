import { useTranslation } from "react-i18next"
import { Trophy, CheckSquare, Gift, Star } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useHouseholdContext } from "@/context/HouseholdContext"
import { useMembers, useCurrentMember } from "@/hooks/useMembers"
import { useTaskCompletions } from "@/hooks/useTasks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

const AVATAR_COLORS = ["#7c3aed", "#db2777", "#0891b2", "#059669", "#d97706", "#dc2626"]

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
  const { data: completions } = useTaskCompletions(activeHouseholdId, 10)

  const lang = i18n.language === "es" ? "es" : "en"

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const weeklyCompletions = completions?.filter((c) => new Date(c.completed_at) > weekAgo) || []

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("dashboard.your_balance")}</p>
              <p className="text-2xl font-bold">{currentMember?.points_balance ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-100 p-3">
              <CheckSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("dashboard.this_week")}</p>
              <p className="text-2xl font-bold">{weeklyCompletions.length}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.tasks_completed")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-yellow-100 p-3">
              <Gift className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("dashboard.all_time")}</p>
              <p className="text-2xl font-bold">{completions?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.tasks_completed")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
                <span className="w-6 text-sm font-bold text-muted-foreground">{idx + 1}</span>
                <AvatarCircle name={m.display_name} color={m.avatar_color} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{m.display_name}</p>
                </div>
                <Badge variant="secondary">
                  {m.points_balance} {t("common.points_abbr")}
                </Badge>
                {idx === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
                  <p className="text-xs text-muted-foreground">{c.member?.display_name}</p>
                </div>
                <Badge variant="success">+{c.points_earned}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

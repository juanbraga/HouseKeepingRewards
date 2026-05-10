import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, CheckCircle, Trash2, Tag, Clock } from "lucide-react"
import { useHouseholdContext } from "@/context/HouseholdContext"
import { useAuth } from "@/hooks/useAuth"
import { useCurrentMember } from "@/hooks/useMembers"
import { useTasks, useTaskTemplates, useCompleteTask, useCreateTask, useDeleteTask } from "@/hooks/useTasks"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select } from "@/components/ui/Select"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Modal } from "@/components/ui/Modal"
import { useToast } from "@/components/ui/Toast"

const CATEGORIES = ["cleaning", "cooking", "laundry", "shopping", "maintenance", "other"]
const FREQUENCIES = ["daily", "weekly", "monthly", "one-time"]

export function TasksPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === "es" ? "es" : "en"
  const toast = useToast()
  const { activeHouseholdId } = useHouseholdContext()
  const { user } = useAuth()
  const { data: member } = useCurrentMember(activeHouseholdId, user?.id)
  const { data: tasks, isLoading } = useTasks(activeHouseholdId)
  const { data: templates } = useTaskTemplates()
  const completeTask = useCompleteTask()
  const createTask = useCreateTask()
  const deleteTask = useDeleteTask()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(null)
  const [activeTab, setActiveTab] = useState("custom")
  const [notes, setNotes] = useState("")
  const [completedAt, setCompletedAt] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")

  const [form, setForm] = useState({
    name_en: "", name_es: "", description_en: "", description_es: "",
    points: 10, frequency: "weekly", category: "cleaning",
  })

  const openCompleteModal = (task) => {
    // Default to current local datetime
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    setCompletedAt(now.toISOString().slice(0, 16))
    setShowCompleteModal(task)
  }

  const handleComplete = async (task) => {
    if (!member) return
    try {
      await completeTask.mutateAsync({
        taskId: task.id, memberId: member.id,
        householdId: activeHouseholdId, points: task.points, notes,
        completedAt: completedAt ? new Date(completedAt).toISOString() : new Date().toISOString(),
      })
      toast({ message: `+${task.points} ${t("common.points")}! ✓` })
      setShowCompleteModal(null)
      setNotes("")
      setCompletedAt("")
    } catch {
      toast({ message: t("common.error"), type: "error" })
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createTask.mutateAsync({
        ...form, household_id: activeHouseholdId, is_template: false, is_active: true,
        points: Number(form.points),
      })
      toast({ message: t("tasks.add") + " ✓" })
      setShowAddModal(false)
      setForm({ name_en: "", name_es: "", description_en: "", description_es: "", points: 10, frequency: "weekly", category: "cleaning" })
    } catch {
      toast({ message: t("common.error"), type: "error" })
    }
  }

  const handleAddTemplate = async (tpl) => {
    try {
      await createTask.mutateAsync({
        name_en: tpl.name_en, name_es: tpl.name_es,
        description_en: tpl.description_en, description_es: tpl.description_es,
        points: tpl.points, frequency: tpl.frequency, category: tpl.category,
        household_id: activeHouseholdId, is_template: false, is_active: true,
      })
      toast({ message: t("tasks.add") + " ✓" })
      setShowAddModal(false)
    } catch {
      toast({ message: t("common.error"), type: "error" })
    }
  }

  const handleDelete = async (task) => {
    try {
      await deleteTask.mutateAsync({ taskId: task.id, householdId: activeHouseholdId })
      toast({ message: t("common.delete") + " ✓" })
    } catch {
      toast({ message: t("common.error"), type: "error" })
    }
  }

  const filtered = filterCategory === "all" ? tasks : tasks?.filter((t) => t.category === filterCategory)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("tasks.title")}</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          {t("tasks.add")}
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filterCategory === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filterCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
          >
            {t(`tasks.categories.${cat}`)}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted-foreground">{t("common.loading")}</p>}

      {!isLoading && !filtered?.length && (
        <p className="text-center text-muted-foreground py-12">{t("tasks.no_tasks")}</p>
      )}

      <div className="grid gap-3">
        {filtered?.map((task) => (
          <Card key={task.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{task[`name_${lang}`] || task.name_en}</p>
                  <Badge variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {t(`tasks.categories.${task.category}`)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {t(`tasks.frequencies.${task.frequency}`)}
                  </Badge>
                </div>
                {task[`description_${lang}`] && (
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">{task[`description_${lang}`]}</p>
                )}
              </div>
              <Badge variant="success" className="shrink-0">+{task.points} {t("common.points_abbr")}</Badge>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => openCompleteModal(task)}>
                  <CheckCircle className="h-4 w-4" />
                  {t("tasks.complete")}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(task)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Complete task modal */}
      <Modal
        open={!!showCompleteModal}
        onClose={() => { setShowCompleteModal(null); setNotes(""); setCompletedAt("") }}
        title={showCompleteModal?.[`name_${lang}`] || showCompleteModal?.name_en || ""}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("tasks.complete")} — <span className="font-medium text-green-600">+{showCompleteModal?.points} {t("common.points")}</span>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="completed-at">Date & time</Label>
            <Input
              id="completed-at"
              type="datetime-local"
              value={completedAt}
              onChange={(e) => setCompletedAt(e.target.value)}
              max={new Date(new Date().setMinutes(new Date().getMinutes() - new Date().getTimezoneOffset())).toISOString().slice(0, 16)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("tasks.notes")}</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowCompleteModal(null); setNotes(""); setCompletedAt("") }}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => handleComplete(showCompleteModal)} disabled={completeTask.isPending}>
              {completeTask.isPending ? t("tasks.completing") : t("tasks.complete")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add task modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={t("tasks.add")} className="max-w-lg">
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("custom")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "custom" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
            >
              {t("tasks.add_custom")}
            </button>
            <button
              onClick={() => setActiveTab("template")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "template" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
            >
              {t("tasks.from_template")}
            </button>
          </div>

          {activeTab === "custom" ? (
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
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("tasks.points")}</Label>
                  <Input type="number" min="1" value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("tasks.frequency")}</Label>
                  <Select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}>
                    {FREQUENCIES.map((f) => <option key={f} value={f}>{t(`tasks.frequencies.${f}`)}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("tasks.category")}</Label>
                  <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{t(`tasks.categories.${c}`)}</option>)}
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>{t("common.cancel")}</Button>
                <Button type="submit" disabled={createTask.isPending}>{t("common.create")}</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {templates?.map((tpl) => (
                <div key={tpl.id} className="flex items-center justify-between p-3 rounded-md border hover:border-primary cursor-pointer" onClick={() => handleAddTemplate(tpl)}>
                  <div>
                    <p className="text-sm font-medium">{tpl[`name_${lang}`] || tpl.name_en}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">{t(`tasks.categories.${tpl.category}`)}</Badge>
                      <Badge variant="secondary" className="text-xs">+{tpl.points}</Badge>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

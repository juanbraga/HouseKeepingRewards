import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useTasks(householdId) {
  return useQuery({
    queryKey: ["tasks", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("household_id", householdId)
        .eq("is_active", true)
        .order("category")
      if (error) throw error
      return data
    },
    enabled: !!householdId,
  })
}

export function useTaskTemplates() {
  return useQuery({
    queryKey: ["task_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .is("household_id", null)
        .eq("is_template", true)
        .order("category")
      if (error) throw error
      return data
    },
  })
}

export function useTaskCompletions(householdId, limit = 20) {
  return useQuery({
    queryKey: ["completions", householdId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_completions")
        .select("*, task:tasks(name_en, name_es, points, category), member:household_members(display_name, avatar_color)")
        .eq("tasks.household_id", householdId)
        .order("completed_at", { ascending: false })
        .limit(limit)
      if (error) throw error
      return data
    },
    enabled: !!householdId,
  })
}

export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, memberId, householdId, points, notes, completedAt }) => {
      const { error: compErr } = await supabase
        .from("task_completions")
        .insert({ task_id: taskId, member_id: memberId, points_earned: points, notes, completed_at: completedAt })
      if (compErr) throw compErr

      const { data: member, error: fetchErr } = await supabase
        .from("household_members")
        .select("points_balance")
        .eq("id", memberId)
        .single()
      if (fetchErr) throw fetchErr

      const { error: updateErr } = await supabase
        .from("household_members")
        .update({ points_balance: member.points_balance + points })
        .eq("id", memberId)
      if (updateErr) throw updateErr
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["completions", vars.householdId] })
      qc.invalidateQueries({ queryKey: ["members", vars.householdId] })
      qc.invalidateQueries({ queryKey: ["member"] })
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (task) => {
      const { error } = await supabase.from("tasks").insert(task)
      if (error) throw error
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["tasks", vars.household_id] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, householdId }) => {
      const { error } = await supabase.from("tasks").update({ is_active: false }).eq("id", taskId)
      if (error) throw error
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["tasks", vars.householdId] }),
  })
}

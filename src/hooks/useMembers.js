import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useMembers(householdId) {
  return useQuery({
    queryKey: ["members", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("household_members")
        .select("*")
        .eq("household_id", householdId)
        .order("points_balance", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!householdId,
  })
}

export function useCurrentMember(householdId, userId) {
  return useQuery({
    queryKey: ["member", householdId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("household_members")
        .select("*")
        .eq("household_id", householdId)
        .eq("user_id", userId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!householdId && !!userId,
  })
}

export function useInviteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ householdId, email, displayName }) => {
      const { data: { user }, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email)
      if (inviteErr) throw inviteErr
      const { error } = await supabase
        .from("household_members")
        .insert({ household_id: householdId, user_id: user.id, display_name: displayName, role: "member", points_balance: 0 })
      if (error) throw error
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["members", vars.householdId] }),
  })
}

export function useAddMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ householdId, displayName, avatarColor }) => {
      const { data, error } = await supabase
        .from("household_members")
        .insert({ household_id: householdId, display_name: displayName, role: "member", points_balance: 0, avatar_color: avatarColor })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["members", vars.householdId] }),
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ memberId, householdId }) => {
      const { error } = await supabase.from("household_members").delete().eq("id", memberId)
      if (error) throw error
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["members", vars.householdId] }),
  })
}

export function useUpdateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ memberId, householdId, ...fields }) => {
      const { error } = await supabase.from("household_members").update(fields).eq("id", memberId)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["members", vars.householdId] })
      qc.invalidateQueries({ queryKey: ["member"] })
    },
  })
}

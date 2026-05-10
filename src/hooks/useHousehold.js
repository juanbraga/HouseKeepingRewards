import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useHouseholds(userId) {
  return useQuery({
    queryKey: ["households", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("household_members")
        .select("role, household:households(id, name, created_at)")
        .eq("user_id", userId)
      if (error) throw error
      return data.map((m) => ({ ...m.household, role: m.role }))
    },
    enabled: !!userId,
  })
}

export function useCreateHousehold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, userId }) => {
      const { data: hh, error: hhErr } = await supabase
        .from("households")
        .insert({ name, created_by: userId })
        .select()
        .single()
      if (hhErr) throw hhErr

      const { data: { user } } = await supabase.auth.getUser()
      const { error: memErr } = await supabase
        .from("household_members")
        .insert({ household_id: hh.id, user_id: userId, display_name: "Admin", role: "admin", points_balance: 0, email: user?.email })
      if (memErr) throw memErr

      return hh
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["households"] }),
  })
}

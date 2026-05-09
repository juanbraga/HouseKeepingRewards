import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useRewards(householdId) {
  return useQuery({
    queryKey: ["rewards", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("household_id", householdId)
        .eq("is_active", true)
        .order("points_cost")
      if (error) throw error
      return data
    },
    enabled: !!householdId,
  })
}

export function useRedemptions(householdId) {
  return useQuery({
    queryKey: ["redemptions", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_redemptions")
        .select("*, reward:rewards(name_en, name_es, points_cost), member:household_members(display_name, avatar_color)")
        .eq("rewards.household_id", householdId)
        .order("redeemed_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!householdId,
  })
}

export function useRedeemReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ rewardId, memberId, householdId, pointsCost }) => {
      const { data: member, error: fetchErr } = await supabase
        .from("household_members")
        .select("points_balance")
        .eq("id", memberId)
        .single()
      if (fetchErr) throw fetchErr
      if (member.points_balance < pointsCost) throw new Error("not_enough_points")

      const { error: redeemErr } = await supabase
        .from("reward_redemptions")
        .insert({ reward_id: rewardId, member_id: memberId, points_spent: pointsCost, status: "pending" })
      if (redeemErr) throw redeemErr

      const { error: updateErr } = await supabase
        .from("household_members")
        .update({ points_balance: member.points_balance - pointsCost })
        .eq("id", memberId)
      if (updateErr) throw updateErr
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["redemptions", vars.householdId] })
      qc.invalidateQueries({ queryKey: ["members", vars.householdId] })
      qc.invalidateQueries({ queryKey: ["member"] })
    },
  })
}

export function useUpdateRedemption() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ redemptionId, status, householdId }) => {
      const { error } = await supabase
        .from("reward_redemptions")
        .update({ status })
        .eq("id", redemptionId)
      if (error) throw error
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["redemptions", vars.householdId] }),
  })
}

export function useCreateReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (reward) => {
      const { error } = await supabase.from("rewards").insert(reward)
      if (error) throw error
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["rewards", vars.household_id] }),
  })
}

export function useDeleteReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ rewardId, householdId }) => {
      const { error } = await supabase.from("rewards").update({ is_active: false }).eq("id", rewardId)
      if (error) throw error
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["rewards", vars.householdId] }),
  })
}

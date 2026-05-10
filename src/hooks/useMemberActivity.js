import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useMemberActivity(memberId) {
  return useQuery({
    queryKey: ["member_activity", memberId],
    queryFn: async () => {
      const [completions, redemptions] = await Promise.all([
        supabase
          .from("task_completions")
          .select("*, task:tasks(name_en, name_es, points, category)")
          .eq("member_id", memberId)
          .order("completed_at", { ascending: false })
          .limit(30),
        supabase
          .from("reward_redemptions")
          .select("*, reward:rewards(name_en, name_es, points_cost)")
          .eq("member_id", memberId)
          .order("redeemed_at", { ascending: false })
          .limit(30),
      ])
      if (completions.error) throw completions.error
      if (redemptions.error) throw redemptions.error
      return {
        completions: completions.data,
        redemptions: redemptions.data,
      }
    },
    enabled: !!memberId,
  })
}

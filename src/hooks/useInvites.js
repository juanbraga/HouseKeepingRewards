import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useCreateInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ householdId, userId }) => {
      const { data, error } = await supabase
        .from("household_invites")
        .insert({ household_id: householdId, created_by: userId })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["invites", vars.householdId] }),
  })
}

export function useInvites(householdId) {
  return useQuery({
    queryKey: ["invites", householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("household_invites")
        .select("*")
        .eq("household_id", householdId)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!householdId,
  })
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async ({ token, userId, displayName }) => {
      // Look up the invite
      const { data: invite, error: inviteErr } = await supabase
        .from("household_invites")
        .select("*, household:households(id, name)")
        .eq("token", token)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .single()
      if (inviteErr || !invite) throw new Error("invalid_invite")

      // Check not already a member
      const { data: existing } = await supabase
        .from("household_members")
        .select("id")
        .eq("household_id", invite.household_id)
        .eq("user_id", userId)
        .single()
      if (existing) throw new Error("already_member")

      // Get current user email
      const { data: { user } } = await supabase.auth.getUser()

      // Create member record
      const { error: memErr } = await supabase
        .from("household_members")
        .insert({
          household_id: invite.household_id,
          user_id: userId,
          display_name: displayName,
          role: "member",
          points_balance: 0,
          avatar_color: "#0891b2",
          email: user?.email,
        })
      if (memErr) throw memErr

      // Mark invite as used
      await supabase
        .from("household_invites")
        .update({ used_at: new Date().toISOString() })
        .eq("id", invite.id)

      return invite.household
    },
  })
}

export function useInviteByToken(token) {
  return useQuery({
    queryKey: ["invite_token", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("household_invites")
        .select("*, household:households(id, name)")
        .eq("token", token)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .single()
      if (error) throw new Error("invalid_invite")
      return data
    },
    enabled: !!token,
    retry: false,
  })
}

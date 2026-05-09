import { createContext, useContext, useState, useEffect } from "react"

const HouseholdContext = createContext(null)

export function HouseholdProvider({ children }) {
  const [activeHouseholdId, setActiveHouseholdId] = useState(
    () => localStorage.getItem("activeHouseholdId") || null
  )

  useEffect(() => {
    if (activeHouseholdId) {
      localStorage.setItem("activeHouseholdId", activeHouseholdId)
    } else {
      localStorage.removeItem("activeHouseholdId")
    }
  }, [activeHouseholdId])

  return (
    <HouseholdContext.Provider value={{ activeHouseholdId, setActiveHouseholdId }}>
      {children}
    </HouseholdContext.Provider>
  )
}

export function useHouseholdContext() {
  const ctx = useContext(HouseholdContext)
  if (!ctx) throw new Error("useHouseholdContext must be used within HouseholdProvider")
  return ctx
}

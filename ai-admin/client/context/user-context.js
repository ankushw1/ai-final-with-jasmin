"use client"

import { createContext, useContext, useState, useEffect } from "react"

const UserContext = createContext()

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (typeof document !== "undefined") {
      const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("token="))
      const userMetaCookie = document.cookie.split("; ").find((row) => row.startsWith("userMeta="))
  
      if (tokenCookie && userMetaCookie) {
        try {
          const token = decodeURIComponent(tokenCookie.split("=")[1])
          const userMeta = JSON.parse(decodeURIComponent(userMetaCookie.split("=")[1]))
          if (token && token.split(".").length === 3) {
            setUser({ token, ...userMeta })
          } else {
            logout()
          }
        } catch (error) {
          console.error("Error parsing cookies:", error)
          logout()
        }
      }
    }
  }, [])  

  const login = (userData) => {
    if (!userData?.token || userData.token.split(".").length !== 3) {
      console.error("Invalid JWT token format")
      return
    }
  
    setUser(userData)
  
    // Store token in a separate cookie
    document.cookie = `token=${userData.token}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
    // Store only necessary data separately
    const safeUser = { name: userData.name, role: userData.role }
    document.cookie = `userMeta=${encodeURIComponent(JSON.stringify(safeUser))}; path=/; max-age=${60 * 60 * 24 * 7}`
  }  

  const logout = () => {
    setUser(null)
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "userMeta=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }  

  return <UserContext.Provider value={{ user, login, logout }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

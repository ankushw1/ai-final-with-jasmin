"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import { useUser } from "@/context/user-context"
import useAxios from "@/hooks/use-axios"
import AdminSidebar from "@/components/admin-sidebar"
import Topbar from "@/components/topbar"

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const axiosInstance = useAxios()
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()

  const publicRoutes = ["/login", "/forgot-password"]

  useEffect(() => {
    const checkTokenExpiry = async () => {
      if (publicRoutes.includes(pathname)) return

      try {
        const response = await axiosInstance.get("/api/check-token")

        if (response?.data?.expired) {
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
          toast.error("Your session has expired. Please login again.")
          router.push("/login")
        }
      } catch (error) {
        console.error("Token check failed:", error)
        toast.error("Session verification failed. Please login again.")
        router.push("/login")
      }
    }

    checkTokenExpiry()
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex flex-col flex-grow overflow-hidden">
        <Topbar />
        <main className="flex-grow overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}

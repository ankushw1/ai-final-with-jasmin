"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useUser } from "@/context/user-context"
import useAxios from "@/hooks/use-axios"
import AdminSidebar from "@/components/admin-sidebar"
import Topbar from "@/components/topbar"

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const axiosInstance = useAxios()
  const router = useRouter()
  const { user } = useUser()

  useEffect(() => {
    const checkTokenExpiry = async () => {
      try {
        const response = await axiosInstance.get("/api/admin/check-token")

        if (response.data.expired) {
          toast.error("Your session has expired. Please login again.")
          router.push("/")
        }
      } catch (error) {
        console.error("Token expiry check failed:", error)
      }
    }

    checkTokenExpiry()
  }, [router, axiosInstance])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar />
      <div className="flex flex-col flex-grow overflow-hidden">
        <Topbar />
        <main className="flex-grow overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}

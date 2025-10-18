"use client"

import { usePathname } from "next/navigation"
import AdminLayout from "@/components/admin-layout"

const publicRoutes = ["/login", "/forgot-password"]

export default function LayoutWrapper({ children }) {
  const pathname = usePathname()
  const isPublic = publicRoutes.includes(pathname)

  // If it's a public route, return the content as-is (no sidebar/topbar)
  return isPublic ? children : <AdminLayout>{children}</AdminLayout>
}

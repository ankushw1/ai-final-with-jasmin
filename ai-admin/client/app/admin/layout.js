import AdminLayout from "@/components/admin-layout"

export const metadata = {
  title: "AiMobile Admin",
  description: "AiMobile Admin Dashboard",
}

export default function AdminRootLayout({ children }) {
  return <AdminLayout>{children}</AdminLayout>
}

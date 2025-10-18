import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { UserProvider } from "@/context/user-context"
import LayoutWrapper from "@/components/layout-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "AiMobile",
  description: "AiMobile Admin Dashboard",
  generator: "v0.dev",
  icons: {
    icon: "/favicon.ico", 
  },
}


export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body className={inter.className}>
        <UserProvider>
          <LayoutWrapper>          <Toaster position="top-right" />
          {children}
          </LayoutWrapper>

        </UserProvider>
      </body>
    </html>
  )
}

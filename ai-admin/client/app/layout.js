import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { UserProvider } from "@/context/user-context"

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
          <Toaster position="top-right" />
          {children}
        </UserProvider>
      </body>
    </html>
  )
}

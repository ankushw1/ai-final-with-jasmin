"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import useAxios from "@/hooks/use-axios"
import { Eye, EyeOff, User, Lock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LinearProgress } from "@/components/ui/linear-progress"
import { useUser } from "@/context/user-context"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [identifier, setIdentifier] = useState("") // Changed from email to identifier
  const [password, setPassword] = useState("")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const axiosInstance = useAxios()

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }
  const { login } = useUser()

  const handleLogin = async (event) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const response = await axiosInstance.post("/api/login", {
        identifier, // Send identifier instead of email
        password,
      })

      const data = response.data

      login({
        token: data.token,
        name: data.name,
        role: data.role,
        email: data.email,
      })

      toast.success("Login successful!")
      router.push("/")
    } catch (error) {
      console.error("Error during login:", error)
      toast.error(error.response?.data?.message || "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-white">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          <div className="flex flex-col items-center">
            <Image src="/AI.png" alt="Logo" width={300} height={100} className="mb-8 w-4/5 max-w-[300px]" />
            <Image src="/Chat.jpg" alt="Chat Illustration" width={400} height={300} className="w-full max-w-[500px]" />
          </div>

          <div className="flex justify-center">
            <Card className="w-full max-w-[450px] shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center text-primary">Customer Login</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading && (
                  <div className="mb-4">
                    <LinearProgress indeterminate />
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div className="space-y-4">
                      <div className="space-y-2">
                      <Label htmlFor="identifier">Email or Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="identifier"
                          type="text"
                          placeholder="Enter your email or username"
                          className="pl-10"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-10 pr-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute right-3 top-3 text-muted-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Login"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

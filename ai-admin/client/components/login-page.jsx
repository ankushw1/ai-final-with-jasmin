"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useUser } from "@/context/user-context"
import useAxios from "@/hooks/use-axios"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LinearProgress } from "@/components/ui/linear-progress"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { login } = useUser()
  const router = useRouter()
  const [isOtpScreen, setIsOtpScreen] = useState(false)
  const [otp, setOtp] = useState("")
  const [authMethod, setAuthMethod] = useState("email")
  const [isLoading, setIsLoading] = useState(false)

  const axiosInstance = useAxios()

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleLoginRequest = async (event) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      if (authMethod === "email") {
        // Request Email OTP
        await axiosInstance.post("/api/otp/send-otp", { email, password })
        toast.success("OTP sent to your email. Please enter the OTP.")
      } else {
        // No need to send anything, just show OTP input for Google Authenticator
        toast.info("Enter the OTP from your Google Authenticator app.")
      }

      setIsOtpScreen(true)
    } catch (error) {
      console.error("Error during login request:", error)
      toast.error(error.response?.data?.message || "Login request failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const response = await axiosInstance.post("/api/admin/login", {
        email,
        otp,
        password,
        authMethod,
      })
      const data = response.data

      login({
        token: data.token,
        name: data.name,
        role: data.role,
      })

      toast.success("Login successful!")
      router.push("/admin")
    } catch (error) {
      console.error("Error during OTP verification:", error)
      toast.error(error.response?.data?.message || "Invalid OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-white">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          <div className="flex flex-col items-center">
            <Image
              src="/AI.png"
              alt="Logo"
              width={300}
              height={100}
              className="mb-8 w-4/5 max-w-[300px]"
            />
            <Image
              src="/Chat.jpg"
              alt="Chat Illustration"
              width={400}
              height={300}
              className="w-full max-w-[500px]"
            />
          </div>

          <div className="flex justify-center">
            <Card className="w-full max-w-[450px] shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center text-primary">Admin Login</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading && (
                  <div className="mb-4">
                    <LinearProgress indeterminate />
                  </div>
                )}

                <form onSubmit={isOtpScreen ? handleOtpSubmit : handleLoginRequest}>
                  {!isOtpScreen ? (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="Enter your email"
                              className="pl-10"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
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

                        <div className="space-y-2">
                          <Label htmlFor="auth-method">Authentication Method</Label>
                          <Select value={authMethod} onValueChange={setAuthMethod}>
                            <SelectTrigger id="auth-method">
                              <SelectValue placeholder="Select authentication method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">OTP via Email</SelectItem>
                              <SelectItem value="google-auth">Google Authenticator</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <p className="text-center">
                          Enter the OTP from {authMethod === "email" ? "your email" : "Google Authenticator"}
                        </p>
                        <Input
                          type="text"
                          placeholder="Enter OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}

                  <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                    {isOtpScreen ? "Verify OTP" : "Login"}
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

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import useAxios from "@/hooks/use-axios"
import { Eye, EyeOff, Mail, Lock, KeyRound } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LinearProgress } from "@/components/ui/linear-progress"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const axiosInstance = useAxios()

  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  const handleRequestOTP = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await axiosInstance.post("/api/request-password", { email })
      toast.success("OTP sent to your email!")
      setStep(2)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!")
      return
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.")
      return
    }

    setIsLoading(true)
    try {
      await axiosInstance.post("/api/verify-reset", {
        email,
        otp,
        newPassword,
      })
      toast.success("Password reset successful!")
      router.push("/login")
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password.")
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
                <CardTitle className="text-2xl font-bold text-center text-primary">
                  {step === 1 ? "Forgot Password" : "Reset Password"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading && (
                  <div className="mb-4">
                    <LinearProgress indeterminate />
                  </div>
                )}

                {step === 1 ? (
                  <form onSubmit={handleRequestOTP} className="space-y-4">
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

                    <Button type="submit" className="w-full">
                      {isLoading ? "Sending OTP..." : "Send OTP"}
                    </Button>

                    <div className="text-center">
                      <Link href="/login" className="text-sm text-primary hover:underline">
                        Back to login
                      </Link>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp">OTP</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="otp"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          className="pl-10"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          className="pl-10 pr-10"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
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
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          className="pl-10 pr-10"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
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

                    <Button type="submit" className="w-full">
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-sm text-primary hover:underline"
                      >
                        Back to email
                      </button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

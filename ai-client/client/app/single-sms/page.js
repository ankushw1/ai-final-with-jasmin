"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { InfoIcon, SendIcon, AlertCircle, X, Copy } from "lucide-react"
import { SmsPreview } from "@/components/sms-preview"
import useAxios from "@/hooks/use-axios"
import { toast } from "sonner"

export default function SingleSmsPage() {
  const [sender, setSender] = useState("")
  const [mobileNumbers, setMobileNumbers] = useState("")
  const [messageType, setMessageType] = useState("TEXT")
  const [message, setMessage] = useState("")
  const [isUnicode, setIsUnicode] = useState(false)
  const [characterCount, setCharacterCount] = useState(160)
  const [messageParts, setMessageParts] = useState([])
  const [currentPart, setCurrentPart] = useState(1)
  const [totalChar, setTotalChar] = useState(0)
  const [loading, setLoading] = useState(false)
  const [parsedNumbers, setParsedNumbers] = useState([])

  const axios = useAxios()

  // Parse mobile numbers from various formats
  const parseMobileNumbers = useCallback((input) => {
    if (!input) return []

    // Split by comma, newline, semicolon, space, or tab
    const numbers = input
      .split(/[,;\n\r\s\t]+/)
      .map((num) => num.trim())
      .filter((num) => num && /^\d{10,15}$/.test(num)) // Basic mobile number validation
      .slice(0, 1000) // Limit to 1000 numbers

    return [...new Set(numbers)] // Remove duplicates
  }, [])

  // Handle mobile numbers input change
  const handleMobileNumbersChange = (e) => {
    const value = e.target.value
    setMobileNumbers(value)

    const parsed = parseMobileNumbers(value)
    setParsedNumbers(parsed)
  }

  // Handle paste event for better CSV/Excel data handling
  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text")

    // Try to parse as CSV-like data
    const lines = pastedData.split("\n")
    let extractedNumbers = []

    lines.forEach((line) => {
      // Look for numbers in each line (could be CSV format)
      const numbersInLine = line.match(/\d{10,15}/g) || []
      extractedNumbers = [...extractedNumbers, ...numbersInLine]
    })

    if (extractedNumbers.length > 0) {
      const uniqueNumbers = [...new Set(extractedNumbers)].slice(0, 1000)
      const formattedNumbers = uniqueNumbers.join("\n")
      setMobileNumbers(formattedNumbers)
      setParsedNumbers(uniqueNumbers)
      toast.success(`Extracted ${uniqueNumbers.length} unique mobile numbers`)
    } else {
      // Fallback to regular paste
      setMobileNumbers(pastedData)
      const parsed = parseMobileNumbers(pastedData)
      setParsedNumbers(parsed)
    }
  }

  // Check if the text contains non-ASCII characters (Unicode)
  const detectUnicode = (text) => {
    return /[^\u0000-\u007F]/.test(text)
  }

  // Split message into parts based on character limits
  const splitMessage = (message, isUnicode) => {
    const messageParts = []
    let limit = isUnicode ? 70 : 160 // First part limit
    let partCount = 1

    while (message.length > 0 && partCount <= 10) {
      if (message.length <= limit) {
        messageParts.push(message)
        break
      }

      messageParts.push(message.slice(0, limit))
      message = message.slice(limit)

      // For subsequent parts, adjust limit
      if (isUnicode) {
        limit = 67 // Unicode subsequent parts have 67 char limit
      } else {
        limit = 153 // Standard subsequent parts have 153 char limit
      }

      partCount++
    }

    return messageParts
  }

  // Handle message change and detect Unicode
  const handleMessageChange = (e) => {
    const newMessage = e.target.value
    setMessage(newMessage)

    // Auto-detect Unicode
    const containsUnicode = detectUnicode(newMessage)

    // If Unicode is detected, automatically set message type
    if (containsUnicode && !isUnicode) {
      setIsUnicode(true)
      setMessageType("UNICODE")
      toast.info("Unicode characters detected. Message type changed to UNICODE.")
    }

    // Set character limit based on message type
    const limit = containsUnicode ? 70 : 160
    setCharacterCount(limit - newMessage.length)

    // Update message parts
    const parts = splitMessage(newMessage, containsUnicode)
    setMessageParts(parts)
    setCurrentPart(1)
    setTotalChar(newMessage.length)
  }

  // Handle message type change
  const handleMessageTypeChange = (value) => {
    setMessageType(value)

    if (value === "UNICODE" || value === "UNI_FLASH") {
      setIsUnicode(true)
      setCharacterCount(70 - message.length)
    } else {
      setIsUnicode(false)
      setCharacterCount(160 - message.length)
    }

    // Recalculate message parts
    const parts = splitMessage(message, value === "UNICODE" || value === "UNI_FLASH")
    setMessageParts(parts)
  }

  // Clear all mobile numbers
  const clearNumbers = () => {
    setMobileNumbers("")
    setParsedNumbers([])
  }

  // Copy sample format
  const copySampleFormat = () => {
    const sample = "919876543210\n919876543211\n919876543212"
    navigator.clipboard.writeText(sample)
    toast.success("Sample format copied to clipboard")
  }

  // Form validation
  const validateForm = () => {
    if (!sender.trim()) {
      toast.error("Sender is required")
      return false
    }

    if (parsedNumbers.length === 0) {
      toast.error("At least one valid mobile number is required")
      return false
    }

    if (!message.trim()) {
      toast.error("Message is required")
      return false
    }

    if (parsedNumbers.length > 1000) {
      toast.error("Maximum 1000 mobile numbers allowed")
      return false
    }

    return true
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      // Send SMS via API
      const response = await axios.post("/sms/send", {
        sender,
        mobileNumbers: parsedNumbers,
        messageType,
        message,
      })

      const { successful, failed, total } = response.data.details

      if (successful > 0) {
        toast.success(`SMS sent successfully! ${successful} sent, ${failed} failed out of ${total} total.`)
      } else {
        toast.error(`Failed to send SMS to all ${total} numbers.`)
      }

      // Clear form on success
      if (successful > 0) {
        setSender("")
        setMobileNumbers("")
        setParsedNumbers([])
        setMessage("")
        setMessageType("TEXT")
        setIsUnicode(false)
        setCharacterCount(160)
        setMessageParts([])
        setCurrentPart(1)
        setTotalChar(0)
      }
    } catch (error) {
      console.error("SMS sending error:", error)
      toast.error(error.response?.data?.message || "Failed to send SMS. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 md:col-span-8">
          <CardHeader>
            <CardTitle className="text-2xl">Single SMS</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-lg font-medium" htmlFor="sender">
                    Source
                  </Label>
                  <p className="text-sm text-muted-foreground">e.g. "testin"</p>
                  <Input
                    id="sender"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    placeholder="Enter sender"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-medium" htmlFor="mobileNumbers">
                      Destination
                    </Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={copySampleFormat}>
                        <Copy className="h-4 w-4 mr-1" />
                        Sample
                      </Button>
                      {parsedNumbers.length > 0 && (
                        <Button type="button" variant="outline" size="sm" onClick={clearNumbers}>
                          <X className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter up to 1000 numbers. Supports comma-separated, line-separated, or paste from Excel/CSV.
                  </p>
                  <Textarea
                    id="mobileNumbers"
                    value={mobileNumbers}
                    onChange={handleMobileNumbersChange}
                    onPaste={handlePaste}
                    placeholder="919860XXXXXX&#10;919860XXXXXY&#10;or paste from Excel/CSV"
                    rows={6}
                    className="text-base font-mono"
                  />

                  {parsedNumbers.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{parsedNumbers.length} valid numbers</Badge>
                      {parsedNumbers.length >= 1000 && <Badge variant="destructive">Maximum limit reached</Badge>}
                    </div>
                  )}

                  {mobileNumbers && parsedNumbers.length === 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>No valid mobile numbers found. Please check the format.</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-lg font-medium">Message Type</Label>
                  <RadioGroup
                    value={messageType}
                    onValueChange={handleMessageTypeChange}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="TEXT" id="text" />
                      <Label htmlFor="text" className="text-base">
                        TEXT
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="FLASH" id="flash" />
                      <Label htmlFor="flash" className="text-base">
                        FLASH
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="UNICODE" id="unicode" />
                      <Label htmlFor="unicode" className="text-base">
                        UNICODE
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="UNI_FLASH" id="uni_flash" />
                      <Label htmlFor="uni_flash" className="text-base">
                        UNI_FLASH
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-lg font-medium" htmlFor="message">
                    Message
                  </Label>
                  <p className="text-sm text-muted-foreground">e.g. "this is a test SMS"</p>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={handleMessageChange}
                    placeholder="Type your SMS here"
                    rows={5}
                    className="text-base"
                  />

                  <div className="flex justify-between text-sm mt-2">
                    <span>
                      Characters: <span className={characterCount < 0 ? "text-red-500" : ""}>{totalChar}</span>
                    </span>
                    <span>
                      Remaining: <span className={characterCount < 0 ? "text-red-500" : ""}>{characterCount}</span>
                    </span>
                  </div>

                  {messageParts.length > 1 && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Message will be sent in {messageParts.length} parts</AlertDescription>
                    </Alert>
                  )}

                  {isUnicode && messageType !== "UNICODE" && messageType !== "UNI_FLASH" && (
                    <Alert className="mt-2">
                      <InfoIcon className="h-4 w-4" />
                      <AlertDescription>
                        Unicode characters detected. Consider switching to UNICODE message type.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full text-base py-5"
                  disabled={loading || parsedNumbers.length === 0}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2 h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
                      Sending to {parsedNumbers.length} numbers...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <SendIcon className="mr-2 h-5 w-5" />
                      Send SMS to {parsedNumbers.length} numbers
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="col-span-12 md:col-span-4 flex flex-col">
          <div className="h-full flex flex-col">
            <SmsPreview
              sender={sender || "SENDER"}
              message={message || "Your message will appear here"}
              messagePart={currentPart}
              totalParts={messageParts.length}
            />

            {messageParts.length > 1 && (
              <div className="mt-4 h-[200px] w-full">
                <Tabs
                  value={currentPart.toString()}
                  onValueChange={(value) => setCurrentPart(Number.parseInt(value))}
                  className="h-full"
                >
                  <TabsList className="grid grid-cols-5 w-full">
                    {messageParts.slice(0, 5).map((_, index) => (
                      <TabsTrigger key={index} value={(index + 1).toString()} className="text-sm h-10">
                        Part {index + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="h-[calc(100%-40px)]">
                    {messageParts.map((part, index) => (
                      <TabsContent
                        key={index}
                        value={(index + 1).toString()}
                        className="h-full mt-0 data-[state=active]:mt-2"
                      >
                        <Card className="h-full">
                          <CardContent className="pt-4 h-full overflow-auto">
                            <p className="whitespace-pre-wrap text-sm">{part}</p>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    ))}
                  </div>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

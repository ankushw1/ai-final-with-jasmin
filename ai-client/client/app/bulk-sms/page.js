"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { InfoIcon, SendIcon, AlertCircle, Upload, Download, FileText, X } from "lucide-react"
import { SmsPreview } from "@/components/sms-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useAxios from "@/hooks/use-axios"
import { toast } from "sonner"

export default function BulkSmsPage() {
  const [sender, setSender] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [messageType, setMessageType] = useState("TEXT")
  const [message, setMessage] = useState("")
  const [isUnicode, setIsUnicode] = useState(false)
  const [characterCount, setCharacterCount] = useState(160)
  const [messageParts, setMessageParts] = useState([])
  const [currentPart, setCurrentPart] = useState(1)
  const [totalChar, setTotalChar] = useState(0)
  const [loading, setLoading] = useState(false)
  const [fileContainsMessages, setFileContainsMessages] = useState(false)
  const [fileStats, setFileStats] = useState({ totalRows: 0, validRows: 0 })

  const axios = useAxios()

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

  // Handle file change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB")
        return
      }

      // Validate file type
      const allowedTypes = [".csv", ".xlsx", ".xls"]
      const fileExtension = "." + file.name.split(".").pop().toLowerCase()
      if (!allowedTypes.includes(fileExtension)) {
        toast.error("Only CSV and Excel files are allowed")
        return
      }

      setSelectedFile(file)

      // Try to parse the file to get stats
      if (fileExtension === ".csv") {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const content = event.target.result
            const lines = content.split("\n").filter((line) => line.trim())
            const validRows = lines.length > 1 ? lines.length - 1 : 0
            setFileStats({ totalRows: validRows, validRows })
            toast.success(`File selected: ${validRows} contacts found`)
          } catch (error) {
            console.error("Error parsing file:", error)
            setFileStats({ totalRows: 0, validRows: 0 })
            toast.success(`File selected: ${file.name}`)
          }
        }
        reader.readAsText(file)
      } else {
        toast.success(`File selected: ${file.name}`)
      }
    }
  }

  // Handle file type change
  const handleFileTypeChange = (value) => {
    setFileContainsMessages(value === "with-messages")
    // Clear selections when changing file type
    setSelectedFile(null)
    setFileStats({ totalRows: 0, validRows: 0 })
  }

  // Remove selected file
  const removeFile = () => {
    setSelectedFile(null)
    setFileStats({ totalRows: 0, validRows: 0 })
    toast.info("File removed")
  }

  // Form validation
  const validateForm = () => {
    if (!sender.trim()) {
      toast.error("Sender is required")
      return false
    }

    if (!selectedFile) {
      toast.error("Please upload a file")
      return false
    }

    if (!fileContainsMessages && !message.trim()) {
      toast.error("Message is required when using files without messages")
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
      // Create form data with file and message
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("sender", sender)
      formData.append("messageType", messageType)
      formData.append("fileContainsMessages", fileContainsMessages.toString())

      if (!fileContainsMessages) {
        formData.append("message", message)
      }

      const response = await axios.post("/sms/send-bulk", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      const { successful, failed, total } = response.data.details

      if (successful > 0) {
        toast.success(`Bulk SMS sent successfully! ${successful} sent, ${failed} failed out of ${total} total.`)
      } else {
        toast.error(`Failed to send SMS to all ${total} numbers.`)
      }

      // Clear form on success
      if (successful > 0) {
        setSender("")
        setSelectedFile(null)
        setMessage("")
        setMessageType("TEXT")
        setIsUnicode(false)
        setCharacterCount(160)
        setMessageParts([])
        setCurrentPart(1)
        setTotalChar(0)
        setFileContainsMessages(false)
        setFileStats({ totalRows: 0, validRows: 0 })
      }
    } catch (error) {
      console.error("Bulk SMS error:", error)
      toast.error(error.response?.data?.message || "Failed to send bulk SMS. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Download sample file - contacts only
  const downloadContactsOnlySample = () => {
    // Create sample CSV content
    const sampleContent = `mobile,name,company
919876543210,John Doe,ABC Corp
919876543211,Jane Smith,XYZ Ltd
919876543212,Bob Johnson,123 Inc`

    const blob = new Blob([sampleContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "sample_contacts.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.success("Sample contacts file downloaded")
  }

  // Download sample file - with messages
  const downloadWithMessagesSample = () => {
    // Create sample CSV content
    const sampleContent = `mobile,message
919876543210,Your order #12345 has been shipped and will arrive tomorrow.
919876543211,Your appointment is confirmed for Jan 15 at 2:30 PM. Please arrive 10 minutes early.
919876543212,Your account balance is now $1500. Thank you for your recent payment.`

    const blob = new Blob([sampleContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "sample_with_messages.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.success("Sample file with messages downloaded")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 md:col-span-8">
          <CardHeader>
            <CardTitle className="text-2xl">Bulk SMS</CardTitle>
            <p className="text-sm text-muted-foreground">Send SMS to multiple recipients using a file upload</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Sender Input */}
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

                {/* File Selection */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-medium">File Selection</Label>
                    <p className="text-sm text-muted-foreground mb-2">Select file type</p>

                    <div className="mb-4">
                      <RadioGroup
                        value={fileContainsMessages ? "with-messages" : "without-messages"}
                        onValueChange={handleFileTypeChange}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="without-messages" id="without-messages" />
                          <Label htmlFor="without-messages" className="text-base">
                            File with contacts only (you'll provide the message)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="with-messages" id="with-messages" />
                          <Label htmlFor="with-messages" className="text-base">
                            File with contacts and messages
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                      <Label className="text-base">Upload File</Label>
                      {!selectedFile ? (
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                          <Input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileChange}
                          />
                          <Label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                            <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
                            <span className="text-base font-medium mb-2">Click to upload or drag and drop</span>
                            <span className="text-sm text-muted-foreground">CSV, Excel files up to 5MB</span>
                          </Label>
                        </div>
                      ) : (
                        <div className="border rounded-lg p-4 bg-muted/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-blue-500" />
                              <div>
                                <p className="font-medium">{selectedFile.name}</p>
                                {/* <p className="text-sm text-muted-foreground">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                {fileStats.totalRows > 0 && (
                                  <Badge variant="secondary">{fileStats.totalRows} contacts</Badge>
                                )} */}
                              </div>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={removeFile} disabled={loading}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sample File Download */}
                    <div className="mt-2 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fileContainsMessages ? downloadWithMessagesSample : downloadContactsOnlySample}
                        className="text-xs flex items-center"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download Sample File
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Message Type and Content (only if file doesn't contain messages) */}
                {!fileContainsMessages && (
                  <>
                    <div className="space-y-3">
                      <Label className="text-lg font-medium">Message Type</Label>
                      <RadioGroup
                        value={messageType}
                        onValueChange={handleMessageTypeChange}
                        className="grid grid-cols-2 gap-4"
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

                    <div className="space-y-3">
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

                      <div className="flex justify-between text-sm">
                        <span>
                          Characters:{" "}
                          <span className={characterCount < 0 ? "text-red-500" : "text-green-600"}>{totalChar}</span>
                        </span>
                        <span>
                          Remaining:{" "}
                          <span className={characterCount < 0 ? "text-red-500" : "text-green-600"}>
                            {characterCount}
                          </span>
                        </span>
                      </div>

                      {messageParts.length > 1 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>Message will be sent in {messageParts.length} parts</AlertDescription>
                        </Alert>
                      )}

                      {isUnicode && messageType !== "UNICODE" && messageType !== "UNI_FLASH" && (
                        <Alert>
                          <InfoIcon className="h-4 w-4" />
                          <AlertDescription>
                            Unicode characters detected. Consider switching to UNICODE message type.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </>
                )}

                {/* Info for file with messages */}
                {fileContainsMessages && (
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription>
                      The selected file contains messages. Each recipient will receive their specific message as defined
                      in the file.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button type="submit" className="w-full text-base py-6" disabled={loading || !selectedFile}>
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2 h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
                      Sending Bulk SMS...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <SendIcon className="mr-2 h-5 w-5" />
                      Send Bulk SMS {fileStats.totalRows > 0 ? `to ${fileStats.totalRows} contacts` : ""}
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <div className="col-span-12 md:col-span-4 flex flex-col">
          {!fileContainsMessages && (
            <div className="h-full flex flex-col space-y-4">
              <SmsPreview
                sender={sender || "SENDER"}
                message={message || "Your message will appear here"}
                messagePart={currentPart}
                totalParts={messageParts.length}
              />

              {messageParts.length > 1 && (
                <div className="h-[200px]">
                  <Tabs
                    value={currentPart.toString()}
                    onValueChange={(value) => setCurrentPart(Number.parseInt(value))}
                    className="h-full"
                  >
                    <TabsList
                      className="grid w-full"
                      style={{ gridTemplateColumns: `repeat(${Math.min(messageParts.length, 5)}, 1fr)` }}
                    >
                      {messageParts.slice(0, 5).map((_, index) => (
                        <TabsTrigger key={index} value={(index + 1).toString()} className="text-sm">
                          Part {index + 1}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <div className="h-[calc(100%-40px)] mt-2">
                      {messageParts.map((part, index) => (
                        <TabsContent key={index} value={(index + 1).toString()} className="h-full mt-0">
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
          )}

          {fileContainsMessages && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <FileText className="h-12 w-12 mx-auto text-blue-500" />
                  <h3 className="text-lg font-medium text-blue-900">Using File Messages</h3>
                  <p className="text-sm text-blue-700">
                    Messages will be sent using the content from your selected file.
                  </p>
                  <p className="text-sm text-blue-700">
                    Each recipient will receive their specific message as defined in the file.
                  </p>
                  <div className="bg-white rounded-md p-3 text-left border border-blue-200">
                    <p className="text-xs font-medium mb-2">Sample file format:</p>
                    <pre className="text-xs overflow-auto p-2 bg-gray-50 rounded">
                      mobile,message
                      <br />
                      919876543210,Your order has shipped
                      <br />
                      919876543211,Your appointment is confirmed
                    </pre>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadWithMessagesSample}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Get Sample File
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

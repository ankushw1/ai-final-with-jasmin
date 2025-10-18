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
import { InfoIcon, SendIcon, AlertCircle, Upload, Download, Table, FileText, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SmsPreview } from "@/components/sms-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useAxios from "@/hooks/use-axios"
import { toast } from "sonner"

export default function PersonalizedSmsPage() {
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
  const [uploading, setUploading] = useState(false)
  const [fileColumns, setFileColumns] = useState([])
  const [previewData, setPreviewData] = useState([])
  const [previewContact, setPreviewContact] = useState(0)
  const [fileHeaders, setFileHeaders] = useState([])
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

  // Replace column references with actual data
  const replaceColumnReferences = (template, contactData) => {
    if (!contactData || !template) return template

    let personalizedMessage = template

    // Replace #N references with column values
    const columnRefs = template.match(/#\d+/g) || []
    columnRefs.forEach((ref) => {
      const columnIndex = Number.parseInt(ref.substring(1)) - 1 // Convert to 0-based index
      if (columnIndex >= 0 && columnIndex < fileHeaders.length) {
        const columnName = fileHeaders[columnIndex]
        const value = contactData[columnName] || ""
        personalizedMessage = personalizedMessage.replace(new RegExp(ref, "g"), value)
      }
    })

    return personalizedMessage
  }

  // Get personalized message for preview
  const getPersonalizedMessage = () => {
    if (!message) return "Your personalized message will appear here"
    if (previewData.length === 0) return message

    const contactData = previewData[previewContact]
    return replaceColumnReferences(message, contactData)
  }

  // Handle message change and detect Unicode
  const handleMessageChange = (e) => {
    const newMessage = e.target.value
    setMessage(newMessage)

    const personalizedMsg = getPersonalizedMessage()
    const containsUnicode = detectUnicode(personalizedMsg)

    if (containsUnicode && !isUnicode) {
      setIsUnicode(true)
      setMessageType("UNICODE")
      toast.info("Unicode characters detected. Message type changed to UNICODE.")
    }

    const limit = containsUnicode ? 70 : 160
    setCharacterCount(limit - personalizedMsg.length)

    const parts = splitMessage(personalizedMsg, containsUnicode)
    setMessageParts(parts)
    setCurrentPart(1)
    setTotalChar(personalizedMsg.length)
  }

  // Handle message type change
  const handleMessageTypeChange = (value) => {
    setMessageType(value)

    if (value === "UNICODE" || value === "UNI_FLASH") {
      setIsUnicode(true)
      setCharacterCount(70 - getPersonalizedMessage().length)
    } else {
      setIsUnicode(false)
      setCharacterCount(160 - getPersonalizedMessage().length)
    }

    const parts = splitMessage(getPersonalizedMessage(), value === "UNICODE" || value === "UNI_FLASH")
    setMessageParts(parts)
  }

  // Parse CSV content
  const parseCSVContent = (content) => {
    const lines = content.split("\n").filter((line) => line.trim())
    if (lines.length === 0) {
      throw new Error("Empty file")
    }

    // Parse headers
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))

    // Validate that we have a mobile number column
    const mobileColumn = headers.find(
      (header) =>
        header.toLowerCase().includes("mobile") ||
        header.toLowerCase().includes("phone") ||
        header.toLowerCase().includes("number"),
    )

    if (!mobileColumn) {
      toast.warning("No mobile column found. Using first column as mobile numbers.")
    }

    // Parse data rows
    const dataRows = []
    let validRows = 0

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
      const row = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })

      // Validate mobile number (first column or mobile column)
      const mobileValue = row[mobileColumn] || row[headers[0]] || ""
      if (mobileValue && /^\d{10,15}$/.test(mobileValue)) {
        validRows++
      }

      dataRows.push(row)
    }

    return {
      headers,
      data: dataRows,
      totalRows: dataRows.length,
      validRows,
    }
  }

  // Handle file change
  const handleFileChange = async (e) => {
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
      setUploading(true)

      try {
        const reader = new FileReader()

        reader.onload = async (event) => {
          try {
            const fileContent = event.target.result
            const extension = file.name.split(".").pop().toLowerCase()

            if (extension === "csv") {
              const parsed = parseCSVContent(fileContent)

              setFileHeaders(parsed.headers)
              // Only store first 10 rows for preview to prevent UI performance issues
              setPreviewData(parsed.data.slice(0, 10))
              setFileStats({ totalRows: parsed.totalRows, validRows: parsed.validRows })

              // Set column information
              setFileColumns(
                parsed.headers.map((header, index) => ({
                  name: header,
                  index: index + 1,
                })),
              )

              toast.success(
                `File processed successfully! ${parsed.validRows} valid contacts found out of ${parsed.totalRows} total.`,
              )
            } else {
              // For Excel files, show a message about CSV preference
              toast.warning("Excel files are supported but CSV is recommended for better compatibility.")

              // You could add Excel parsing here using a library like SheetJS
              // For now, we'll just show the file is selected
              setFileHeaders([])
              setPreviewData([])
              setFileColumns([])
              setFileStats({ totalRows: 0, validRows: 0 })
            }

            setUploading(false)
          } catch (error) {
            console.error("Error parsing file:", error)
            toast.error(`Could not parse the file: ${error.message}`)
            setSelectedFile(null)
            setUploading(false)
            resetFileData()
          }
        }

        reader.onerror = () => {
          toast.error("Error reading the file")
          setSelectedFile(null)
          setUploading(false)
          resetFileData()
        }

        reader.readAsText(file)
      } catch (error) {
        toast.error(`Upload error: ${error.message}`)
        setSelectedFile(null)
        setUploading(false)
        resetFileData()
      }
    }
  }

  // Reset file data
  const resetFileData = () => {
    setFileHeaders([])
    setPreviewData([])
    setFileColumns([])
    setFileStats({ totalRows: 0, validRows: 0 })
    setPreviewContact(0)
  }

  // Remove selected file
  const removeFile = () => {
    setSelectedFile(null)
    resetFileData()
    toast.info("File removed")
  }

  // Insert column field reference into message
  const insertColumnField = (columnNumber) => {
    const placeholder = `#${columnNumber}`
    const textarea = document.getElementById("message")

    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newMessage = message.substring(0, start) + placeholder + message.substring(end)
      setMessage(newMessage)

      // Update cursor position
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length)
        handleMessageChange({ target: { value: newMessage } })
      }, 0)

      toast.success(`Inserted ${placeholder} into message template`)
    }
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

    if (!message.trim()) {
      toast.error("Message template is required")
      return false
    }

    if (fileStats.validRows === 0) {
      toast.error("No valid mobile numbers found in the file")
      return false
    }

    // Check if message template uses valid column references
    const columnRefs = message.match(/#\d+/g) || []
    const invalidRefs = columnRefs.filter((ref) => {
      const columnIndex = Number.parseInt(ref.substring(1)) - 1
      return columnIndex >= fileHeaders.length
    })

    if (invalidRefs.length > 0) {
      toast.error(
        `Invalid column references: ${invalidRefs.join(", ")}. Available columns: #1 to #${fileHeaders.length}`,
      )
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
      // Create form data with file and message template
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("sender", sender)
      formData.append("messageType", messageType)
      formData.append("messageTemplate", message)

      const response = await axios.post("/sms/send-personalized", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      const { successful, failed, total } = response.data.details

      if (successful > 0) {
        toast.success(`Personalized SMS sent successfully! ${successful} sent, ${failed} failed out of ${total} total.`)

        // Clear form on success
        setSender("")
        setSelectedFile(null)
        setMessage("")
        setMessageType("TEXT")
        setIsUnicode(false)
        setCharacterCount(160)
        setMessageParts([])
        setCurrentPart(1)
        setTotalChar(0)
        resetFileData()
      } else {
        toast.error(`Failed to send SMS to all ${total} numbers. Please check your file and try again.`)
      }
    } catch (error) {
      console.error("Personalized SMS error:", error)
      const errorMessage = error.response?.data?.message || "Failed to send personalized SMS. Please try again."
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Download sample file
  const downloadSampleFile = () => {
    // Create sample CSV content
    const sampleContent = `mobile,name,balance,due_date
919876543210,John Doe,1500,2024-01-15
919876543211,Jane Smith,2300,2024-01-20
919876543212,Bob Johnson,890,2024-01-25`

    const blob = new Blob([sampleContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "sample_personalized.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.success("Sample personalized SMS file downloaded")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 md:col-span-8">
          <CardHeader>
            <CardTitle className="text-2xl">Personalized SMS</CardTitle>
            <p className="text-sm text-muted-foreground">
              Send personalized messages using data from your contact file
            </p>
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

                {/* File Upload Section */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-medium">Upload File</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload a CSV or Excel file with contact information and personalization fields
                    </p>

                    {!selectedFile ? (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                        <Input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileChange}
                          disabled={uploading}
                        />
                        <Label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                          <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
                          <span className="text-base font-medium mb-2">
                            {uploading ? "Processing..." : "Click to upload or drag and drop"}
                          </span>
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
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="secondary">{fileStats.totalRows} total rows</Badge>
                                  <Badge variant="default">{fileStats.validRows} valid contacts</Badge>
                                </div>
                              )} */}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={removeFile}
                            disabled={uploading || loading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadSampleFile}
                        className="text-xs flex items-center"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download Sample File
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Available Columns */}
                {fileColumns.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Table className="h-5 w-5" />
                      <Label className="text-lg font-medium">Available Columns</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Click on column numbers to insert them into your message template
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {fileColumns.map((column) => (
                        <Button
                          key={column.index}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex flex-col items-center p-3 h-auto hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => insertColumnField(column.index)}
                        >
                          <span className="font-bold text-lg">#{column.index}</span>
                          <span className="text-xs truncate max-w-full mt-1" title={column.name}>
                            {column.name}
                          </span>
                        </Button>
                      ))}
                    </div>
                    <Alert>
                      <InfoIcon className="h-4 w-4" />
                      <AlertDescription>
                        Use <span className="font-mono bg-muted px-1 rounded">#1</span> for the first column,{" "}
                        <span className="font-mono bg-muted px-1 rounded">#2</span> for the second, etc.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Message Type */}
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

                {/* Message Template */}
                <div className="space-y-3">
                  <Label className="text-lg font-medium" htmlFor="message">
                    Message Template
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Use <span className="font-mono bg-muted px-1 rounded">#1</span>,{" "}
                    <span className="font-mono bg-muted px-1 rounded">#2</span>, etc. to reference columns in your file
                  </p>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={handleMessageChange}
                    placeholder="Type your personalized SMS template here. Example: Dear #2, your balance is #3. Due date: #4"
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
                      <span className={characterCount < 0 ? "text-red-500" : "text-green-600"}>{characterCount}</span>
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

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full text-base py-6"
                  disabled={loading || uploading || !selectedFile || fileStats.validRows === 0}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2 h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
                      Sending Personalized SMS...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <SendIcon className="mr-2 h-5 w-5" />
                      Send Personalized SMS to {fileStats.validRows} contacts
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <div className="col-span-12 md:col-span-4 flex flex-col">
          <div className="h-full flex flex-col space-y-4">
            {/* Contact Preview Selector */}
            {previewData.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Preview Contact</Label>
                <Select
                  value={previewContact.toString()}
                  onValueChange={(value) => setPreviewContact(Number.parseInt(value))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {previewData.map((contact, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        Contact {index + 1} {contact[fileHeaders[0]] ? `(${contact[fileHeaders[0]]})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fileStats.totalRows > 10 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Showing first 10 contacts for preview (of {fileStats.totalRows} total)
                  </p>
                )}
              </div>
            )}

            {/* SMS Preview */}
            <SmsPreview
              sender={sender || "SENDER"}
              message={getPersonalizedMessage()}
              messagePart={currentPart}
              totalParts={messageParts.length}
            />

            {/* Message Parts Tabs */}
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

            {/* Sample Data Preview */}
            {previewData.length > 0 && previewData[previewContact] && (
              <Card>
                <CardHeader className="pb-2">
                  <h4 className="font-medium text-sm">Sample Data Preview</h4>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs space-y-2">
                    {Object.entries(previewData[previewContact]).map(([key, value], index) => (
                      <div key={key} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="font-medium">
                          #{index + 1} {key}:
                        </span>
                        <span className="text-right max-w-[50%] truncate" title={value}>
                          {value || "(empty)"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help Card */}
            {fileColumns.length === 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <Upload className="h-12 w-12 mx-auto text-blue-500" />
                    <h3 className="font-medium text-blue-900">Upload Your Contact File</h3>
                    <p className="text-sm text-blue-700">
                      Upload a CSV file with contact information to start creating personalized messages.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={downloadSampleFile}
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
    </div>
  )
}

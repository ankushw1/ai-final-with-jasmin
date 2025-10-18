"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, RotateCcw, MessageSquare, Calendar, Loader2 } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import useAxios from "@/hooks/use-axios"

export default function SmsDeliveryReportPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [entriesPerPage, setEntriesPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)
  const [senderName, setSenderName] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [transactionId, setTransactionId] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [deliveryReportData, setDeliveryReportData] = useState([])
  const [currentBalance,setCurrentBalance] = useState(0)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalRecords: 0,
  })
  const [statusCounts, setStatusCounts] = useState({
    DELIVRD: 0,
    REJECTD: 0,
    UNDELIV: 0,
    PENDING: 0,
    TOTAL: 0,
  })

  const { toast } = useToast()
  const axios = useAxios()

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await axios.get("/api/check-balance");
        const balance = res.data.balance;
        setCurrentBalance(Number(balance).toFixed(2),)
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    };
  
    fetchBalance();
  }, []);

  // Set default dates (last 7 days)
  useEffect(() => {
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    setFromDate(sevenDaysAgo.toISOString().split("T")[0])
    setToDate(today.toISOString().split("T")[0])
  }, [])

  // Fetch SMS delivery report data
  const fetchSmsReport = async (page = 1) => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: entriesPerPage,
        ...(senderName && { senderName }),
        ...(mobileNumber && { mobileNumber }),
        ...(transactionId && { transactionId }),
        ...(fromDate && { startDate: new Date(fromDate).toISOString() }),
        ...(toDate && { endDate: new Date(toDate + "T23:59:59").toISOString() }),
        ...(searchTerm && { search: searchTerm }),
      }

      const response = await axios.get("/api/summary/sms-report", { params })

      if (response.data) {
        setDeliveryReportData(response.data.data || [])
        setPagination(response.data.pagination || {})
      }
    } catch (error) {
      console.error("Error fetching SMS report:", error)
      toast({
        title: "Error",
        description: "Failed to fetch SMS delivery report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch status counts for dashboard
  const fetchStatusCounts = async () => {
    try {
      const response = await axios.get("/api/summary/sms-report-dashboard")
      if (response.data?.statusCounts) {
        setStatusCounts(response.data.statusCounts)
      }
    } catch (error) {
      console.error("Error fetching status counts:", error)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (fromDate && toDate) {
      fetchSmsReport(1)
      fetchStatusCounts()
    }
  }, [fromDate, toDate, entriesPerPage])

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1)
    fetchSmsReport(1)
  }

  // Handle reset
  const handleReset = () => {
    setSearchTerm("")
    setSenderName("")
    setMobileNumber("")
    setTransactionId("")
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    setFromDate(sevenDaysAgo.toISOString().split("T")[0])
    setToDate(today.toISOString().split("T")[0])
    setCurrentPage(1)
    fetchSmsReport(1)
  }

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchSmsReport(page)
  }

  // Handle download
  const handleDownload = async () => {
    try {
      const params = {
        limit: 1000, // Get more records for export
        ...(senderName && { senderName }),
        ...(mobileNumber && { mobileNumber }),
        ...(transactionId && { transactionId }),
        ...(fromDate && { startDate: new Date(fromDate).toISOString() }),
        ...(toDate && { endDate: new Date(toDate + "T23:59:59").toISOString() }),
        ...(searchTerm && { search: searchTerm }),
      }

      const response = await axios.get("/api/summary/sms-report", { params })

      if (response.data?.data) {
        // Convert to CSV
        const csvContent = convertToCSV(response.data.data)
        downloadCSV(csvContent, "sms-delivery-report.csv")

        toast({
          title: "Success",
          description: "SMS delivery report downloaded successfully.",
        })
      }
    } catch (error) {
      console.error("Error downloading report:", error)
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Convert data to CSV
  const convertToCSV = (data) => {
    const headers = [
      "Transaction ID",
      "Message ID",
      "Mobile",
      "Sender Name",
      "Text Message",
      "Length",
      "Cost",
      "Status",
      "Submitted Time",
      "Delivered Time",
    ]

    const csvRows = [headers.join(",")]

    data.forEach((row) => {
      const values = [
        row.transactionId,
        row.messageId,
        row.mobile,
        row.senderName,
        `"${row.textMessage.replace(/"/g, '""')}"`, // Escape quotes
        row.length,
        row.cost,
        row.status,
        row.cause,
        row.ipAddress,
        formatDateTime(row.submittedTime),
        row.deliveredTime ? formatDateTime(row.deliveredTime) : "-",
      ]
      csvRows.push(values.join(","))
    })

    return csvRows.join("\n")
  }

  // Download CSV file
  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Format date time for display
  const formatDateTime = (dateString) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
    })
  }

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{status}</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{status}</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{status}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }


  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">SMS Delivery Report</CardTitle>
                  <CardDescription>Detailed SMS delivery logs and message tracking</CardDescription>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 text-white px-4 py-2 rounded font-medium">Balance: € {currentBalance}</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{statusCounts.DELIVRD}</div>
            <div className="text-sm text-muted-foreground">Delivered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{statusCounts.REJECTD}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{statusCounts.UNDELIV}</div>
            <div className="text-sm text-muted-foreground">Undelivered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.PENDING}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.TOTAL}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-xs">🔍</span>
            </div>
            Search Message Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="sender-name">Sender Name</Label>
              <Input
                id="sender-name"
                placeholder="Enter sender name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-number">Mobile Number</Label>
              <Input
                id="mobile-number"
                placeholder="Enter mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-id">Transaction ID</Label>
              <Input
                id="transaction-id"
                placeholder="Enter transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="from-date">From Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mb-6">
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleDownload} className="bg-orange-500 hover:bg-orange-600" disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleSearch} className="bg-blue-500 hover:bg-blue-600" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
                <span className="text-white text-xs">📋</span>
              </div>
              SMS Delivery Report
            </CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm">entries per page</span>
            </div>

            <div className="flex gap-2 ml-auto">
              <Button
                variant="default"
                className="bg-blue-500 hover:bg-blue-600"
                onClick={handleDownload}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Message ID</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Sender Name</TableHead>
                  <TableHead>Text Message</TableHead>
                  <TableHead>Length</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted Time</TableHead>
                  <TableHead>Delivered Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <div className="mt-2">Loading SMS delivery reports...</div>
                    </TableCell>
                  </TableRow>
                ) : deliveryReportData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-6 text-muted-foreground">
                      No matching records found in the database
                    </TableCell>
                  </TableRow>
                ) : (
                  deliveryReportData.map((record, index) => (
                    <TableRow key={record.transactionId || index}>
                      <TableCell className="font-medium">{record.transactionId}</TableCell>
                      <TableCell>{record.messageId}</TableCell>
                      <TableCell className="font-mono">{record.mobile}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.senderName}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={record.textMessage}>
                        {record.textMessage}
                      </TableCell>
                   
                      <TableCell className="text-center">{record.length}</TableCell>
                      <TableCell className="font-medium text-green-600">{record.cost}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="font-mono text-sm">{formatDateTime(record.submittedTime)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {record.deliveredTime ? formatDateTime(record.deliveredTime) : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.currentPage - 1) * Number.parseInt(entriesPerPage) + 1} to{" "}
              {Math.min(pagination.currentPage * Number.parseInt(entriesPerPage), pagination.totalRecords)} of{" "}
              {pagination.totalRecords} entries
            </div>

            {pagination.totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                    const pageNumber = i + 1
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNumber)}
                          isActive={currentPage === pageNumber}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(currentPage + 1, pagination.totalPages))}
                      className={
                        currentPage === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

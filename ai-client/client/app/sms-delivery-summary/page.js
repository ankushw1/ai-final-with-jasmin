"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, Settings, Search, Download, RotateCcw, MessageSquare, Calendar } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function SmsDeliverySummaryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [entriesPerPage, setEntriesPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)
  const [senderName, setSenderName] = useState("")
  const [fromDate, setFromDate] = useState("2025-05-01")
  const [toDate, setToDate] = useState("2025-05-24")
  const [groupBy, setGroupBy] = useState("summary")

  // Dummy delivery summary data
  const deliverySummaryData = [
    {
      summary: "Campaign A",
      totalRequested: 1250,
      totalDelivered: 1180,
      pending: 15,
      totalFailed: 45,
      notSent: 8,
      others: 2,
      refund: 0,
      date: "2025-05-20",
      senderName: "BRAND01",
    },
    {
      summary: "Campaign B",
      totalRequested: 850,
      totalDelivered: 820,
      pending: 5,
      totalFailed: 20,
      notSent: 3,
      others: 2,
      refund: 0,
      date: "2025-05-19",
      senderName: "BRAND02",
    },
    {
      summary: "Campaign C",
      totalRequested: 2100,
      totalDelivered: 2050,
      pending: 25,
      totalFailed: 20,
      notSent: 5,
      others: 0,
      refund: 0,
      date: "2025-05-18",
      senderName: "BRAND01",
    },
    {
      summary: "Campaign D",
      totalRequested: 500,
      totalDelivered: 485,
      pending: 0,
      totalFailed: 12,
      notSent: 3,
      others: 0,
      refund: 0,
      date: "2025-05-17",
      senderName: "BRAND03",
    },
    {
      summary: "Campaign E",
      totalRequested: 1800,
      totalDelivered: 1750,
      pending: 10,
      totalFailed: 35,
      notSent: 5,
      others: 0,
      refund: 0,
      date: "2025-05-16",
      senderName: "BRAND02",
    },
  ]

  const currentBalance = "€ 0.7360"

  // Filter data based on search term and filters
  const filteredData = deliverySummaryData.filter((item) => {
    const matchesSearch =
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.senderName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSender = !senderName || item.senderName.toLowerCase().includes(senderName.toLowerCase())
    const matchesDateRange = (!fromDate || item.date >= fromDate) && (!toDate || item.date <= toDate)

    return matchesSearch && matchesSender && matchesDateRange
  })

  // Pagination
  const itemsPerPage = Number.parseInt(entriesPerPage)
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const handleSearch = () => {
    setCurrentPage(1)
  }

  const handleReset = () => {
    setSearchTerm("")
    setSenderName("")
    setFromDate("2025-05-01")
    setToDate("2025-05-24")
    setGroupBy("summary")
    setCurrentPage(1)
  }

  const handleExport = () => {
    console.log("Exporting delivery summary data...")
  }

  const handleReload = () => {
    console.log("Reloading delivery summary data...")
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">SMS Delivery Summary</CardTitle>
                  <CardDescription>Track SMS delivery statistics and campaign performance</CardDescription>
                </div>
              </div>
            
            </div>
            <div className="flex items-center gap-4">
           
              <div className="bg-blue-500 text-white px-4 py-2 rounded font-medium">Balance: {currentBalance}</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs">📊</span>
            </div>
            Search Delivery Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filter Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="sender-name">Sender Name</Label>
              <Select value={senderName} onValueChange={setSenderName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Sender Name" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Senders</SelectItem>
                  <SelectItem value="BRAND01">BRAND01</SelectItem>
                  <SelectItem value="BRAND02">BRAND02</SelectItem>
                  <SelectItem value="BRAND03">BRAND03</SelectItem>
                </SelectContent>
              </Select>
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

          {/* Group By Section */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Group By:</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="groupBy"
                  value="summary"
                  checked={groupBy === "summary"}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-sm">Summary</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="groupBy"
                  value="date"
                  checked={groupBy === "date"}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-sm">Date</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="groupBy"
                  value="senderName"
                  checked={groupBy === "senderName"}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-sm">Sender Name</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mb-6">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSearch} className="bg-blue-500 hover:bg-blue-600">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                <span className="text-white text-xs">📈</span>
              </div>
              Delivery Summary
            </CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search summary..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Controls */}
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
              <Button variant="default" className="bg-blue-500 hover:bg-blue-600" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Summary</TableHead>
                  <TableHead>Total Requested</TableHead>
                  <TableHead>Total Delivered</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Total Failed</TableHead>
                  <TableHead>Not Sent</TableHead>
                  <TableHead>Others</TableHead>
                  <TableHead>Refund</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Sender</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                      No delivery summary found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{record.summary}</TableCell>
                      <TableCell className="text-center">{record.totalRequested}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-green-600 font-medium">{record.totalDelivered}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-yellow-600">{record.pending}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-red-600">{record.totalFailed}</span>
                      </TableCell>
                      <TableCell className="text-center">{record.notSent}</TableCell>
                      <TableCell className="text-center">{record.others}</TableCell>
                      <TableCell className="text-center">{record.refund}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.senderName}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer Info and Pagination */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of{" "}
              {filteredData.length} entries
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pageNumber = i + 1
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNumber)}
                          isActive={currentPage === pageNumber}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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

"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { format, startOfDay, endOfDay, subHours, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { FilterIcon, Download, Copy, Check } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import useAxios from "@/hooks/use-axios"

export default function SmsReport() {
  const params = useParams()
  const searchParams = useSearchParams()
  const customerId = params?.customerId
  const customerEmail = searchParams.get("email")

  const [smsData, setSmsData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedItems, setCopiedItems] = useState(new Set())

  const axiosInstance = useAxios()

  const fetchSmsData = async () => {
    setLoading(true)
    try {
      const formattedStartDate = startDate ? format(startDate, "yyyy-MM-dd'T'HH:mm:ss") : null
      const formattedEndDate = endDate ? format(endDate, "yyyy-MM-dd'T'HH:mm:ss") : null

      const response = await axiosInstance.get(`/api/reporting/customer-reporting/${customerId}`, {
        params: {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          page: page + 1, // API expects page starting from 1
          limit: pageSize,
          search: searchTerm || undefined,
        },
      })

      setSmsData(response.data.data || [])
      setTotalRecords(response.data.pagination?.totalRecords || 0)
    } catch (error) {
      console.error("Error fetching SMS data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSmsData()
  }, [page, pageSize, startDate, endDate, customerId, searchTerm])

  const handleFilterSelect = (filter) => {
    let newStartDate = null
    let newEndDate = null
    const currentDate = new Date()

    switch (filter) {
      case "today":
        newStartDate = startOfDay(currentDate)
        newEndDate = endOfDay(currentDate)
        break
      case "last24":
        newStartDate = subHours(currentDate, 24)
        newEndDate = currentDate
        break
      case "thisWeek":
        newStartDate = startOfWeek(currentDate, { weekStartsOn: 1 })
        newEndDate = endOfWeek(currentDate, { weekStartsOn: 1 })
        break
      case "thisMonth":
        newStartDate = startOfMonth(currentDate)
        newEndDate = endOfMonth(currentDate)
        break
      case "custom":
        setIsCustomDateOpen(true)
        return
      default:
        break
    }

    if (newStartDate && newEndDate) {
      setStartDate(newStartDate)
      setEndDate(newEndDate)
    }
  }

  const handleApplyCustomDate = () => {
    if (startDate && endDate) {
      fetchSmsData()
    }
    setIsCustomDateOpen(false)
  }

  const formatSentAtDate = (dateStr) => {
    if (!dateStr) {
      return "Invalid Date"
    }

    // Check if it's an ISO string
    const isoDate = new Date(dateStr)
    if (!isNaN(isoDate.getTime())) {
      return format(isoDate, "dd MMM yyyy HH:mm:ss")
    }

    // If it's a 12-character custom format (YYMMDDHHMMSS)
    if (dateStr.length === 12) {
      const year = `20${dateStr.substring(0, 2)}` // Prefix with "20"
      const month = dateStr.substring(2, 4)
      const day = dateStr.substring(4, 6)
      const hour = dateStr.substring(6, 8)
      const minute = dateStr.substring(8, 10)
      const second = dateStr.substring(10, 12)

      const isoDateString = `${year}-${month}-${day}T${hour}:${minute}:${second}`
      const formattedDate = new Date(isoDateString)

      if (!isNaN(formattedDate.getTime())) {
        return format(formattedDate, "dd MMM yyyy HH:mm:ss")
      }
    }

    return "Invalid Date"
  }

  const copyToClipboard = async (text, itemId, type) => {
    try {
      await navigator.clipboard.writeText(text)
      const copyKey = `${itemId}-${type}`
      setCopiedItems((prev) => new Set([...prev, copyKey]))
      toast.success(`${type === "message" ? "Message" : "Message ID"} copied to clipboard`)

      // Remove the copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems((prev) => {
          const newSet = new Set(prev)
          newSet.delete(copyKey)
          return newSet
        })
      }, 2000)
    } catch (err) {
      toast.error("Failed to copy to clipboard")
      console.error("Failed to copy: ", err)
    }
  }

  const CopyButton = ({ text, itemId, type, className = "" }) => {
    const copyKey = `${itemId}-${type}`
    const isCopied = copiedItems.has(copyKey)

    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          copyToClipboard(text, itemId, type)
        }}
        className={cn(
          "inline-flex items-center justify-center w-4 h-4 ml-2 text-gray-400 hover:text-gray-600 transition-colors",
          className,
        )}
        title={`Copy ${type === "message" ? "message" : "message ID"}`}
      >
        {isCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      </button>
    )
  }

  const totalPages = Math.ceil(totalRecords / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold">{customerEmail || "SMS Report"}</h1>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
                <FilterIcon className="h-4 w-4" />
                <span className="sr-only">Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleFilterSelect("today")}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterSelect("last24")}>Last 24 hours</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterSelect("thisWeek")}>This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterSelect("thisMonth")}>This Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterSelect("custom")}>Custom Date</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
            <Download className="h-4 w-4" />
            <span className="sr-only">Export</span>
          </Button>
        </div>
      </div>

      {/* Custom Date Dialog */}
      <Dialog open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
            <DialogDescription>Choose a start and end date to filter the SMS data.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="startDate">Start Date</label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="startDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date)
                        setStartDateOpen(false)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="endDate">End Date</label>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="endDate"
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                    >
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date)
                        setEndDateOpen(false)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomDateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyCustomDate}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {loading && (
          <div className="h-1 w-full bg-gray-200 overflow-hidden">
            <div className="h-full bg-blue-600 animate-progress"></div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sender</TableHead>
                <TableHead>Mobile Numbers</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Message ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submission Time</TableHead>
                <TableHead>Delivered Time</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead>Sale Price</TableHead>
                <TableHead>Profit</TableHead>

              </TableRow>
            </TableHeader>
            <TableBody>
              {smsData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                    {loading ? "Loading..." : "No SMS data found"}
                  </TableCell>
                </TableRow>
              ) : (
                smsData.map((sms) => (
                  <TableRow key={sms._id}>
                    <TableCell className="font-medium">{sms.sender}</TableCell>
                    <TableCell>
                      {Array.isArray(sms.mobileNumbers) ? sms.mobileNumbers.join(", ") : "Not Available"}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex items-start">
                        <span className="truncate flex-1" title={sms.message}>
                          {sms.message}
                        </span>
                        {sms.message && (
                          <CopyButton text={sms.message} itemId={sms._id} type="message" className="flex-shrink-0" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-mono text-sm">{sms.providerResponse?.id || "N/A"}</span>
                        {sms.providerResponse?.id && (
                          <CopyButton text={sms.providerResponse.id} itemId={sms._id} type="id" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          sms.dlr?.message_status === "DELIVRD"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : sms.status === "Failed"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
                        )}
                      >
                        {sms.dlr?.message_status || sms.status || "Pending"}
                      </span>
                    </TableCell>
                    <TableCell>{sms.sentAt ? formatSentAtDate(sms.sentAt) : "PENDING"}</TableCell>
                    <TableCell>{sms.dlr?.donedate ? formatSentAtDate(sms.dlr.donedate) : "Pending"}</TableCell>
                    <TableCell>
                      {sms.hasOwnProperty('costRate') ? `${sms.costRate.toFixed(3)}€` : "N/A"}
                    </TableCell>
                    <TableCell>
                      {sms.hasOwnProperty('assignedRate') ? `${sms.assignedRate.toFixed(3)}€` : "N/A"}
                    </TableCell>
                    <TableCell>
                      {sms.hasOwnProperty('profit') ? `${sms.profit.toFixed(3)}€` : "N/A"}
                    </TableCell>

                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{smsData.length}</span> of{" "}
            <span className="font-medium">{totalRecords}</span> messages
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(Math.max(0, page - 1))}
                  className={page === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNumber

                if (totalPages <= 5) {
                  pageNumber = i
                } else if (page < 3) {
                  pageNumber = i
                } else if (page > totalPages - 3) {
                  pageNumber = totalPages - 5 + i
                } else {
                  pageNumber = page - 2 + i
                }

                if (pageNumber >= 0 && pageNumber < totalPages) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink isActive={page === pageNumber} onClick={() => setPage(pageNumber)}>
                        {pageNumber + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                }
                return null
              })}

              {totalPages > 5 && page < totalPages - 3 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  className={page >= totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}

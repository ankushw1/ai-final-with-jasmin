"use client"

import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useUser } from "@/context/user-context"
import useAxios from "@/hooks/use-axios"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Search } from 'lucide-react'
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LinearProgress } from "@/components/ui/linear-progress"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Initialize dayjs plugins
dayjs.extend(utc)
dayjs.extend(timezone)

export default function SmsReport() {
  const [smsData, setSmsData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState("")

  const axiosInstance = useAxios()
  const { user } = useUser()

  useEffect(() => {
    fetchSmsData()
  }, [page, pageSize, startDate, endDate])

  const fetchSmsData = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/reporting/overall-reporting", {
        params: {
          startDate: startDate ? dayjs(startDate).format("YYYY-MM-DDTHH:mm:ss") : null,
          endDate: endDate ? dayjs(endDate).format("YYYY-MM-DDTHH:mm:ss") : null,
          page: page + 1,
          limit: pageSize,
        },
      })

      setSmsData(response.data.data)
      setTotalRecords(response.data.pagination.totalRecords)
    } catch (error) {
      console.error("Error fetching SMS data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter)
    let newStartDate = null,
      newEndDate = null

    const now = dayjs()

    switch (filter) {
      case "Today":
        newStartDate = now.startOf("day").toDate()
        newEndDate = now.endOf("day").toDate()
        break
      case "Last 24 hours":
        newStartDate = now.subtract(24, "hour").toDate()
        newEndDate = now.toDate()
        break
      case "This Week":
        newStartDate = now.startOf("week").toDate()
        newEndDate = now.endOf("week").toDate()
        break
      case "This Month":
        newStartDate = now.startOf("month").toDate()
        newEndDate = now.endOf("month").toDate()
        break
      case "Custom Date":
        setIsCustomDateOpen(true)
        setIsFilterMenuOpen(false)
        return
      default:
        break
    }

    if (newStartDate && newEndDate) {
      setStartDate(newStartDate)
      setEndDate(newEndDate)
    }
    setIsFilterMenuOpen(false)
  }

  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      fetchSmsData()
    }
    setIsCustomDateOpen(false)
  }

  const formatSentAtDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 12) {
      return "Invalid Date"
    }
    const year = `20${dateStr.substring(0, 2)}`
    const month = dateStr.substring(2, 4)
    const day = dateStr.substring(4, 6)
    const hour = dateStr.substring(6, 8)
    const minute = dateStr.substring(8, 10)
    const second = dateStr.substring(10, 12)

    const isoDateString = `${year}-${month}-${day}T${hour}:${minute}:${second}`
    try {
      return dayjs(isoDateString).format("DD MMM YYYY HH:mm:ss")
    } catch (error) {
      return "Invalid Date"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">SMS Report</h1>
        <Button onClick={() => setIsFilterMenuOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Filter className="h-4 w-4 mr-2" /> Filter
        </Button>
        <DropdownMenu open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
          <DropdownMenuTrigger asChild>
            <span className="hidden">Filter</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white">
            <DropdownMenuItem onClick={() => handleFilterSelect("Today")}>Today</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterSelect("Last 24 hours")}>Last 24 hours</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterSelect("This Week")}>This Week</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterSelect("This Month")}>This Month</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterSelect("Custom Date")}>Custom Date</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">SMS Messages</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search messages..." className="pl-10 border-gray-200" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && <LinearProgress indeterminate className="mb-0" />}

          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Sender</TableHead>
                  <TableHead className="font-semibold text-gray-700">Mobile Numbers</TableHead>
                  <TableHead className="font-semibold text-gray-700">Message</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700">Submission Time</TableHead>
                  <TableHead className="font-semibold text-gray-700">Delivered Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {smsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {loading ? "Loading..." : "No SMS data found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  smsData.map((sms) => (
                    <TableRow key={sms._id} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">{sms.sender}</TableCell>
                      <TableCell>
                        {Array.isArray(sms.mobileNumbers) ? sms.mobileNumbers.join(", ") : "Not Available"}
                      </TableCell>
                      <TableCell>{sms.message}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div
                            className={`mr-2 h-2.5 w-2.5 rounded-full ${
                              sms.dlr?.message_status === "DELIVRD" ? "bg-green-500" : "bg-yellow-500"
                            }`}
                          />
                          <span
                            className={sms.dlr?.message_status === "DELIVRD" ? "text-green-700" : "text-yellow-700"}
                          >
                            {sms.dlr?.message_status || "Pending"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{sms.dlr?.subdate ? formatSentAtDate(sms.dlr.subdate) : "Not Available"}</TableCell>
                      <TableCell>{sms.dlr?.donedate ? formatSentAtDate(sms.dlr.donedate) : "Pending"}</TableCell>
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
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * pageSize >= totalRecords}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(Math.floor(totalRecords / pageSize))}
                disabled={(page + 1) * pageSize >= totalRecords}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Date Dialog */}
      <Dialog open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Select Date Range</DialogTitle>
            <DialogDescription className="text-gray-500">
              Choose a custom date range for filtering SMS data.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-gray-700">
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-gray-200"
                    id="startDate"
                  >
                    {startDate ? dayjs(startDate).format("MMMM D, YYYY") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-gray-700">
                End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-gray-200"
                    id="endDate"
                  >
                    {endDate ? dayjs(endDate).format("MMMM D, YYYY") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCustomDateOpen(false)}
              className="border-gray-200 text-gray-700"
            >
              Cancel
            </Button>
            <Button onClick={handleCustomDateChange} className="bg-blue-600 hover:bg-blue-700 text-white">
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

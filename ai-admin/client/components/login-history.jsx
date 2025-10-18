"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/context/user-context"
import useAxios from "@/hooks/use-axios"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Search } from "lucide-react"
import moment from "moment"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export default function LoginHistory() {
  const [loginData, setLoginData] = useState([])
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
    fetchLoginData()
  }, [page, pageSize, startDate, endDate])

  const fetchLoginData = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/reporting/login-history", {
        params: {
          startDate: startDate ? moment(startDate).format("YYYY-MM-DDTHH:mm:ss") : null,
          endDate: endDate ? moment(endDate).format("YYYY-MM-DDTHH:mm:ss") : null,
          page: page + 1,
          limit: pageSize,
        },
      })

      setLoginData(response.data.data)
      setTotalRecords(response.data.pagination.totalRecords)
    } catch (error) {
      console.error("Error fetching login history:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter)
    let newStartDate = null,
      newEndDate = null

    const now = moment()

    switch (filter) {
      case "Today":
        newStartDate = now.clone().startOf("day").toDate()
        newEndDate = now.clone().endOf("day").toDate()
        break
      case "Last 24 hours":
        newStartDate = now.clone().subtract(24, "hours").toDate()
        newEndDate = now.toDate()
        break
      case "This Week":
        newStartDate = now.clone().startOf("week").toDate()
        newEndDate = now.clone().endOf("week").toDate()
        break
      case "This Month":
        newStartDate = now.clone().startOf("month").toDate()
        newEndDate = now.clone().endOf("month").toDate()
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
      fetchLoginData()
    }
    setIsCustomDateOpen(false)
  }

  const formatDate = (dateStr) => {
    return dateStr ? moment(dateStr).format("DD MMM YYYY HH:mm:ss") : "N/A"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Login History</h1>
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
          <CardTitle className="text-lg font-semibold text-gray-800">Login Sessions</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search logins..." className="pl-10 border-gray-200" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && <LinearProgress indeterminate className="mb-0" />}

          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Email</TableHead>
                  <TableHead className="font-semibold text-gray-700">User Type</TableHead>
                  <TableHead className="font-semibold text-gray-700">IP Address</TableHead>
                  <TableHead className="font-semibold text-gray-700">Device Type</TableHead>
                  <TableHead className="font-semibold text-gray-700">Login Time</TableHead>
                  <TableHead className="font-semibold text-gray-700">Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {loading ? "Loading..." : "No login history found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  loginData.map((login) => (
                    <TableRow key={login._id} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">{login.email}</TableCell>
                      <TableCell>{login.userType}</TableCell>
                      <TableCell>{login.ip}</TableCell>
                      <TableCell>{login.deviceType}</TableCell>
                      <TableCell>{formatDate(login.loginTime)}</TableCell>
                      <TableCell>
                        {login.location
                          ? `${login.location.city || "N/A"}, ${login.location.region || "N/A"}, ${login.location.country || "N/A"}`
                          : "Location not available"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{loginData.length}</span> of{" "}
              <span className="font-medium">{totalRecords}</span> login sessions
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
              Choose a custom date range for filtering login history.
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
                    {startDate ? moment(startDate).format("MMMM D, YYYY") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
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
                    {endDate ? moment(endDate).format("MMMM D, YYYY") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
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

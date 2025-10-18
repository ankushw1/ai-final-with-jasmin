"use client"

import { useState, useEffect } from "react"
import { Filter, ChevronDown, Check, ArrowUpRight, ArrowDownRight, RefreshCw, Eye, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LinearProgress } from "@/components/ui/linear-progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useAxios from "@/hooks/use-axios"
import { useUser } from "@/context/user-context"
import { toast } from "sonner"

export default function Dashboard() {
  const [selectedFilter, setSelectedFilter] = useState("last24hours")
  const [isLoading, setIsLoading] = useState(false)
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
  })
  const [showCustomRange, setShowCustomRange] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [selectedGateway, setSelectedGateway] = useState(null)
  const [showGatewayDetails, setShowGatewayDetails] = useState(false)
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalMessages: 0,
      totalSent: 0,
      delivered: 0,
      rejected: 0,
      undelivered: 0,
      pending: 0,
      total: 0,
    },
    userStats: [],
    gatewayStats: [],
    gatewayStatus: [],
  })

  const axiosInstance = useAxios()
  const { user } = useUser()

  const filterOptions = [
    { value: "last1hour", label: "Last 1 Hour" },
    { value: "last2hours", label: "Last 2 Hours" },
    { value: "last6hours", label: "Last 6 Hours" },
    { value: "last12hours", label: "Last 12 Hours" },
    { value: "last24hours", label: "Last 24 Hours" },
    { value: "today", label: "Today (00:00 - 23:59)" },
    { value: "thisweek", label: "This Week" },
    { value: "thismonth", label: "This Month" },
    { value: "custom", label: "Custom Range" },
  ]

  const fetchDashboardData = async (filter = selectedFilter, customRange = null) => {
    setIsLoading(true)
    try {
      const params = { filter }
      // Add custom date range if selected
      if (filter === "custom" && customRange) {
        params.startDate = customRange.startDate
        params.endDate = customRange.endDate
      }

      const response = await axiosInstance.get("/api/dashboard/stats", {
        params,
        headers: { Authorization: `Bearer ${user?.token}` },
      })

      if (response.data) {
        setDashboardData(response.data)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Failed to fetch dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    // Set up auto-refresh every 2 minutes (120 seconds)
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 120000)

    return () => clearInterval(interval)
  }, [selectedFilter])

  const handleFilterSelect = (filter) => {
    if (filter === "custom") {
      setShowCustomRange(true)
      setSelectedFilter(filter)
    } else {
      setSelectedFilter(filter)
      setShowCustomRange(false)
      fetchDashboardData(filter)
    }
  }

  const handleCustomRangeApply = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      fetchDashboardData("custom", customDateRange)
      setShowCustomRange(false)
      toast.success("Custom date range applied")
    } else {
      toast.error("Please select both start and end dates")
    }
  }

  // Handle user click for user details popup
  const handleUserClick = async (userId, username) => {
    try {
      console.log("Clicking user:", userId, username)
      setIsLoading(true)

      // Pass the current filter and date range to get user details for the same period
      const params = {
        filter: selectedFilter,
        ...(selectedFilter === "custom" &&
          customDateRange.startDate &&
          customDateRange.endDate && {
            startDate: customDateRange.startDate,
            endDate: customDateRange.endDate,
          }),
      }

      // Fetch user details from our API
      const userDetailsResponse = await axiosInstance.get(`/api/dashboard/user-details/${userId}`, {
        params,
        headers: { Authorization: `Bearer ${user?.token}` },
      })

      // Also update the main dashboard user stats with Jasmin balance
      let jasminBalance = "0"
      try {
        const jasminBalanceResponse = await axiosInstance.get(`/api/credit/user-balance`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        // Find the user's balance from Jasmin
        const jasminUsers = jasminBalanceResponse.data.users || []
        const jasminUser = jasminUsers.find((u) => u.username === username)
        jasminBalance = jasminUser?.balance || "0"
      } catch (jasminError) {
        console.log("Could not fetch Jasmin balance:", jasminError.message)
      }

      // Also update the main dashboard user stats with Jasmin balance
      if (jasminBalance && jasminBalance !== "0") {
        setDashboardData((prevData) => ({
          ...prevData,
          userStats: prevData.userStats.map((user) => (user.username === username ? { ...user, jasminBalance } : user)),
        }))
      }

      // Combine the data
      const combinedUserData = {
        ...userDetailsResponse.data,
        jasminBalance,
      }

      console.log("Combined user data:", combinedUserData)
      setSelectedUser(combinedUserData)
      setShowUserDetails(true)
    } catch (error) {
      console.error("Error fetching user details:", error)
      toast.error("Failed to fetch user details")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle gateway click for gateway details popup
  const handleGatewayClick = async (gatewayName, country) => {
    try {
      console.log("Clicking gateway:", gatewayName, country)
      setIsLoading(true)

      const response = await axiosInstance.get(`/api/dashboard/gateway-details`, {
        params: {
          gateway: gatewayName,
          country: country,
          filter: selectedFilter,
          ...(selectedFilter === "custom" &&
            customDateRange.startDate &&
            customDateRange.endDate && {
              startDate: customDateRange.startDate,
              endDate: customDateRange.endDate,
            }),
        },
        headers: { Authorization: `Bearer ${user?.token}` },
      })

      setSelectedGateway(response.data)
      setShowGatewayDetails(true)
    } catch (error) {
      console.error("Error fetching gateway details:", error)
      toast.error("Failed to fetch gateway details")
    } finally {
      setIsLoading(false)
    }
  }

  const summaryCards = [
    {
      title: "Total Messages",
      value: dashboardData.summary.totalMessages.toLocaleString(),
      change: "+12.5%",
      trend: "up",
      color: "bg-blue-500",
      icon: BarChart3,
    },
    {
      title: "Total Sent",
      value: dashboardData.summary.totalSent.toLocaleString(),
      change: "+8.2%",
      trend: "up",
      color: "bg-green-500",
      icon: ArrowUpRight,
    },
    {
      title: "Delivered",
      value: dashboardData.summary.delivered.toLocaleString(),
      change: "+15.3%",
      trend: "up",
      color: "bg-emerald-500",
      icon: Check,
    },
    {
      title: "Rejected",
      value: dashboardData.summary.rejected.toLocaleString(),
      change: "-2.1%",
      trend: "down",
      color: "bg-red-500",
      icon: ArrowDownRight,
    },
    {
      title: "Undelivered",
      value: dashboardData.summary.undelivered.toLocaleString(),
      change: "-5.4%",
      trend: "down",
      color: "bg-orange-500",
      icon: ArrowDownRight,
    },
    {
      title: "Pending",
      value: dashboardData.summary.pending.toLocaleString(),
      change: "+3.7%",
      trend: "up",
      color: "bg-yellow-500",
      icon: RefreshCw,
    },
  ]

  // Updated DataTable component with fixed scrollbar positioning
  const DataTable = ({ title, data, columns, onRowClick, showActions = true }) => (
    <Card className="h-full shadow-sm">
      <CardHeader className="bg-white border-b py-4">
        <CardTitle className="text-lg font-semibold text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4">
            <LinearProgress indeterminate />
          </div>
        ) : data.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No data available for the selected time period</div>
        ) : (
          <div className="h-[350px] border-t">
            <div className="h-full overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-50 z-10">
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.id} className="whitespace-nowrap font-semibold text-gray-700 border-b">
                        {column.label}
                      </TableHead>
                    ))}
                    {showActions && (
                      <TableHead className="text-center font-semibold text-gray-700 border-b">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow
                      key={row.id || index}
                      className={`border-b hover:bg-gray-50 ${onRowClick ? "cursor-pointer" : ""}`}
                      onClick={() => onRowClick && onRowClick(row)}
                    >
                      {columns.map((column) => (
                        <TableCell key={column.id} className="py-3">
                          {column.format ? column.format(row[column.id]) : row[column.id]}
                        </TableCell>
                      ))}
                      {showActions && (
                        <TableCell className="text-center">
                          {onRowClick && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                onRowClick(row)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchDashboardData()}
            disabled={isLoading}
            className="h-10 w-10"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1 bg-white border-gray-200 text-gray-700">
                <Filter className="h-4 w-4" />
                <span>
                  {selectedFilter === "custom"
                    ? "Custom Range"
                    : filterOptions.find((opt) => opt.value === selectedFilter)?.label}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              {filterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleFilterSelect(option.value)}
                  className="cursor-pointer"
                >
                  {option.label}
                  {selectedFilter === option.value && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Custom Date Range Dialog */}
      <Dialog open={showCustomRange} onOpenChange={setShowCustomRange}>
        <DialogContent className="w-80">
          <DialogHeader>
            <DialogTitle>Custom Date Range</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date & Time</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={customDateRange.startDate}
                onChange={(e) =>
                  setCustomDateRange((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date & Time</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={customDateRange.endDate}
                onChange={(e) =>
                  setCustomDateRange((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCustomRange(false)}>
                Cancel
              </Button>
              <Button onClick={handleCustomRangeApply}>Apply Range</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog - Enhanced with Gateway Stats */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">User Details & Analytics</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="gateways">Gateway Stats</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500">Username</Label>
                    <p className="text-sm font-semibold">{selectedUser.username}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500">Email</Label>
                    <p className="text-sm">{selectedUser.primaryEmail}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500">Company</Label>
                    <p className="text-sm">{selectedUser.companyName || "N/A"}</p>
                  </div>
                </div>

                {/* Balance Information */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Card className="p-3 bg-green-50 border-green-200">
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-600">{selectedUser.jasminBalance || "0"}</p>
                      <p className="text-xs text-green-700">Balance</p>
                    </div>
                  </Card>
                  {/* <Card className="p-3 bg-blue-50 border-blue-200">
                    <div className="text-center">
                      <p className="text-xl font-bold text-blue-600">{selectedUser.creditsRemaining || 0}</p>
                      <p className="text-xs text-blue-700">DB Credits</p>
                    </div>
                  </Card> */}
                  <Card className="p-3 bg-purple-50 border-purple-200">
                    <div className="text-center">
                      <p className="text-xl font-bold text-purple-600">
                        {selectedUser.totalProfit?.toFixed(3) || "0.000"}€
                      </p>
                      <p className="text-xs text-purple-700">Total Profit</p>
                    </div>
                  </Card>
                  <Card className="p-3 bg-orange-50 border-orange-200">
                    <div className="text-center">
                      <p className="text-xl font-bold text-orange-600">
                        {selectedUser.avgCostPrice?.toFixed(3) || "0.000"}€
                      </p>
                      <p className="text-xs text-orange-700">Avg Cost Price</p>
                    </div>
                  </Card>
                </div>

                {/* SMS Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Card className="p-3 text-center">
                    <p className="text-xl font-bold text-blue-600">{selectedUser.submitted}</p>
                    <p className="text-xs text-gray-500">Submitted</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <p className="text-xl font-bold text-green-600">{selectedUser.delivered}</p>
                    <p className="text-xs text-gray-500">Delivered</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <p className="text-xl font-bold text-yellow-600">{selectedUser.pending}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <p className="text-xl font-bold text-red-600">{selectedUser.rejected || 0}</p>
                    <p className="text-xs text-gray-500">Rejected</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <p className="text-xl font-bold text-orange-600">{selectedUser.undelivered || 0}</p>
                    <p className="text-xs text-gray-500">Undelivered</p>
                  </Card>
                </div>

                {/* Pricing Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500">Average Cost Price (CP)</Label>
                    <p className="text-lg font-bold text-yellow-600">
                      {selectedUser.avgCostPrice?.toFixed(3) || "0.000"}€
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500">Average Sale Price (SP)</Label>
                    <p className="text-lg font-bold text-yellow-600">
                      {selectedUser.avgSalePrice?.toFixed(3) || "0.000"}€
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500">Profit Margin</Label>
                    <p className="text-lg font-bold text-green-600">
                      {selectedUser.avgCostPrice && selectedUser.avgSalePrice
                        ? (
                            ((selectedUser.avgSalePrice - selectedUser.avgCostPrice) / selectedUser.avgSalePrice) *
                            100
                          ).toFixed(1)
                        : "0.0"}
                      %
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="gateways" className="space-y-4">
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-3">Gateway-wise Message Statistics</h3>
                  {selectedUser.gatewayStats && selectedUser.gatewayStats.length > 0 ? (
                    <div className="h-[400px] border rounded-md">
                      <div className="h-full overflow-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-gray-50 z-10">
                            <TableRow>
                              <TableHead className="font-semibold text-gray-700">Gateway</TableHead>
                              <TableHead className="font-semibold text-gray-700">Country</TableHead>
                              <TableHead className="font-semibold text-gray-700">Total</TableHead>
                              <TableHead className="font-semibold text-gray-700">Delivered</TableHead>
                              <TableHead className="font-semibold text-gray-700">Rejected</TableHead>
                              <TableHead className="font-semibold text-gray-700">Undelivered</TableHead>
                              <TableHead className="font-semibold text-gray-700">Pending</TableHead>
                              <TableHead className="font-semibold text-gray-700">Avg CP</TableHead>
                              <TableHead className="font-semibold text-gray-700">Avg SP</TableHead>
                              <TableHead className="font-semibold text-gray-700">Profit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedUser.gatewayStats.map((gateway, index) => (
                              <TableRow
                                key={`${gateway.gatewayName}-${gateway.country}-${index}`}
                                className="border-b hover:bg-gray-50"
                              >
                                <TableCell className="font-medium">{gateway.gatewayName}</TableCell>
                                <TableCell>{gateway.country}</TableCell>
                                <TableCell>{gateway.totalMessages}</TableCell>
                                <TableCell className="text-green-600">{gateway.delivered}</TableCell>
                                <TableCell className="text-red-600">{gateway.rejected}</TableCell>
                                <TableCell className="text-orange-600">{gateway.undelivered}</TableCell>
                                <TableCell className="text-yellow-600">{gateway.pending}</TableCell>
                                <TableCell>{gateway.avgCostPrice?.toFixed(3)}€</TableCell>
                                <TableCell>{gateway.avgSalePrice?.toFixed(3)}€</TableCell>
                                <TableCell className="text-purple-600">{gateway.totalProfit?.toFixed(3)}€</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <p>No gateway statistics available for this user in the selected time period</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Gateway Details Dialog */}
      <Dialog open={showGatewayDetails} onOpenChange={setShowGatewayDetails}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Gateway Details - {selectedGateway?.gatewayName} ({selectedGateway?.country})
            </DialogTitle>
          </DialogHeader>
          {selectedGateway && (
            <div className="space-y-4">
              {/* Gateway Summary */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="p-3 text-center bg-blue-50">
                  <p className="text-xl font-bold text-blue-600">{selectedGateway.totalMessages}</p>
                  <p className="text-xs text-gray-500">Total Messages</p>
                </Card>
                <Card className="p-3 text-center bg-green-50">
                  <p className="text-xl font-bold text-green-600">{selectedGateway.delivered}</p>
                  <p className="text-xs text-gray-500">Delivered</p>
                </Card>
                <Card className="p-3 text-center bg-red-50">
                  <p className="text-xl font-bold text-red-600">{selectedGateway.rejected}</p>
                  <p className="text-xs text-gray-500">Rejected</p>
                </Card>
                <Card className="p-3 text-center bg-orange-50">
                  <p className="text-xl font-bold text-orange-600">{selectedGateway.undelivered}</p>
                  <p className="text-xs text-gray-500">Undelivered</p>
                </Card>
                <Card className="p-3 text-center bg-yellow-50">
                  <p className="text-xl font-bold text-yellow-600">{selectedGateway.pending}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </Card>
              </div>

              {/* User Details Table */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-3">Users sending via this gateway</h3>
                <div className="h-[300px] border rounded-md">
                  <div className="h-full overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-50 z-10">
                        <TableRow>
                          <TableHead className="font-semibold text-gray-700">Username</TableHead>
                          <TableHead className="font-semibold text-gray-700">Total</TableHead>
                          <TableHead className="font-semibold text-gray-700">Delivered</TableHead>
                          <TableHead className="font-semibold text-gray-700">Rejected</TableHead>
                          <TableHead className="font-semibold text-gray-700">Undelivered</TableHead>
                          <TableHead className="font-semibold text-gray-700">Pending</TableHead>
                          <TableHead className="font-semibold text-gray-700">Avg CP</TableHead>
                          <TableHead className="font-semibold text-gray-700">Avg SP</TableHead>
                          <TableHead className="font-semibold text-gray-700">Profit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedGateway.userDetails?.map((user, index) => (
                          <TableRow key={index} className="border-b hover:bg-gray-50">
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.totalMessages}</TableCell>
                            <TableCell className="text-green-600">{user.delivered}</TableCell>
                            <TableCell className="text-red-600">{user.rejected}</TableCell>
                            <TableCell className="text-orange-600">{user.undelivered}</TableCell>
                            <TableCell className="text-yellow-600">{user.pending}</TableCell>
                            <TableCell>{user.avgCostPrice?.toFixed(3)}€</TableCell>
                            <TableCell>{user.avgSalePrice?.toFixed(3)}€</TableCell>
                            <TableCell className="text-purple-600">{user.totalProfit?.toFixed(3)}€</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card, index) => {
          const IconComponent = card.icon
          return (
            <Card key={index} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col space-y-2">
                  <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.title}</p>
                    <h3 className="text-lg font-bold mt-1 text-gray-800">{card.value}</h3>
                  </div>
                  <div
                    className={`flex items-center text-xs font-medium ${
                      card.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {card.trend === "up" ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    {card.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Tables - Rearranged Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* First Row: User Stats and Gateway Stats */}
        <DataTable
          title="User Stats"
          columns={[
            { id: "username", label: "Username" },
            { id: "jasminBalance", label: "Balance" },
            { id: "submitted", label: "Submitted" },
            { id: "delivered", label: "Delivered" },
            { id: "pending", label: "Pending" },
          ]}
          data={dashboardData.userStats}
          onRowClick={(rowData) => handleUserClick(rowData._id || rowData.id, rowData.username)}
          showActions={true}
        />

        <DataTable
          title="Gateway Stats"
          columns={[
            { id: "gatewayName", label: "Gateway" },
            { id: "country", label: "Country" },
            { id: "totalMessages", label: "Total" },
            { id: "delivered", label: "Delivered" },
            { id: "undelivered", label: "Undelivered" },
            { id: "pending", label: "Pending" },
          ]}
          data={dashboardData.gatewayStats}
          onRowClick={(rowData) => handleGatewayClick(rowData.gatewayName, rowData.country)}
          showActions={true}
        />
      </div>

      {/* Second Row: Gateway Status (Full Width) */}
      <div className="grid grid-cols-1 gap-6">
        <DataTable
          title="Gateway Status"
          columns={[
            { id: "gatewayId", label: "Gateway ID" },
            {
              id: "status",
              label: "Status",
              format: (status) => (
                <div className="flex items-center">
                  <div
                    className={`mr-2 h-2.5 w-2.5 rounded-full ${
                      status === "Online" || status === "enabled" ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className={status === "Online" || status === "enabled" ? "text-green-700" : "text-red-700"}>
                    {status}
                  </span>
                </div>
              ),
            },
          ]}
          data={dashboardData.gatewayStatus}
          showActions={false}
        />
      </div>
    </div>
  )
}

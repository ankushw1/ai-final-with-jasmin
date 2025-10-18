"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import {
  Filter,
  ChevronDown,
  Check,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  Calendar,
  CreditCard,
  FileText,
  BarChart3,
  TrendingUp,
  Monitor,
  Layers,
  RefreshCw,
  TrendingDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useAxios from "@/hooks/use-axios"

export default function DashboardPage() {
  const [selectedFilter, setSelectedFilter] = useState("Today")
  const [creditInfo, setCreditInfo] = useState({
    balance: 0,
    creditType: "Wallet",
  })
  const [data, setData] = useState({
    realTimeStats: null,
    hourlyDistribution: [],
    dailyPerformance: [],
    comparativeAnalytics: null,
    dailyReportData: [],
    loading: true,
    error: null,
  })

  const axiosInstance = useAxios()

  const fetchDashboardData = async (filter = selectedFilter) => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }))

      console.log("Fetching data with filter:", filter)

      // Build API calls with filter parameter (updated to use the working filter logic)
      const apiCalls = [
        // Real-time stats with filter
        axiosInstance.get(`/api/dashboard/real-time-stats?filter=${encodeURIComponent(filter)}`),

        // Hourly distribution with filter
        axiosInstance.get(`/api/dashboard/hourly-distribution?filter=${encodeURIComponent(filter)}`),

        // Daily performance with filter
        axiosInstance.get(`/api/dashboard/daily-performance?filter=${encodeURIComponent(filter)}`),

        // Comparative analytics (always yesterday vs today)
        axiosInstance.get("/api/dashboard/comparative-analytics"),

        // Daily report data with filter
        axiosInstance.get(`/api/dashboard/daily-report-data?filter=${encodeURIComponent(filter)}`),
      ]

      const [realTimeStats, hourlyDistribution, dailyPerformance, comparativeAnalytics, dailyReportData] =
        await Promise.all(apiCalls)

      console.log("API Responses:", {
        realTimeStats: realTimeStats.data,
        hourlyDistribution: hourlyDistribution.data,
        dailyPerformance: dailyPerformance.data,
        comparativeAnalytics: comparativeAnalytics.data,
        dailyReportData: dailyReportData.data,
      })

      setData({
        realTimeStats: realTimeStats.data.data,
        hourlyDistribution: hourlyDistribution.data.data,
        dailyPerformance: dailyPerformance.data.data,
        comparativeAnalytics: comparativeAnalytics.data.data,
        dailyReportData: dailyReportData.data.data,
        loading: false,
        error: null,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
    }
  }

  useEffect(() => {
    fetchDashboardData()

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000)

    return () => clearInterval(interval)
  }, [selectedFilter])

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await axiosInstance.get("/api/check-balance")
        const balance = res.data.balance
        setCreditInfo((prev) => ({
          ...prev,
          balance: Number(balance).toFixed(2),
        }))
      } catch (error) {
        console.error("Failed to fetch balance:", error)
      }
    }

    fetchBalance()
  }, [])

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter)
    fetchDashboardData(filter)
  }

  const { realTimeStats, hourlyDistribution, dailyPerformance, comparativeAnalytics, dailyReportData, loading, error } =
    data

  if (loading && !realTimeStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-violet-500" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
          <Button onClick={() => fetchDashboardData()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with credit info */}
      <div className="bg-violet-400 text-white p-4 rounded-[10px]">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center">
              <Monitor className="mr-2 h-6 w-6" /> SMS Dashboard
            </h1>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <div className="bg-teal-400 p-2 rounded-l-md">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div className="bg-white text-gray-800 p-2 rounded-r-md">
                  <div className="text-xs text-gray-500">CREDIT TYPE</div>
                  <div className="font-semibold">{creditInfo.creditType}</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-emerald-400 p-2 rounded-l-md">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="bg-white text-gray-800 p-2 rounded-r-md">
                  <div className="text-xs text-gray-500">BALANCE</div>
                  <div className="font-semibold">€ {creditInfo.balance}</div>
                </div>
              </div>
              <Button
                onClick={() => fetchDashboardData()}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
            <Badge variant="outline" className="bg-violet-100 text-violet-800 border-violet-200">
              {selectedFilter}
            </Badge>
            {loading && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Updating...
              </Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1 bg-white border-gray-200 text-gray-700">
                <Filter className="h-4 w-4" />
                <span>Filter: {selectedFilter}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              {["Today", "Yesterday", "Last 24 hours", "This Week", "This Month", "Last 7 days", "Last 30 days"].map(
                (filter) => (
                  <DropdownMenuItem key={filter} onClick={() => handleFilterSelect(filter)} className="cursor-pointer">
                    {filter}
                    {selectedFilter === filter && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Message Status Cards */}
        {realTimeStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card className="border border-green-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-green-600 flex items-center">
                      <CheckCircle className="mr-1 h-4 w-4" /> Delivered
                    </p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-800">
                      {realTimeStats.DELIVERED.toLocaleString()}
                    </h3>
                  </div>
                  <div className="h-12 w-12 bg-green-400 rounded-full flex items-center justify-center text-white">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-red-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-red-600 flex items-center">
                      <XCircle className="mr-1 h-4 w-4" /> Rejected
                    </p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-800">{realTimeStats.REJECTED.toLocaleString()}</h3>
                  </div>
                  <div className="h-12 w-12 bg-red-400 rounded-full flex items-center justify-center text-white">
                    <XCircle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-amber-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-amber-600 flex items-center">
                      <AlertTriangle className="mr-1 h-4 w-4" /> Undelivered
                    </p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-800">
                      {realTimeStats.UNDELIVERED.toLocaleString()}
                    </h3>
                  </div>
                  <div className="h-12 w-12 bg-amber-400 rounded-full flex items-center justify-center text-white">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-violet-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-violet-600 flex items-center">
                      <Clock className="mr-1 h-4 w-4" /> Pending
                    </p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-800">{realTimeStats.PENDING.toLocaleString()}</h3>
                  </div>
                  <div className="h-12 w-12 bg-violet-400 rounded-full flex items-center justify-center text-white">
                    <Clock className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-teal-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-teal-600 flex items-center">
                      <Layers className="mr-1 h-4 w-4" /> Total
                    </p>
                    <h3 className="text-2xl font-bold mt-1 text-gray-800">{realTimeStats.TOTAL.toLocaleString()}</h3>
                  </div>
                  <div className="h-12 w-12 bg-teal-500 rounded-full flex items-center justify-center text-white">
                    <Layers className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chart Tabs */}
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="grid grid-cols-3 mb-4 bg-gray-100">
            <TabsTrigger value="overview" className="flex items-center data-[state=active]:bg-white">
              <Activity className="h-4 w-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center data-[state=active]:bg-white">
              <TrendingUp className="h-4 w-4 mr-2" /> Performance
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center data-[state=active]:bg-white">
              <BarChart3 className="h-4 w-4 mr-2" /> Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Real-time SMS Summary */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center text-gray-800">
                  <Activity className="mr-2 h-5 w-5 text-violet-500" /> SMS Distribution - {selectedFilter}
                </CardTitle>
                <CardDescription className="text-gray-500">
                  {selectedFilter === "Today" || selectedFilter === "Yesterday"
                    ? `Hourly SMS distribution for ${selectedFilter.toLowerCase()}`
                    : `SMS distribution for ${selectedFilter.toLowerCase()}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="hour"
                        label={{
                          value: "Hour",
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="messages"
                        name="Messages"
                        stroke="#c084fc"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Message Status Distribution and Daily Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="flex items-center text-gray-800">
                    <PieChart className="mr-2 h-5 w-5 text-violet-500" /> Message Status Distribution
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Breakdown of message delivery statuses for {selectedFilter.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Delivered", value: realTimeStats?.DELIVERED || 0, color: "#4ade80" },
                            { name: "Rejected", value: realTimeStats?.REJECTED || 0, color: "#f87171" },
                            { name: "Undelivered", value: realTimeStats?.UNDELIVERED || 0, color: "#fbbf24" },
                            { name: "Pending", value: realTimeStats?.PENDING || 0, color: "#c084fc" },
                          ].filter((item) => item.value > 0)} // Only show segments with values > 0
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent, value }) =>
                            value > 0 ? `${name}: ${(percent * 100).toFixed(1)}%` : null
                          }
                        >
                          {[
                            { name: "Delivered", value: realTimeStats?.DELIVERED || 0, color: "#4ade80" },
                            { name: "Rejected", value: realTimeStats?.REJECTED || 0, color: "#f87171" },
                            { name: "Undelivered", value: realTimeStats?.UNDELIVERED || 0, color: "#fbbf24" },
                            { name: "Pending", value: realTimeStats?.PENDING || 0, color: "#c084fc" },
                          ]
                            .filter((item) => item.value > 0)
                            .map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [value.toLocaleString(), name]}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                          wrapperStyle={{
                            paddingTop: "20px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-gray-200">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="flex items-center text-gray-800">
                    <BarChart3 className="mr-2 h-5 w-5 text-violet-500" /> Daily Message Performance
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Message delivery performance for {selectedFilter.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="delivered" name="Delivered" fill="#4ade80" />
                        <Bar dataKey="rejected" name="Rejected" fill="#f87171" />
                        <Bar dataKey="undelivered" name="Undelivered" fill="#fbbf24" />
                        <Bar dataKey="pending" name="Pending" fill="#c084fc" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Delivery Rate Trend */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center text-gray-800">
                  <TrendingUp className="mr-2 h-5 w-5 text-violet-500" /> Delivery Rate Trend
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Daily delivery rate performance for {selectedFilter.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="deliveryRate"
                        name="Delivery Rate"
                        stroke="#4ade80"
                        fill="#4ade80"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Message Volume by Hour */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center text-gray-800">
                  <BarChart3 className="mr-2 h-5 w-5 text-violet-500" /> Message Volume Distribution
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Distribution of messages for {selectedFilter.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="messages"
                        name="Messages"
                        stroke="#c084fc"
                        fill="#c084fc"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Daily Performance Chart */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center text-gray-800">
                  <BarChart3 className="mr-2 h-5 w-5 text-violet-500" />
                  Performance Analysis - {selectedFilter}
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Detailed breakdown of message performance for {selectedFilter.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" name="Total Messages" fill="#c084fc" />
                      <Bar dataKey="delivered" name="Delivered" fill="#4ade80" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* SMS Comparative Analytics */}
        {comparativeAnalytics && (
          <Card className="mb-6 shadow-sm border-gray-200">
            <CardHeader className="bg-gradient-to-r from-violet-500 to-violet-400 text-white">
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" /> SMS Comparative Analytics (Yesterday vs Today)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { key: "submitted", label: "Submitted", color: "gray" },
                  { key: "delivered", label: "Delivered", color: "green" },
                  { key: "failed", label: "Failed", color: "amber" },
                  { key: "rejected", label: "Rejected", color: "red" },
                ].map((item, index) => {
                  const yesterday = comparativeAnalytics[item.key].yesterday
                  const today = comparativeAnalytics[item.key].today
                  const change = yesterday > 0 ? ((today - yesterday) / yesterday) * 100 : 0
                  const isPositive = change >= 0

                  return (
                    <div key={index} className={`p-4 ${index < 3 ? "border-r border-gray-200" : ""}`}>
                      <h3
                        className={`font-semibold mb-2 ${
                          item.color === "green"
                            ? "text-green-600"
                            : item.color === "amber"
                              ? "text-amber-600"
                              : item.color === "red"
                                ? "text-red-600"
                                : "text-gray-700"
                        }`}
                      >
                        {item.label}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Yesterday</span>
                          <span className="font-medium">{yesterday}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Today</span>
                          <span className="font-medium">{today}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Change</span>
                          <span
                            className={`font-medium flex items-center ${
                              isPositive ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {isPositive ? "+" : ""}
                            {change.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily SMS Delivery Performance Report */}
        {dailyReportData && dailyReportData.length > 0 && (
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gradient-to-r from-violet-500 to-violet-400 text-white">
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" /> SMS Delivery Performance Report - {selectedFilter}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="p-3 border-b border-gray-200 font-semibold text-gray-700">Date</th>
                      <th className="p-3 border-b border-gray-200 font-semibold text-gray-700">Submitted</th>
                      <th className="p-3 border-b border-gray-200 font-semibold text-gray-700">Delivered</th>
                      <th className="p-3 border-b border-gray-200 font-semibold text-gray-700">Delivered %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyReportData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-3 border-b border-gray-200">{row.date}</td>
                        <td className="p-3 border-b border-gray-200">{row.submitted.toLocaleString()}</td>
                        <td className="p-3 border-b border-gray-200">{row.delivered.toLocaleString()}</td>
                        <td className="p-3 border-b border-gray-200">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div
                                className={`h-2.5 rounded-full ${
                                  Number.parseFloat(row.deliveryRate) > 95
                                    ? "bg-green-400"
                                    : Number.parseFloat(row.deliveryRate) > 90
                                      ? "bg-amber-400"
                                      : "bg-red-400"
                                }`}
                                style={{ width: `${row.deliveryRate}%` }}
                              ></div>
                            </div>
                            <span>{row.deliveryRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

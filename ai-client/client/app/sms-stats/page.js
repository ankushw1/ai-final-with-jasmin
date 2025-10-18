"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  TrendingUp,
  Calendar,
  Activity,
  Loader2,
} from "lucide-react"
import useAxios from "@/hooks/use-axios"
import { useToast } from "@/hooks/use-toast"

export default function SmsStatsPage() {
  const [stats, setStats] = useState({
    today: {
      delivered: 0,
      rejected: 0,
      undelivered: 0,
      pending: 0,
      total: 0,
    },
    overall: {
      delivered: 0,
      rejected: 0,
      undelivered: 0,
      pending: 0,
      total: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const axios = useAxios()
  const { toast } = useToast()

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const response = await axios.get("/sms/stats")

      if (response.data.success) {
        setStats(response.data.data)
        if (isRefresh) {
          toast({
            title: "Success",
            description: "Statistics refreshed successfully",
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch SMS statistics",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
      toast({
        title: "Error",
        description: "Error loading SMS statistics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleRefresh = () => {
    fetchStats(true)
  }

  const StatCard = ({ title, value, icon: Icon, color, bgColor, textColor, description }) => (
    <Card
      className={`${bgColor} border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className={`text-sm font-medium ${textColor} opacity-80`}>{title}</p>
            <p className={`text-3xl font-bold ${textColor}`}>{loading ? "..." : value.toLocaleString()}</p>
            {description && <p className={`text-xs ${textColor} opacity-70`}>{description}</p>}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const SectionHeader = ({ title, icon: Icon, subtitle }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-blue-100 rounded-lg">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Loading SMS statistics...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SMS Statistics</h1>
            <p className="text-gray-600">Monitor your SMS delivery performance and analytics</p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} className="bg-blue-600 hover:bg-blue-700">
          {refreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Today's Stats */}
      <div className="space-y-6">
        <SectionHeader
          title="Today's Statistics"
          icon={Calendar}
          subtitle={`Statistics for ${new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Sent"
            value={stats.today.total}
            icon={MessageSquare}
            color="bg-blue-500"
            bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
            textColor="text-blue-900"
            description="Messages sent today"
          />
          <StatCard
            title="Delivered"
            value={stats.today.delivered}
            icon={CheckCircle}
            color="bg-green-500"
            bgColor="bg-gradient-to-br from-green-50 to-green-100"
            textColor="text-green-900"
            description="Successfully delivered"
          />
          <StatCard
            title="Pending"
            value={stats.today.pending}
            icon={Clock}
            color="bg-yellow-500"
            bgColor="bg-gradient-to-br from-yellow-50 to-yellow-100"
            textColor="text-yellow-900"
            description="Awaiting delivery"
          />
          <StatCard
            title="Undelivered"
            value={stats.today.undelivered}
            icon={XCircle}
            color="bg-red-500"
            bgColor="bg-gradient-to-br from-red-50 to-red-100"
            textColor="text-red-900"
            description="Failed to deliver"
          />
          <StatCard
            title="Rejected"
            value={stats.today.rejected}
            icon={AlertTriangle}
            color="bg-orange-500"
            bgColor="bg-gradient-to-br from-orange-50 to-orange-100"
            textColor="text-orange-900"
            description="Rejected by carrier"
          />
        </div>

        {/* Today's Performance Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Today's Performance</h3>
                  <p className="text-blue-700">
                    {stats.today.total > 0
                      ? `${((stats.today.delivered / stats.today.total) * 100).toFixed(1)}% delivery rate`
                      : "No messages sent today"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {stats.today.total === 0 ? "No Activity" : "Active"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Stats */}
      <div className="space-y-6">
        <SectionHeader title="Overall Statistics" icon={Activity} subtitle="Cumulative statistics for all time" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Sent"
            value={stats.overall.total}
            icon={MessageSquare}
            color="bg-indigo-500"
            bgColor="bg-gradient-to-br from-indigo-50 to-indigo-100"
            textColor="text-indigo-900"
            description="All time total"
          />
          <StatCard
            title="Delivered"
            value={stats.overall.delivered}
            icon={CheckCircle}
            color="bg-emerald-500"
            bgColor="bg-gradient-to-br from-emerald-50 to-emerald-100"
            textColor="text-emerald-900"
            description="Successfully delivered"
          />
          <StatCard
            title="Pending"
            value={stats.overall.pending}
            icon={Clock}
            color="bg-amber-500"
            bgColor="bg-gradient-to-br from-amber-50 to-amber-100"
            textColor="text-amber-900"
            description="Awaiting delivery"
          />
          <StatCard
            title="Undelivered"
            value={stats.overall.undelivered}
            icon={XCircle}
            color="bg-rose-500"
            bgColor="bg-gradient-to-br from-rose-50 to-rose-100"
            textColor="text-rose-900"
            description="Failed to deliver"
          />
          <StatCard
            title="Rejected"
            value={stats.overall.rejected}
            icon={AlertTriangle}
            color="bg-red-500"
            bgColor="bg-gradient-to-br from-red-50 to-red-100"
            textColor="text-red-900"
            description="Rejected by carrier"
          />
        </div>

        {/* Overall Performance Summary */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-900">Overall Performance</h3>
                  <p className="text-purple-700">
                    {stats.overall.total > 0
                      ? `${((stats.overall.delivered / stats.overall.total) * 100).toFixed(1)}% delivery rate across all campaigns`
                      : "No messages sent yet"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-900">{stats.overall.total.toLocaleString()}</div>
                <p className="text-sm text-purple-700">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

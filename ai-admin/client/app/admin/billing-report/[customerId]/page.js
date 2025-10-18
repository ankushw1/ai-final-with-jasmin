"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { format, startOfDay, endOfDay, subHours, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { CheckCircle, Clock, FilterIcon, DollarSign, TrendingUp, MessageSquare } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import useAxios from "@/hooks/use-axios"

export default function BillingReport() {
  const params = useParams()
  const searchParams = useSearchParams()
  const customerId = params?.customerId 
  const customerEmail = searchParams.get("email")

  const [billingSummary, setBillingSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  const axiosInstance = useAxios()

  const fetchBillingSummary = async () => {
    setLoading(true)
    try {
      const formattedStartDate = startDate ? format(startDate, "yyyy-MM-dd'T'HH:mm:ss") : null
      const formattedEndDate = endDate ? format(endDate, "yyyy-MM-dd'T'HH:mm:ss") : null

      const response = await axiosInstance.get("/api/reporting/billing-summary", {
        params: {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          CUSTOMERID: customerId,
        },
      })

      setBillingSummary(response.data.billingSummary)
    } catch (error) {
      console.error("Error fetching billing summary:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBillingSummary()
  }, [startDate, endDate, customerId])

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
      fetchBillingSummary()
    }
    setIsCustomDateOpen(false)
  }

  // Card data for the dashboard
  const cardsData = [
    {
      label: "Total Billing (€)",
      count: billingSummary?.totalBilling?.toFixed(3) || "0.000",
      icon: <DollarSign className="h-8 w-8 text-green-500" />,
      className: "bg-green-50 dark:bg-green-900/20",
      textClass: "text-green-600 dark:text-green-400",
    },
    {
      label: "Rates",
      count: billingSummary?.rates?.[0] || "0",
      icon: <TrendingUp className="h-8 w-8 text-green-500" />,
      className: "bg-green-50 dark:bg-green-900/20",
      textClass: "text-green-600 dark:text-green-400",
    },
    {
      label: "Total Messages",
      count: billingSummary?.statusCounts?.TOTAL || "0",
      icon: <MessageSquare className="h-8 w-8 text-green-500" />,
      className: "bg-green-50 dark:bg-green-900/20",
      textClass: "text-green-600 dark:text-green-400",
    },
    {
      label: "Delivered",
      count: billingSummary?.statusCounts?.DELIVRD || "0",
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      className: "bg-green-50 dark:bg-green-900/20",
      textClass: "text-green-600 dark:text-green-400",
    },
    {
      label: "Rejected",
      count: billingSummary?.statusCounts?.REJECTD || "0",
      icon: <Clock className="h-8 w-8 text-yellow-500" />,
      className: "bg-yellow-50 dark:bg-yellow-900/20",
      textClass: "text-yellow-600 dark:text-yellow-400",
    },
    {
      label: "Undelivered",
      count: billingSummary?.statusCounts?.UNDELIV || "0",
      icon: <Clock className="h-8 w-8 text-yellow-500" />,
      className: "bg-yellow-50 dark:bg-yellow-900/20",
      textClass: "text-yellow-600 dark:text-yellow-400",
    },
    {
      label: "Pending",
      count: billingSummary?.statusCounts?.PENDING || "0",
      icon: <Clock className="h-8 w-8 text-yellow-500" />,
      className: "bg-yellow-50 dark:bg-yellow-900/20",
      textClass: "text-yellow-600 dark:text-yellow-400",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold">{customerEmail || "Billing Report"}</h1>
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
      </div>

      {/* Custom Date Dialog */}
      <Dialog open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
            <DialogDescription>Choose a start and end date to filter the billing data.</DialogDescription>
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

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* First row of cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cardsData.slice(0, 3).map((card, index) => (
              <Card key={index} className={cn("overflow-hidden", card.className)}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                      <h3 className={cn("text-3xl font-bold mt-2", card.textClass)}>{card.count}</h3>
                    </div>
                    <div className="rounded-full p-2 bg-white dark:bg-gray-800 shadow-sm">{card.icon}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Second row of cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {cardsData.slice(3).map((card, index) => (
              <Card key={index} className={cn("overflow-hidden", card.className)}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                      <h3 className={cn("text-3xl font-bold mt-2", card.textClass)}>{card.count}</h3>
                    </div>
                    <div className="rounded-full p-2 bg-white dark:bg-gray-800 shadow-sm">{card.icon}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

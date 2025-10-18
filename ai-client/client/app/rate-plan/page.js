"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, Settings, Search, Download, RotateCcw, DollarSign } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function RatePlanPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [entriesPerPage, setEntriesPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)

  // Dummy rate plan data
  const ratePlanData = [
    {
      country: "India",
      sortName: "IN",
      phoneCode: "+91",
      operator: "Airtel",
      mcc: "404",
      mnc: "10",
      ratePerMsg: "€ 0.045",
    },
    {
      country: "India",
      sortName: "IN",
      phoneCode: "+91",
      operator: "Vodafone",
      mcc: "404",
      mnc: "20",
      ratePerMsg: "€ 0.048",
    },
    {
      country: "India",
      sortName: "IN",
      phoneCode: "+91",
      operator: "Jio",
      mcc: "405",
      mnc: "857",
      ratePerMsg: "€ 0.042",
    },
    {
      country: "United States",
      sortName: "US",
      phoneCode: "+1",
      operator: "Verizon",
      mcc: "310",
      mnc: "004",
      ratePerMsg: "€ 0.035",
    },
    {
      country: "United States",
      sortName: "US",
      phoneCode: "+1",
      operator: "AT&T",
      mcc: "310",
      mnc: "410",
      ratePerMsg: "€ 0.038",
    },
    {
      country: "United Kingdom",
      sortName: "GB",
      phoneCode: "+44",
      operator: "EE",
      mcc: "234",
      mnc: "30",
      ratePerMsg: "€ 0.055",
    },
    {
      country: "United Kingdom",
      sortName: "GB",
      phoneCode: "+44",
      operator: "Vodafone",
      mcc: "234",
      mnc: "15",
      ratePerMsg: "€ 0.052",
    },
    {
      country: "Germany",
      sortName: "DE",
      phoneCode: "+49",
      operator: "Deutsche Telekom",
      mcc: "262",
      mnc: "01",
      ratePerMsg: "€ 0.058",
    },
    {
      country: "Germany",
      sortName: "DE",
      phoneCode: "+49",
      operator: "Vodafone",
      mcc: "262",
      mnc: "02",
      ratePerMsg: "€ 0.056",
    },
    {
      country: "France",
      sortName: "FR",
      phoneCode: "+33",
      operator: "Orange",
      mcc: "208",
      mnc: "01",
      ratePerMsg: "€ 0.062",
    },
    {
      country: "Default",
      sortName: "Default",
      phoneCode: "Default",
      operator: "Default",
      mcc: "Default",
      mnc: "Default",
      ratePerMsg: "€ -",
    },
  ]

  const currentBalance = "€ 0.7360"

  // Filter data based on search term
  const filteredData = ratePlanData.filter(
    (item) =>
      item.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phoneCode.includes(searchTerm) ||
      item.sortName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Pagination
  const itemsPerPage = Number.parseInt(entriesPerPage)
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const handleSearch = () => {
    setCurrentPage(1)
  }

  const handleClear = () => {
    setSearchTerm("")
    setCurrentPage(1)
  }

  const handleExport = () => {
    console.log("Exporting rate plan data...")
  }

  const handleReload = () => {
    console.log("Reloading rate plan data...")
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Rate Plan Details</CardTitle>
                  <CardDescription>View SMS rates for different countries and operators</CardDescription>
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                <span className="text-white text-xs">💬</span>
              </div>
              SMS Rate Plan Details
            </CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rates..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm font-medium">Search:</span>
              <div className="relative flex-1 max-w-md">
                <Input
                  placeholder="Search by country, operator, or code"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-20"
                />
                <div className="absolute right-1 top-1 flex gap-1">
                  <Button size="sm" onClick={handleSearch} className="h-8 px-3">
                    <Search className="h-3 w-3 mr-1" />
                    Search
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleClear} className="h-8 px-2">
                    Clear
                  </Button>
                </div>
              </div>
            </div>

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

            <div className="flex gap-2">
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
                  <TableHead>Country</TableHead>
                  <TableHead>Sort Name</TableHead>
                  <TableHead>Phone Code</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>MCC</TableHead>
                  <TableHead>MNC</TableHead>
                  <TableHead>Rate Per Msg</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No rate plans found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((rate, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{rate.country}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rate.sortName}</Badge>
                      </TableCell>
                      <TableCell>{rate.phoneCode}</TableCell>
                      <TableCell>{rate.operator}</TableCell>
                      <TableCell>{rate.mcc}</TableCell>
                      <TableCell>{rate.mnc}</TableCell>
                      <TableCell className="font-medium text-green-600">{rate.ratePerMsg}</TableCell>
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

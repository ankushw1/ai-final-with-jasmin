"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useUser } from "@/context/user-context"
import useAxios from "@/hooks/use-axios"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, Search, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LinearProgress } from "@/components/ui/linear-progress"

export default function ManageOperator() {
  const [operators, setOperators] = useState([])
  const [filteredOperators, setFilteredOperators] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalOperators, setTotalOperators] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [countries, setCountries] = useState([])
  const [selectedCountry, setSelectedCountry] = useState("")
  const [countryDetails, setCountryDetails] = useState(null)
  const [countrySearchTerm, setCountrySearchTerm] = useState("")
  const [operatorDetails, setOperatorDetails] = useState({
    Country: "",
    "Operetor name": "",
    MNC: "",
    MCC: "",
  })

  const axiosInstance = useAxios()
  const { user } = useUser()

  useEffect(() => {
    fetchCountries()
  }, [])

  useEffect(() => {
    if (selectedCountry) {
      fetchOperators()
    }
  }, [selectedCountry])

  // Filter operators whenever search term changes
  useEffect(() => {
    if (operators.length > 0) {
      filterOperators()
    }
  }, [searchTerm, operators, page, pageSize])

  const fetchCountries = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/routing/countries", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (Array.isArray(response.data.countries)) {
        setCountries(response.data.countries)
      }
    } catch (error) {
      console.error("Error fetching countries:", error)
      toast.error("Failed to fetch countries")
    } finally {
      setLoading(false)
    }
  }

  const fetchOperators = async () => {
    if (!selectedCountry) return
    setLoading(true)
    try {
      const endpoint = selectedCountry === "All" ? "/api/routing/all-operators" : "/api/routing/detailss"
      const payload =
        selectedCountry === "All"
          ? { search: "", page: 1, limit: 999999 }
          : { country: selectedCountry, search: "", page: 1, limit: 999999 }

      const response = await axiosInstance.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })

      if (response.data.results) {
        // Store all operators in state
        const validOperators = response.data.results.filter((op) => op && op.operator)
        setOperators(validOperators)
        setTotalOperators(validOperators.length)

        // Set country details from first result
        if (validOperators.length > 0 && selectedCountry !== "All") {
          const firstResult = validOperators[0]
          setCountryDetails({
            cc: firstResult.cc,
            mcc: firstResult.mcc,
          })
        } else if (selectedCountry === "All") {
          setCountryDetails(null)
        }
      }
    } catch (error) {
      console.error("Error fetching operators:", error)
      toast.error("Failed to fetch operators")
      setOperators([])
    } finally {
      setLoading(false)
    }
  }

  // Filter operators based on search term
  const filterOperators = () => {
    const filtered = operators.filter((operator) => {
      if (!operator || !operator.operator) return false
      return (
        operator.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.mnc.toString().includes(searchTerm.toLowerCase()) ||
        operator.mcc.toString().includes(searchTerm.toLowerCase())
      )
    })
    setFilteredOperators(filtered)
    setTotalOperators(filtered.length)
    setTotalPages(pageSize === "All" ? 1 : Math.ceil(filtered.length / pageSize))

    // Reset to first page if current page is beyond available pages
    if (
      pageSize !== "All" &&
      page > Math.ceil(filtered.length / pageSize) &&
      Math.ceil(filtered.length / pageSize) > 0
    ) {
      setPage(1)
    }
  }

  // Get the current page of operators
  const getCurrentPageData = () => {
    if (pageSize === "All") {
      return filteredOperators
    }
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredOperators.slice(startIndex, endIndex)
  }

  const downloadCSV = async () => {
    if (!selectedCountry) {
      toast.error("Please select a country first")
      return
    }

    setLoading(true)
    try {
      // Get the currently filtered and paginated data from frontend (like ManageCountry does)
      const currentPageData = getCurrentPageData()

      // Convert to CSV format
      const headers = ["country", "operator", "mcc", "mnc"]
      const csvData = currentPageData.map((op) => ({
        country: op.country,
        operator: op.operator,
        mcc: op.mcc,
        mnc: op.mnc,
      }))

      // Convert to CSV string
      const csvHeaders = headers.join(",")
      const csvRows = csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header] || ""
            return typeof value === "string" && (value.includes(",") || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value
          })
          .join(","),
      )
      const csvContent = [csvHeaders, ...csvRows].join("\n")

      // Download the CSV
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `operators_page${page}_${selectedCountry === "All" ? "all" : selectedCountry}_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("CSV downloaded successfully!")
    } catch (error) {
      console.error("Error downloading CSV:", error)
      toast.error("Failed to download CSV")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setOperatorDetails({ ...operatorDetails, [name]: value })
  }

  const handleOpenModal = () => {
    if (!selectedCountry || selectedCountry === "All") {
      toast.error("Please select a specific country first")
      return
    }
    setOperatorDetails({
      Country: selectedCountry,
      "Operetor name": "",
      MNC: "",
      MCC: countryDetails?.mcc || "",
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const validateOperatorDetails = () => {
    const { Country, "Operetor name": operatorName, MNC } = operatorDetails
    if (!Country) {
      toast.error("Country is required")
      return false
    }
    if (!operatorName) {
      toast.error("Operator name is required")
      return false
    }
    if (!operatorDetails.MCC) {
      toast.error("MCC is required")
      return false
    }
    if (!MNC) {
      toast.error("MNC is required")
      return false
    }
    return true
  }

  const handleAddOperator = async () => {
    if (!validateOperatorDetails()) return
    setLoading(true)
    try {
      const response = await axiosInstance.post("/api/routing/operator", operatorDetails, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      toast.success("Operator added successfully!")
      setIsModalOpen(false)
      fetchOperators() // Refresh the list
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to add operator!"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Handle pagination
  const handleFirstPage = () => setPage(1)
  const handlePreviousPage = () => setPage(Math.max(1, page - 1))
  const handleNextPage = () => setPage(Math.min(totalPages, page + 1))
  const handleLastPage = () => setPage(Math.max(1, totalPages))

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize === "All" ? "All" : Number.parseInt(newPageSize))
    setPage(1) // Reset to first page when changing page size
  }

  // Filter countries based on search term
  const filteredCountries = countries.filter((country) =>
    country.country.toLowerCase().includes(countrySearchTerm.toLowerCase()),
  )

  // Get the current page data
  const displayedOperators = getCurrentPageData()
  const startItem = totalOperators > 0 && pageSize !== "All" ? (page - 1) * pageSize + 1 : 1
  const endItem = pageSize === "All" ? totalOperators : Math.min(page * pageSize, totalOperators)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Operators</h1>
        <div className="flex gap-2">
          <Button
            onClick={downloadCSV}
            variant="outline"
            className="border-gray-200 text-gray-700 bg-transparent"
            disabled={!selectedCountry}
          >
            <Download className="h-4 w-4 mr-2" /> Export Current Page
          </Button>
          <Button onClick={handleOpenModal} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Operator
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-64">
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="border-gray-200">
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <div className="sticky top-0 z-10 bg-white p-2 border-b border-gray-200">
                <Input
                  placeholder="Search countries..."
                  value={countrySearchTerm}
                  onChange={(e) => setCountrySearchTerm(e.target.value)}
                  className="mb-2"
                />
              </div>
              <SelectItem value="All">All Countries</SelectItem>
              {filteredCountries.map((country, index) => (
                <SelectItem key={index} value={country.country}>
                  {country.country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {countryDetails && selectedCountry !== "All" && (
          <div className="text-sm text-gray-500">
            CC: <span className="font-medium">{countryDetails.cc}</span>
          </div>
        )}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">Operator List</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-600">Rows per page:</Label>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="All">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search operators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && <LinearProgress indeterminate className="mb-0" />}
          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Country</TableHead>
                  <TableHead className="font-semibold text-gray-700">Operator</TableHead>
                  <TableHead className="font-semibold text-gray-700">MCC</TableHead>
                  <TableHead className="font-semibold text-gray-700">MNC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!selectedCountry ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      Please select a country to view operators
                    </TableCell>
                  </TableRow>
                ) : displayedOperators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      {loading ? "Loading..." : "No operators found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedOperators.map((op, index) => (
                    <TableRow key={index} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">{op.country}</TableCell>
                      <TableCell>{op.operator}</TableCell>
                      <TableCell>{op.mcc}</TableCell>
                      <TableCell>{op.mnc}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {pageSize !== "All" && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-500">
                {totalOperators > 0 ? (
                  <>
                    Showing <span className="font-medium">{startItem}</span> to{" "}
                    <span className="font-medium">{endItem}</span> of{" "}
                    <span className="font-medium">{totalOperators}</span> operators
                  </>
                ) : (
                  "No operators found"
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFirstPage}
                  disabled={page === 1}
                  className="h-8 w-8 border-gray-200 bg-transparent"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousPage}
                  disabled={page === 1}
                  className="h-8 w-8 border-gray-200 bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 px-2">
                  Page {page} of {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextPage}
                  disabled={page >= totalPages || totalPages === 0}
                  className="h-8 w-8 border-gray-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleLastPage}
                  disabled={page >= totalPages || totalPages === 0}
                  className="h-8 w-8 border-gray-200"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {pageSize === "All" && (
            <div className="flex items-center justify-center p-4 border-t">
              <div className="text-sm text-gray-500">
                Showing all <span className="font-medium">{totalOperators}</span> operators
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Operator Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Add New Operator</DialogTitle>
            <DialogDescription className="text-gray-500">Add a new operator for {selectedCountry}.</DialogDescription>
          </DialogHeader>
          {loading && <LinearProgress indeterminate className="mb-4" />}
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="Operetor name" className="text-gray-700">
                Operator Name
              </Label>
              <Input
                id="Operetor name"
                name="Operetor name"
                placeholder="Enter operator name"
                value={operatorDetails["Operetor name"]}
                onChange={handleInputChange}
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="MNC" className="text-gray-700">
                Mobile Network Code (MNC)
              </Label>
              <Input
                id="MNC"
                name="MNC"
                placeholder="Enter MNC (e.g., 01 or *)"
                value={operatorDetails.MNC}
                onChange={handleInputChange}
                className="border-gray-200"
              />
              <p className="text-xs text-gray-500">
                Use "*" for wildcard MNC that applies to all networks in this country
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="MCC" className="text-gray-700">
                Mobile Country Code (MCC)
              </Label>
              <Input
                id="MCC"
                name="MCC"
                placeholder="Enter MCC"
                value={operatorDetails.MCC}
                onChange={handleInputChange}
                className="border-gray-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="border-gray-200 text-gray-700 bg-transparent"
            >
              Cancel
            </Button>
            <Button onClick={handleAddOperator} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Operator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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

export default function ManagePrefix() {
  const [prefixes, setPrefixes] = useState([])
  const [filteredPrefixes, setFilteredPrefixes] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalPrefixes, setTotalPrefixes] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [countries, setCountries] = useState([])
  const [selectedCountry, setSelectedCountry] = useState("")
  const [operators, setOperators] = useState([])
  const [selectedOperator, setSelectedOperator] = useState("")
  const [selectedMNC, setSelectedMNC] = useState("")
  const [countryDetails, setCountryDetails] = useState(null)
  const [countrySearchTerm, setCountrySearchTerm] = useState("")
  const [operatorSearchTerm, setOperatorSearchTerm] = useState("")
  const [prefixDetails, setPrefixDetails] = useState({
    Country: "",
    "Operetor name": "",
    MNC: "",
    Prefix: "",
  })

  const axiosInstance = useAxios()
  const { user } = useUser()

  useEffect(() => {
    fetchCountries()
  }, [])

  useEffect(() => {
    if (selectedCountry) {
      fetchOperators()
      setSelectedOperator("")
      setSelectedMNC("")
      setPrefixes([])
    }
  }, [selectedCountry])

  useEffect(() => {
    if (selectedCountry && (selectedOperator || selectedOperator === "All")) {
      fetchPrefixes()
    }
  }, [selectedCountry, selectedOperator, selectedMNC])

  // Filter prefixes whenever search term changes
  useEffect(() => {
    if (prefixes.length > 0) {
      filterPrefixes()
    }
  }, [searchTerm, prefixes, page, pageSize])

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
    if (!selectedCountry || selectedCountry === "All") return
    setLoading(true)
    try {
      const response = await axiosInstance.post(
        "/api/routing/details",
        {
          country: selectedCountry,
          page: 1,
          limit: 1000, // Get all operators for the dropdown
        },
        { headers: { Authorization: `Bearer ${user?.token}` } },
      )
      if (response.data.results) {
        // Group by operator to get unique operators
        const uniqueOperators = response.data.results.reduce((acc, item) => {
          const key = `${item.operator}-${item.mnc}`
          if (!acc[key]) {
            acc[key] = {
              operator: item.operator,
              mnc: item.mnc,
              mcc: item.mcc,
              country: item.country,
              cc: item.cc,
            }
          }
          return acc
        }, {})
        setOperators(Object.values(uniqueOperators))
        // Set country details from first result
        if (response.data.results.length > 0) {
          const firstResult = response.data.results[0]
          setCountryDetails({
            cc: firstResult.cc,
            mcc: firstResult.mcc,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching operators:", error)
      toast.error("Failed to fetch operators")
    } finally {
      setLoading(false)
    }
  }

  const fetchPrefixes = async () => {
    if (!selectedCountry) return
    setLoading(true)
    try {
      let endpoint, payload

      if (selectedCountry === "All") {
        endpoint = "/api/routing/all-prefixes"
        payload = {
          search: "",
          page: 1,
          limit: 999999,
        }
      } else if (selectedOperator === "All") {
        endpoint = "/api/routing/details"
        payload = {
          country: selectedCountry,
          search: "",
          page: 1,
          limit: 999999,
        }
      } else {
        endpoint = "/api/routing/details"
        payload = {
          country: selectedCountry,
          search: "",
          page: 1,
          limit: 999999,
        }
      }

      const response = await axiosInstance.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })

      if (response.data.results) {
        let allPrefixes = response.data.results

        // Filter results for the selected operator and MNC if not "All"
        if (selectedCountry !== "All" && selectedOperator !== "All" && selectedOperator && selectedMNC) {
          allPrefixes = response.data.results.filter(
            (item) => item.operator === selectedOperator && item.mnc.toString() === selectedMNC.toString(),
          )
        }

        // Store all prefixes in state
        const validPrefixes = allPrefixes.filter((prefix) => prefix && prefix.prefix)
        setPrefixes(validPrefixes)
        setTotalPrefixes(validPrefixes.length)
      }
    } catch (error) {
      console.error("Error fetching prefixes:", error)
      toast.error("Failed to fetch prefixes")
      setPrefixes([])
    } finally {
      setLoading(false)
    }
  }

  // Filter prefixes based on search term
  const filterPrefixes = () => {
    const filtered = prefixes.filter((prefix) => {
      if (!prefix) return false
      return (
        prefix.operator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prefix.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prefix.prefix?.toString().includes(searchTerm.toLowerCase()) ||
        prefix.mnc?.toString().includes(searchTerm.toLowerCase()) ||
        prefix.mcc?.toString().includes(searchTerm.toLowerCase())
      )
    })
    setFilteredPrefixes(filtered)
    setTotalPrefixes(filtered.length)
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

  // Get the current page of prefixes
  const getCurrentPageData = () => {
    if (pageSize === "All") {
      return filteredPrefixes
    }
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredPrefixes.slice(startIndex, endIndex)
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
      const headers = ["country", "operator", "cc", "mcc", "mnc", "prefix"]
      const csvData = currentPageData.map((prefix) => ({
        country: prefix.country,
        operator: prefix.operator,
        cc: prefix.cc,
        mcc: prefix.mcc,
        mnc: prefix.mnc,
        prefix: prefix.prefix,
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
      link.download = `prefixes_page${page}_${selectedCountry === "All" ? "all" : selectedCountry}_${new Date().toISOString().split("T")[0]}.csv`
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
    setPrefixDetails({ ...prefixDetails, [name]: value })
  }

  const handleOpenModal = () => {
    if (
      !selectedCountry ||
      selectedCountry === "All" ||
      !selectedOperator ||
      selectedOperator === "All" ||
      !selectedMNC
    ) {
      toast.error("Please select a specific country, operator, and MNC first")
      return
    }
    setPrefixDetails({
      Country: selectedCountry,
      "Operetor name": selectedOperator,
      MNC: selectedMNC,
      Prefix: "",
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const validatePrefixDetails = () => {
    const { Country, "Operetor name": operatorName, MNC, Prefix } = prefixDetails
    if (!Country) {
      toast.error("Country is required")
      return false
    }
    if (!operatorName) {
      toast.error("Operator name is required")
      return false
    }
    if (!MNC) {
      toast.error("MNC is required")
      return false
    }
    if (!Prefix) {
      toast.error("Prefix is required")
      return false
    }
    return true
  }

  const handleAddPrefix = async () => {
    if (!validatePrefixDetails()) return
    setLoading(true)
    try {
      const response = await axiosInstance.post("/api/routing/prefix", prefixDetails, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      toast.success("Prefix added successfully!")
      setIsModalOpen(false)
      fetchPrefixes() // Refresh the list
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to add prefix!"
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

  // Filter operators based on search term
  const filteredOperators = operators.filter((operator) =>
    operator.operator.toLowerCase().includes(operatorSearchTerm.toLowerCase()),
  )

  // Get the current page data
  const displayedPrefixes = getCurrentPageData()
  const startItem = totalPrefixes > 0 && pageSize !== "All" ? (page - 1) * pageSize + 1 : 1
  const endItem = pageSize === "All" ? totalPrefixes : Math.min(page * pageSize, totalPrefixes)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Prefixes</h1>
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
            <Plus className="h-4 w-4 mr-2" /> Add Prefix
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
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
        {operators.length > 0 && selectedCountry !== "All" && (
          <div className="w-64">
            <Select
              value={selectedOperator}
              onValueChange={(value) => {
                setSelectedOperator(value)
                if (value !== "All") {
                  // Find the corresponding MNC
                  const op = operators.find((o) => o.operator === value)
                  if (op) {
                    setSelectedMNC(op.mnc.toString())
                  }
                } else {
                  setSelectedMNC("")
                }
              }}
            >
              <SelectTrigger className="border-gray-200">
                <SelectValue placeholder="Select an operator" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <div className="sticky top-0 z-10 bg-white p-2 border-b border-gray-200">
                  <Input
                    placeholder="Search operators..."
                    value={operatorSearchTerm}
                    onChange={(e) => setOperatorSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                </div>
                <SelectItem value="All">All Operators</SelectItem>
                {filteredOperators.map((operator, index) => (
                  <SelectItem key={index} value={operator.operator}>
                    {operator.operator} (MNC: {operator.mnc})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">Prefix List</CardTitle>
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
                placeholder="Search prefixes..."
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
                  <TableHead className="font-semibold text-gray-700">CC</TableHead>
                  <TableHead className="font-semibold text-gray-700">MCC</TableHead>
                  <TableHead className="font-semibold text-gray-700">MNC</TableHead>
                  <TableHead className="font-semibold text-gray-700">Prefix</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!selectedCountry ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Please select a country to view prefixes
                    </TableCell>
                  </TableRow>
                ) : displayedPrefixes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {loading ? "Loading..." : "No prefixes found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedPrefixes.map((prefix, index) => (
                    <TableRow key={index} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">{prefix.country}</TableCell>
                      <TableCell>{prefix.operator}</TableCell>
                      <TableCell>{prefix.cc}</TableCell>
                      <TableCell>{prefix.mcc}</TableCell>
                      <TableCell>{prefix.mnc}</TableCell>
                      <TableCell className="font-mono">{prefix.prefix}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {pageSize !== "All" && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-500">
                {totalPrefixes > 0 ? (
                  <>
                    Showing <span className="font-medium">{startItem}</span> to{" "}
                    <span className="font-medium">{endItem}</span> of{" "}
                    <span className="font-medium">{totalPrefixes}</span> prefixes
                  </>
                ) : (
                  "No prefixes found"
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
                Showing all <span className="font-medium">{totalPrefixes}</span> prefixes
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Prefix Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Add New Prefix</DialogTitle>
            <DialogDescription className="text-gray-500">
              Add a new prefix for {selectedOperator} in {selectedCountry}.
            </DialogDescription>
          </DialogHeader>
          {loading && <LinearProgress indeterminate className="mb-4" />}
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="Prefix" className="text-gray-700">
                Prefix
              </Label>
              <Input
                id="Prefix"
                name="Prefix"
                placeholder="Enter prefix (e.g., 12345)"
                value={prefixDetails.Prefix}
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
            <Button onClick={handleAddPrefix} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Prefix
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

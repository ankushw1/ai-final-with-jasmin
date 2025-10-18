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

export default function ManageCountry() {
  const [countries, setCountries] = useState([])
  const [filteredCountries, setFilteredCountries] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCountries, setTotalCountries] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [countryDetails, setCountryDetails] = useState({
    Country: "",
    CC: "",
    MCC: "",
  })

  const axiosInstance = useAxios()
  const { user } = useUser()

  useEffect(() => {
    fetchCountries()
  }, [])

  // Filter countries whenever search term changes
  useEffect(() => {
    if (countries.length > 0) {
      filterCountries()
    }
  }, [searchTerm, countries, page, pageSize])

  const fetchCountries = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/routing/countries", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (response.data && Array.isArray(response.data.countries)) {
        // Store all countries in state
        const validCountries = response.data.countries.filter((country) => country && country.country)
        setCountries(validCountries)
        setTotalCountries(validCountries.length)
      } else {
        console.error("Invalid response format:", response.data)
        toast.error("Invalid response format from server")
      }
    } catch (error) {
      console.error("Error fetching countries:", error)
      toast.error("Failed to fetch countries")
    } finally {
      setLoading(false)
    }
  }

  // Filter countries based on search term
  const filterCountries = () => {
    const filtered = countries.filter((country) => {
      if (!country || !country.country) return false
      return country.country.toLowerCase().includes(searchTerm.toLowerCase())
    })
    setFilteredCountries(filtered)
    setTotalCountries(filtered.length)
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

  // Get the current page of countries
  const getCurrentPageData = () => {
    if (pageSize === "All") {
      return filteredCountries
    }
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredCountries.slice(startIndex, endIndex)
  }

  const downloadCSV = async () => {
    setLoading(true)
    try {
      // Download only currently displayed data
      const limit = pageSize === "All" ? 999999 : pageSize
      const response = await axiosInstance.post(
        "/api/routing/export-current-countries",
        { search: searchTerm, page: page, limit: limit },
        {
          headers: { Authorization: `Bearer ${user?.token}` },
          responseType: "blob",
        },
      )

      const blob = new Blob([response.data], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `countries_page${page}_${new Date().toISOString().split("T")[0]}.csv`
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
    setCountryDetails({ ...countryDetails, [name]: value })
  }

  const handleOpenModal = () => {
    setCountryDetails({
      Country: "",
      CC: "",
      MCC: "",
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const validateCountryDetails = () => {
    const { Country, CC, MCC } = countryDetails
    if (!Country) {
      toast.error("Country name is required")
      return false
    }
    if (!CC) {
      toast.error("Country Code (CC) is required")
      return false
    }
    if (!MCC) {
      toast.error("Mobile Country Code (MCC) is required")
      return false
    }
    return true
  }

  const handleAddCountry = async () => {
    if (!validateCountryDetails()) return
    setLoading(true)
    try {
      const response = await axiosInstance.post("/api/routing/country", countryDetails, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      toast.success("Country added successfully!")
      setIsModalOpen(false)
      fetchCountries() // Refresh the country list
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to add country!"
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

  // Get the current page data
  const displayedCountries = getCurrentPageData()
  const startItem = totalCountries > 0 && pageSize !== "All" ? (page - 1) * pageSize + 1 : 1
  const endItem = pageSize === "All" ? totalCountries : Math.min(page * pageSize, totalCountries)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Countries</h1>
        <div className="flex gap-2">
          <Button onClick={downloadCSV} variant="outline" className="border-gray-200 text-gray-700 bg-transparent">
            <Download className="h-4 w-4 mr-2" /> Export Current Page
          </Button>
          <Button onClick={handleOpenModal} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Country
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">Country List</CardTitle>
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
                placeholder="Search countries..."
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
                  <TableHead className="font-semibold text-gray-700">Country Code (CC)</TableHead>
                  <TableHead className="font-semibold text-gray-700">Mobile Country Code (MCC)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedCountries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                      {loading ? "Loading..." : "No countries found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedCountries.map((country, index) => (
                    <TableRow key={index} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">{country.country}</TableCell>
                      <TableCell>{country.cc}</TableCell>
                      <TableCell>{country.mcc || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {pageSize !== "All" && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-500">
                {totalCountries > 0 ? (
                  <>
                    Showing <span className="font-medium">{startItem}</span> to{" "}
                    <span className="font-medium">{endItem}</span> of{" "}
                    <span className="font-medium">{totalCountries}</span> countries
                  </>
                ) : (
                  "No countries found"
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
                Showing all <span className="font-medium">{totalCountries}</span> countries
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Country Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Add New Country</DialogTitle>
            <DialogDescription className="text-gray-500">Add a new country to the system.</DialogDescription>
          </DialogHeader>
          {loading && <LinearProgress indeterminate className="mb-4" />}
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="Country" className="text-gray-700">
                Country Name
              </Label>
              <Input
                id="Country"
                name="Country"
                placeholder="Enter country name"
                value={countryDetails.Country}
                onChange={handleInputChange}
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="CC" className="text-gray-700">
                Country Code (CC)
              </Label>
              <Input
                id="CC"
                name="CC"
                placeholder="Enter country code"
                value={countryDetails.CC}
                onChange={handleInputChange}
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="MCC" className="text-gray-700">
                Mobile Country Code (MCC)
              </Label>
              <Input
                id="MCC"
                name="MCC"
                placeholder="Enter mobile country code"
                value={countryDetails.MCC}
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
            <Button onClick={handleAddCountry} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Country
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

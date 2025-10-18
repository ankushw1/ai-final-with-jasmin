"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { useUser } from "@/context/user-context"
import useAxios from "@/hooks/use-axios"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Upload,
  Download,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function ManageRates() {
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalRates, setTotalRates] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedSmpp, setSelectedSmpp] = useState("")
  const [smpps, setSmpps] = useState([])
  const [countries, setCountries] = useState([])
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedViewSmpp, setSelectedViewSmpp] = useState("")
  const [uploadType, setUploadType] = useState("rates") // "rates" or "prefix"
  const [activeTab, setActiveTab] = useState("view-rates")
  const [countrySearchTerm, setCountrySearchTerm] = useState("")
  const [smppSearchTerm, setSmppSearchTerm] = useState("")
  const [uploadSmppSearchTerm, setUploadSmppSearchTerm] = useState("")
  const [uploadProgress, setUploadProgress] = useState(null)

  // New states for SMPP rates tab
  const [smppRates, setSmppRates] = useState([])
  const [selectedSmppForRates, setSelectedSmppForRates] = useState("")
  const [smppRatesLoading, setSmppRatesLoading] = useState(false)
  const [smppRatesPage, setSmppRatesPage] = useState(0)
  const [smppRatesPageSize, setSmppRatesPageSize] = useState(10)
  const [smppRatesTotalRates, setSmppRatesTotalRates] = useState(0)
  const [smppRatesTotalPages, setSmppRatesTotalPages] = useState(0)
  const [smppRatesSearchTerm, setSmppRatesSearchTerm] = useState("")
  const [smppRatesSearchSmpp, setSmppRatesSearchSmpp] = useState("")

  const fileInputRef = useRef(null)
  const axiosInstance = useAxios()
  const { user } = useUser()

  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([fetchSmpps(), fetchCountries()])
    }
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedCountry && selectedViewSmpp) {
      fetchRatesByCountry(selectedCountry, page, pageSize, searchTerm)
    }
  }, [selectedCountry, selectedViewSmpp, page, pageSize, searchTerm])

  useEffect(() => {
    if (selectedSmppForRates) {
      fetchRatesBySmpp(selectedSmppForRates, smppRatesPage, smppRatesPageSize, smppRatesSearchTerm)
    }
  }, [selectedSmppForRates, smppRatesPage, smppRatesPageSize, smppRatesSearchTerm])

  const fetchSmpps = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/routing/smpps", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      setSmpps(response.data.smpps || [])
    } catch (error) {
      console.error("Error fetching SMPPs:", error)
      toast.error("Failed to fetch SMPP connectors")
    } finally {
      setLoading(false)
    }
  }

  const fetchCountries = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/routing/countries", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (Array.isArray(response.data.countries)) {
        const countryNames = response.data.countries.map((item) => item.country)
        setCountries(countryNames || [])
      } else {
        setCountries(response.data.countries || [])
      }
    } catch (error) {
      console.error("Error fetching countries:", error)
      toast.error("Failed to fetch countries")
    } finally {
      setLoading(false)
    }
  }

  const fetchRatesByCountry = async (country, page, pageSize, search = "") => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/routing/rates-by-country", {
        params: { country, page, pageSize, search, smppId: selectedViewSmpp },
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      setRates(response.data.rates || [])
      setTotalRates(response.data.total || 0)
      setTotalPages(response.data.totalPages || 0)
    } catch (error) {
      console.error("Error fetching rates:", error)
      toast.error("Failed to fetch rates")
    } finally {
      setLoading(false)
    }
  }

  const fetchRatesBySmpp = async (smppId, page, pageSize, search = "") => {
    setSmppRatesLoading(true)
    try {
      const response = await axiosInstance.get("/api/routing/rates-by-smpp", {
        params: { smppId, page, pageSize, search },
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      setSmppRates(response.data.rates || [])
      setSmppRatesTotalRates(response.data.total || 0)
      setSmppRatesTotalPages(response.data.totalPages || 0)
    } catch (error) {
      console.error("Error fetching SMPP rates:", error)
      toast.error("Failed to fetch SMPP rates")
    } finally {
      setSmppRatesLoading(false)
    }
  }

  const handleUploadFile = async (event) => {
    event.preventDefault()
    if (!fileInputRef.current?.files?.length) {
      toast.error("Please select a file to upload")
      return
    }
    if (uploadType === "rates" && !selectedSmpp) {
      toast.error("Please select an SMPP connector")
      return
    }

    const formData = new FormData()
    formData.append("file", fileInputRef.current.files[0])
    if (uploadType === "rates") {
      formData.append("smppId", selectedSmpp)
    }

    setLoading(true)
    setUploadProgress({ status: "uploading", message: "Uploading file..." })

    try {
      const endpoint = uploadType === "rates" ? "/api/routing/import-rates" : "/api/routing/import-prefix"
      const response = await axiosInstance.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      setUploadProgress({
        status: "success",
        message: response.data.message || "File uploaded successfully",
        details: response.data.details,
      })
      toast.success(response.data.message || "File uploaded successfully")

      // Refresh data if needed
      if (selectedCountry && selectedViewSmpp) {
        await fetchRatesByCountry(selectedCountry, page, pageSize, searchTerm)
      }
      if (selectedSmppForRates) {
        await fetchRatesBySmpp(selectedSmppForRates, smppRatesPage, smppRatesPageSize, smppRatesSearchTerm)
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        setIsUploadModalOpen(false)
        setUploadProgress(null)
      }, 2000)
    } catch (error) {
      console.error("Error uploading file:", error)
      const errorMessage = error.response?.data?.message || "Failed to upload file"
      setUploadProgress({ status: "error", message: errorMessage })
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadSample = async () => {
    try {
      const response = await axiosInstance.get("/api/routing/sample-rates-csv", {
        headers: { Authorization: `Bearer ${user?.token}` },
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "sample_rates_template.csv")
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success("Sample CSV template downloaded successfully")
    } catch (error) {
      console.error("Error downloading sample CSV:", error)
      toast.error("Failed to download sample CSV")
    }
  }

  const handleOpenUploadModal = (type) => {
    setUploadType(type)
    setIsUploadModalOpen(true)
    setUploadProgress(null)
  }

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false)
    setSelectedSmpp("")
    setUploadProgress(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCountryChange = (country) => {
    setSelectedCountry(country)
    setPage(0)
  }

  const handlePageSizeChange = (newPageSize) => {
    if (newPageSize === "all") {
      setPageSize(999999)
    } else {
      setPageSize(Number.parseInt(newPageSize))
    }
    setPage(0)
  }

  const handleSmppRatesPageSizeChange = (newPageSize) => {
    if (newPageSize === "all") {
      setSmppRatesPageSize(999999)
    } else {
      setSmppRatesPageSize(Number.parseInt(newPageSize))
    }
    setSmppRatesPage(0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "—"
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return "—"
    }
  }

  // Filter functions
  const filteredCountries = countries.filter((country) =>
    country.toLowerCase().includes(countrySearchTerm.toLowerCase()),
  )

  const filteredSmpps = smpps.filter((smpp) =>
    (smpp.name || smpp.host).toLowerCase().includes(smppSearchTerm.toLowerCase()),
  )

  const filteredUploadSmpps = smpps.filter((smpp) =>
    (smpp.name || smpp.host).toLowerCase().includes(uploadSmppSearchTerm.toLowerCase()),
  )

  const filteredSmppRatesSmpps = smpps.filter((smpp) =>
    (smpp.name || smpp.host).toLowerCase().includes(smppRatesSearchSmpp.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Rates</h1>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenUploadModal("rates")} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Upload className="h-4 w-4 mr-2" /> Upload Rates
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view-rates">Rates by Country</TabsTrigger>
          <TabsTrigger value="rates-by-smpp">Rates by SMPP</TabsTrigger>
        </TabsList>

        <TabsContent value="view-rates" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800">
                Operator Rates List
                {totalRates > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {totalRates} unique operators
                  </Badge>
                )}
              </CardTitle>
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
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-48">
                  <Select value={selectedCountry} onValueChange={handleCountryChange}>
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
                      {filteredCountries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-48">
                  <Select value={selectedViewSmpp} onValueChange={setSelectedViewSmpp}>
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder="Select SMPP" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <div className="sticky top-0 z-10 bg-white p-2 border-b border-gray-200">
                        <Input
                          placeholder="Search SMPP..."
                          value={smppSearchTerm}
                          onChange={(e) => setSmppSearchTerm(e.target.value)}
                          className="mb-2"
                        />
                      </div>
                      {filteredSmpps.map((smpp) => (
                        <SelectItem key={smpp._id} value={smpp._id}>
                          {smpp.name || smpp.host}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative w-48">
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
                      <TableHead className="font-semibold text-gray-700">Operator</TableHead>
                      <TableHead className="font-semibold text-gray-700">MCC</TableHead>
                      <TableHead className="font-semibold text-gray-700">MNC</TableHead>
                      <TableHead className="font-semibold text-gray-700">Rate</TableHead>
                      <TableHead className="font-semibold text-gray-700">Label</TableHead>
                      <TableHead className="font-semibold text-gray-700">Updated At</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!selectedCountry || !selectedViewSmpp ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Please select a country and SMPP connector to view rates
                        </TableCell>
                      </TableRow>
                    ) : rates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          {loading ? "Loading..." : "No operators found for this country"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      rates.map((rate, index) => (
                        <TableRow key={`${rate.operator}-${rate.mnc}-${index}`} className="border-b hover:bg-gray-50">
                          <TableCell className="font-medium">{rate.operator}</TableCell>
                          <TableCell>{rate.mcc}</TableCell>
                          <TableCell>
                            <Badge variant={rate.mnc === "*" ? "secondary" : "outline"}>{rate.mnc}</Badge>
                          </TableCell>
                          <TableCell>
                            {rate.rate !== null ? (
                              <span className="font-mono text-green-600">{rate.rate.toFixed(4)}</span>
                            ) : (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </TableCell>
                          <TableCell>{rate.label || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-3 w-3" />
                              {formatDate(rate.updatedAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {rate.hasRate ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">Rate Set</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-orange-500">
                                <XCircle className="h-4 w-4" />
                                <span className="text-sm">No Rate</span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {selectedCountry && selectedViewSmpp && totalRates > 0 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{rates.length}</span> of{" "}
                    <span className="font-medium">{totalRates}</span> unique operators
                    <span className="text-xs text-gray-400 ml-2">
                      (Page {page + 1} of {totalPages})
                    </span>
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
                      disabled={page >= totalPages - 1}
                      className="h-8 w-8 border-gray-200"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(totalPages - 1)}
                      disabled={page >= totalPages - 1}
                      className="h-8 w-8 border-gray-200"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates-by-smpp" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800">
                Rates by SMPP Connector
                {smppRatesTotalRates > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {smppRatesTotalRates} rates assigned
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-600">Rows per page:</Label>
                  <Select value={smppRatesPageSize.toString()} onValueChange={handleSmppRatesPageSizeChange}>
                    <SelectTrigger className="w-20 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-48">
                  <Select value={selectedSmppForRates} onValueChange={setSelectedSmppForRates}>
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder="Select SMPP" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <div className="sticky top-0 z-10 bg-white p-2 border-b border-gray-200">
                        <Input
                          placeholder="Search SMPP..."
                          value={smppRatesSearchSmpp}
                          onChange={(e) => setSmppRatesSearchSmpp(e.target.value)}
                          className="mb-2"
                        />
                      </div>
                      {filteredSmppRatesSmpps.map((smpp) => (
                        <SelectItem key={smpp._id} value={smpp._id}>
                          {smpp.name || smpp.host}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative w-48">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={smppRatesSearchTerm}
                    onChange={(e) => setSmppRatesSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {smppRatesLoading && <LinearProgress indeterminate className="mb-0" />}

              {!selectedSmppForRates ? (
                <div className="text-center py-8 text-gray-500">
                  Please select an SMPP connector to view assigned rates
                </div>
              ) : smppRates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {smppRatesLoading ? "Loading..." : "No rates assigned to this SMPP connector"}
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {Object.entries(
                    smppRates.reduce((acc, rate) => {
                      const country = rate.country || "Unknown"
                      if (!acc[country]) {
                        acc[country] = []
                      }
                      acc[country].push(rate)
                      return acc
                    }, {}),
                  ).map(([country, countryRates]) => (
                    <Card key={country} className="border border-gray-200">
                      <CardHeader className="bg-gray-50 py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-600" />
                            {country}
                          </CardTitle>
                          <Badge variant="outline" className="text-sm">
                            {countryRates.length} operators
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-25">
                              <TableHead className="font-semibold text-gray-700">Operator</TableHead>
                              <TableHead className="font-semibold text-gray-700">MCC</TableHead>
                              <TableHead className="font-semibold text-gray-700">MNC</TableHead>
                              <TableHead className="font-semibold text-gray-700">Rate</TableHead>
                              <TableHead className="font-semibold text-gray-700">Label</TableHead>
                              <TableHead className="font-semibold text-gray-700">Updated At</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {countryRates.map((rate, index) => (
                              <TableRow
                                key={`${rate.operator}-${rate.mnc}-${index}`}
                                className="border-b hover:bg-gray-50"
                              >
                                <TableCell className="font-medium">{rate.operator}</TableCell>
                                <TableCell>{rate.mcc}</TableCell>
                                <TableCell>
                                  <Badge variant={rate.mnc === "*" ? "secondary" : "outline"}>{rate.mnc}</Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="font-mono text-green-600">{rate.rate.toFixed(4)}</span>
                                </TableCell>
                                <TableCell>{rate.label || "—"}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(rate.updatedAt)}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {selectedSmppForRates && smppRatesTotalRates > 0 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{smppRates.length}</span> of{" "}
                    <span className="font-medium">{smppRatesTotalRates}</span> assigned rates
                    <span className="text-xs text-gray-400 ml-2">
                      (Page {smppRatesPage + 1} of {smppRatesTotalPages})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSmppRatesPage(0)}
                      disabled={smppRatesPage === 0}
                      className="h-8 w-8 border-gray-200"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSmppRatesPage(smppRatesPage - 1)}
                      disabled={smppRatesPage === 0}
                      className="h-8 w-8 border-gray-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSmppRatesPage(smppRatesPage + 1)}
                      disabled={smppRatesPage >= smppRatesTotalPages - 1}
                      className="h-8 w-8 border-gray-200"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSmppRatesPage(smppRatesTotalPages - 1)}
                      disabled={smppRatesPage >= smppRatesTotalPages - 1}
                      className="h-8 w-8 border-gray-200"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={handleCloseUploadModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              {uploadType === "rates" ? "Upload Rates" : "Upload Prefix"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {uploadType === "rates"
                ? "Upload a CSV or Excel file with rates information. Select the SMPP connector first."
                : "Upload a CSV or Excel file with prefix information."}
            </DialogDescription>
          </DialogHeader>

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="py-4">
              {uploadProgress.status === "uploading" && (
                <div className="space-y-2">
                  <LinearProgress indeterminate />
                  <p className="text-sm text-gray-600">{uploadProgress.message}</p>
                </div>
              )}
              {uploadProgress.status === "success" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Upload Successful!</span>
                  </div>
                  <p className="text-sm text-gray-600">{uploadProgress.message}</p>
                  {uploadProgress.details && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <div>New rates: {uploadProgress.details.newRates}</div>
                      <div>Updated rates: {uploadProgress.details.updatedRates}</div>
                      <div>Total processed: {uploadProgress.details.totalProcessed}</div>
                    </div>
                  )}
                </div>
              )}
              {uploadProgress.status === "error" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Upload Failed</span>
                  </div>
                  <p className="text-sm text-gray-600">{uploadProgress.message}</p>
                </div>
              )}
            </div>
          )}

          {!uploadProgress && (
            <form onSubmit={handleUploadFile}>
              <div className="grid gap-4 py-4">
                {uploadType === "rates" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-700">Sample Template</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadSample}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Sample CSV
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Download a sample CSV template to see the required format</p>
                  </div>
                )}

                {uploadType === "rates" && (
                  <div className="space-y-2">
                    <Label htmlFor="smpp" className="text-gray-700">
                      SMPP Connector
                    </Label>
                    <Select value={selectedSmpp} onValueChange={setSelectedSmpp} required>
                      <SelectTrigger id="smpp" className="border-gray-200">
                        <SelectValue placeholder="Select SMPP connector" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <div className="p-2">
                          <Input
                            placeholder="Search SMPP..."
                            value={uploadSmppSearchTerm}
                            onChange={(e) => setUploadSmppSearchTerm(e.target.value)}
                            className="mb-2"
                          />
                        </div>
                        {filteredUploadSmpps.map((smpp) => (
                          <SelectItem key={smpp._id} value={smpp._id}>
                            {smpp.name || smpp.host}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="file" className="text-gray-700">
                    Upload File (CSV or Excel)
                  </Label>
                  <Input
                    id="file"
                    type="file"
                    ref={fileInputRef}
                    accept=".csv, .xlsx, .xls"
                    className="border-gray-200"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {uploadType === "rates"
                      ? "File should contain MCC, MNC, and rates columns. Existing operator rates will be updated."
                      : "File should contain Country, Operator_Name, MCC, MNC, and Prefix columns."}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleCloseUploadModal}
                  className="border-gray-200 text-gray-700 bg-transparent"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Upload className="h-4 w-4 mr-2" /> Upload
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

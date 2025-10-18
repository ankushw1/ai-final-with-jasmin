"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useUser } from "@/context/user-context"
import useAxios from "@/hooks/use-axios"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, Search, Trash, X } from "lucide-react"

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LinearProgress } from "@/components/ui/linear-progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ManageRouteFilter() {
  const [routefilter, setRouteFilter] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalRouteFilter, setTotalRouteFilter] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmMessage, setConfirmMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [prefixPopoverOpen, setPrefixPopoverOpen] = useState(false)

  const [smsfilterDetails, setSmsfilterDetails] = useState({
    fid: "",
    type: "",
    parameter: "",
  })

  const [smpps, setSmpps] = useState([])
  const [selectedConnector, setSelectedConnector] = useState("")
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState("")
  const [countries, setCountries] = useState([])
  const [operators, setOperators] = useState([])
  const [mncs, setMncs] = useState([])
  const [prefixes, setPrefixes] = useState([])
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedOperator, setSelectedOperator] = useState("")
  const [selectedMNC, setSelectedMNC] = useState("")
  const [selectedPrefix, setSelectedPrefix] = useState([])
  const [costPrice, setCostPrice] = useState("")
  const [sellingPrice, setSellingPrice] = useState("")
  const [smsUsers, setSmsUsers] = useState([])
  const [currentCountryCode, setCurrentCountryCode] = useState("")

  const axiosInstance = useAxios()
  const { user } = useUser()

  useEffect(() => {
    fetchSmpp()
    fetchSmsUsers()
    fetchCountries()
  }, [])

  useEffect(() => {
    fetchRouteFilter()
    fetchGroup()
  }, [page, pageSize])

  useEffect(() => {
    if (selectedCountry) {
      fetchCountryCode(selectedCountry)
    }
  }, [selectedCountry])

  const fetchSmpp = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/smpp/all")
      if (response.status === 200) {
        setSmpps(response.data.connectors || [])
      } else {
        toast.error(response.data?.message || "Error fetching SMPP connectors")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error fetching SMPP connectors")
    } finally {
      setLoading(false)
    }
  }

  const fetchSmsUsers = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/users/all")
      if (response.status === 200) {
        const usernames = response.data.users.map((user) => user.username)
        setSmsUsers(usernames)
      }
    } catch (error) {
      toast.error("Failed to fetch SMS users")
    } finally {
      setLoading(false)
    }
  }

  const fetchGroup = async () => {
    try {
      const response = await axiosInstance.get("/api/group/all")
      if (response.status === 200) {
        setGroups(response.data.groups || [])
      }
    } catch (error) {
      console.error("Error fetching groups:", error)
    }
  }

  const fetchCountries = async () => {
    try {
      const response = await axiosInstance.get("/api/countries")
      if (response.status === 200) {
        setCountries(response.data.unique_countries || [])
      }
    } catch (error) {
      toast.error("Failed to fetch countries")
    }
  }

  const fetchCountryCode = async (country) => {
    try {
      const response = await axiosInstance.get(`/api/cc?country=${country}`)
      if (response.status === 200) {
        setCurrentCountryCode(response.data?.country_code || "")
      }
    } catch (error) {
      toast.error("Error fetching country code")
      setCurrentCountryCode("")
    }
  }

  const handleCountryChange = (value) => {
    setSelectedCountry(value)
    setSelectedOperator("")
    setSelectedMNC("")
    // Don't reset selected prefixes when country changes
    fetchOperators(value)
  }

  const fetchOperators = async (country) => {
    try {
      const response = await axiosInstance.get(`/api/operators?country=${country}`)
      if (response.status === 200) {
        setOperators(response.data.operators || [])
      }
    } catch (error) {
      toast.error("Failed to fetch operators")
    }
  }

  const fetchMncs = async (country, operator) => {
    if (!country || !operator) return

    try {
      const response = await axiosInstance.get(`/api/mncs?country=${country}&operator=${operator}`)
      if (response.status === 200) {
        setMncs(response.data.mncs || [])
      }
    } catch (error) {
      toast.error("Failed to fetch MNCs")
    }
  }

  const fetchPrefixes = async (country, operator, mnc) => {
    try {
      const response = await axiosInstance.get(`/api/prefixes?country=${country}&operator=${operator}&mnc=${mnc}`)
      if (response.status === 200) {
        setPrefixes(response.data.prefixes || [])
      }
    } catch (error) {
      toast.error("Failed to fetch prefixes")
    }
  }

  const fetchRouteFilter = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/filter/all")
      if (response.status === 200) {
        setRouteFilter(response.data.data.filters || [])
        setTotalRouteFilter(response.data.data.filters.length || 0)
      } else {
        toast.error(response.data?.message || "Error fetching filters")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error fetching filters")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSmsfilterDetails((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "type" && value === "UserFilter" ? { parameter: "" } : {}),
    }))
  }

  const handleOperatorChange = (value) => {
    setSelectedOperator(value)
    setSelectedMNC("")
    fetchMncs(selectedCountry, value)
  }

  const handleMncChange = (value) => {
    setSelectedMNC(value)
    fetchPrefixes(selectedCountry, selectedOperator, value)
    setSmsfilterDetails((prev) => ({
      ...prev,
      parameter: value,
    }))
  }

  const handlePrefixChange = (prefix) => {
    if (!currentCountryCode) {
      toast.error("Country code not available. Please try again.")
      return
    }

    setSelectedPrefix((current) => {
      // Check if this exact country+prefix combination already exists
      const existingIndex = current.findIndex(
        (p) => p.country === selectedCountry && p.prefix === prefix && p.cc === currentCountryCode,
      )

      // If it exists, remove it
      if (existingIndex >= 0) {
        return current.filter((_, index) => index !== existingIndex)
      }

      // Otherwise, add it to the selection with the current country and country code
      return [
        ...current,
        {
          country: selectedCountry,
          prefix: prefix,
          cc: currentCountryCode,
        },
      ]
    })
  }

  const handleRemovePrefix = (prefixToRemove) => {
    setSelectedPrefix((prevSelected) => prevSelected.filter((item) => item.prefix !== prefixToRemove))
  }

  const handleOpenModal = () => {
    setSmsfilterDetails({
      fid: "",
      type: "",
      parameter: "",
    })
    setSelectedConnector("")
    setSelectedGroup("")
    setSelectedCountry("")
    setSelectedOperator("")
    setSelectedMNC("")
    setSelectedPrefix([])
    setCostPrice("")
    setSellingPrice("")
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const checkRoutingStatus = async () => {
    try {
      let isCompleted = false
      while (!isCompleted) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        const res = await axiosInstance.get("/api/filter/status")
        if (res.data.status === "completed") {
          isCompleted = true
          toast.success("✅ Routing is complete!")
        }
      }
    } catch (error) {
      console.error("Error checking routing status:", error)
    }
  }

  const handleAddSmsfilter = async () => {
    if (!smsfilterDetails.fid.trim() || !smsfilterDetails.type) {
      toast.error("Filter ID and Type are required")
      return
    }

    if (!selectedConnector || !selectedGroup) {
      toast.error("SMPP Carrier and Group are required")
      return
    }

    if (smsfilterDetails.type === "DestinationAddrFilter") {
      if (!selectedCountry || !selectedOperator || !selectedMNC || !selectedPrefix.length) {
        toast.error("Country, Operator, MNC, and Prefix are required")
        return
      }
    }

    if (smsfilterDetails.type === "DestinationAddrFilter") {
      if (Number.parseFloat(sellingPrice) < Number.parseFloat(costPrice)) {
        toast.error("❌ Selling price cannot be less than cost price!")
        return
      }
    }

    let filterP = smsfilterDetails.parameter || ""

    if (smsfilterDetails.type === "DestinationAddrFilter") {
      filterP = selectedPrefix // Already in the correct format with country, prefix, and cc
    }

    setLoading(true)
    try {
      // We don't need to get country code here anymore since it's already included in each prefix object
      setLoading(false)
      toast.info("🔔 You will be notified when routing is done")
      handleCloseModal()

      const response = await axiosInstance.post("/api/filter/create", {
        filterType: smsfilterDetails.type,
        filterId: smsfilterDetails.fid,
        filterP: filterP,
        group: selectedGroup,
        routesmpp: selectedConnector,
        sellingPrice: sellingPrice,
      })

      if (response.status === 200) {
        fetchRouteFilter()
        checkRoutingStatus()
      } else {
        toast.error(response.data?.error || "Failed to add SMS filter")
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to add SMS filter")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSmsfilter = async (filterId) => {
    setLoading(true)
    try {
      const response = await axiosInstance.delete("/api/filter", {
        data: { filterId },
      })

      if (response.status === 200) {
        toast.success(response.data?.message || "SMS filter deleted successfully!")
        fetchRouteFilter()
      } else {
        toast.error(response.data?.message || "Failed to delete SMS filter")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error deleting SMS filter")
    } finally {
      setLoading(false)
    }
  }

  const openConfirmModal = (message, action) => {
    setConfirmMessage(message)
    setConfirmAction(() => action)
    setIsConfirmModalOpen(true)
  }

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false)
    setConfirmAction(null)
    setConfirmMessage("")
  }

  // Filter out any empty values to prevent the SelectItem error
  const filteredGroups = groups.filter((group) => group && group.name && group.name.trim() !== "")
  const filteredSmpps = smpps.filter((smpp) => smpp && smpp.cid && smpp.cid.trim() !== "")
  const filteredCountries = countries.filter((country) => country && country.trim() !== "")
  const filteredOperators = operators.filter((operator) => operator && operator.trim() !== "")
  const filteredMncs = mncs.filter((mnc) => mnc && mnc.trim() !== "")
  const filteredPrefixes = prefixes.filter((prefix) => prefix && prefix.trim() !== "")
  const filteredSmsUsers = smsUsers.filter((user) => user && user.trim() !== "")

  // Filter prefixes based on search query
  const filteredSearchPrefixes = filteredPrefixes.filter((prefix) =>
    prefix.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Routing</h1>
        <Button onClick={handleOpenModal} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Destination
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">Route Filters List</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search filters..." className="pl-10 border-gray-200" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && <LinearProgress indeterminate className="mb-0" />}

          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Filter ID</TableHead>
                  <TableHead className="font-semibold text-gray-700">Filter Type</TableHead>
                  <TableHead className="font-semibold text-gray-700">Description</TableHead>
                  <TableHead className="font-semibold text-gray-700">Routes</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routefilter.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {loading ? "Loading..." : "No route filters found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  routefilter.map((filter) => (
                    <TableRow key={filter.fid} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">{filter.fid}</TableCell>
                      <TableCell>{filter.type}</TableCell>
                      <TableCell>{filter.description}</TableCell>
                      <TableCell>{filter.routes}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() =>
                            openConfirmModal(`Are you sure you want to delete filter: ${filter.fid}?`, () =>
                              handleDeleteSmsfilter(filter.fid),
                            )
                          }
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{routefilter.length}</span> of{" "}
              <span className="font-medium">{totalRouteFilter}</span> route filters
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
                disabled={(page + 1) * pageSize >= totalRouteFilter}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(Math.floor(totalRouteFilter / pageSize))}
                disabled={(page + 1) * pageSize >= totalRouteFilter}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Route Filter Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Destination wise Routing</DialogTitle>
            <DialogDescription className="text-gray-500">Add a new route filter to the system.</DialogDescription>
          </DialogHeader>
          {loading && <LinearProgress indeterminate className="mb-4" />}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fid" className="text-gray-700">
                  Filter ID
                </Label>
                <Input
                  id="fid"
                  name="fid"
                  placeholder="Enter filter ID"
                  value={smsfilterDetails.fid}
                  onChange={handleInputChange}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group" className="text-gray-700">
                  Select Group
                </Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredGroups.map((group) => (
                      <SelectItem key={group.name} value={group.name}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-gray-700">
                  Filter Type
                </Label>
                <Select
                  name="type"
                  value={smsfilterDetails.type}
                  onValueChange={(value) => setSmsfilterDetails({ ...smsfilterDetails, type: value })}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Select filter type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DestinationAddrFilter">DestinationAddrFilter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="connector" className="text-gray-700">
                  SMPP Connector
                </Label>
                <Select value={selectedConnector} onValueChange={setSelectedConnector}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Select SMPP connector" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSmpps.map((smpp) => (
                      <SelectItem key={smpp.cid} value={smpp.cid}>
                        {smpp.cid}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {smsfilterDetails.type === "UserFilter" && (
              <div className="space-y-2">
                <Label htmlFor="parameter" className="text-gray-700">
                  Select Username
                </Label>
                <Select
                  name="parameter"
                  value={smsfilterDetails.parameter}
                  onValueChange={(value) => setSmsfilterDetails({ ...smsfilterDetails, parameter: value })}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Select username" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSmsUsers.map((username) => (
                      <SelectItem key={username} value={username}>
                        {username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {smsfilterDetails.type === "DestinationAddrFilter" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-gray-700">
                      Select Country
                    </Label>
                    <Select value={selectedCountry} onValueChange={handleCountryChange}>
                      <SelectTrigger className="border-gray-200">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {filteredCountries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCountry && (
                    <div className="space-y-2">
                      <Label htmlFor="operator" className="text-gray-700">
                        Select Operator
                      </Label>
                      <Select value={selectedOperator} onValueChange={handleOperatorChange}>
                        <SelectTrigger className="border-gray-200">
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {filteredOperators.map((operator) => (
                            <SelectItem key={operator} value={operator}>
                              {operator}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {selectedOperator && (
                  <div className="space-y-2">
                    <Label htmlFor="mnc" className="text-gray-700">
                      Select MNC
                    </Label>
                    <Select value={selectedMNC} onValueChange={handleMncChange}>
                      <SelectTrigger className="border-gray-200">
                        <SelectValue placeholder="Select MNC" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {filteredMncs.map((mnc) => (
                          <SelectItem key={mnc} value={mnc}>
                            {mnc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedMNC && (
                  <div className="space-y-2">
                    <Label htmlFor="prefix" className="text-gray-700">
                      Select Prefix
                    </Label>
                    <Popover open={prefixPopoverOpen} onOpenChange={setPrefixPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={prefixPopoverOpen}
                          className="w-full justify-between border-gray-200 bg-white"
                        >
                          {selectedPrefix.length > 0
                            ? `${selectedPrefix.length} prefix${selectedPrefix.length > 1 ? "es" : ""} selected`
                            : "Select prefixes..."}
                          <ChevronRight
                            className={`ml-2 h-4 w-4 shrink-0 transition-transform ${prefixPopoverOpen ? "rotate-90" : ""}`}
                          />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search prefixes..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No prefix found.</CommandEmpty>
                            <CommandGroup className="max-h-[200px] overflow-auto">
                              {filteredSearchPrefixes.map((prefix) => (
                                <CommandItem
                                  key={prefix}
                                  value={prefix}
                                  onSelect={() => handlePrefixChange(prefix)}
                                  className="flex items-center"
                                >
                                  <div
                                    className={cn(
                                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                      selectedPrefix.some(
                                        (item) => item.prefix === prefix && item.country === selectedCountry,
                                      )
                                        ? "bg-primary text-primary-foreground"
                                        : "opacity-50",
                                    )}
                                  >
                                    {selectedPrefix.some(
                                      (item) => item.prefix === prefix && item.country === selectedCountry,
                                    ) && <Check className="h-3 w-3" />}
                                  </div>
                                  <span>{prefix}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedPrefix.map((item, index) => (
                        <Badge
                          key={`${item.country}-${item.prefix}-${index}`}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          <span className="text-xs text-gray-500 mr-1">{item.country}:</span>
                          {item.prefix}
                          <button
                            type="button"
                            onClick={() => handleRemovePrefix(item.prefix)}
                            className="hover:bg-gray-200 rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice" className="text-gray-700">
                      Cost Price
                    </Label>
                    <Input
                      id="costPrice"
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="border-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice" className="text-gray-700">
                      Selling Price
                    </Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="border-gray-200"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} className="border-gray-200 text-gray-700">
              Cancel
            </Button>
            <Button
              onClick={handleAddSmsfilter}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Destination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={closeConfirmModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Confirm Action</DialogTitle>
            <DialogDescription className="text-gray-500">{confirmMessage}</DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={closeConfirmModal} className="border-gray-200 text-gray-700">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmAction) confirmAction()
                closeConfirmModal()
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

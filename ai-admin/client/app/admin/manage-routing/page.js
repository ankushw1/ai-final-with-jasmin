"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import useAxios from "@/hooks/use-axios"
import { useUser } from "@/context/user-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Loader2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function ManageRouting() {
  const [isOpen, setIsOpen] = useState(false)
  const [routingData, setRoutingData] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingRoutes, setFetchingRoutes] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [submittingRouting, setSubmittingRouting] = useState(false)

  // Form state
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedSMPP, setSelectedSMPP] = useState("")
  const [selectedOperators, setSelectedOperators] = useState([])
  const [defaultAssignedRate, setDefaultAssignedRate] = useState("")

  // Data for dropdowns
  const [users, setUsers] = useState([])
  const [countries, setCountries] = useState([])
  const [smpps, setSmpps] = useState([])
  const [operators, setOperators] = useState([])
  const [countryCode, setCountryCode] = useState("")

  // Search states for dropdowns
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [countrySearchTerm, setCountrySearchTerm] = useState("")
  const [smppSearchTerm, setSmppSearchTerm] = useState("")
  const [usernameSearchTerm, setUsernameSearchTerm] = useState("")

  // New state for manage routing view - Updated to handle multiple countries
  const [selectedUsername, setSelectedUsername] = useState("")
  const [usernamesWithRouting, setUsernamesWithRouting] = useState([])
  const [currentRoutings, setCurrentRoutings] = useState([]) // Changed from single to array
  const [loadingRouting, setLoadingRouting] = useState(false)

  const axiosInstance = useAxios()
  const { user } = useUser()

  useEffect(() => {
    // Fetch initial data
    fetchUsers()
    fetchSMPPs()
    fetchCountries()
    fetchUsernamesWithRouting()
  }, [])

  useEffect(() => {
    if (selectedCountry) {
      fetchCountryCode(selectedCountry)
      if (selectedSMPP) {
        fetchOperators(selectedCountry)
      }
    }
  }, [selectedCountry, selectedSMPP])

  useEffect(() => {
    if (selectedUsername) {
      fetchRoutingByUsername(selectedUsername)
    } else {
      setCurrentRoutings([])
    }
  }, [selectedUsername])

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/api/routing/users", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (response.status === 200) {
        setUsers(response.data.users || [])
      } else {
        toast.error(response.data?.message || "Failed to fetch users")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch users")
      console.error(error)
    }
  }

  const fetchSMPPs = async () => {
    try {
      const response = await axiosInstance.get("/api/routing/smpps", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (response.status === 200) {
        setSmpps(response.data.smpps || [])
      } else {
        toast.error(response.data?.message || "Failed to fetch SMPP connectors")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch SMPP connectors")
      console.error(error)
    }
  }

  const fetchCountries = async () => {
    try {
      const response = await axiosInstance.get("/api/routing/countries", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (response.status === 200) {
        setCountries(response.data.countries || [])
      } else {
        toast.error(response.data?.message || "Failed to fetch countries")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch countries")
      console.error(error)
    }
  }

  const fetchUsernamesWithRouting = async () => {
    try {
      const response = await axiosInstance.get("/api/routing/usernames-with-routing", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (response.status === 200) {
        setUsernamesWithRouting(response.data.usernames || [])
      } else {
        toast.error(response.data?.message || "Failed to fetch usernames")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch usernames")
      console.error(error)
    }
  }

  const fetchRoutingByUsername = async (username) => {
    setLoadingRouting(true)
    try {
      const response = await axiosInstance.get(`/api/routing/routing/${username}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (response.status === 200) {
        setCurrentRoutings(response.data.routings || []) // Updated to handle array
      } else {
        toast.error(response.data?.message || "Failed to fetch routing data")
        setCurrentRoutings([])
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setCurrentRoutings([])
        toast.info("No routing configuration found for this username")
      } else {
        toast.error(error?.response?.data?.message || "Failed to fetch routing data")
      }
      console.error(error)
    } finally {
      setLoadingRouting(false)
    }
  }

  const fetchCountryCode = async (country) => {
    try {
      const response = await axiosInstance.get(`/api/cc?country=${country}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (response.status === 200) {
        setCountryCode(response.data?.country_code || "")
      } else {
        toast.error(response.data?.message || "Failed to fetch country code")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch country code")
      console.error(error)
    }
  }

  const fetchOperators = async (country) => {
    if (!country || !selectedSMPP) {
      return
    }

    setFetchingRoutes(true)
    try {
      const smppObj = smpps.find((smpp) => smpp.name === selectedSMPP)
      if (!smppObj) {
        toast.error("Selected SMPP not found")
        return
      }

      const response = await axiosInstance.get(
        `/api/routing/operators-by-country?country=${country}&smppId=${smppObj._id}`,
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        },
      )

      if (response.status === 200) {
        const operatorsWithAssignedRate = response.data.operators.map((op) => ({
          ...op,
          assignedRate: "", // Initialize with empty assigned rate
        }))
        setOperators(operatorsWithAssignedRate || [])
      } else {
        toast.error(response.data?.message || "Failed to fetch operators")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch operators")
      console.error(error)
    } finally {
      setFetchingRoutes(false)
    }
  }

  const handleOpenModal = () => {
    setIsOpen(true)
    resetForm()
  }

  const resetForm = () => {
    setSelectedUser(null)
    setSelectedCountry("")
    setSelectedSMPP("")
    setSelectedOperators([])
    setDefaultAssignedRate("")
    setOperators([])
    // Reset search terms
    setUserSearchTerm("")
    setCountrySearchTerm("")
    setSmppSearchTerm("")
  }

  const handleSelectAllOperators = () => {
    if (selectedOperators.length === operators.length) {
      setSelectedOperators([])
    } else {
      // When selecting all, apply default assigned rate if available
      const operatorsWithRate = operators.map((op) => ({
        ...op,
        assignedRate: defaultAssignedRate || op.assignedRate || "",
      }))
      setSelectedOperators(operatorsWithRate)
    }
  }

  const handleOperatorToggle = (operator) => {
    setSelectedOperators((prev) => {
      const exists = prev.some((op) => op.operator === operator.operator && op.mnc === operator.mnc)
      if (exists) {
        return prev.filter((op) => !(op.operator === operator.operator && op.mnc === operator.mnc))
      } else {
        // When adding operator, use default assigned rate if available
        const operatorWithRate = {
          ...operator,
          assignedRate: defaultAssignedRate || operator.assignedRate || "",
        }
        return [...prev, operatorWithRate]
      }
    })
  }

  const handleAssignedRateChange = (operatorIndex, newRate) => {
    setSelectedOperators((prev) =>
      prev.map((op, index) => (index === operatorIndex ? { ...op, assignedRate: newRate } : op)),
    )
  }

  const applyDefaultRateToAll = () => {
    if (!defaultAssignedRate) {
      toast.error("Please enter a default assigned rate first")
      return
    }

    setSelectedOperators((prev) => prev.map((op) => ({ ...op, assignedRate: defaultAssignedRate })))
    toast.success("Default rate applied to all selected operators")
  }

  const handleSubmit = async () => {
    if (!selectedUser || !selectedCountry || !selectedSMPP || selectedOperators.length === 0) {
      toast.error("Please fill all required fields")
      return
    }

    // Check if all selected operators have assigned rates
    const operatorsWithoutRate = selectedOperators.filter((op) => !op.assignedRate || op.assignedRate === "")
    if (operatorsWithoutRate.length > 0) {
      toast.error("All selected operators must have an assigned rate")
      return
    }

    // Check if assigned rates are higher than operator rates
    const invalidRates = selectedOperators.filter((operator) => {
      const numericAssignedRate = Number.parseFloat(operator.assignedRate)
      return operator.rate !== null && Number.parseFloat(operator.rate) >= numericAssignedRate
    })

    if (invalidRates.length > 0) {
      toast.error("Assigned Rate must be higher than operator rate for all selected operators")
      return
    }

    const payload = {
      username: selectedUser.username,
      groupname: selectedUser.groupname || "",
      smpp: selectedSMPP,
      country: selectedCountry,
      countryCode: countryCode,
      operators: selectedOperators.map((operator) => ({
        operator: operator.operator,
        mnc: operator.mnc,
        rate: operator.rate,
        mcc: operator.mcc,
        assignedRate: operator.assignedRate, // Include individual assigned rate
      })),
    }

    setSubmittingRouting(true)
    try {
      const response = await axiosInstance.post("/api/routing/submitted-routing", payload, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })

      if (response.status === 200) {
        toast.success(`Routing configuration saved successfully for ${selectedCountry}`)
        setIsOpen(false)
        fetchUsernamesWithRouting()
        if (selectedUsername === selectedUser.username) {
          fetchRoutingByUsername(selectedUsername)
        }
      } else {
        toast.error(response.data?.message || "Failed to save routing configuration")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "An error occurred while saving routing configuration")
      console.error(error)
    } finally {
      setSubmittingRouting(false)
    }
  }

  const filteredOperators = operators.filter((operator) => {
    const operatorName = operator.operator || ""
    const mnc = operator.mnc?.toString() || ""
    return operatorName.toLowerCase().includes(searchQuery.toLowerCase()) || mnc.includes(searchQuery)
  })

  // Filter functions for dropdowns
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(userSearchTerm.toLowerCase())
  )

  const filteredCountries = countries.filter((country) =>
    country.country.toLowerCase().includes(countrySearchTerm.toLowerCase())
  )

  const filteredSmpps = smpps.filter((smpp) =>
    smpp.name.toLowerCase().includes(smppSearchTerm.toLowerCase())
  )

  const filteredUsernamesWithRouting = usernamesWithRouting.filter((username) =>
    username.toLowerCase().includes(usernameSearchTerm.toLowerCase())
  )

  // Calculate total operators across all countries for selected username
  const totalOperators = currentRoutings.reduce((total, routing) => total + (routing.operators?.length || 0), 0)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Manage Routing</h1>
        <Button onClick={handleOpenModal} disabled={submittingRouting} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Routing
        </Button>
      </div>

      {/* Customer Selection and Routing Display */}
      <Card className="shadow-sm">
        <CardHeader className="bg-white border-b">
          <CardTitle className="text-lg font-semibold text-gray-800">View Customer Routing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="customer-select" className="text-gray-700">Select Customer Username</Label>
              <Select value={selectedUsername} onValueChange={setSelectedUsername} disabled={submittingRouting}>
                <SelectTrigger id="customer-select" className="border-gray-200">
                  <SelectValue placeholder="Select a customer username" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <div className="sticky top-0 z-10 bg-white p-2 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search usernames..."
                        value={usernameSearchTerm}
                        onChange={(e) => setUsernameSearchTerm(e.target.value)}
                        className="pl-10 border-gray-200"
                      />
                    </div>
                  </div>
                  {filteredUsernamesWithRouting.map((username) => (
                    <SelectItem key={username} value={username}>
                      {username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingRouting && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading routing data...
            </div>
          )}

          {currentRoutings.length > 0 && !loadingRouting && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Username</Label>
                  <p className="font-semibold text-gray-800">{selectedUsername}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Countries</Label>
                  <p className="font-semibold text-gray-800">{currentRoutings.length}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Total Operators</Label>
                  <p className="font-semibold text-gray-800">{totalOperators}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Group Name</Label>
                  <p className="font-semibold text-gray-800">{currentRoutings[0]?.groupname}</p>
                </div>
              </div>

              {/* Countries and Operators */}
              {currentRoutings.map((routing, routingIndex) => (
                <div key={`${routing.country}-${routingIndex}`} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-800">{routing.country}</h3>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {routing.operators?.length || 0} operators
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>
                        SMPP: <strong className="text-gray-800">{routing.smpp}</strong>
                      </span>
                      <span>
                        Code: <strong className="text-gray-800">{routing.countryCode}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="border rounded-md bg-white shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold text-gray-700">Operator Name</TableHead>
                          <TableHead className="font-semibold text-gray-700">MCC</TableHead>
                          <TableHead className="font-semibold text-gray-700">MNC</TableHead>
                          <TableHead className="font-semibold text-gray-700">Operator Rate</TableHead>
                          <TableHead className="font-semibold text-gray-700">Assigned Rate</TableHead>
                          <TableHead className="font-semibold text-gray-700">Country Code</TableHead>
                          <TableHead className="font-semibold text-gray-700">Group Name</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {routing.operators?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                              No operators configured for {routing.country}
                            </TableCell>
                          </TableRow>
                        ) : (
                          routing.operators?.map((operator, index) => (
                            <TableRow key={`${operator.operator}-${operator.mnc}-${index}`} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{operator.operator}</TableCell>
                              <TableCell>{operator.mcc}</TableCell>
                              <TableCell>{operator.mnc}</TableCell>
                              <TableCell>{operator.rate || "N/A"}</TableCell>
                              <TableCell className="font-semibold text-green-600">
                                {operator.assignedRate || "N/A"}
                              </TableCell>
                              <TableCell>{routing.countryCode}</TableCell>
                              <TableCell>{routing.groupname}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedUsername && currentRoutings.length === 0 && !loadingRouting && (
            <div className="text-center py-8 text-gray-500">
              No routing configuration found for the selected username.
            </div>
          )}

          {!selectedUsername && (
            <div className="text-center py-8 text-gray-500">
              Please select a customer username to view routing configuration.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Routing Modal */}
      <Dialog open={isOpen} onOpenChange={(open) => !submittingRouting && setIsOpen(open)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Add Routing Configuration</DialogTitle>
            <DialogDescription className="text-gray-600">Configure routing for a specific user, country, and SMPP connection.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700">Select Customer User</Label>
                <Select
                  value={selectedUser?._id || ""}
                  onValueChange={(value) => {
                    const user = users.find((u) => u._id === value)
                    setSelectedUser(user)
                  }}
                  disabled={submittingRouting}
                >
                  <SelectTrigger id="username" className="border-gray-200">
                    <SelectValue placeholder="Select username" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <div className="sticky top-0 z-10 bg-white p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search users..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="pl-10 border-gray-200"
                        />
                      </div>
                    </div>
                    {filteredUsers.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-gray-700">Select Country</Label>
                <Select
                  value={selectedCountry}
                  onValueChange={(value) => {
                    setSelectedCountry(value)
                    setSelectedOperators([])
                    setOperators([])
                  }}
                  disabled={submittingRouting}
                >
                  <SelectTrigger id="country" className="border-gray-200">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <div className="sticky top-0 z-10 bg-white p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search countries..."
                          value={countrySearchTerm}
                          onChange={(e) => setCountrySearchTerm(e.target.value)}
                          className="pl-10 border-gray-200"
                        />
                      </div>
                    </div>
                    {filteredCountries.map((country) => (
                      <SelectItem key={country.cc} value={country.country}>
                        {country.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smpp" className="text-gray-700">Select SMPP</Label>
                <Select
                  value={selectedSMPP}
                  onValueChange={(value) => {
                    setSelectedSMPP(value)
                    setSelectedOperators([])
                    if (selectedCountry) {
                      fetchOperators(selectedCountry)
                    }
                  }}
                  disabled={submittingRouting}
                >
                  <SelectTrigger id="smpp" className="border-gray-200">
                    <SelectValue placeholder="Select SMPP" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <div className="sticky top-0 z-10 bg-white p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search SMPP..."
                          value={smppSearchTerm}
                          onChange={(e) => setSmppSearchTerm(e.target.value)}
                          className="pl-10 border-gray-200"
                        />
                      </div>
                    </div>
                    {filteredSmpps.map((smpp) => (
                      <SelectItem key={smpp._id} value={smpp.name}>
                        {smpp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultAssignedRate" className="text-gray-700">Default Assigned Rate (Optional)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="defaultAssignedRate"
                    type="number"
                    step="0.001"
                    placeholder="0.00"
                    value={defaultAssignedRate}
                    onChange={(e) => setDefaultAssignedRate(e.target.value)}
                    disabled={submittingRouting}
                    className="border-gray-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyDefaultRateToAll}
                    disabled={!defaultAssignedRate || selectedOperators.length === 0 || submittingRouting}
                    className="border-gray-200"
                  >
                    Apply to All
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Set a default rate and apply to all selected operators</p>
              </div>
            </div>

            {selectedCountry && selectedSMPP && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-700">Select Operators</Label>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search operators..."
                        className="w-64 pl-10 border-gray-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={submittingRouting}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllOperators}
                      disabled={fetchingRoutes || submittingRouting}
                      className="border-gray-200"
                    >
                      {selectedOperators.length === operators.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                </div>

                <div className="border rounded-md bg-white">
                  <div className="grid grid-cols-12 gap-2 p-2 border-b bg-gray-50">
                    <div className="col-span-1"></div>
                    <div className="col-span-4 font-medium text-gray-700">Operator</div>
                    <div className="col-span-1 font-medium text-gray-700">MNC</div>
                    <div className="col-span-2 font-medium text-gray-700">Rate</div>
                    <div className="col-span-4 font-medium text-gray-700">Assigned Rate</div>
                  </div>

                  <ScrollArea className="h-64">
                    {fetchingRoutes ? (
                      <div className="p-4 text-center">
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Fetching operators...
                        </div>
                      </div>
                    ) : filteredOperators.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {operators.length === 0
                          ? "No operators found for the selected criteria"
                          : "No operators match your search"}
                      </div>
                    ) : (
                      filteredOperators.map((operator, index) => {
                        const isSelected = selectedOperators.some(
                          (op) => op.operator === operator.operator && op.mnc === operator.mnc,
                        )
                        const selectedOperator = selectedOperators.find(
                          (op) => op.operator === operator.operator && op.mnc === operator.mnc,
                        )

                        return (
                          <div
                            key={`${operator.operator}-${operator.mnc}-${index}`}
                            className={`grid grid-cols-12 gap-2 p-2 border-b last:border-0 hover:bg-gray-50 ${
                              submittingRouting ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                            }`}
                          >
                            <div className="col-span-1 flex items-center justify-center">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => !submittingRouting && handleOperatorToggle(operator)}
                                disabled={submittingRouting}
                              />
                            </div>
                            <div className="col-span-4 truncate">{operator.operator}</div>
                            <div className="col-span-1">{operator.mnc}</div>
                            <div className="col-span-2">{operator.rate}</div>
                            <div className="col-span-4">
                              {isSelected ? (
                                <Input
                                  type="number"
                                  step="0.001"
                                  placeholder="0.00"
                                  value={selectedOperator?.assignedRate || ""}
                                  onChange={(e) => {
                                    const operatorIndex = selectedOperators.findIndex(
                                      (op) => op.operator === operator.operator && op.mnc === operator.mnc,
                                    )
                                    if (operatorIndex !== -1) {
                                      handleAssignedRateChange(operatorIndex, e.target.value)
                                    }
                                  }}
                                  disabled={submittingRouting}
                                  className="h-8 border-gray-200"
                                />
                              ) : (
                                <span className="text-gray-500 text-sm">Select operator first</span>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </ScrollArea>
                </div>

                <div className="text-sm text-gray-500 mt-1">
                  {selectedOperators.length} operator(s) selected.
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)} 
              disabled={submittingRouting}
              className="border-gray-200 text-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={fetchingRoutes || submittingRouting} 
              className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
            >
              {submittingRouting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
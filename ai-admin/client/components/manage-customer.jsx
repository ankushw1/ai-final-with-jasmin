"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useUser } from "@/context/user-context"
import useAxios from "@/hooks/use-axios"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Eye,
  EyeOff,
  MoreHorizontal,
  Plus,
  Search,
  UserPlus,
  Ban,
  Play,
  RefreshCw,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LinearProgress } from "@/components/ui/linear-progress"

export default function ManageCustomer() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubaccountModalOpen, setIsSubaccountModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmMessage, setConfirmMessage] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [managements, setManagements] = useState([])
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewCustomerDetails, setViewCustomerDetails] = useState(null)

  const [customerDetails, setCustomerDetails] = useState({
    username: "",
    password: "",
    companyName: "",
    mobileNumber: "",
    primaryEmail: "",
    supportEmail: "",
    ratesEmail: "",
    billingEmail: "",
    address: "",
    contactPersonName: "",
    contactPersonMobile: "",
    assignedAccountManager: "",
    accountType: "",
    billingCycle: "",
    channels: ["sms"],
  })

  const [subaccountDetails, setSubaccountDetails] = useState({
    product: "",
    username: "",
    password: "",
    confirmPassword: "",
    ip_whitelist: "",
  })

  const axiosInstance = useAxios()
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      await fetchManagements()
      fetchCustomers(page, pageSize, searchTerm)
    }

    fetchData()
  }, [page, pageSize, searchTerm])

  const fetchCustomers = async (page, pageSize, searchTerm = "") => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/customers", {
        params: { page, pageSize, search: searchTerm },
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      setCustomers(response.data.customers || [])
      setTotalCustomers(response.data.total || 0)
    } catch (error) {
      console.error("Error fetching customers:", error)
      toast.error("Failed to fetch customers")
    } finally {
      setLoading(false)
    }
  }

  const fetchManagements = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/management", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      setManagements(response.data.managements || [])
    } catch (error) {
      console.error("Error fetching managements:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateStrongPassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz"
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const numbers = "0123456789"
    const specialChars = "@$!%*?&"

    // Ensure at least one character from each required category
    let password = ""
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += specialChars[Math.floor(Math.random() * specialChars.length)]

    // Fill the rest with random characters from all categories
    const allChars = lowercase + uppercase + numbers + specialChars
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }

    // Shuffle the password to avoid predictable patterns
    const shuffled = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("")

    setCustomerDetails({ ...customerDetails, password: shuffled })
    toast.success("Strong password generated!")
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCustomerDetails({ ...customerDetails, [name]: value })
  }

  const handleSubaccountInputChange = (e) => {
    const { name, value } = e.target
    setSubaccountDetails({ ...subaccountDetails, [name]: value })
  }

  const handleSelectChannels = (value) => {
    setCustomerDetails({
      ...customerDetails,
      channels: Array.isArray(value) ? value : [],
    })
  }

  const handleOpenModal = () => {
    setIsEditing(false)
    setCustomerDetails({
      username: "",
      password: "",
      companyName: "",
      mobileNumber: "",
      primaryEmail: "",
      supportEmail: "",
      ratesEmail: "",
      billingEmail: "",
      address: "",
      contactPersonName: "",
      contactPersonMobile: "",
      assignedAccountManager: "",
      accountType: "",
      billingCycle: "",
      channels: ["sms"],
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setShowPassword(false)
  }

  const handleOpenSubaccountModal = (customer) => {
    setSubaccountDetails({
      product: "",
      username: "",
      password: "",
      confirmPassword: "",
      ip_whitelist: "",
      customerId: customer._id,
    })
    setIsSubaccountModalOpen(true)
  }

  const handleCloseSubaccountModal = () => {
    setIsSubaccountModalOpen(false)
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

  const validateCustomerDetails = () => {
    const {
      username,
      password,
      companyName,
      mobileNumber,
      primaryEmail,
      contactPersonName,
      contactPersonMobile,
      accountType,
      assignedAccountManager,
    } = customerDetails

    if (!username) {
      toast.error("Username is required")
      return false
    }

    if (!isEditing && !password) {
      toast.error("Password is required")
      return false
    }

    if (
      !isEditing &&
      password &&
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)
    ) {
      toast.error(
        "Password must be at least 8 characters long, with at least one lowercase letter, one uppercase letter, one number, and one special character",
      )
      return false
    }

    if (!companyName) {
      toast.error("Company Name is required")
      return false
    }

    if (!mobileNumber || !/^\d{1,20}$/.test(mobileNumber)) {
      toast.error("Valid mobile number is required")
      return false
    }

    if (!primaryEmail || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(primaryEmail)) {
      toast.error("Valid primary email is required")
      return false
    }

    if (!contactPersonName) {
      toast.error("Contact Person Name is required")
      return false
    }

    if (!contactPersonMobile || !/^\d{1,20}$/.test(contactPersonMobile)) {
      toast.error("Valid contact person mobile number is required")
      return false
    }

    if (!accountType) {
      toast.error("Account type is required")
      return false
    }

    if (!assignedAccountManager) {
      toast.error("Assigned Account Manager must be selected")
      return false
    }

    return true
  }

  const handleAddCustomer = async () => {
    if (!validateCustomerDetails()) return

    setLoading(true)
    try {
      const response = await axiosInstance.post("/api/customers", customerDetails)
      toast.success(response.data.message || "Customer added successfully!")
      setIsModalOpen(false)
      fetchCustomers(page, pageSize, searchTerm)
    } catch (error) {
      // Catch duplicate username or email errors
      const errorMessage = error.response?.data?.message || "Failed to add customer!"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCustomer = (customer) => {
    setIsEditing(true)
    setSelectedCustomerId(customer._id)
    setCustomerDetails({
      username: customer.username,
      password: "",
      companyName: customer.companyName,
      mobileNumber: customer.mobileNumber,
      primaryEmail: customer.primaryEmail,
      supportEmail: customer.supportEmail || "",
      ratesEmail: customer.ratesEmail || "",
      billingEmail: customer.billingEmail || "",
      address: customer.address || "",
      contactPersonName: customer.contactPersonName,
      contactPersonMobile: customer.contactPersonMobile,
      accountType: customer.accountType,
      billingCycle: customer.billingCycle || "",
      channels: customer.channels || ["sms"],
      assignedAccountManager: customer.assignedAccountManager || "",
    })
    setIsModalOpen(true)
  }

  const handleSaveCustomer = async () => {
    if (!validateCustomerDetails()) return

    setLoading(true)
    try {
      const response = await axiosInstance.put(`/api/customers/${selectedCustomerId}`, customerDetails)
      toast.success(response.data.message || "Customer updated successfully!")
      setIsModalOpen(false)
      fetchCustomers(page, pageSize, searchTerm)
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update customer!"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async (customerId) => {
    setLoading(true)
    try {
      const response = await axiosInstance.delete(`/api/customers/${customerId}`)
      toast.success(response.data.message || "Customer deleted successfully!")
      fetchCustomers(page, pageSize, searchTerm)
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete customer!"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCustomerStatus = async (customerId, newStatus) => {
    try {
      const response = await axiosInstance.put(`/api/activation/${customerId}/activate`, { isActive: newStatus })
      toast.success(response.data.message || `Customer ${newStatus ? "enabled" : "disabled"} successfully!`)
      fetchCustomers(page, pageSize, searchTerm)
    } catch (error) {
      toast.error("Failed to update customer status")
      console.error(error)
    }
  }

  const handleCreateSubaccount = async () => {
    // Implement subaccount creation logic
    toast.success("Subaccount created successfully!")
    setIsSubaccountModalOpen(false)
  }

  const handleViewCustomer = (customer) => {
    setViewCustomerDetails(customer)
    setIsViewModalOpen(true)
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setViewCustomerDetails(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Customers</h1>
        <Button onClick={handleOpenModal} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Customer
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">Customer List</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && <LinearProgress indeterminate className="mb-0" />}

          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Username</TableHead>
                  <TableHead className="font-semibold text-gray-700">Company Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Account Type</TableHead>
                  <TableHead className="font-semibold text-gray-700">Mobile Number</TableHead>
                  <TableHead className="font-semibold text-gray-700">Primary Email</TableHead>
                  <TableHead className="font-semibold text-gray-700">Contact Person</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {loading ? "Loading..." : "No customers found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer._id} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">{customer.username}</TableCell>
                      <TableCell>{customer.companyName}</TableCell>
                      <TableCell>{customer.accountType}</TableCell>
                      <TableCell>{customer.mobileNumber}</TableCell>
                      <TableCell>{customer.primaryEmail}</TableCell>
                      <TableCell>{customer.contactPersonName}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div
                            className={`mr-2 h-2.5 w-2.5 rounded-full ${
                              customer.isActive ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span className={customer.isActive ? "text-green-700" : "text-red-700"}>
                            {customer.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 mr-1"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            <DropdownMenuItem onClick={() => handleEditCustomer(customer)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenSubaccountModal(customer)}
                              className="cursor-pointer"
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Add Subaccount
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                openConfirmModal(
                                  `Are you sure you want to ${customer.isActive ? "disable" : "enable"} this customer?`,
                                  () => handleToggleCustomerStatus(customer._id, !customer.isActive),
                                )
                              }
                              className="cursor-pointer"
                            >
                              {customer.isActive ? (
                                <>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <Play className="mr-2 h-4 w-4" />
                                  Enable
                                </>
                              )}
                            </DropdownMenuItem>
                            {/* <DropdownMenuItem
                              onClick={() =>
                                openConfirmModal("Are you sure you want to delete this customer?", () =>
                                  handleDeleteCustomer(customer._id),
                                )
                              }
                              className="text-red-600 cursor-pointer"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem> */}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{customers.length}</span> of{" "}
              <span className="font-medium">{totalCustomers}</span> customers
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
                disabled={(page + 1) * pageSize >= totalCustomers}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(Math.floor(totalCustomers / pageSize))}
                disabled={(page + 1) * pageSize >= totalCustomers}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-6xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              {isEditing ? "Edit Customer" : "Create New Customer"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {isEditing ? "Update customer information in the system." : "Add a new customer to the system."}
            </DialogDescription>
          </DialogHeader>
          {loading && <LinearProgress indeterminate className="mb-4" />}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="Enter username"
                  value={customerDetails.username}
                  onChange={handleInputChange}
                  disabled={isEditing}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Password {isEditing && "(leave blank to keep current)"}
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      disabled={isEditing}
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={customerDetails.password}
                      onChange={handleInputChange}
                      className="border-gray-200 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={generateStrongPassword}
                      className="border-gray-200 hover:bg-gray-50"
                      title="Generate strong password"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-gray-700">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="Enter company name"
                  value={customerDetails.companyName}
                  onChange={handleInputChange}
                  className="border-gray-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryEmail" className="text-gray-700">
                  Primary Email
                </Label>
                <Input
                  disabled={isEditing}
                  id="primaryEmail"
                  name="primaryEmail"
                  placeholder="Enter primary email"
                  value={customerDetails.primaryEmail}
                  onChange={handleInputChange}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportEmail" className="text-gray-700">
                  Support Email
                </Label>
                <Input
                  id="supportEmail"
                  name="supportEmail"
                  placeholder="Enter support email"
                  value={customerDetails.supportEmail}
                  onChange={handleInputChange}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ratesEmail" className="text-gray-700">
                  Rates Email
                </Label>
                <Input
                  id="ratesEmail"
                  name="ratesEmail"
                  placeholder="Enter rates email"
                  value={customerDetails.ratesEmail}
                  onChange={handleInputChange}
                  className="border-gray-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingEmail" className="text-gray-700">
                  Billing Email
                </Label>
                <Input
                  id="billingEmail"
                  name="billingEmail"
                  placeholder="Enter billing email"
                  value={customerDetails.billingEmail}
                  onChange={handleInputChange}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber" className="text-gray-700">
                  Mobile Number
                </Label>
                <Input
                  id="mobileNumber"
                  name="mobileNumber"
                  placeholder="Enter mobile number"
                  value={customerDetails.mobileNumber}
                  onChange={handleInputChange}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-gray-700">
                  Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Enter address"
                  value={customerDetails.address}
                  onChange={handleInputChange}
                  className="border-gray-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPersonName" className="text-gray-700">
                  Contact Person Name
                </Label>
                <Input
                  id="contactPersonName"
                  name="contactPersonName"
                  placeholder="Enter contact person name"
                  value={customerDetails.contactPersonName}
                  onChange={handleInputChange}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPersonMobile" className="text-gray-700">
                  Contact Person Mobile
                </Label>
                <Input
                  id="contactPersonMobile"
                  name="contactPersonMobile"
                  placeholder="Enter contact person mobile"
                  value={customerDetails.contactPersonMobile}
                  onChange={handleInputChange}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType" className="text-gray-700">
                  Account Type
                </Label>
                <Select
                  value={customerDetails.accountType}
                  onValueChange={(value) => setCustomerDetails({ ...customerDetails, accountType: value })}
                >
                  <SelectTrigger id="accountType" className="border-gray-200">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Prepaid">Prepaid</SelectItem>
                    <SelectItem value="Postpaid">Postpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {customerDetails.accountType === "Postpaid" && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billingCycle" className="text-gray-700">
                    Billing Cycle
                  </Label>
                  <Select
                    value={customerDetails.billingCycle}
                    onValueChange={(value) => setCustomerDetails({ ...customerDetails, billingCycle: value })}
                  >
                    <SelectTrigger id="billingCycle" className="border-gray-200">
                      <SelectValue placeholder="Select billing cycle" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="assignedAccountManager" className="text-gray-700">
                Assigned Account Manager
              </Label>
              <Select
                value={customerDetails.assignedAccountManager}
                onValueChange={(value) => setCustomerDetails({ ...customerDetails, assignedAccountManager: value })}
              >
                <SelectTrigger id="assignedAccountManager" className="border-gray-200">
                  <SelectValue placeholder="Select account manager" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="none">None</SelectItem>
                  {managements.map((manager) => (
                    <SelectItem key={manager._id} value={manager._id}>
                      {manager.firstName} {manager.lastName} - {manager.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} className="border-gray-200 text-gray-700">
              Cancel
            </Button>
            <Button
              onClick={isEditing ? handleSaveCustomer : handleAddCustomer}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEditing ? "Save Changes" : "Create Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subaccount Modal */}
      <Dialog open={isSubaccountModalOpen} onOpenChange={handleCloseSubaccountModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Add Subaccount</DialogTitle>
            <DialogDescription className="text-gray-500">Create a new subaccount for this customer.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product" className="text-gray-700">
                Product
              </Label>
              <Select
                value={subaccountDetails.product}
                onValueChange={(value) => setSubaccountDetails({ ...subaccountDetails, product: value })}
              >
                <SelectTrigger id="product" className="border-gray-200">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="sim">SIM</SelectItem>
                  <SelectItem value="ss7">SS7</SelectItem>
                  <SelectItem value="local-direct">Local direct</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="high-quality">High Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subaccount-username" className="text-gray-700">
                Username
              </Label>
              <Input
                id="subaccount-username"
                name="username"
                placeholder="Enter username"
                value={subaccountDetails.username}
                onChange={handleSubaccountInputChange}
                className="border-gray-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subaccount-password" className="text-gray-700">
                  Password
                </Label>
                <Input
                  id="subaccount-password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={subaccountDetails.password}
                  onChange={handleSubaccountInputChange}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-700">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={subaccountDetails.confirmPassword}
                  onChange={handleSubaccountInputChange}
                  className="border-gray-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ip-whitelist" className="text-gray-700">
                IP Whitelist
              </Label>
              <Input
                id="ip-whitelist"
                name="ip_whitelist"
                placeholder="Enter IP addresses (comma separated)"
                value={subaccountDetails.ip_whitelist}
                onChange={handleSubaccountInputChange}
                className="border-gray-200"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseSubaccountModal} className="border-gray-200 text-gray-700">
              Cancel
            </Button>
            <Button onClick={handleCreateSubaccount} className="bg-blue-600 hover:bg-blue-700 text-white">
              Create Subaccount
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
              variant={confirmMessage.includes("delete") ? "destructive" : "default"}
              onClick={() => {
                if (confirmAction) confirmAction()
                closeConfirmModal()
              }}
              className={
                confirmMessage.includes("delete")
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Customer Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={handleCloseViewModal}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Customer Details</DialogTitle>
            <DialogDescription className="text-gray-500">Full information about the customer.</DialogDescription>
          </DialogHeader>

          {viewCustomerDetails && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">Username</h3>
                  <p className="text-base">{viewCustomerDetails.username}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">Company Name</h3>
                  <p className="text-base">{viewCustomerDetails.companyName}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">Account Type</h3>
                  <p className="text-base">{viewCustomerDetails.accountType}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="flex items-center">
                    <div
                      className={`mr-2 h-2.5 w-2.5 rounded-full ${
                        viewCustomerDetails.isActive ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span className={viewCustomerDetails.isActive ? "text-green-700" : "text-red-700"}>
                      {viewCustomerDetails.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">Mobile Number</h3>
                  <p className="text-base">{viewCustomerDetails.mobileNumber}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">Primary Email</h3>
                  <p className="text-base">{viewCustomerDetails.primaryEmail}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">Support Email</h3>
                  <p className="text-base">{viewCustomerDetails.supportEmail || "—"}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">Rates Email</h3>
                  <p className="text-base">{viewCustomerDetails.ratesEmail || "—"}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">Billing Email</h3>
                  <p className="text-base">{viewCustomerDetails.billingEmail || "—"}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">Address</h3>
                  <p className="text-base">{viewCustomerDetails.address || "—"}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">Contact Person Name</h3>
                  <p className="text-base">{viewCustomerDetails.contactPersonName}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">Contact Person Mobile</h3>
                  <p className="text-base">{viewCustomerDetails.contactPersonMobile}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">Billing Cycle</h3>
                  <p className="text-base">{viewCustomerDetails.billingCycle || "—"}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">Channels</h3>
                  <p className="text-base">{viewCustomerDetails.channels?.join(", ") || "—"}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                  <p className="text-base">{new Date(viewCustomerDetails.createdAt).toLocaleString()}</p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p className="text-base">{new Date(viewCustomerDetails.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleCloseViewModal} className="bg-blue-600 hover:bg-blue-700 text-white">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

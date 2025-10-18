"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useUser } from "@/context/user-context"
import useAxios from "@/hooks/use-axios"
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Eye,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Trash,
} from "lucide-react"

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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LinearProgress } from "@/components/ui/linear-progress"

export default function ManageManagement() {
  const [managements, setManagements] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalManagements, setTotalManagements] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmMessage, setConfirmMessage] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [selectedManagementId, setSelectedManagementId] = useState(null)
  const [kycPreview, setKycPreview] = useState(null)

  const [managementDetails, setManagementDetails] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    mobile: "",
    address: "",
    kyc: null,
  })

  const axiosInstance = useAxios()
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    fetchManagements(page, pageSize, searchTerm)
  }, [page, pageSize, searchTerm])

  const fetchManagements = async (page, pageSize, searchTerm = "") => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/management", {
        params: { page, pageSize, search: searchTerm },
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      setManagements(response.data.managements || [])
      setTotalManagements(response.data.total || 0)
    } catch (error) {
      console.error("Error fetching managements:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setManagementDetails({ ...managementDetails, [name]: value })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setManagementDetails((prevState) => ({
        ...prevState,
        kyc: file,
      }))

      if (file.type.startsWith("image/")) {
        setKycPreview(URL.createObjectURL(file))
      } else if (file.type === "application/pdf") {
        setKycPreview(null)
      } else {
        toast.error("Unsupported file format. Please upload an image or PDF.")
        setKycPreview(null)
      }
    }
  }

  const handleOpenModal = () => {
    setIsEditing(false)
    setManagementDetails({
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      mobile: "",
      address: "",
      kyc: null,
    })
    setKycPreview(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleEditManagement = (management) => {
    setIsEditing(true)
    setSelectedManagementId(management._id)
    setManagementDetails({
      username: management.username,
      password: "",
      email: management.email,
      firstName: management.firstName,
      lastName: management.lastName,
      mobile: management.mobile,
      address: management.address,
      kyc: management.kyc,
    })
    setKycPreview(management.kyc)
    setIsModalOpen(true)
  }

  const validateManagementDetails = () => {
    const { username, password, email, firstName, lastName, mobile, address, kyc } = managementDetails

    if (!username.trim()) {
      toast.error("Username is required")
      return false
    }
    if (!email.trim() || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      toast.error("Valid email is required")
      return false
    }
    if (!isEditing && (!password.trim() || password.length < 6)) {
      toast.error("Password must be at least 6 characters long")
      return false
    }
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First and last name are required")
      return false
    }
    if (!mobile.trim() || !/^\d{10}$/.test(mobile)) {
      toast.error("Valid 10-digit mobile number is required")
      return false
    }
    if (!address.trim()) {
      toast.error("Address is required")
      return false
    }
    if (!isEditing && !kyc) {
      toast.error("KYC document is required")
      return false
    }

    return true
  }

  const handleAddManagement = async () => {
    if (!validateManagementDetails()) return

    setLoading(true)

    const formData = new FormData()
    for (const key in managementDetails) {
      if (managementDetails[key]) {
        formData.append(key, managementDetails[key])
      }
    }

    try {
      const response = await axiosInstance.post("/api/management/create", formData)
      toast.success(response.data.message || "Sales user added successfully!")
      setIsModalOpen(false)
      fetchManagements(page, pageSize, searchTerm)
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to add sales user!"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveManagement = async () => {
    if (!validateManagementDetails()) return

    setLoading(true)

    const formData = new FormData()
    for (const key in managementDetails) {
      if (managementDetails[key]) {
        formData.append(key, managementDetails[key])
      }
    }

    try {
      const response = await axiosInstance.put(`/api/management/${selectedManagementId}`, formData)
      toast.success(response.data.message || "Sales user updated successfully!")
      setIsModalOpen(false)
      fetchManagements(page, pageSize, searchTerm)
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update sales user!"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteManagement = async (managementId) => {
    setLoading(true)
    try {
      const response = await axiosInstance.delete(`/api/management/${managementId}`)
      toast.success(response.data.message || "Sales user deleted successfully!")
      fetchManagements(page, pageSize, searchTerm)
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete sales user!"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleManagementStatus = async (managementId, newStatus) => {
    try {
      const response = await axiosInstance.put(`/api/activation/management/${managementId}/activate`, {
        isActive: newStatus,
      })
      toast.success(response.data.message || `Sales user ${newStatus ? "enabled" : "disabled"} successfully!`)
      fetchManagements(page, pageSize, searchTerm)
    } catch (error) {
      toast.error("Failed to update sales user status")
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Sales</h1>
        <Button onClick={handleOpenModal} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Sales User
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">Sales Team List</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search sales users..."
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
                  <TableHead className="font-semibold text-gray-700">Email</TableHead>
                  <TableHead className="font-semibold text-gray-700">Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Mobile</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700">KYC</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {loading ? "Loading..." : "No sales users found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  managements.map((management) => (
                    <TableRow key={management._id} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">{management.username}</TableCell>
                      <TableCell>{management.email}</TableCell>
                      <TableCell>{`${management.firstName} ${management.lastName}`}</TableCell>
                      <TableCell>{management.mobile}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div
                            className={`mr-2 h-2.5 w-2.5 rounded-full ${
                              management.isActive ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span className={management.isActive ? "text-green-700" : "text-red-700"}>
                            {management.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {management.kyc ? (
                          <a
                            href={management.kyc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-gray-400">No file</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            <DropdownMenuItem
                              onClick={() => handleEditManagement(management)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                openConfirmModal(
                                  `Are you sure you want to ${management.isActive ? "disable" : "enable"} this sales user?`,
                                  () => handleToggleManagementStatus(management._id, !management.isActive),
                                )
                              }
                              className="cursor-pointer"
                            >
                              {management.isActive ? (
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
                            <DropdownMenuItem
                              onClick={() =>
                                openConfirmModal("Are you sure you want to delete this sales user?", () =>
                                  handleDeleteManagement(management._id),
                                )
                              }
                              className="text-red-600 cursor-pointer"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
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
              Showing <span className="font-medium">{managements.length}</span> of{" "}
              <span className="font-medium">{totalManagements}</span> sales users
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
                disabled={(page + 1) * pageSize >= totalManagements}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(Math.floor(totalManagements / pageSize))}
                disabled={(page + 1) * pageSize >= totalManagements}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Management Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              {isEditing ? "Edit Sales User" : "Create New Sales User"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {isEditing ? "Update sales user information in the system." : "Add a new sales user to the system."}
            </DialogDescription>
          </DialogHeader>
          {loading && <LinearProgress indeterminate className="mb-4" />}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="Enter username"
                  value={managementDetails.username}
                  onChange={handleInputChange}
                  disabled={isEditing}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  placeholder="Enter email"
                  value={managementDetails.email}
                  onChange={handleInputChange}
                  disabled={isEditing}
                  className="border-gray-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Password {isEditing && "(leave blank to keep current)"}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={managementDetails.password}
                  onChange={handleInputChange}
                  disabled={isEditing}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-gray-700">
                  Mobile
                </Label>
                <Input
                  id="mobile"
                  name="mobile"
                  placeholder="Enter mobile number"
                  value={managementDetails.mobile}
                  onChange={handleInputChange}
                  className="border-gray-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-700">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="Enter first name"
                  value={managementDetails.firstName}
                  onChange={handleInputChange}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-700">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Enter last name"
                  value={managementDetails.lastName}
                  onChange={handleInputChange}
                  className="border-gray-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-700">
                Address
              </Label>
              <Input
                id="address"
                name="address"
                placeholder="Enter address"
                value={managementDetails.address}
                onChange={handleInputChange}
                className="border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kyc" className="text-gray-700">
                KYC Document
              </Label>
              <Input
                id="kyc"
                name="kyc"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="border-gray-200"
              />
              {(kycPreview || managementDetails.kyc) && (
                <div className="mt-2">
                  {kycPreview && kycPreview.startsWith("http") ? (
                    <img
                      src={kycPreview || "/placeholder.svg"}
                      alt="KYC Preview"
                      className="h-24 w-auto rounded-md object-cover"
                    />
                  ) : (
                    <div className="text-sm text-gray-500">
                      {isEditing ? "Current document will be kept unless changed" : "Document selected"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} className="border-gray-200 text-gray-700">
              Cancel
            </Button>
            <Button
              onClick={isEditing ? handleSaveManagement : handleAddManagement}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEditing ? "Save Changes" : "Create Sales User"}
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
    </div>
  )
}

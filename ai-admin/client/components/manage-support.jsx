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

export default function ManageSupport() {
  const [supports, setSupports] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalSupports, setTotalSupports] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmMessage, setConfirmMessage] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [selectedSupportId, setSelectedSupportId] = useState(null)
  const [kycPreview, setKycPreview] = useState(null)

  const [supportDetails, setSupportDetails] = useState({
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
    fetchSupports(page, pageSize, searchTerm)
  }, [page, pageSize, searchTerm])

  const fetchSupports = async (page, pageSize, searchTerm = "") => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/support", {
        params: { page, pageSize, search: searchTerm },
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      setSupports(response.data.supports || [])
      setTotalSupports(response.data.total || 0)
    } catch (error) {
      console.error("Error fetching supports:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSupportDetails({ ...supportDetails, [name]: value })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSupportDetails((prevState) => ({
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
    setSupportDetails({
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

  const handleEditSupport = (support) => {
    setIsEditing(true)
    setSelectedSupportId(support._id)
    setSupportDetails({
      username: support.username,
      password: "",
      email: support.email,
      firstName: support.firstName,
      lastName: support.lastName,
      mobile: support.mobile,
      address: support.address,
      kyc: support.kyc,
    })
    setKycPreview(support.kyc)
    setIsModalOpen(true)
  }

  const validateSupportDetails = () => {
    const { username, password, email, firstName, lastName, mobile, address, kyc } = supportDetails

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

  const handleAddSupport = async () => {
    if (!validateSupportDetails()) return

    setLoading(true)

    const formData = new FormData()
    for (const key in supportDetails) {
      if (supportDetails[key]) {
        formData.append(key, supportDetails[key])
      }
    }

    try {
      const response = await axiosInstance.post("/api/Support/create", formData)
      toast.success(response.data.message || "Support added successfully!")
      setIsModalOpen(false)
      fetchSupports(page, pageSize, searchTerm)
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to add support!"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSupport = async () => {
    if (!validateSupportDetails()) return

    setLoading(true)

    const formData = new FormData()
    for (const key in supportDetails) {
      if (supportDetails[key]) {
        formData.append(key, supportDetails[key])
      }
    }

    try {
      const response = await axiosInstance.put(`/api/support/${selectedSupportId}`, formData)
      toast.success(response.data.message || "Support updated successfully!")
      setIsModalOpen(false)
      fetchSupports(page, pageSize, searchTerm)
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update support!"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSupport = async (supportId) => {
    setLoading(true)
    try {
      const response = await axiosInstance.delete(`/api/support/${supportId}`)
      toast.success(response.data.message || "Support deleted successfully!")
      fetchSupports(page, pageSize, searchTerm)
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete support!"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSupportStatus = async (supportId, newStatus) => {
    try {
      const response = await axiosInstance.put(`/api/activation/Support/${supportId}/activate`, { isActive: newStatus })
      toast.success(response.data.message || `Support ${newStatus ? "enabled" : "disabled"} successfully!`)
      fetchSupports(page, pageSize, searchTerm)
    } catch (error) {
      toast.error("Failed to update support status")
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
        <h1 className="text-2xl font-bold text-gray-800">Manage Support</h1>
        <Button onClick={handleOpenModal} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Support
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">Support List</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search support..."
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
                {supports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {loading ? "Loading..." : "No support users found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  supports.map((support) => (
                    <TableRow key={support._id} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">{support.username}</TableCell>
                      <TableCell>{support.email}</TableCell>
                      <TableCell>{`${support.firstName} ${support.lastName}`}</TableCell>
                      <TableCell>{support.mobile}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div
                            className={`mr-2 h-2.5 w-2.5 rounded-full ${
                              support.isActive ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span className={support.isActive ? "text-green-700" : "text-red-700"}>
                            {support.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {support.kyc ? (
                          <a
                            href={support.kyc}
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
                            <DropdownMenuItem onClick={() => handleEditSupport(support)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                openConfirmModal(
                                  `Are you sure you want to ${support.isActive ? "disable" : "enable"} this support user?`,
                                  () => handleToggleSupportStatus(support._id, !support.isActive),
                                )
                              }
                              className="cursor-pointer"
                            >
                              {support.isActive ? (
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
                                openConfirmModal("Are you sure you want to delete this support user?", () =>
                                  handleDeleteSupport(support._id),
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
              Showing <span className="font-medium">{supports.length}</span> of{" "}
              <span className="font-medium">{totalSupports}</span> support users
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
                disabled={(page + 1) * pageSize >= totalSupports}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(Math.floor(totalSupports / pageSize))}
                disabled={(page + 1) * pageSize >= totalSupports}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              {isEditing ? "Edit Support User" : "Create New Support User"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {isEditing ? "Update support user information in the system." : "Add a new support user to the system."}
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
                  value={supportDetails.username}
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
                  value={supportDetails.email}
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
                  value={supportDetails.password}
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
                  value={supportDetails.mobile}
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
                  value={supportDetails.firstName}
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
                  value={supportDetails.lastName}
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
                value={supportDetails.address}
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
              {(kycPreview || supportDetails.kyc) && (
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
              onClick={isEditing ? handleSaveSupport : handleAddSupport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEditing ? "Save Changes" : "Create Support User"}
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

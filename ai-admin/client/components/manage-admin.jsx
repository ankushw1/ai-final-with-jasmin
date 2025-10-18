"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useUser } from "@/context/user-context"
import useAxios from "@/hooks/use-axios"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, MoreHorizontal, Plus, Search, Trash } from 'lucide-react'

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

export default function ManageAdmin() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalAdmins, setTotalAdmins] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmMessage, setConfirmMessage] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [selectedAdminId, setSelectedAdminId] = useState(null)

  const [adminDetails, setAdminDetails] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
  })

  const axiosInstance = useAxios()
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    fetchAdmins(page, pageSize, searchTerm)
  }, [page, pageSize, searchTerm])

  const fetchAdmins = async (page, pageSize, searchTerm = "") => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/admin/all", {
        params: { page, pageSize, search: searchTerm },
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      setAdmins(response.data.admins || [])
      setTotalAdmins(response.data.total || 0)
    } catch (error) {
      console.error("Error fetching admins:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setAdminDetails({ ...adminDetails, [name]: value })
  }

  const handleOpenModal = () => {
    setIsEditing(false)
    setAdminDetails({
      name: "",
      email: "",
      password: "",
      mobile: "",
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleEditAdmin = (admin) => {
    setIsEditing(true)
    setSelectedAdminId(admin._id)
    setAdminDetails({
      name: admin.name,
      email: admin.email,
      password: "",
      mobile: admin.mobile,
    })
    setIsModalOpen(true)
  }

  const validateAdminDetails = () => {
    const { name, email, password, mobile } = adminDetails
    if (!name.trim()) {
      toast.error("Name is required")
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
    if (!mobile.trim() || !/^\d{10}$/.test(mobile)) {
      toast.error("Valid 10-digit mobile number is required")
      return false
    }
    return true
  }

  const handleAddAdmin = async () => {
    if (!validateAdminDetails()) return

    setLoading(true)
    try {
      const response = await axiosInstance.post("/api/admin/create", adminDetails)
      toast.success(response.data.message || "Admin added successfully!")
      setIsModalOpen(false)
      fetchAdmins(page, pageSize, searchTerm)
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to add admin!"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAdmin = async () => {
    if (!validateAdminDetails()) return

    setLoading(true)
    try {
      const response = await axiosInstance.put(`/api/admin/${selectedAdminId}`, adminDetails)
      toast.success(response.data.message || "Admin updated successfully!")
      setIsModalOpen(false)
      fetchAdmins(page, pageSize, searchTerm)
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update admin!"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAdmin = async (adminId) => {
    setLoading(true)
    try {
      const response = await axiosInstance.delete(`/api/admin/${adminId}`)
      toast.success(response.data.message || "Admin deleted successfully!")
      fetchAdmins(page, pageSize, searchTerm)
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete admin!"
      toast.error(errorMessage)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Admins</h1>
        <Button onClick={handleOpenModal} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Admin
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">Admin List</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search admins..."
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
                  <TableHead className="font-semibold text-gray-700">Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Email</TableHead>
                  <TableHead className="font-semibold text-gray-700">Mobile</TableHead>
                  <TableHead className="font-semibold text-gray-700">Role</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {loading ? "Loading..." : "No admins found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin._id} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.mobile}</TableCell>
                      <TableCell>{admin.role === 1 ? "Admin" : "User"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            <DropdownMenuItem onClick={() => handleEditAdmin(admin)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                openConfirmModal("Are you sure you want to delete this admin?", () =>
                                  handleDeleteAdmin(admin._id),
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
              Showing <span className="font-medium">{admins.length}</span> of{" "}
              <span className="font-medium">{totalAdmins}</span> admins
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
                disabled={(page + 1) * pageSize >= totalAdmins}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(Math.floor(totalAdmins / pageSize))}
                disabled={(page + 1) * pageSize >= totalAdmins}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              {isEditing ? "Edit Admin" : "Create New Admin"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {isEditing ? "Update admin information in the system." : "Add a new admin to the system."}
            </DialogDescription>
          </DialogHeader>
          {loading && <LinearProgress indeterminate className="mb-4" />}

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter name"
                value={adminDetails.name}
                onChange={handleInputChange}
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
                value={adminDetails.email}
                onChange={handleInputChange}
                disabled={isEditing}
                className="border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                Password {isEditing && "(leave blank to keep current)"}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter password"
                value={adminDetails.password}
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
                value={adminDetails.mobile}
                onChange={handleInputChange}
                className="border-gray-200"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} className="border-gray-200 text-gray-700">
              Cancel
            </Button>
            <Button
              onClick={isEditing ? handleSaveAdmin : handleAddAdmin}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEditing ? "Save Changes" : "Create Admin"}
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

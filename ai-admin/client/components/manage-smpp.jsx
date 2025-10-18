"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useUser } from "@/context/user-context"
import useAxios from "@/hooks/use-axios"
import { Ban, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, MoreHorizontal, Play, Plus, Search, Trash } from 'lucide-react'

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

export default function SMPP() {
  const [smpps, setSmpps] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalSmpp, setTotalSmpp] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmMessage, setConfirmMessage] = useState("")

  const [smppDetails, setSmppDetails] = useState({ 
    name: "" 
  })

  const [editSmppDetails, setEditSmppDetails] = useState({
    smpp_name: "",
    host: "",
    port: "",
    bind: "",
    src_ton: "",
    src_npi: "",
    dst_ton: "",
    dst_npi: "",
    bind_ton: "",
    bind_npi: "",
    submit_throughput: "",
    username: "",
    password: "",
  })

  const axiosInstance = useAxios()
  const { user } = useUser()

  useEffect(() => {
    fetchSmpp()
  }, [page, pageSize])

  const fetchSmpp = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/smpp/all")
      if (response.status === 200) {
        setSmpps(response.data.connectors || [])
        setTotalSmpp(response.data.connectors.length || 0)
      } else {
        toast.error(response.data?.message || "Error fetching SMPP connectors")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error fetching SMPP connectors")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSmppDetails({ ...smppDetails, [name]: value })
  }

  const handleOpenModal = () => {
    setSmppDetails({ name: "" })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleAddSmpp = async () => {
    if (!smppDetails.name.trim()) {
      toast.error("SMPP Name is required")
      return
    }

    setLoading(true)
    try {
      const response = await axiosInstance.post("/api/smpp/create", {
        smppName: smppDetails.name,
      })

      if (response.status === 200) {
        toast.success(response.data?.message || "SMPP added successfully!")
        setIsModalOpen(false)
        setSmppDetails({ name: "" })
        fetchSmpp()
      } else {
        toast.error(response.data?.error || "Failed to add SMPP")
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to add SMPP")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSmpp = async (smppName) => {
    setLoading(true)
    try {
      const response = await axiosInstance.delete("/api/smpp", {
        params: { smppName },
      })

      if (response.status === 200) {
        toast.success(response.data?.message || "SMPP deleted successfully!")
        fetchSmpp()
      } else {
        toast.error(response.data?.message || "Failed to delete SMPP")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete SMPP")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (name, currentStatus) => {
    setLoading(true)
    const smppName = name
    try {
      const action = currentStatus === "started" ? "disable" : "enable"
      const response = await axiosInstance.put(`/api/smpp/${action}`, {
        params: { smppName },
      })

      if (response.status === 200) {
        toast.success(response.data?.message || `SMPP ${action}d successfully!`)
        fetchSmpp()
      } else {
        toast.error(response.data?.message || `Failed to ${action} SMPP`)
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to ${action} SMPP`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = async (row) => {
    try {
      // Fetch the SMPP details using the cid (SMPP name)
      const response = await axiosInstance.get("/api/smpp/details", {
        params: { smppName: row.cid },
      })

      if (response.status === 200) {
        // Set the fetched details into editSmppDetails
        setEditSmppDetails({
          ...response.data.connector,
          smpp_name: row.cid,
        })
        setIsEditModalOpen(true)
      } else {
        toast.error(response.data?.message || "Failed to fetch SMPP details")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch SMPP details")
    }
  }

  const handleUpdateSmpp = async () => {
    setLoading(true)

    try {
      const response = await axiosInstance.post("/api/smpp/update", editSmppDetails)

      if (response.status === 200) {
        toast.success("SMPP updated successfully!")
        setIsEditModalOpen(false)
        fetchSmpp()
      } else {
        toast.error(response.data?.message || "Failed to update SMPP")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update SMPP")
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
        <h1 className="text-2xl font-bold text-gray-800">SMPP Carrier</h1>
        <Button onClick={handleOpenModal} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" /> Add SMPP
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">SMPP Carriers List</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search SMPP..."
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
                  <TableHead className="font-semibold text-gray-700">CID Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Host</TableHead>
                  <TableHead className="font-semibold text-gray-700">Port</TableHead>
                  <TableHead className="font-semibold text-gray-700">Username</TableHead>
                  <TableHead className="font-semibold text-gray-700">Password</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {smpps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {loading ? "Loading..." : "No SMPP carriers found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  smpps.map((smpp) => (
                    <TableRow key={smpp.cid} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">{smpp.cid}</TableCell>
                      <TableCell>{smpp.host}</TableCell>
                      <TableCell>{smpp.port}</TableCell>
                      <TableCell>{smpp.username}</TableCell>
                      <TableCell>{smpp.password}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div
                            className={`mr-2 h-2.5 w-2.5 rounded-full ${
                              smpp.status === "started" ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span className={smpp.status === "enabled" ? "text-green-700" : "text-red-700"}>
                            {smpp.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            <DropdownMenuItem onClick={() => handleEditClick(smpp)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                openConfirmModal(
                                  `Are you sure you want to ${smpp.status === "started" ? "disable" : "enable"} this SMPP?`,
                                  () => handleToggleStatus(smpp.cid, smpp.status),
                                )
                              }
                              className="cursor-pointer"
                            >
                              {smpp.status === "started" ? (
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
                                openConfirmModal("Are you sure you want to delete this SMPP?", () =>
                                  handleDeleteSmpp(smpp.cid),
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
              Showing <span className="font-medium">{smpps.length}</span> of{" "}
              <span className="font-medium">{totalSmpp}</span> SMPP carriers
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
                disabled={(page + 1) * pageSize >= totalSmpp}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(Math.floor(totalSmpp / pageSize))}
                disabled={(page + 1) * pageSize >= totalSmpp}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add SMPP Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              Create New SMPP
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Add a new SMPP carrier to the system.
            </DialogDescription>
          </DialogHeader>
          {loading && <LinearProgress indeterminate className="mb-4" />}

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700">
                SMPP Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter SMPP name"
                value={smppDetails.name}
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
              onClick={handleAddSmpp}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create SMPP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit SMPP Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={() => setIsEditModalOpen(false)}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              Edit SMPP Details
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Update SMPP carrier configuration.
            </DialogDescription>
          </DialogHeader>
          {loading && <LinearProgress indeterminate className="mb-4" />}

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="smpp_name" className="text-gray-700">
                SMPP Name
              </Label>
              <Input
                id="smpp_name"
                name="smpp_name"
                value={editSmppDetails.smpp_name}
                onChange={(e) => setEditSmppDetails({...editSmppDetails, smpp_name: e.target.value})}
                className="border-gray-200"
                disabled={isEditModalOpen}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="host" className="text-gray-700">
                Host
              </Label>
              <Input
                id="host"
                name="host"
                value={editSmppDetails.host}
                onChange={(e) => setEditSmppDetails({...editSmppDetails, host: e.target.value})}
                className="border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="port" className="text-gray-700">
                Port
              </Label>
              <Input
                id="port"
                name="port"
                value={editSmppDetails.port}
                onChange={(e) => setEditSmppDetails({...editSmppDetails, port: e.target.value})}
                className="border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bind" className="text-gray-700">
                Bind Type
              </Label>
              <Input
                id="bind"
                name="bind"
                value={editSmppDetails.bind}
                onChange={(e) => setEditSmppDetails({...editSmppDetails, bind: e.target.value})}
                className="border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="src_ton" className="text-gray-700">
                Source TON
              </Label>
              <Input
                id="src_ton"
                name="src_ton"
                value={editSmppDetails.src_ton}
                onChange={(e) => setEditSmppDetails({...editSmppDetails, src_ton: e.target.value})}
                className="border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="src_npi" className="text-gray-700">
                Source NPI
              </Label>
              <Input
                id="src_npi"
                name="src_npi"
                value={editSmppDetails.src_npi}
                onChange={(e) => setEditSmppDetails({...editSmppDetails, src_npi: e.target.value})}
                className="border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dst_ton" className="text-gray-700">
                Destination TON
              </Label>
              <Input
                id="dst_ton"
                name="dst_ton"
                value={editSmppDetails.dst_ton}
                onChange={(e) => setEditSmppDetails({...editSmppDetails, dst_ton: e.target.value})}
                className="border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dst_npi" className="text-gray-700">
                Destination NPI
              </Label>
              <Input
                id="dst_npi"
                name="dst_npi"
                value={editSmppDetails.dst_npi}
                onChange={(e) => setEditSmppDetails({...editSmppDetails, dst_npi: e.target.value})}
                className="border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bind_ton" className="text-gray-700">
                Bind TON
              </Label>
              <Input
                id="bind_ton"
                name="bind_ton"
                value={editSmppDetails.bind_ton}
                onChange={(e) => setEditSmppDetails({...editSmppDetails, bind_ton: e.target.value})}
                className="border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bind_npi" className="text-gray-700">
                Bind NPI
              </Label>
              <Input
                id="bind_npi"
                name="bind_npi"
                value={editSmppDetails.bind_npi}
                onChange={(e) => setEditSmppDetails({...editSmppDetails, bind_npi: e.target.value})}
                className="border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="submit_throughput" className="text-gray-700">
                SMPP Throughput
              </Label>
              <Input
                id="submit_throughput"
                name="submit_throughput"
                value={editSmppDetails.submit_throughput}
                onChange={(e) => setEditSmppDetails({...editSmppDetails, submit_throughput: e.target.value})}
                className="border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                value={editSmppDetails.username}
                onChange={(e) => setEditSmppDetails({...editSmppDetails, username: e.target.value})}
                className="border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                value={editSmppDetails.password}
                onChange={(e) => setEditSmppDetails({...editSmppDetails, password: e.target.value})}
                className="border-gray-200"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-gray-200 text-gray-700">
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSmpp}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Update SMPP
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

"use client"

import { useState, useEffect } from "react"
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
  MoreHorizontal,
  Play,
  Search,
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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ManageSMSUsers() {
  const [smsUsers, setSmsUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalSmsUsers, setTotalSmsUsers] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmMessage, setConfirmMessage] = useState("")
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [currentTab, setCurrentTab] = useState("balance")
  const [isBalanceDisabled, setIsBalanceDisabled] = useState(false)

  const [userBalanceData, setUserBalanceData] = useState({
    balance_amt: "",
    balance_sms: "",
    balance_percent: "",
    smpp_tput: "",
    http_tput: "",
  })

  const [userPermissions, setUserPermissions] = useState({
    http_send: false,
    dlr_method: false,
    http_balance: false,
    smpps_send: false,
    priority: false,
    long_content: false,
    src_addr: false,
    dlr_level: false,
    http_rate: false,
    valid_period: false,
    http_bulk: false,
    hex_content: false,
  })

  const axiosInstance = useAxios()
  const { user } = useUser()

  useEffect(() => {
    fetchSmsUsers()
  }, [page, pageSize, searchTerm])

  const fetchSmsUsers = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/users/all")
      if (response.status === 200) {
        setSmsUsers(response.data.users || [])
        setTotalSmsUsers(response.data.users.length || 0)
      }
    } catch (error) {
      toast.error("Failed to fetch SMS users")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleEditClick = (user) => {
    setSelectedUserId(user.uid)

    // Pre-fill balance data
    setUserBalanceData({
      balance_amt: user.mt_messaging_cred?.quota?.balance || "",
      balance_sms: user.mt_messaging_cred?.quota?.sms_count || "",
      balance_percent: user.mt_messaging_cred?.quota?.early_percent || "",
      smpp_tput: user.mt_messaging_cred?.quota?.smpps_throughput || "",
      http_tput: user.mt_messaging_cred?.quota?.http_throughput || "",
    })

    // Check if balance is a number or "ND"
    const balanceValue = user.mt_messaging_cred?.quota?.balance
    setIsBalanceDisabled(
      balanceValue !== "ND" &&
      balanceValue !== undefined &&
      balanceValue !== null &&
      balanceValue !== "" &&
      balanceValue.toLowerCase() !== "nan"
    );
    

    // Pre-fill permissions
    const auth = user.mt_messaging_cred?.authorization || {}
    setUserPermissions({
      http_send: auth.http_send === "True",
      dlr_method: auth.http_dlr_method === "True",
      http_balance: auth.http_balance === "True",
      smpps_send: auth.smpps_send === "True",
      priority: auth.priority === "True",
      long_content: auth.http_long_content === "True",
      src_addr: auth.src_addr === "True",
      dlr_level: auth.dlr_level === "True",
      http_rate: auth.http_rate === "True",
      valid_period: auth.validity_period === "True",
      http_bulk: auth.http_bulk === "True",
      hex_content: auth.hex_content === "True",
    })

    setIsModalOpen(true)
  }

  const handleUpdateUserBalance = async () => {
    if (!selectedUserId) {
      toast.error("User not selected")
      return
    }

    // Build params object, excluding disabled balance_amt field
    const params = {
      user_name: selectedUserId,
    }

    // Only add balance_amt if it's not disabled
    if (!isBalanceDisabled && userBalanceData.balance_amt) {
      params.balance_amt = userBalanceData.balance_amt
    }

    // Add other required fields
    if (userBalanceData.balance_sms) params.balance_sms = userBalanceData.balance_sms
    if (userBalanceData.balance_percent) params.balance_percent = userBalanceData.balance_percent
    if (userBalanceData.smpp_tput) params.smpp_tput = userBalanceData.smpp_tput
    if (userBalanceData.http_tput) params.http_tput = userBalanceData.http_tput

    // Validate required fields (excluding balance_amt if disabled)
    const requiredFields = ["balance_sms", "balance_percent", "smpp_tput", "http_tput"]
    const missingFields = requiredFields.filter((field) => !userBalanceData[field])

    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields.join(", ")}`)
      return
    }

    setLoading(true)
    try {
      const response = await axiosInstance.post("/api/users/balance", null, { params })

      if (response.status === 200) {
        toast.success("User balance updated successfully")
        setIsModalOpen(false)
        clearStates()
        fetchSmsUsers()
      }
    } catch (error) {
      toast.error("Failed to update user balance")
      console.error("Balance update error:", error.response?.data || error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePermissions = async () => {
    setLoading(true)

    if (!selectedUserId) {
      toast.error("User not selected")
      return
    }

    try {
      const response = await axiosInstance.post("/api/users/permissions", null, {
        params: {
          user_name: selectedUserId,
          http_send: userPermissions.http_send ? "1" : "0",
          dlr_method: userPermissions.dlr_method ? "1" : "0",
          http_balance: userPermissions.http_balance ? "1" : "0",
          smpps_send: userPermissions.smpps_send ? "1" : "0",
          priority: userPermissions.priority ? "1" : "0",
          long_content: userPermissions.long_content ? "1" : "0",
          src_addr: userPermissions.src_addr ? "1" : "0",
          dlr_level: userPermissions.dlr_level ? "1" : "0",
          http_rate: userPermissions.http_rate ? "1" : "0",
          valid_period: userPermissions.valid_period ? "1" : "0",
          http_bulk: userPermissions.http_bulk ? "1" : "0",
          hex_content: userPermissions.hex_content ? "1" : "0",
        },
      })

      if (response.status === 200) {
        toast.success("User permissions updated successfully")
        setIsModalOpen(false)
        clearStates()
        fetchSmsUsers()
      }
    } catch (error) {
      toast.error("Failed to update user permissions")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUserStatus = async (username, currentStatus) => {
    setLoading(true)
    try {
      const action = currentStatus === "enabled" ? "disable" : "enable"
      const response = await axiosInstance.post(`/api/users/${action}/${username}`)

      if (response.status === 200) {
        toast.success(`SMS User ${action}d successfully!`)
        fetchSmsUsers()
      }
    } catch (error) {
      console.error(error.response?.data || error.message)
      toast.error(`Failed to ${currentStatus === "enabled" ? "disable" : "enable"} SMS User`)
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

  const clearStates = () => {
    setUserBalanceData({
      balance_amt: "",
      balance_sms: "",
      balance_percent: "",
      smpp_tput: "",
      http_tput: "",
    })

    setUserPermissions({
      http_send: false,
      dlr_method: false,
      http_balance: false,
      smpps_send: false,
      priority: false,
      long_content: false,
      src_addr: false,
      dlr_level: false,
      http_rate: false,
      valid_period: false,
      http_bulk: false,
      hex_content: false,
    })

    setSelectedUserId(null)
    setIsBalanceDisabled(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage SMS Users</h1>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">SMS Users List</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search users..."
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
                  <TableHead className="font-semibold text-gray-700">GID</TableHead>
                  <TableHead className="font-semibold text-gray-700">UID</TableHead>
                  <TableHead className="font-semibold text-gray-700">Username</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700">Balance</TableHead>
                  <TableHead className="font-semibold text-gray-700">HTTP Throughput</TableHead>
                  <TableHead className="font-semibold text-gray-700">SMPP Throughput</TableHead>
                  <TableHead className="font-semibold text-gray-700">Early Percent</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {smsUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      {loading ? "Loading..." : "No SMS users found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  smsUsers.map((user) => (
                    <TableRow key={user.uid} className="border-b hover:bg-gray-50">
                      <TableCell>{user.gid}</TableCell>
                      <TableCell>{user.uid}</TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div
                            className={`mr-2 h-2.5 w-2.5 rounded-full ${
                              user.status === "enabled" ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span className={user.status === "enabled" ? "text-green-700" : "text-red-700"}>
                            {user.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{user.mt_messaging_cred?.quota?.balance || "ND"}</TableCell>
                      <TableCell>{user.mt_messaging_cred?.quota?.http_throughput || "ND"}</TableCell>
                      <TableCell>{user.mt_messaging_cred?.quota?.smpps_throughput || "ND"}</TableCell>
                      <TableCell>{user.mt_messaging_cred?.quota?.early_percent || "ND"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white">
                            <DropdownMenuItem onClick={() => handleEditClick(user)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                openConfirmModal(
                                  `Are you sure you want to ${user.status === "enabled" ? "disable" : "enable"} this user?`,
                                  () => handleToggleUserStatus(user.uid, user.status),
                                )
                              }
                              className="cursor-pointer"
                            >
                              {user.status === "enabled" ? (
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
              Showing <span className="font-medium">{smsUsers.length}</span> of{" "}
              <span className="font-medium">{totalSmsUsers}</span> users
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
                disabled={(page + 1) * pageSize >= totalSmsUsers}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(Math.floor(totalSmsUsers / pageSize))}
                disabled={(page + 1) * pageSize >= totalSmsUsers}
                className="h-8 w-8 border-gray-200"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Edit SMS User</DialogTitle>
            <DialogDescription className="text-gray-500">Update user settings and permissions</DialogDescription>
          </DialogHeader>
          {loading && <LinearProgress indeterminate className="mb-4" />}

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="balance">User Balance</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="balance" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="balance_amt" className="text-gray-700">
                    Balance Amount {isBalanceDisabled && "(Disabled - has existing balance)"}
                  </Label>
                  <Input
                    id="balance_amt"
                    type="number"
                    value={userBalanceData.balance_amt}
                    onChange={(e) => setUserBalanceData({ ...userBalanceData, balance_amt: e.target.value })}
                    className="border-gray-200"
                    disabled={isBalanceDisabled}
                    placeholder={
                      isBalanceDisabled ? "Field disabled - user has existing balance" : "Enter balance amount"
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="balance_sms" className="text-gray-700">
                    Balance SMS
                  </Label>
                  <Input
                    id="balance_sms"
                    type="number"
                    value={userBalanceData.balance_sms}
                    onChange={(e) => setUserBalanceData({ ...userBalanceData, balance_sms: e.target.value })}
                    className="border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="balance_percent" className="text-gray-700">
                    Balance Percent
                  </Label>
                  <Input
                    id="balance_percent"
                    type="number"
                    value={userBalanceData.balance_percent}
                    onChange={(e) => setUserBalanceData({ ...userBalanceData, balance_percent: e.target.value })}
                    className="border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smpp_tput" className="text-gray-700">
                    SMPP Throughput
                  </Label>
                  <Input
                    id="smpp_tput"
                    type="number"
                    value={userBalanceData.smpp_tput}
                    onChange={(e) => setUserBalanceData({ ...userBalanceData, smpp_tput: e.target.value })}
                    className="border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="http_tput" className="text-gray-700">
                    HTTP Throughput
                  </Label>
                  <Input
                    id="http_tput"
                    type="number"
                    value={userBalanceData.http_tput}
                    onChange={(e) => setUserBalanceData({ ...userBalanceData, http_tput: e.target.value })}
                    className="border-gray-200"
                  />
                </div>
              </div>

              <Button
                onClick={handleUpdateUserBalance}
                disabled={loading}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Update Balance
              </Button>
            </TabsContent>

            <TabsContent value="permissions" className="mt-4">
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(userPermissions).map(([permission, value]) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Switch
                      id={permission}
                      checked={value}
                      onCheckedChange={(checked) => setUserPermissions({ ...userPermissions, [permission]: checked })}
                    />
                    <Label htmlFor={permission} className="text-gray-700">
                      {permission.replace(/_/g, " ").toUpperCase()}
                    </Label>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleUpdatePermissions}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                Update Permissions
              </Button>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} className="border-gray-200 text-gray-700">
              Close
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

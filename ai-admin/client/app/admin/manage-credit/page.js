"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import useAxios from "@/hooks/use-axios"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, Search, DollarSign } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LinearProgress } from "@/components/ui/linear-progress"
import { Textarea } from "@/components/ui/textarea"

export default function CreditPage() {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState("")
  const [creditHistory, setCreditHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalHistory, setTotalHistory] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [isAddCreditModalOpen, setIsAddCreditModalOpen] = useState(false)
  const [currentBalance, setCurrentBalance] = useState(0)
  const [creditAmount, setCreditAmount] = useState("")
  const [description, setDescription] = useState("")

  const axiosInstance = useAxios()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      fetchCreditHistory()
    } else {
      setCreditHistory([])
      setTotalHistory(0)
      setCurrentBalance(0)
    }
  }, [selectedUser, page, pageSize])

  // Update current balance when users data changes and a user is selected
  useEffect(() => {
    if (selectedUser && users.length > 0) {
      const user = users.find((u) => u.username === selectedUser)
      if (user) {
        setCurrentBalance(Number.parseFloat(user?.balance || 0))
      }
    }
  }, [users, selectedUser])

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/api/credit/users")
      if (response.status === 200) {
        setUsers(response.data.users || [])
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast.error("Failed to fetch users")
    }
  }

  const fetchCreditHistory = async () => {
    if (!selectedUser) return

    setLoading(true)
    try {
      const response = await axiosInstance.get(`/api/credit/history/${selectedUser}`)
      if (response.status === 200) {
        setCreditHistory(response.data.history || [])
        setTotalHistory(response.data.history.length || 0)
      }
    } catch (error) {
      console.error("Failed to fetch credit history:", error)
      toast.error("Failed to fetch credit history")
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setLoading(true)
    try {
      // First fetch updated users data
      await fetchUsers()

      // Then fetch updated credit history if a user is selected
      if (selectedUser) {
        await fetchCreditHistory()
      }
    } catch (error) {
      console.error("Failed to refresh data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCredit = async () => {
    if (!selectedUser || !creditAmount) {
      toast.error("Please select a user and enter credit amount")
      return
    }

    if (Number.parseFloat(creditAmount) <= 0) {
      toast.error("Credit amount must be greater than 0")
      return
    }

    setLoading(true)
    try {
      const response = await axiosInstance.post("/api/credit/add", {
        username: selectedUser,
        creditAmount: Number.parseFloat(creditAmount),
        description: description || `Credit added by admin`,
      })

      if (response.status === 200) {
        toast.success("Credit added successfully")

        // Close modal and reset form
        setIsAddCreditModalOpen(false)
        setCreditAmount("")
        setDescription("")

        // Refresh all data to show updated information
        await refreshData()

        // Reset pagination to first page to see the latest transaction
        setPage(0)
      }
    } catch (error) {
      console.error("Failed to add credit:", error)
      toast.error("Failed to add credit")
    } finally {
      setLoading(false)
    }
  }

  const openAddCreditModal = () => {
    if (!selectedUser) {
      toast.error("Please select a user first")
      return
    }
    setIsAddCreditModalOpen(true)
  }

  // Get paginated data
  const getPaginatedData = () => {
    let filteredHistory = creditHistory

    if (searchTerm) {
      filteredHistory = creditHistory.filter(
        (item) =>
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.transactionType.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    const startIndex = page * pageSize
    const endIndex = startIndex + pageSize
    return filteredHistory.slice(startIndex, endIndex)
  }

  const getFilteredTotal = () => {
    if (!searchTerm) return totalHistory

    return creditHistory.filter(
      (item) =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.transactionType.toLowerCase().includes(searchTerm.toLowerCase()),
    ).length
  }

  const filteredTotal = getFilteredTotal()
  const totalPages = Math.ceil(filteredTotal / pageSize)

  // Reset page when search term changes
  useEffect(() => {
    setPage(0)
  }, [searchTerm])

  // Filter users based on search term
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(userSearchTerm.toLowerCase())
  )

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(Number.parseInt(newPageSize))
    setPage(0) // Reset to first page when changing page size
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Credit Management</h1>
        <Button onClick={refreshData} variant="outline" disabled={loading} className="border-gray-200 bg-transparent">
          Refresh Data
        </Button>
      </div>

      {/* User Selection */}
      <Card className="shadow-sm">
        <CardHeader className="bg-white border-b py-4">
          <CardTitle className="text-lg font-semibold text-gray-800">Select User</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="user-select" className="text-gray-700">
                Choose User
              </Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-full mt-2 border-gray-200">
                  <SelectValue placeholder="Select a user..." />
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
                    <SelectItem key={user.username} value={user.username}>
                      {user.username} - Balance: €
                      {user.balance === "ND" ? "0.00" : Number.parseFloat(user.balance || 0).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedUser && (
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-600">
                  Current Balance: <span className="font-semibold text-green-600">€{currentBalance.toFixed(2)}</span>
                </div>
                <Button onClick={openAddCreditModal} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Credit
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credit History */}
      {selectedUser && (
        <Card className="shadow-sm">
          <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800">Credit History - {selectedUser}</CardTitle>
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
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search history..."
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
                    <TableHead className="font-semibold text-gray-700">Date</TableHead>
                    <TableHead className="font-semibold text-gray-700">Type</TableHead>
                    <TableHead className="font-semibold text-gray-700">Previous Balance</TableHead>
                    <TableHead className="font-semibold text-gray-700">Amount Added</TableHead>
                    <TableHead className="font-semibold text-gray-700">New Balance</TableHead>
                    <TableHead className="font-semibold text-gray-700">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPaginatedData().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {loading
                          ? "Loading..."
                          : searchTerm
                            ? "No matching transactions found"
                            : "No credit history found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    getPaginatedData().map((item, index) => (
                      <TableRow key={`${item.createdAt}-${index}`} className="border-b hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {new Date(item.createdAt).toLocaleDateString()}{" "}
                          {new Date(item.createdAt).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.transactionType === "credit_added"
                                ? "bg-green-100 text-green-800"
                                : item.transactionType === "balance_updated"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.transactionType.replace("_", " ").toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>€{Number.parseFloat(item.previousBalance || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          {item.amountAdded > 0 && (
                            <span className="text-green-600 font-medium">
                              +€{Number.parseFloat(item.amountAdded).toFixed(2)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          €{Number.parseFloat(item.newBalance || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredTotal > 0 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-gray-500">
                  Page <span className="font-medium">{page + 1}</span> of <span className="font-medium">{totalPages}</span> (
                  {filteredTotal} total transactions)
                  {searchTerm && <span> - filtered from {totalHistory} total</span>}
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
      )}

      {/* Add Credit Modal */}
      <Dialog open={isAddCreditModalOpen} onOpenChange={setIsAddCreditModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">Add Credit</DialogTitle>
            <DialogDescription className="text-gray-500">Add credit to {selectedUser}</DialogDescription>
          </DialogHeader>
          {loading && <LinearProgress indeterminate className="mb-4" />}
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Balance:</span>
                <span className="font-semibold text-green-600">€{currentBalance.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-amount" className="text-gray-700">
                Credit Amount (€)
              </Label>
              <Input
                id="credit-amount"
                type="number"
                step="0.01"
                min="0"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Enter amount to add"
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description for this credit transaction"
                className="border-gray-200"
                rows={3}
              />
            </div>
            {creditAmount && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New Balance:</span>
                  <span className="font-semibold text-blue-600">
                    €{(currentBalance + Number.parseFloat(creditAmount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsAddCreditModalOpen(false)}
              className="border-gray-200 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCredit}
              disabled={loading || !creditAmount || Number.parseFloat(creditAmount) <= 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Add Credit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
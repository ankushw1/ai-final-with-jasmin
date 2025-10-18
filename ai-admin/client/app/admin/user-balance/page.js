"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import useAxios from "@/hooks/use-axios"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LinearProgress } from "@/components/ui/linear-progress"
import { Button } from "@/components/ui/button"

export default function UserBalancePage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalUsers, setTotalUsers] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredUsers, setFilteredUsers] = useState([])

  const axiosInstance = useAxios()

  useEffect(() => {
    fetchUserBalances()
  }, [])

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm) {
      const filtered = users.filter((user) => user.username.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredUsers(filtered)
      setTotalUsers(filtered.length)
    } else {
      setFilteredUsers(users)
      setTotalUsers(users.length)
    }
    setPage(0) // Reset to first page when searching
  }, [searchTerm, users])

  const fetchUserBalances = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get("/api/credit/user-balance")
      if (response.status === 200) {
        setUsers(response.data.users || [])
        setFilteredUsers(response.data.users || [])
        setTotalUsers(response.data.users.length || 0)
      }
    } catch (error) {
      toast.error("Failed to fetch user balances")
    } finally {
      setLoading(false)
    }
  }

  // Get paginated data
  const getPaginatedData = () => {
    const startIndex = page * pageSize
    const endIndex = startIndex + pageSize
    return filteredUsers.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(totalUsers / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Balance</h1>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">User Balance List</CardTitle>
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
                  <TableHead className="font-semibold text-gray-700">Username</TableHead>
                  <TableHead className="font-semibold text-gray-700">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getPaginatedData().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                      {loading ? "Loading..." : "No users found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  getPaginatedData().map((user, index) => (
                    <TableRow key={index} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${
                            user.balance === "ND" || user.balance === "0" ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {user.balance === "ND" ? "No Data" : `€${user.balance}`}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{Math.min((page + 1) * pageSize, totalUsers)}</span> of{" "}
              <span className="font-medium">{totalUsers}</span> users
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
              <span className="text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
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
        </CardContent>
      </Card>
    </div>
  )
}

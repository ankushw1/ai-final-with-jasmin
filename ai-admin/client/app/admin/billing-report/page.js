"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, Search } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import useAxios from "@/hooks/use-axios"
import { useUser } from "@/context/user-context"

export default function ManageBillingReport() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")

  const axiosInstance = useAxios()
  const { user } = useUser()
  const router = useRouter()

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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers(page, pageSize, searchTerm)
  }, [page, pageSize, searchTerm])

  const handleViewCustomerReport = (customerId, customerEmail) => {
    router.push(`/admin/billing-report/${customerId}?email=${encodeURIComponent(customerEmail)}`)
  }

  const totalPages = Math.ceil(totalCustomers / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Billing Report</h1>
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
          {loading && (
            <div className="h-1 w-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-blue-600 animate-progress"></div>
            </div>
          )}

          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Username</TableHead>
                  <TableHead className="font-semibold text-gray-700">Company Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Primary Email</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      {loading ? "Loading..." : "No customers found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer._id} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">{customer.username}</TableCell>
                      <TableCell>{customer.companyName}</TableCell>
                      <TableCell>{customer.primaryEmail}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewCustomerReport(customer._id, customer.primaryEmail)}
                        >
                          <Eye className="h-4 w-4" />
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
              Showing <span className="font-medium">{customers.length}</span> of{" "}
              <span className="font-medium">{totalCustomers}</span> customers
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage(Math.max(0, page - 1))}
                    className={page === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNumber

                  if (totalPages <= 5) {
                    pageNumber = i
                  } else if (page < 3) {
                    pageNumber = i
                  } else if (page > totalPages - 3) {
                    pageNumber = totalPages - 5 + i
                  } else {
                    pageNumber = page - 2 + i
                  }

                  if (pageNumber >= 0 && pageNumber < totalPages) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink isActive={page === pageNumber} onClick={() => setPage(pageNumber)}>
                          {pageNumber + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  }
                  return null
                })}

                {totalPages > 5 && page < totalPages - 3 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    className={page >= totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

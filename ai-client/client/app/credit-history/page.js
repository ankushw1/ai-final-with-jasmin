"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import useAxios from "@/hooks/use-axios";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinearProgress } from "@/components/ui/linear-progress";
import { Button } from "@/components/ui/button";

export default function CreditHistoryTable() {
  const [creditHistory, setCreditHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalHistory, setTotalHistory] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentBalance, setCurrentBalance] = useState(0);

  const axiosInstance = useAxios();

  useEffect(() => {
    fetchCreditHistory();
    fetchCurrentBalance();
  }, [page, pageSize, searchTerm]);

  const fetchCurrentBalance = async () => {
    try {
      const response = await axiosInstance.get("/api/check-balance");
      if (response.status === 200) {
        const balance = response.data.balance;
        setCurrentBalance(Number(balance).toFixed(2));
      }
    } catch (error) {
      console.error("Failed to fetch current balance");
    }
  };

  const fetchCreditHistory = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/credit-history", {
        params: {
          page,
          pageSize,
          search: searchTerm,
        },
      });

      if (response.status === 200) {
        setCreditHistory(response.data.history || []);
        setTotalHistory(response.data.total || 0);
      }
    } catch (error) {
      toast.error("Failed to fetch credit history");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
    });
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case "credit_added":
        return "bg-green-100 text-green-800";
      case "balance_updated":
        return "bg-blue-100 text-blue-800";
      case "credit_deducted":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalPages = Math.ceil(totalHistory / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Credit History</h1>
        <div className="flex items-center gap-4">
          <div className="bg-blue-500 text-white px-4 py-2 rounded font-medium">
            Balance: € {currentBalance}
          </div>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Transaction History
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search transactions..."
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
                  <TableHead className="font-semibold text-gray-700">
                    Date & Time
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Transaction Type
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Previous Balance
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Amount Added
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    New Balance
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Description
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditHistory.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-gray-500"
                    >
                      {loading ? "Loading..." : "No credit history found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  creditHistory.map((item, index) => (
                    <TableRow key={index} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {formatDateTime(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(
                            item.transactionType
                          )}`}
                        >
                          {item.transactionType.replace("_", " ").toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        € {Number(item.previousBalance).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {item.amountAdded > 0 && (
                          <span className="text-green-600 font-medium">
                            +€ {item.amountAdded}
                          </span>
                        )}
                        {item.amountAdded === 0 && (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        € {Number(item.newBalance).toFixed(2)}
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalHistory > 0 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium">
                  {Math.min((page + 1) * pageSize, totalHistory)}
                </span>{" "}
                of <span className="font-medium">{totalHistory}</span>{" "}
                transactions
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

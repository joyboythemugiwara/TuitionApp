"use client";

import { useEffect, useState, useMemo } from "react";
import { useMetadata } from "@/providers/MetadataProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  IndianRupee, 
  Search, 
  DownloadCloud, 
  Loader2, 
  Plus,
  CreditCard,
  Banknote,
  MoreHorizontal,
  Mail,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import useSWR from "swr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Papa from "papaparse";
import { GenerateFeesModal } from "./GenerateFeesModal";
import { RecordPaymentModal } from "./RecordPaymentModal";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function FeesPage() {
  const { setTitle } = useMetadata();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [dueDateFilter, setDueDateFilter] = useState("");
  const [minAmountFilter, setMinAmountFilter] = useState("");
  const [maxAmountFilter, setMaxAmountFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  useEffect(() => {
    setTitle("Fee Management");
  }, [setTitle]);

  const { data: response, isLoading, mutate } = useSWR("/fees", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
  const fees = response?.data || [];

  const filteredFees = useMemo(() => {
    let filtered = [...fees];
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(f => f.status === statusFilter);
    }
    
    // Month filter
    if (monthFilter) {
      filtered = filtered.filter(f => f.month === monthFilter);
    }

    // Due Date filter
    if (dueDateFilter) {
      filtered = filtered.filter(f => f.dueDate === dueDateFilter);
    }

    // Amount filters
    if (minAmountFilter) {
      filtered = filtered.filter(f => parseFloat(f.amount) >= parseFloat(minAmountFilter));
    }
    if (maxAmountFilter) {
      filtered = filtered.filter(f => parseFloat(f.amount) <= parseFloat(maxAmountFilter));
    }
    
    // Search filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        (f.studentName || "").toLowerCase().includes(q) ||
        (f.studentPhone || "").toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [fees, searchQuery, statusFilter, monthFilter, dueDateFilter, minAmountFilter, maxAmountFilter]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, monthFilter, dueDateFilter, minAmountFilter, maxAmountFilter]);

  const totalPages = Math.ceil(filteredFees.length / itemsPerPage);
  const paginatedFees = filteredFees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportCSV = () => {
    if (filteredFees.length === 0) {
      toast.error("No fees to export");
      return;
    }

    const csvData = filteredFees.map((f: any) => ({
      ID: f.id,
      "Student Name": f.studentName || "Unknown",
      "Phone": f.studentPhone || "N/A",
      Month: f.month,
      "Total Amount": f.amount,
      "Amount Paid": f.amountPaid,
      "Due Date": f.dueDate,
      Status: f.status,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fees_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePaymentLink = async (feeId: string) => {
    try {
      const res = await api.post(`/fees/${feeId}/payment-link`);
      toast.success("Payment link generated and sent to student!");
      mutate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate payment link");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'partial':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">Partial</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">Overdue</Badge>;
      case 'waived':
        return <Badge className="bg-neutral-500/10 text-neutral-400 hover:bg-neutral-500/20 border-neutral-500/20">Waived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Fees & Payments</h1>
          <p className="text-neutral-400 mt-1">Manage monthly invoices and collect payments.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportCSV} className="border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 hover:text-white">
            <DownloadCloud className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <GenerateFeesModal onGenerated={() => mutate()} />
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-neutral-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-800/60 bg-neutral-900/30 flex flex-col gap-4">
          <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 justify-between">
            <div className="relative w-full xl:max-w-sm shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input 
                placeholder="Search students, phone..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-neutral-900 border-neutral-800 focus:ring-1 focus:ring-indigo-500 text-white w-full"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
              {['all', 'pending', 'partial', 'paid', 'overdue'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap capitalize",
                    statusFilter === status
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-neutral-800/40">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Month:</span>
              <Input 
                type="month" 
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="h-8 bg-neutral-900 border-neutral-800 text-white text-sm w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Due Date:</span>
              <Input 
                type="date" 
                value={dueDateFilter}
                onChange={(e) => setDueDateFilter(e.target.value)}
                className="h-8 bg-neutral-900 border-neutral-800 text-white text-sm w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Amount:</span>
              <Input 
                type="number" 
                placeholder="Min"
                value={minAmountFilter}
                onChange={(e) => setMinAmountFilter(e.target.value)}
                className="h-8 bg-neutral-900 border-neutral-800 text-white text-sm w-24"
              />
              <span className="text-neutral-500">-</span>
              <Input 
                type="number" 
                placeholder="Max"
                value={maxAmountFilter}
                onChange={(e) => setMaxAmountFilter(e.target.value)}
                className="h-8 bg-neutral-900 border-neutral-800 text-white text-sm w-24"
              />
            </div>
            {(monthFilter || dueDateFilter || minAmountFilter || maxAmountFilter) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setMonthFilter("");
                  setDueDateFilter("");
                  setMinAmountFilter("");
                  setMaxAmountFilter("");
                }}
                className="h-8 text-neutral-400 hover:text-white"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto min-h-[400px]">
          <Table>
            <TableHeader className="bg-neutral-900/50 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="border-neutral-800/60 hover:bg-transparent">
                <TableHead className="text-neutral-400 font-medium whitespace-nowrap">Student Name</TableHead>
                <TableHead className="text-neutral-400 font-medium whitespace-nowrap">Month</TableHead>
                <TableHead className="text-neutral-400 font-medium whitespace-nowrap">Amount</TableHead>
                <TableHead className="text-neutral-400 font-medium whitespace-nowrap">Paid</TableHead>
                <TableHead className="text-neutral-400 font-medium whitespace-nowrap">Due Date</TableHead>
                <TableHead className="text-neutral-400 font-medium whitespace-nowrap">Status</TableHead>
                <TableHead className="text-neutral-400 font-medium text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredFees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-neutral-500">
                    No fee records found. Click "Generate Fees" to create invoices for a month.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFees.map((fee: any) => (
                  <TableRow key={fee.id} className="border-neutral-800/60 hover:bg-neutral-900/50 transition-colors group">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{fee.studentName || "Unknown Student"}</p>
                        <p className="text-xs text-neutral-500">{fee.studentPhone || "No Phone"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-neutral-300">
                      {new Date(fee.month).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-white font-medium">₹{parseFloat(fee.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-emerald-400 font-medium">₹{parseFloat(fee.amountPaid).toLocaleString()}</TableCell>
                    <TableCell className="text-neutral-400">{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(fee.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {fee.status !== 'paid' && (
                          <>
                            <RecordPaymentModal 
                              fee={fee} 
                              onRecorded={() => mutate()} 
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-neutral-800">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              } />
                              <DropdownMenuContent align="end" className="w-48 bg-neutral-900 border-neutral-800 text-neutral-200">
                                <DropdownMenuItem 
                                  className="focus:bg-neutral-800 focus:text-white cursor-pointer"
                                  onClick={() => generatePaymentLink(fee.id)}
                                >
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Send Payment Link
                                </DropdownMenuItem>
                                <DropdownMenuItem className="focus:bg-neutral-800 focus:text-white cursor-pointer text-indigo-400">
                                  <Mail className="w-4 h-4 mr-2" />
                                  Send Reminder
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-800/60 flex items-center justify-between text-sm text-neutral-400">
            <div>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredFees.length)} of {filteredFees.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Prev
              </Button>
              <div className="flex items-center justify-center min-w-[2rem]">
                <span className="font-medium text-white">{currentPage}</span>
                <span className="mx-1">/</span>
                <span>{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

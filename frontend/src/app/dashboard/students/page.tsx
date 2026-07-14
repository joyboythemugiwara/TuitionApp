"use client";

import { useEffect, useState } from "react";
import { useMetadata } from "@/providers/MetadataProvider";
import useSWR, { mutate } from "swr";
import { api } from "@/lib/api";

const fetcher = (url: string) => api.get(url).then((res) => res.data);
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, SortAsc, SortDesc, ArrowUpDown, DownloadCloud, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreHorizontal, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import Papa from "papaparse";
import { AddStudentModal } from "./AddStudentModal";
import { EditStudentModal } from "./EditStudentModal";
import { BulkImportModal } from "./BulkImportModal";

export default function StudentsPage() {
  const { setTitle } = useMetadata();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingStudent, setEditingStudent] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // New Filters
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch batches for filter dropdown
  const { data: batchesResponse } = useSWR("/batches", fetcher);
  const batches = batchesResponse?.data || [];
  const sortedBatches = [...batches].sort((a, b) => a.name.localeCompare(b.name));

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort: sortBy,
    order: sortOrder,
  });
  
  if (debouncedSearch) queryParams.append("search", debouncedSearch);
  if (batchFilter !== "all") queryParams.append("batchId", batchFilter);
  if (statusFilter !== "all") queryParams.append("status", statusFilter);

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const toggleStatus = async (studentId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await api.patch(`/students/${studentId}`, { status: newStatus });
      toast.success(`Student marked as ${newStatus}`);
      mutate((key) => typeof key === "string" && key.startsWith("/students"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const { data: response, isLoading: loading, error } = useSWR(
    `/students?${queryParams.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const filteredStudents = response?.data || [];
  const meta = response?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pageIds = filteredStudents.map((s: any) => s.id);
    if (e.target.checked) {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkUpdate = async (updates: { batchId?: string | null, status?: "active" | "inactive" }) => {
    try {
      await api.patch(`/students/bulk`, { studentIds: selectedIds, updates });
      toast.success("Students updated successfully");
      setSelectedIds([]);
      mutate((key) => typeof key === "string" && key.startsWith("/students"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update students");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm("Are you sure you want to delete the selected students? This action cannot be undone.")) return;
    try {
      await api.delete(`/students/bulk`, { data: { studentIds: selectedIds } });
      toast.success("Students deleted successfully");
      setSelectedIds([]);
      mutate((key) => typeof key === "string" && key.startsWith("/students"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete students");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student? This action cannot be undone.")) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success("Student deleted successfully");
      mutate((key) => typeof key === "string" && key.startsWith("/students"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete student");
    }
  };



  useEffect(() => {
    setTitle("Students");
  }, [setTitle]);

  useEffect(() => {
    if (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch students");
    }
  }, [error]);

  const handleExportCSV = async () => {
    try {
      // Fetch all students for export
      const res = await api.get('/students?limit=10000');
      let allStudents = res.data?.data || [];
      
      if (selectedIds.length > 0) {
        allStudents = allStudents.filter((s: any) => selectedIds.includes(s.id));
      }
      
      if (allStudents.length === 0) {
        toast.error("No students to export");
        return;
      }

      const csvData = allStudents.map((s: any) => ({
        ID: s.id,
        "Full Name": s.name,
        Batch: s.batch?.name || "Unassigned",
        "Primary Phone": s.primaryPhone || "",
        Status: s.status,
        "School Name": s.schoolName || "",
        Board: s.board || "",
        "Monthly Fee": s.monthlyFee || s.batch?.defaultFee || 0,
        "Fee Start Date": s.feeStartDate || "",
        "Joined At": new Date(s.createdAt).toLocaleDateString()
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `students_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error("Failed to export data");
    }
  };


  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Students</h1>
          <p className="text-neutral-400 mt-1">Manage all your enrolled students here.</p>
        </div>
        <div className="flex items-center gap-3">

          <Button variant="outline" onClick={handleExportCSV} className="border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 hover:text-white">
            <DownloadCloud className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <BulkImportModal />
          <AddStudentModal />
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-neutral-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-800/60 bg-neutral-900/30 flex flex-col xl:flex-row items-start xl:items-center gap-4 justify-between">
          <div className="relative w-full xl:max-w-sm shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input 
              placeholder="Search students, schools..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-neutral-950/50 border-neutral-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-white h-10 rounded-xl placeholder:text-neutral-600 w-full"
            />
          </div>
          
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Batch Filter */}
            <Select value={batchFilter} onValueChange={(val) => { setBatchFilter(val || 'all'); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[160px] h-10 bg-neutral-950/80 border-neutral-800 text-neutral-300 rounded-xl hover:bg-neutral-900 transition-colors">
                <span className="truncate">{batchFilter === 'all' ? 'All Batches' : batches.find((b: any) => b.id === batchFilter)?.name || 'All Batches'}</span>
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-300 rounded-xl">
                <SelectItem value="all">All Batches</SelectItem>
                {sortedBatches.map(batch => (
                  <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || 'all'); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[140px] h-10 bg-neutral-950/80 border-neutral-800 text-neutral-300 rounded-xl hover:bg-neutral-900 transition-colors">
                <span className="truncate">{statusFilter === 'all' ? 'All Status' : statusFilter === 'active' ? 'Active' : 'Inactive'}</span>
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-300 rounded-xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Filter */}
            <div className="col-span-2 sm:col-span-1 flex items-center gap-2 w-full sm:w-auto">
              <Select value={sortBy} onValueChange={(val) => { setSortBy(val || 'name-asc'); setPage(1); }}>
                <SelectTrigger className="flex-1 sm:w-[160px] h-10 bg-neutral-950/80 border-neutral-800 text-neutral-300 rounded-xl hover:bg-neutral-900 transition-colors">
                  <div className="flex items-center gap-2 truncate">
                    <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{sortBy === 'createdAt' ? 'Date Joined' : sortBy === 'name' ? 'Name (A-Z)' : 'Monthly Fee'}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-300 rounded-xl">
                  <SelectItem value="createdAt">Date Joined</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="monthlyFee">Monthly Fee</SelectItem>
                </SelectContent>
              </Select>

              {/* Order Toggle */}
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); setPage(1); }}
                className="h-10 w-10 shrink-0 bg-neutral-950/80 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-xl transition-colors"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="bg-indigo-500/10 border-t border-b border-indigo-500/20 px-6 py-3 flex flex-wrap gap-4 items-center justify-between">
            <span className="text-sm font-medium text-indigo-300">
              {selectedIds.length} students selected
            </span>
            <div className="flex items-center gap-3">
              <Select onValueChange={(val) => handleBulkUpdate({ batchId: val === "none" || !val ? null : (val as string) })}>
                <SelectTrigger className="h-8 text-xs bg-neutral-900 border-neutral-700 text-white w-[140px]">
                  <SelectValue placeholder="Change Batch" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                  <SelectItem value="none">No Batch</SelectItem>
                  {batches.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="h-8 text-xs bg-neutral-900 border-neutral-700 text-white hover:text-emerald-400 hover:bg-neutral-800 transition-colors" onClick={() => handleBulkUpdate({ status: "active" })}>Mark Active</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs bg-neutral-900 border-neutral-700 text-white hover:text-red-400 hover:bg-neutral-800 transition-colors" onClick={() => handleBulkUpdate({ status: "inactive" })}>Mark Inactive</Button>
              <Button size="sm" variant="outline" onClick={handleExportCSV} className="h-8 border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors text-xs">
                <DownloadCloud className="w-3.5 h-3.5 mr-1.5" />
                Export Selected
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkDelete} className="h-8 border-red-900/50 bg-red-950/20 hover:bg-red-900/50 text-red-400 hover:text-red-300 text-xs transition-colors">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <Table>
              <TableHeader className="bg-neutral-900/50 hover:bg-neutral-900/50">
                <TableRow className="border-neutral-800 hover:bg-transparent">
                  <TableHead className="text-neutral-400 font-medium w-16">S.No</TableHead>
                  <TableHead className="text-neutral-400 font-medium w-24">ID</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Student</TableHead>
                  <TableHead className="text-neutral-400 font-medium hidden md:table-cell">Fee</TableHead>
                  <TableHead className="text-neutral-400 font-medium hidden lg:table-cell">Batch</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Status</TableHead>
                  <TableHead className="text-right text-neutral-400 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i} className="border-neutral-800/60 hover:bg-transparent">
                    <TableCell><div className="h-4 w-6 bg-neutral-800 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-12 bg-neutral-800 rounded animate-pulse" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 py-1">
                        <div className="h-10 w-10 bg-neutral-800 rounded-full animate-pulse shrink-0" />
                        <div className="flex flex-col gap-2">
                          <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse" />
                          <div className="h-3 w-24 bg-neutral-800/60 rounded animate-pulse md:hidden" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="h-4 w-40 bg-neutral-800 rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="h-6 w-20 bg-neutral-800 rounded-md animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-20 bg-neutral-800 rounded-full animate-pulse" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <div className="h-8 w-8 bg-neutral-800 rounded-md animate-pulse" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800 mb-4">
                <Search className="h-8 w-8 text-neutral-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">No students found</h3>
              <p className="text-neutral-400 text-sm max-w-xs">
                {searchQuery 
                  ? "We couldn't find any students matching your search." 
                  : "You haven't added any students yet. Get started by adding a new student!"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-neutral-900/50 hover:bg-neutral-900/50">
                <TableRow className="border-neutral-800 hover:bg-transparent">
                  <TableHead className="w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-neutral-700 bg-neutral-900/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-neutral-900 cursor-pointer w-4 h-4"
                      checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-neutral-400 font-medium w-16">S.No</TableHead>
                  <TableHead className="text-neutral-400 font-medium w-24">ID</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Student</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Fee</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Batch</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Status</TableHead>
                  <TableHead className="text-right text-neutral-400 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student: any, index: number) => (
                  <TableRow key={student.id} className={`border-neutral-800/60 hover:bg-neutral-900/40 transition-colors ${selectedIds.includes(student.id) ? 'bg-indigo-500/5' : ''}`}>
                    <TableCell className="text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-neutral-700 bg-neutral-900/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-neutral-900 cursor-pointer w-4 h-4"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => handleSelectOne(student.id)}
                      />
                    </TableCell>
                    <TableCell className="text-neutral-400 font-medium">
                      {(meta.page - 1) * meta.limit + index + 1}
                    </TableCell>
                    <TableCell className="text-neutral-500 font-mono text-xs font-semibold tracking-wider">
                      STU-{student.id.substring(0, 6).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0 border border-neutral-700/50">
                          {student.photoUrl ? (
                            <div key={student.photoUrl} className="contents">
                              <img src={student.photoUrl} alt={student.name} className="h-full w-full object-cover z-10" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                              <span className="hidden absolute inset-0 flex items-center justify-center text-neutral-400 font-medium text-sm bg-neutral-800">
                                {student.name.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-neutral-400 font-medium text-sm">
                              {student.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div>{student.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-neutral-300">
                      {student.monthlyFee ? `₹${student.monthlyFee}` : <span className="text-neutral-500 italic">Default</span>}
                    </TableCell>
                    <TableCell className="text-neutral-300">
                      {student.batchName ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-neutral-800 border border-neutral-700 text-xs font-medium text-neutral-300">
                          {student.batchName}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                        student.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                      }`}>
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 p-0 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-neutral-200">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              className="focus:bg-neutral-800 focus:text-white cursor-pointer" 
                              onClick={() => window.location.href = `/dashboard/students/${student.id}`}
                            >
                              View Profile
                            </DropdownMenuItem>
                            </DropdownMenuGroup>
                          <DropdownMenuSeparator className="bg-neutral-800" />
                          <DropdownMenuItem 
                            className={`${student.status === 'active' ? 'text-red-400 focus:bg-red-500/10 focus:text-red-300' : 'text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-300'} cursor-pointer`}
                            onClick={() => toggleStatus(student.id, student.status)}
                          >
                            {student.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-neutral-800" />
                          <DropdownMenuItem 
                            className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
                            onClick={() => handleDelete(student.id)}
                          >
                            Delete Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {!loading && filteredStudents.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-400 mt-4 px-2">
          <div className="flex items-center gap-4">
            <div>
              Showing {meta.total === 0 ? 0 : ((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} students
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="per-page" className="hidden sm:inline-block">Rows per page:</label>
              <select
                id="per-page"
                value={limit}
                onChange={handleLimitChange}
                className="bg-neutral-900 border border-neutral-800 text-white rounded-md text-sm py-1 pl-2 pr-6 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: `right 0.25rem center`,
                  backgroundRepeat: `no-repeat`,
                  backgroundSize: `1.5em 1.5em`,
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={meta.page === 1}
              className="bg-transparent border-neutral-800 hover:bg-neutral-800 hover:text-white"
            >
              Previous
            </Button>
            <div className="text-neutral-500 font-medium px-2">
              Page {meta.page} of {Math.max(1, meta.totalPages)}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={meta.page >= meta.totalPages}
              className="bg-transparent border-neutral-800 hover:bg-neutral-800 hover:text-white"
            >
              Next
            </Button>
          </div>
        </div>
      )}


    </div>
  );
}

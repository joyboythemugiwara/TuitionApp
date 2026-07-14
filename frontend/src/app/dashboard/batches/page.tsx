"use client";

import { useEffect, useState } from "react";
import { useMetadata } from "@/providers/MetadataProvider";
import useSWR, { mutate, useSWRConfig } from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
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
import { Search, Loader2, MoreHorizontal, Edit, Archive, ArchiveRestore, Users, Plus, Minus, DownloadCloud, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AddBatchModal } from "./AddBatchModal";
import { EditBatchModal } from "./EditBatchModal";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

const NumberStepper = ({ value, onChange, placeholder, min = 0, step = 1 }: any) => {
  const val = value === "" ? "" : Number(value);
  
  const handleDecrement = () => {
    if (val === "" || val <= min) return;
    onChange(String(val - step));
  };
  
  const handleIncrement = () => {
    if (val === "") {
      onChange(String(step));
    } else {
      onChange(String(val + step));
    }
  };

  return (
    <div className="flex items-center bg-neutral-900/80 border border-neutral-800 rounded-md focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 overflow-hidden h-9 w-full min-w-[80px]">
      <button 
        onClick={handleDecrement}
        type="button"
        className="px-2 h-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors border-r border-neutral-800 shrink-0"
      >
        <Minus className="w-3 h-3" />
      </button>
      <input
        type="number"
        min={min}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-[30px] px-1 bg-transparent text-white text-center text-sm outline-none placeholder:text-neutral-600 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
      />
      <button 
        onClick={handleIncrement}
        type="button"
        className="px-2 h-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors border-l border-neutral-800 shrink-0"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
};

export default function BatchesPage() {
  const { setTitle } = useMetadata();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // New Filters
  const [showFilters, setShowFilters] = useState(false);
  const [minFee, setMinFee] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [minStudents, setMinStudents] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [schedules, setSchedules] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setTitle("Batches");
  }, [setTitle]);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort: sortBy,
    order: sortOrder,
  });
  
  if (debouncedSearch) queryParams.append("search", debouncedSearch);
  if (statusFilter !== "all") queryParams.append("archived", statusFilter === "archived" ? "true" : "false");
  if (minFee) queryParams.append("minFee", minFee);
  if (maxFee) queryParams.append("maxFee", maxFee);
  if (minStudents) queryParams.append("minStudents", minStudents);
  if (maxStudents) queryParams.append("maxStudents", maxStudents);
  if (schedules.length > 0) queryParams.append("schedule", schedules.join(","));

  const { data: response, isLoading: loading, error } = useSWR(
    `/batches?${queryParams.toString()}`,
    fetcher
  );

  useEffect(() => {
    if (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch batches");
    }
  }, [error]);

  const batches = response?.data || [];
  const meta = response?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pageIds = batches.map((b: any) => b.id);
    if (e.target.checked) {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkUpdate = async (updates: { archived?: boolean }) => {
    try {
      await api.patch(`/batches/bulk`, { batchIds: selectedIds, updates });
      toast.success("Batches updated successfully");
      setSelectedIds([]);
      mutate((key) => typeof key === "string" && key.startsWith("/batches"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update batches");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm("Are you sure you want to delete the selected batches? This action cannot be undone.")) return;
    try {
      await api.delete(`/batches/bulk`, { data: { batchIds: selectedIds } });
      toast.success("Batches deleted successfully");
      setSelectedIds([]);
      mutate((key) => typeof key === "string" && key.startsWith("/batches"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete batches");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this batch? This action cannot be undone.")) return;
    try {
      await api.delete(`/batches/${id}`);
      toast.success("Batch deleted successfully");
      mutate((key) => typeof key === "string" && key.startsWith("/batches"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete batch");
    }
  };

  const toggleArchived = async (batchId: string, currentArchived: boolean) => {
    try {
      await api.put(`/batches/${batchId}`, { archived: !currentArchived });
      toast.success(currentArchived ? "Batch restored" : "Batch archived");
      mutate((key) => typeof key === "string" && key.startsWith("/batches"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleExportCSV = async () => {
    try {
      // Fetch all batches for export
      const res = await api.get('/batches?limit=10000');
      let allBatches = res.data?.data || [];
      
      if (selectedIds.length > 0) {
        allBatches = allBatches.filter((b: any) => selectedIds.includes(b.id));
      }
      
      if (allBatches.length === 0) {
        toast.error("No batches to export");
        return;
      }

      const csvData = allBatches.map((b: any) => ({
        ID: b.id,
        "Batch Name": b.name,
        "Schedule": b.schedule || "",
        "Default Fee": b.defaultFee || 0,
        "Status": b.archived ? "Archived" : "Active",
        "Students Count": b.studentsCount || 0,
        "Created At": new Date(b.createdAt).toLocaleDateString()
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `batches_export_${new Date().toISOString().split('T')[0]}.csv`);
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Batches</h1>
          <p className="text-neutral-400 mt-1">Manage your class batches and schedules.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportCSV} className="border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 hover:text-white">
            <DownloadCloud className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <AddBatchModal />
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-neutral-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-800/60 bg-neutral-900/30 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative w-full max-w-sm flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input 
                  placeholder="Search batches..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-neutral-950/50 border-neutral-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-white h-10 rounded-xl placeholder:text-neutral-600 w-full"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className={`h-10 border-neutral-800 transition-colors ${showFilters ? 'bg-neutral-800 text-white' : 'bg-transparent text-neutral-300 hover:text-white hover:bg-neutral-800/50'}`}
              >
                Filters
              </Button>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center text-sm text-neutral-400 mr-2">
                <span className="mr-2">Show</span>
                <select 
                  className="bg-neutral-900 border border-neutral-800 text-white rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
              
              <select
                className="bg-neutral-900 border border-neutral-800 text-white rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Extended Filters Panel */}
          {showFilters && (
            <div className="flex flex-wrap items-end gap-4 p-4 bg-neutral-950/50 rounded-xl border border-neutral-800/60 mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Fee Range (₹)</label>
                <div className="flex items-center gap-2">
                  <NumberStepper 
                    placeholder="Min" 
                    value={minFee} 
                    step={100}
                    onChange={(val: string) => { setMinFee(val); setPage(1); }}
                  />
                  <span className="text-neutral-600">-</span>
                  <NumberStepper 
                    placeholder="Max" 
                    value={maxFee} 
                    step={100}
                    onChange={(val: string) => { setMaxFee(val); setPage(1); }}
                  />
                </div>
              </div>
              
              <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Students Count</label>
                <div className="flex items-center gap-2">
                  <NumberStepper 
                    placeholder="Min" 
                    value={minStudents} 
                    step={5}
                    onChange={(val: string) => { setMinStudents(val); setPage(1); }}
                  />
                  <span className="text-neutral-600">-</span>
                  <NumberStepper 
                    placeholder="Max" 
                    value={maxStudents} 
                    step={5}
                    onChange={(val: string) => { setMaxStudents(val); setPage(1); }}
                  />
                </div>
              </div>
              
              <div className="space-y-2 flex-[2] min-w-[250px]">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Schedule Days</label>
                <div className="flex flex-wrap gap-2">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                    const isSelected = schedules.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          const newSchedules = isSelected ? schedules.filter(d => d !== day) : [...schedules, day];
                          setSchedules(newSchedules);
                          setPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${isSelected ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white'}`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col justify-end pb-[1px]">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setMinFee(""); setMaxFee("");
                    setMinStudents(""); setMaxStudents("");
                    setSchedules([]);
                    setPage(1);
                  }}
                  className="h-9 text-neutral-400 hover:text-white hover:bg-neutral-800/50 w-full sm:w-auto"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {selectedIds.length > 0 && (
          <div className="bg-indigo-500/10 border-t border-b border-indigo-500/20 px-6 py-3 flex flex-wrap gap-4 items-center justify-between">
            <span className="text-sm font-medium text-indigo-300">
              {selectedIds.length} batches selected
            </span>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" className="h-8 text-xs bg-neutral-900 border-neutral-700 text-white hover:text-emerald-400 hover:bg-neutral-800 transition-colors" onClick={() => handleBulkUpdate({ archived: false })}>Restore Selected</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs bg-neutral-900 border-neutral-700 text-white hover:text-amber-400 hover:bg-neutral-800 transition-colors" onClick={() => handleBulkUpdate({ archived: true })}>Archive Selected</Button>
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
                  <TableHead className="w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-neutral-700 bg-neutral-900/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-neutral-900 cursor-pointer w-4 h-4"
                      checked={selectedIds.length === batches.length && batches.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-neutral-400 font-medium">Batch ID</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Name</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Schedule</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Default Fee</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Students</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Status</TableHead>
                  <TableHead className="text-right text-neutral-400 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-neutral-800/60 hover:bg-transparent">
                    <TableCell><div className="h-4 w-4 bg-neutral-800 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-20 bg-neutral-800 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-40 bg-neutral-800 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-32 bg-neutral-800 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-20 bg-neutral-800 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-12 bg-neutral-800 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-6 w-16 bg-neutral-800 rounded-full animate-pulse" /></TableCell>
                    <TableCell><div className="h-8 w-8 ml-auto bg-neutral-800 rounded-md animate-pulse" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="h-20 w-20 rounded-full bg-neutral-900 flex items-center justify-center mb-4">
                <Search className="h-10 w-10 text-neutral-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No batches found</h3>
              <p className="text-neutral-400 max-w-sm">
                {debouncedSearch ? `No batches matching "${debouncedSearch}"` : "You haven't created any batches yet."}
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
                      checked={selectedIds.length === batches.length && batches.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-neutral-400 font-medium">Batch ID</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Name</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Schedule</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Default Fee</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Students</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Status</TableHead>
                  <TableHead className="text-right text-neutral-400 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch: any, index: number) => (
                  <TableRow 
                    key={batch.id} 
                    className={`border-neutral-800/60 hover:bg-neutral-900/40 transition-colors cursor-pointer ${selectedIds.includes(batch.id) ? 'bg-indigo-500/5' : ''}`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('[data-slot="dropdown-menu-trigger"]') || (e.target as HTMLElement).closest('[role="menu"]')) return;
                      router.push(`/dashboard/batches/${batch.id}`);
                    }}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-neutral-700 bg-neutral-900/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-neutral-900 cursor-pointer w-4 h-4"
                        checked={selectedIds.includes(batch.id)}
                        onChange={() => handleSelectOne(batch.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-neutral-400 text-sm">
                      BT-{batch.id.substring(0, 6).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      {batch.name}
                    </TableCell>
                    <TableCell className="text-neutral-300">
                      {batch.schedule || <span className="text-neutral-600 italic">Not set</span>}
                    </TableCell>
                    <TableCell className="text-neutral-300">
                      ₹{batch.defaultFee}
                    </TableCell>
                    <TableCell className="text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{batch.studentCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                        batch.archived
                          ? "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {batch.archived ? "Archived" : "Active"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 p-0 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent onClick={(e) => e.stopPropagation()} align="end" className="w-48 bg-neutral-900 border-neutral-800 text-neutral-200">
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/batches/${batch.id}`); }} 
                            className="cursor-pointer focus:bg-neutral-800 focus:text-white"
                          >
                            <Users className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-neutral-800" />
                          <DropdownMenuItem 
                            onSelect={(e) => { e.preventDefault(); setEditingBatch(batch); }} 
                            className="hover:bg-neutral-800 hover:text-white cursor-pointer"
                          >
                            <Edit className="w-4 h-4 mr-2" /> Edit Batch
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-neutral-800" />
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); toggleArchived(batch.id, batch.archived); }}
                            className="hover:bg-neutral-800 hover:text-white cursor-pointer"
                          >
                            {batch.archived ? (
                              <><ArchiveRestore className="w-4 h-4 mr-2" /> Restore Batch</>
                            ) : (
                              <><Archive className="w-4 h-4 mr-2" /> Archive Batch</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-neutral-800" />
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); handleDelete(batch.id); }}
                            className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Batch
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

        {/* Pagination */}
        {!loading && batches.length > 0 && (
          <div className="p-4 border-t border-neutral-800/60 bg-neutral-900/30 flex items-center justify-between text-sm">
            <div className="text-neutral-400">
              Showing <span className="font-medium text-white">{meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1}</span> to{" "}
              <span className="font-medium text-white">{Math.min(meta.page * meta.limit, meta.total)}</span> of{" "}
              <span className="font-medium text-white">{meta.total}</span> batches
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="border-neutral-800 bg-transparent text-white hover:bg-neutral-800"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                      meta.page === p
                        ? "bg-indigo-500 text-white font-medium shadow-md shadow-indigo-500/20"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="border-neutral-800 bg-transparent text-white hover:bg-neutral-800"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {editingBatch && (
        <EditBatchModal 
          batch={editingBatch} 
          trigger={<div style={{ display: 'none' }} />} 
          isOpen={true} 
          onClose={() => setEditingBatch(null)} 
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useMetadata } from "@/providers/MetadataProvider";
import useSWR from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, CreditCard, Users, Calendar, CheckCircle2, Shield, User, Search, ChevronLeft, ChevronRight, Edit, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddStudentModal } from "../../students/AddStudentModal";
import { EditBatchModal } from "../EditBatchModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function BatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { setTitle } = useMetadata();
  const batchId = params.id as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Batch Details
  const { data: batchResponse, isLoading: loadingBatch, error: batchError } = useSWR(
    `/batches/${batchId}`,
    fetcher
  );

  // Fetch Students in Batch
  const { data: studentsResponse, isLoading: loadingStudents } = useSWR(
    `/students?batchId=${batchId}&search=${encodeURIComponent(debouncedSearch)}&page=${page}&limit=${limit}&sort=name&order=asc${statusFilter !== "all" ? `&status=${statusFilter}` : ""}`,
    fetcher
  );

  const batch = batchResponse?.data;
  const students = studentsResponse?.data || [];
  const meta = studentsResponse?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 };

  useEffect(() => {
    if (batch?.name) {
      setTitle(`${batch.name} - Batch Details`);
    } else {
      setTitle("Batch Details");
    }
  }, [setTitle, batch]);

  if (batchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h3 className="text-xl font-semibold text-white mb-2">Batch not found</h3>
        <p className="text-neutral-400 mb-6">The batch you are looking for does not exist or you don't have access.</p>
        <Button onClick={() => router.push("/dashboard/batches")} variant="outline" className="border-neutral-800">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Batches
        </Button>
      </div>
    );
  }

  if (loadingBatch) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-neutral-800 rounded-full" />
          <div className="h-8 w-64 bg-neutral-800 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-neutral-800 rounded-2xl md:col-span-2" />
          <div className="h-48 bg-neutral-800 rounded-2xl" />
        </div>
        <div className="h-96 bg-neutral-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/dashboard/batches")}
            className="text-neutral-400 hover:text-white rounded-full bg-neutral-900/50 border border-neutral-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">{batch.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                batch.archived
                  ? "bg-neutral-900/50 text-neutral-400 border-neutral-800" 
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}>
                {batch.archived ? "Archived" : "Active"}
              </span>
            </div>
            <p className="text-neutral-400 font-mono text-sm mt-1">ID: BT-{batch.id.substring(0, 6).toUpperCase()}</p>
          </div>
        </div>
        <div>
          <EditBatchModal
            batch={batch}
            trigger={
              <Button className="bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 rounded-full">
                <Edit className="w-4 h-4 mr-2" /> Edit Batch
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Main Details Card */}
        <div className="md:col-span-2 bg-[#0A0A0A] border border-neutral-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" /> Batch Information
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/60 flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                <Clock className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-400">Class Schedule</p>
                <p className="text-white font-medium mt-1">{batch.schedule || "Not scheduled yet"}</p>
              </div>
            </div>
            
            <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/60 flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-400">Default Monthly Fee</p>
                <p className="text-white font-medium mt-1">₹{batch.defaultFee}</p>
              </div>
            </div>

            <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/60 flex items-start gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg shrink-0">
                <Users className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-400">Enrolled Students</p>
                <p className="text-white font-medium mt-1">{studentsResponse?.meta?.total || 0} Students</p>
              </div>
            </div>

            <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/60 flex items-start gap-3">
              <div className="p-2 bg-neutral-800 rounded-lg shrink-0">
                <Calendar className="w-5 h-5 text-neutral-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-400">Created At</p>
                <p className="text-white font-medium mt-1">{format(new Date(batch.createdAt), "PPP")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Teachers Card */}
        <div className="bg-[#0A0A0A] border border-neutral-800 rounded-2xl shadow-xl flex flex-col">
          <div className="p-6 border-b border-neutral-800/60 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-400" /> Assigned Teachers
            </h2>
          </div>
          <div className="p-6 flex-1">
            {batch.teachers && batch.teachers.length > 0 ? (
              <div className="space-y-4">
                {batch.teachers.map((teacher: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 bg-neutral-900/30 p-3 rounded-lg border border-neutral-800/50">
                    <div className="w-10 h-10 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20 shrink-0">
                      <Shield className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{teacher.name || "Unknown Teacher"}</p>
                      <p className="text-neutral-500 text-xs font-mono">Assigned {format(new Date(teacher.assignedAt), "MMM d")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500">
                <Shield className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No teachers assigned</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enrolled Students Table */}
      <div className="bg-[#0A0A0A] border border-neutral-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-neutral-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Enrolled Students
            </h2>
            <div className="h-6 w-px bg-neutral-800 hidden sm:block"></div>
            <AddStudentModal
              defaultBatchId={batch.id}
              trigger={
                <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white h-8">
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Add Student
                </Button>
              }
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === "all" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === "active" ? "bg-emerald-500/20 text-emerald-400" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"}`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === "inactive" ? "bg-neutral-700/50 text-neutral-300" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"}`}
              >
                Inactive
              </button>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-neutral-900/50 border-neutral-800 focus-visible:ring-indigo-500 rounded-xl"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loadingStudents ? (
            <div className="p-8 text-center text-neutral-400">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-neutral-600" />
              </div>
              <h3 className="text-lg font-medium text-white">No students enrolled</h3>
              <p className="text-neutral-500 mt-1">This batch doesn't have any students yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-neutral-900/50 hover:bg-neutral-900/50">
                <TableRow className="border-neutral-800 hover:bg-transparent">
                  <TableHead className="text-neutral-400 font-medium">Student</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Status</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Date of Joined</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Monthly Fee</TableHead>
                  <TableHead className="text-neutral-400 font-medium">Primary Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => (
                  <TableRow key={student.id} className="border-neutral-800/60 hover:bg-neutral-900/30 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/students/${student.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium shadow-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{student.name}</p>
                          <p className="text-xs text-neutral-500 font-mono">ID: {student.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        student.status === "active" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                      }`}>
                        {student.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-neutral-300">
                        <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                        {student.createdAt ? format(new Date(student.createdAt), "MMM d, yyyy") : "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-emerald-400 font-medium">
                      ₹{student.monthlyFee}
                    </TableCell>
                    <TableCell>
                      <span className="text-neutral-300">
                        {student.phones?.find((p: any) => p.isPrimary)?.number || "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination Footer */}
        {students.length > 0 && (
          <div className="p-4 border-t border-neutral-800/60 bg-neutral-900/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-neutral-400">
              Showing <span className="text-white font-medium">{meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1}</span> to{" "}
              <span className="text-white font-medium">{Math.min(meta.page * meta.limit, meta.total)}</span> of{" "}
              <span className="text-white font-medium">{meta.total}</span> students
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrev}
                onClick={() => setPage((p) => p - 1)}
                className="bg-transparent border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <div className="text-sm text-neutral-400 px-2">
                Page {meta.page} of {meta.totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNext}
                onClick={() => setPage((p) => p + 1)}
                className="bg-transparent border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

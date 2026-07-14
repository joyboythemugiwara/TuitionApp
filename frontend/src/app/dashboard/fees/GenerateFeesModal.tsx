"use client";

import { useState } from "react";
import useSWR from "swr";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function GenerateFeesModal({ onGenerated }: { onGenerated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState("");
  
  const [type, setType] = useState<"global" | "batch" | "student">("global");
  const [batchId, setBatchId] = useState("");
  const [studentId, setStudentId] = useState("");

  const { data: batchesData } = useSWR(open ? "/batches" : null, fetcher);
  const batches = batchesData?.data || [];
  const sortedBatches = [...batches].sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  
  const { data: studentsData } = useSWR(open ? "/students?status=active&limit=1000" : null, fetcher);
  const students = studentsData?.data || [];
  const sortedStudents = [...students].sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!month) return;
    
    if (type === "batch" && !batchId) {
      toast.error("Please select a batch");
      return;
    }
    
    if (type === "student" && !studentId) {
      toast.error("Please select a student");
      return;
    }
    
    setLoading(true);
    try {
      // Input is YYYY-MM. We need to send YYYY-MM-01
      const formattedMonth = `${month}-01`;
      
      const payload: any = { month: formattedMonth };
      if (type === "batch") payload.batchId = batchId;
      if (type === "student") payload.studentId = studentId;

      const res = await api.post("/fees/generate", payload);
      toast.success(res.data.message || "Fees generated successfully");
      onGenerated();
      setOpen(false);
      setMonth("");
      setType("global");
      setBatchId("");
      setStudentId("");
    } catch (err: any) {
      toast.error(err.response?.data?.body?.message || err.response?.data?.message || err.message || "Failed to generate fees");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl" />}>
        <Plus className="w-4 h-4 mr-2" />
        Generate Fees
      </DialogTrigger>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[425px] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Generate Monthly Fees</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Create pending fee records based on default or custom monthly fees.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Target Audience</label>
              <Select value={type} onValueChange={(val) => { if (val) setType(val as "global" | "batch" | "student"); }}>
                <SelectTrigger className="bg-neutral-950 border-neutral-800 focus:ring-indigo-500/50 w-full text-white">
                  <SelectValue placeholder="Select target">
                    {(val: any) => val === "global" ? "All Active Students" : val === "batch" ? "Specific Batch" : "Specific Student"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                  <SelectItem value="global">All Active Students</SelectItem>
                  <SelectItem value="batch">Specific Batch</SelectItem>
                  <SelectItem value="student">Specific Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === "batch" && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-medium text-neutral-300">Select Batch</label>
                <Select value={batchId} onValueChange={(val) => setBatchId(val || "")}>
                  <SelectTrigger className="bg-neutral-950 border-neutral-800 focus:ring-indigo-500/50 w-full text-white">
                    <SelectValue placeholder="Select batch">
                      {(val: any) => {
                        if (!val) return "Select batch";
                        const batch = sortedBatches.find((b: any) => b.id === val);
                        return batch ? batch.name : "Select batch";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white max-h-60">
                    {sortedBatches.map((batch: any) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === "student" && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-medium text-neutral-300">Select Student</label>
                <Select value={studentId} onValueChange={(val) => setStudentId(val || "")}>
                  <SelectTrigger className="bg-neutral-950 border-neutral-800 focus:ring-indigo-500/50 w-full text-white">
                    <SelectValue placeholder="Select student">
                      {(val: any) => {
                        if (!val) return "Select student";
                        const student = sortedStudents.find((s: any) => s.id === val);
                        return student ? student.name : "Select student";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white max-h-60">
                    {sortedStudents.map((student: any) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Select Month</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  required
                  className="pl-9 bg-neutral-950 border-neutral-800 focus:ring-1 focus:ring-indigo-500 text-white [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 border-t border-neutral-800/60 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="border-neutral-800 hover:bg-neutral-800 text-neutral-300"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate Invoices
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Megaphone, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function NewAnnouncementModal({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: batchesData } = useSWR(open ? "/batches" : null, fetcher);
  const batches = batchesData?.data || [];
  
  const sortedBatches = [...batches].sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  const [type, setType] = useState<"global" | "batch">("global");
  const [batchId, setBatchId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    if (type === "batch" && !batchId) {
      toast.error("Please select a batch");
      return;
    }
    
    setLoading(true);
    try {
      await api.post("/announcements", {
        type,
        batchIds: type === "batch" ? [batchId] : undefined,
        title,
        message,
        scheduledAt: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : undefined
      });
      toast.success(isScheduled ? "Announcement scheduled successfully" : "Announcement broadcasted successfully");
      mutate("/announcements");
      mutate("/dashboard/dashboard");
      setOpen(false);
      
      // Reset form
      setType("global");
      setBatchId("");
      setTitle("");
      setMessage("");
      setIsScheduled(false);
      setScheduledAt("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to broadcast announcement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        React.isValidElement(trigger) 
          ? React.cloneElement(trigger as React.ReactElement<any>, { onClick: (e: any) => { e.preventDefault(); setOpen(true); } }) 
          : <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setOpen(true)} className="bg-white text-black hover:bg-neutral-200">
          <Megaphone className="w-4 h-4 mr-2" /> New Announcement
        </Button>
      )}
      <DialogContent className="sm:max-w-[550px] bg-[#0A0A0A] border-neutral-800 text-white p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="shrink-0 p-6 pb-4 border-b border-neutral-800/60 bg-neutral-900/30">
          <DialogTitle className="text-xl font-semibold tracking-tight">Broadcast Announcement</DialogTitle>
          <DialogDescription className="text-neutral-400 mt-1.5">
            Send a message to all students or a specific batch. They will receive it via push notification or email.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6">
          <form id="announcement-form" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-neutral-300">Audience</Label>
                <Select value={type} onValueChange={(val) => { if (val) setType(val as "global" | "batch"); }}>
                  <SelectTrigger className="bg-neutral-950 border-neutral-800 focus:ring-indigo-500/50 w-full">
                    <SelectValue placeholder="Select audience">
                      {(val: any) => val === "global" ? "All Students (Global)" : val === "batch" ? "Specific Batch" : "Select audience"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    <SelectItem value="global">All Students (Global)</SelectItem>
                    <SelectItem value="batch">Specific Batch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {type === "batch" && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="batch" className="text-neutral-300">Batch</Label>
                  <Select value={batchId} onValueChange={(val) => setBatchId(val || "")}>
                    <SelectTrigger className="bg-neutral-950 border-neutral-800 focus:ring-indigo-500/50 w-full">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-neutral-300">Title</Label>
              <Input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Center closed tomorrow due to heavy rain"
                className="bg-neutral-950 border-neutral-800 focus:border-indigo-500/50 transition-colors"
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-neutral-300">Message</Label>
              <Textarea
                id="message"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the full details of your announcement here..."
                className="bg-neutral-950 border-neutral-800 focus:border-indigo-500/50 transition-colors min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-4 pt-2 border-t border-neutral-800/60 mt-4">
              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="isScheduled" 
                  checked={isScheduled} 
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="accent-indigo-500 w-4 h-4 rounded-sm cursor-pointer"
                />
                <Label htmlFor="isScheduled" className="text-neutral-300 cursor-pointer">Schedule for later</Label>
              </div>
              
              {isScheduled && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="scheduledAt" className="text-neutral-300">Date & Time</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    required={isScheduled}
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="bg-neutral-950 border-neutral-800 focus:border-indigo-500/50 transition-colors [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              )}
            </div>

          </form>
        </div>

        <div className="shrink-0 p-6 pt-4 border-t border-neutral-800/60 bg-neutral-900/30 flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="border-neutral-700 hover:bg-neutral-800 text-neutral-300"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="announcement-form"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Megaphone className="w-4 h-4 mr-2" />}
            {isScheduled ? "Schedule Announcement" : "Broadcast Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

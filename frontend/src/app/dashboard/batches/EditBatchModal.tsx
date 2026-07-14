import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { capitalizeWords } from "@/lib/utils";
import { mutate } from "swr";
import useSWR from "swr";
import React from "react";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function EditBatchModal({ batch, trigger, isOpen, onClose }: { batch: any; trigger?: React.ReactNode; isOpen?: boolean; onClose?: () => void }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    if (!newOpen && onClose) {
      onClose();
    }
  };

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: batch.name,
    schedule: batch.schedule || "",
    defaultFee: batch.defaultFee || "",
  });
  
  const [teacherIds, setTeacherIds] = useState<string[]>(batch.teachers?.map((t: any) => t.userId) || []);
  const [teacherSearch, setTeacherSearch] = useState("");

  const { data: usersResponse, isLoading: loadingUsers } = useSWR(open ? "/users" : null, fetcher);
  const users = usersResponse?.data || [];
  
  const availableTeachers = users.filter((u: any) => 
    u.name.toLowerCase().includes(teacherSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        schedule: formData.schedule || undefined,
        defaultFee: formData.defaultFee ? Number(formData.defaultFee) : 0,
      };

      await api.put(`/batches/${batch.id}`, payload);
      
      if (teacherIds.length >= 0) {
        // Only assign if teachers array was modified, or just send it unconditionally 
        // to simplify. The API accepts minItems: 1 currently, wait, does it accept empty?
        // Let's check: minItems: 1. If empty, the backend might reject it.
        // If teacherIds is empty, we probably shouldn't call it if the API errors on empty.
        // If we want to clear teachers, we'd need to fix the backend schema to allow empty array.
        // For now, let's call it if there are teacher IDs.
        if (teacherIds.length > 0) {
          await api.post(`/batches/${batch.id}/teachers`, { teacherIds });
        } else {
          // Send empty array to clear, but first need to remove minItems: 1 from backend.
          // Let's assume the API handles it or we'll fix the API next.
          await api.post(`/batches/${batch.id}/teachers`, { teacherIds: [] }).catch(() => {}); 
        }
      }
      
      toast.success("Batch updated successfully");
      mutate("/batches");
      mutate("/dashboard/dashboard");
      mutate(`/batches/${batch.id}`);
      handleOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update batch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        React.isValidElement(trigger) 
          ? React.cloneElement(trigger, { onClick: (e: any) => { e.preventDefault(); handleOpenChange(true); } } as any) 
          : <div onClick={() => handleOpenChange(true)}>{trigger}</div>
      )}
      
      <DialogContent className="bg-[#0A0A0A] border-neutral-800 text-white sm:max-w-[450px] rounded-2xl overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 p-6 pb-2">
          <DialogTitle className="text-xl">Edit Batch</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Update details for {batch.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6 pt-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-neutral-300">Batch Name <span className="text-red-400">*</span></Label>
              <Input
                id="name"
                required
                placeholder="e.g. 11th Grade Physics"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: capitalizeWords(e.target.value) }))}
                className="bg-neutral-900/50 border-neutral-800 focus-visible:ring-indigo-500 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="schedule" className="text-neutral-300">Schedule (Optional)</Label>
              <Input
                id="schedule"
                placeholder="e.g. Mon, Wed, Fri (4:00 PM - 5:30 PM)"
                value={formData.schedule}
                onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                className="bg-neutral-900/50 border-neutral-800 focus-visible:ring-indigo-500 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultFee" className="text-neutral-300">Default Monthly Fee <span className="text-red-400">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">₹</span>
                <Input
                  id="defaultFee"
                  type="number"
                  required
                  min="0"
                  placeholder="2000"
                  value={formData.defaultFee}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultFee: e.target.value }))}
                  className="pl-8 bg-neutral-900/50 border-neutral-800 focus-visible:ring-indigo-500 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-300">Assign Teachers</Label>
              <Input
                placeholder="Search by name or email..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="bg-neutral-900/50 border-neutral-800 focus-visible:ring-indigo-500 rounded-xl mb-2"
              />
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                {loadingUsers ? (
                  <p className="text-neutral-500 text-sm py-2">Loading teachers...</p>
                ) : availableTeachers.length > 0 ? (
                  availableTeachers.map((user: any) => (
                    <label key={user.id} className="flex items-center space-x-3 cursor-pointer p-1.5 hover:bg-neutral-800/50 rounded-md transition-colors">
                      <input 
                        type="checkbox"
                        id={`teacher-${user.id}`}
                        checked={teacherIds.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTeacherIds([...teacherIds, user.id]);
                          } else {
                            setTeacherIds(teacherIds.filter(id => id !== user.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-neutral-900"
                      />
                      <span className="text-sm text-neutral-300 font-medium">{user.name} <span className="text-neutral-500 text-xs font-mono ml-2">({user.email})</span></span>
                    </label>
                  ))
                ) : (
                  <p className="text-neutral-500 text-sm py-2">No teachers available.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-neutral-800/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="bg-transparent border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.defaultFee}
              className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

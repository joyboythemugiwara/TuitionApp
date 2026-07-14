import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { capitalizeWords } from "@/lib/utils";
import { mutate } from "swr";
import useSWR from "swr";
import React from "react";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function AddBatchModal({ trigger }: { trigger?: React.ReactNode } = {}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    schedule: "",
    defaultFee: "",
  });

  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [teacherSearch, setTeacherSearch] = useState("");

  const { data: usersResponse, isLoading: loadingUsers } = useSWR(open ? "/users" : null, fetcher);
  const users = usersResponse?.data || [];
  
  const availableTeachers = users.filter((u: any) => 
    (u.name || "").toLowerCase().includes(teacherSearch.toLowerCase()) || 
    (u.email || "").toLowerCase().includes(teacherSearch.toLowerCase())
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

      const response = await api.post("/batches", payload);
      const newBatch = response.data.data;
      
      if (teacherIds.length > 0) {
        await api.post(`/batches/${newBatch.id}/teachers`, { teacherIds });
      }
      
      toast.success("Batch created successfully");
      mutate("/batches");
      mutate("/dashboard/dashboard");
      setOpen(false);
      setFormData({
        name: "",
        schedule: "",
        defaultFee: "",
      });
      setTeacherIds([]);
      setTeacherSearch("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create batch");
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
        <div onClick={() => setOpen(true)}>
          <Button className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20 rounded-full px-6 h-10">
            <Plus className="w-4 h-4 mr-2" />
            Add Batch
          </Button>
        </div>
      )}
      
      <DialogContent className="bg-[#0A0A0A] border-neutral-800 text-white sm:max-w-[450px] rounded-2xl overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 p-6 pb-2">
          <DialogTitle className="text-xl">Add New Batch</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Create a new class batch to assign students and teachers.
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
              onClick={() => setOpen(false)}
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
              Create Batch
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

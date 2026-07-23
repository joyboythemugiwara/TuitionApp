"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, User, Shield } from "lucide-react";
import posthog from "posthog-js";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { mutate } from "swr";
import { capitalizeWords } from "@/lib/utils";

export function InviteUserModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "teacher"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await api.post("/users/invite", formData);
      posthog.capture('team_member_invited', { role: formData.role });
      toast.success(`Invitation sent to ${formData.email}!`);
      mutate("/users"); // Refresh the team list
      onClose();
      setFormData({ name: "", email: "", role: "teacher" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send invitation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-[#0A0A0A] border-neutral-800 text-white p-0 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-neutral-800/60 bg-neutral-900/30">
          <DialogTitle className="text-xl font-bold tracking-tight">Invite Team Member</DialogTitle>
          <p className="text-sm text-neutral-400 mt-1">Send an invitation email to a new staff member.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
              <User className="w-4 h-4 text-neutral-500" /> Full Name
            </label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: capitalizeWords(e.target.value) }))}
              placeholder="e.g. John Doe"
              className="bg-neutral-900 border-neutral-800 focus:ring-1 focus:ring-indigo-500 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
              <Mail className="w-4 h-4 text-neutral-500" /> Email Address
            </label>
            <Input 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value.toLowerCase() }))}
              placeholder="john@example.com"
              className="bg-neutral-900 border-neutral-800 focus:ring-1 focus:ring-indigo-500 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-neutral-500" /> Role
            </label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value || 'teacher' }))}
            >
              <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white w-full h-10 px-3 py-2 rounded-md focus:ring-1 focus:ring-indigo-500">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white z-50">
                <SelectItem value="teacher" className="focus:bg-neutral-800 focus:text-white cursor-pointer">Teacher (Standard)</SelectItem>
                <SelectItem value="admin" className="focus:bg-neutral-800 focus:text-white cursor-pointer">Admin (Full Access)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-neutral-500 mt-1">
              Admins can manage billing, settings, and other staff members. Teachers can only manage students and batches.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-neutral-800/60 mt-6">
            <DialogClose render={<Button type="button" variant="ghost" className="text-neutral-400 hover:text-white hover:bg-neutral-800" />}>
              Cancel
            </DialogClose>
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium min-w-[120px]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              {saving ? "Sending..." : "Send Invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

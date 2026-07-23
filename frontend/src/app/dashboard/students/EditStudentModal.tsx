"use client";

import React, { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { api } from "@/lib/api";
const fetcher = (url: string) => api.get(url).then((res) => res.data);
import { toast } from "sonner";
import { capitalizeWords } from "@/lib/utils";
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
import { Plus, Loader2, UploadCloud, Image as ImageIcon } from "lucide-react";
import posthog from "posthog-js";

export function EditStudentModal({ student, trigger, isOpen, onClose, onSuccess }: { student: any; trigger: React.ReactNode; isOpen?: boolean; onClose?: () => void; onSuccess?: () => void }) {
  const [open, setOpen] = useState(isOpen || false);

  useEffect(() => {
    if (isOpen !== undefined) {
      setOpen(isOpen);
    }
  }, [isOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && onClose) {
      onClose();
    }
  };
  const [loading, setLoading] = useState(false);

  // Fetch batches for the dropdown only when modal is open
  const { data: batchesData } = useSWR(open ? "/batches" : null, fetcher);
  const batches = batchesData?.data || [];
  
  // Sort batches alphabetically by name
  const sortedBatches = [...batches].sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  const [name, setName] = useState(student.name || "");
  const [schoolName, setSchoolName] = useState(student.schoolName || "");
  const [board, setBoard] = useState(student.board || "CBSE");
  const [batchId, setBatchId] = useState(student.batchId || "");
  const [monthlyFee, setMonthlyFee] = useState(student.monthlyFee ? student.monthlyFee.toString() : "");
  const [feeStartDate, setFeeStartDate] = useState(() => student.feeStartDate ? new Date(student.feeStartDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
  
  // Dynamic Phone Numbers
  const [phones, setPhones] = useState(student.phones?.length > 0 ? student.phones.map((p: any) => ({
    id: p.id,
    number: p.number,
    label: p.label,
    isPrimary: p.isPrimary,
    receiveNotifications: p.receiveNotifications
  })) : [
    { number: "", label: "student", isPrimary: true, receiveNotifications: true }
  ]);
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(student.photoUrl || "");

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setName(student.name || "");
      setSchoolName(student.schoolName || "");
      setBoard(student.board || "CBSE");
      setBatchId(student.batchId || "");
      setMonthlyFee(student.monthlyFee ? student.monthlyFee.toString() : "");
      setFeeStartDate(student.feeStartDate ? new Date(student.feeStartDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
      setPhones(student.phones?.length > 0 ? student.phones.map((p: any) => ({
        id: p.id,
        number: p.number,
        label: p.label,
        isPrimary: p.isPrimary,
        receiveNotifications: p.receiveNotifications
      })) : [{ number: "", label: "student", isPrimary: true, receiveNotifications: true }]);
      setPhotoFile(null);
      setExistingPhotoUrl(student.photoUrl || "");
    }
  }, [open, student]);

  const addPhone = () => {
    setPhones([...phones, { number: "", label: "parent", isPrimary: phones.length === 0, receiveNotifications: true }]);
  };

  const removePhone = (index: number) => {
    const newPhones = phones.filter((_: any, i: number) => i !== index);
    // Ensure at least one primary if we removed the primary
    if (phones[index].isPrimary && newPhones.length > 0) {
      newPhones[0].isPrimary = true;
    }
    setPhones(newPhones);
  };

  const updatePhone = (index: number, field: string, value: any) => {
    const newPhones = [...phones];
    if (field === "isPrimary" && value === true) {
      // Unset primary for others
      newPhones.forEach(p => p.isPrimary = false);
    }
    newPhones[index] = { ...newPhones[index], [field]: value };
    setPhones(newPhones);
  };

  const handlePhoneChange = (index: number, value: string) => {
    let cleaned = value.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.length > 10) {
      cleaned = cleaned.substring(0, 10);
    }
    updatePhone(index, "number", cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!batchId) {
      toast.error("Please select a batch");
      return;
    }
    
    const phoneRegex = /^[1-9]\d{9}$/;
    for (const p of phones) {
      if (!phoneRegex.test(p.number)) {
        toast.error(`Please enter a valid 10-digit phone number for ${p.label}`);
        return;
      }
    }

    setLoading(true);

    try {
      let finalPhotoUrl: string | undefined = undefined;

      // If user selected a new photo, handle upload first
      if (photoFile) {
        try {
          const presignedRes = await api.post("/uploads/presigned-url", {
            filename: photoFile.name,
            contentType: photoFile.type,
            folder: "avatars"
          });
          
          const { uploadUrl, fileUrl } = presignedRes.data.data;

          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            body: photoFile,
            headers: { "Content-Type": photoFile.type },
          });

          if (!uploadRes.ok) {
            throw new Error(`Cloudflare R2 returned ${uploadRes.status}: ${uploadRes.statusText}. Please check your bucket CORS policy or credentials.`);
          }

          finalPhotoUrl = fileUrl;
        } catch (err: any) {
          toast.error("Failed to upload photo. Check backend R2 configuration.");
          setLoading(false);
          return;
        }
      }

      const updateData = {
        name,
        schoolName: schoolName || undefined,
        board: board || undefined,
        batchId,
        monthlyFee: monthlyFee ? Number(monthlyFee) : null,
        status: student.status, // Preserve status
        phones: phones,
        ...(finalPhotoUrl && { photoUrl: finalPhotoUrl })
      };

      await api.patch(`/students/${student.id}`, updateData);

      mutate((key) => typeof key === "string" && key.startsWith("/students"));
      mutate("/dashboard/dashboard");
      if (onSuccess) onSuccess();
      posthog.capture('student_edited', { student_id: student.id, batch_id: batchId });
      toast.success("Student updated successfully!");
      handleOpenChange(false);
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger nativeButton={false} render={React.isValidElement(trigger) ? trigger : <div>{trigger}</div>} />
      )}
      <DialogContent className="sm:max-w-[600px] bg-[#0A0A0A] border-neutral-800 text-white p-0 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-neutral-800/60 bg-neutral-900/30">
          <DialogTitle className="text-xl font-bold tracking-tight">Edit Student</DialogTitle>
          <DialogDescription className="text-neutral-400 mt-1.5">
            Update the details and contact information for {student.name}.
          </DialogDescription>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[70vh]">
          <form id="add-student-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name" className="text-neutral-300">Full Name <span className="text-red-400">*</span></Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(capitalizeWords(e.target.value))}
                  placeholder="e.g. Rahul Sharma"
                  className="bg-neutral-900/50 border-neutral-800 focus:border-indigo-500 text-white placeholder:text-neutral-600"
                />
              </div>

              <div className="col-span-2 space-y-3 mt-2 border-t border-neutral-800 pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-neutral-300">Phone Numbers <span className="text-red-400">*</span></Label>
                  <Button type="button" variant="ghost" onClick={addPhone} className="h-7 px-2 text-xs bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300">
                    <Plus className="w-3 h-3 mr-1" /> Add Number
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {phones.map((phone: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 bg-neutral-900/30 p-3 rounded-lg border border-neutral-800/50">
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Input
                              required
                              value={phone.number}
                              onChange={(e) => handlePhoneChange(index, e.target.value)}
                              placeholder="e.g. 9876543210"
                              maxLength={10}
                              className="h-9 bg-neutral-900 border-neutral-800 focus:border-indigo-500 text-white placeholder:text-neutral-600"
                            />
                          </div>
                          <select
                            value={phone.label}
                            onChange={(e) => updatePhone(index, "label", e.target.value)}
                            className="w-[110px] h-9 rounded-md bg-neutral-900 border border-neutral-800 px-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
                          >
                            <option value="student" className="bg-[#0A0A0A]">Student</option>
                            <option value="father" className="bg-[#0A0A0A]">Father</option>
                            <option value="mother" className="bg-[#0A0A0A]">Mother</option>
                            <option value="guardian" className="bg-[#0A0A0A]">Guardian</option>
                            <option value="other" className="bg-[#0A0A0A]">Other</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-neutral-400">
                          <label className="flex items-center gap-1.5 cursor-pointer hover:text-neutral-200">
                            <input 
                              type="radio" 
                              name={`primaryPhone-${index}`}
                              checked={phone.isPrimary} 
                              onChange={() => updatePhone(index, "isPrimary", true)}
                              className="accent-indigo-500 w-3.5 h-3.5"
                            />
                            Primary Contact
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer hover:text-neutral-200">
                            <input 
                              type="checkbox" 
                              checked={phone.receiveNotifications} 
                              onChange={(e) => updatePhone(index, "receiveNotifications", e.target.checked)}
                              className="accent-indigo-500 w-3.5 h-3.5 rounded-sm"
                            />
                            Receive SMS/WhatsApp
                          </label>
                        </div>
                      </div>
                      {phones.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => removePhone(index)}
                          className="h-9 w-9 p-0 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                        >
                          &times;
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="batch" className="text-neutral-300">Batch <span className="text-red-400">*</span></Label>
                <select
                  id="batch"
                  required
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="flex h-10 w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 text-white appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                >
                  <option value="" disabled className="bg-[#0A0A0A] text-neutral-400">Select a batch...</option>
                  {sortedBatches.map((b: any) => (
                    <option key={b.id} value={b.id} className="bg-[#0A0A0A] text-white">{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feeStartDate" className="text-neutral-300">Fee Start Date <span className="text-red-400">*</span></Label>
                <Input
                  id="feeStartDate"
                  type="date"
                  required
                  value={feeStartDate}
                  onChange={(e) => setFeeStartDate(e.target.value)}
                  className="bg-neutral-900/50 border-neutral-800 focus:border-indigo-500 text-white dark:[color-scheme:dark]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monthlyFee" className="text-neutral-300">Monthly Fee (Custom)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 select-none">₹</span>
                  <Input
                    id="monthlyFee"
                    type="number"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                    placeholder="Leave blank for batch default"
                    className="pl-7 bg-neutral-900/50 border-neutral-800 focus:border-indigo-500 text-white placeholder:text-neutral-600 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school" className="text-neutral-300">School Name</Label>
                <Input
                  id="school"
                  value={schoolName}
                  onChange={(e) => setSchoolName(capitalizeWords(e.target.value))}
                  placeholder="e.g. Delhi Public School"
                  className="bg-neutral-900/50 border-neutral-800 focus:border-indigo-500 text-white placeholder:text-neutral-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="board" className="text-neutral-300">Board</Label>
                <select
                  id="board"
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="flex h-10 w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 text-white appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                >
                  <option value="CBSE" className="bg-[#0A0A0A] text-white">CBSE</option>
                  <option value="ICSE" className="bg-[#0A0A0A] text-white">ICSE</option>
                  <option value="State Board" className="bg-[#0A0A0A] text-white">State Board</option>
                  <option value="Other" className="bg-[#0A0A0A] text-white">Other</option>
                </select>
              </div>
              
              <div className="space-y-3 col-span-2">
                <Label className="text-neutral-300">Student Photo (Optional)</Label>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
                  <div className="h-16 w-16 rounded-full border-2 border-neutral-700/50 bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {photoFile ? (
                      <img src={URL.createObjectURL(photoFile)} alt="Preview" className="h-full w-full object-cover" />
                    ) : existingPhotoUrl ? (
                      <img src={existingPhotoUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-neutral-500" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                      <Label
                        htmlFor="photo"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 bg-neutral-800 text-white hover:bg-neutral-700 h-9 px-4 py-2 cursor-pointer border border-neutral-700 shadow-sm"
                      >
                        <UploadCloud className="w-4 h-4 mr-2 text-neutral-400" />
                        {photoFile ? "Change Photo" : "Upload Photo"}
                      </Label>
                      {photoFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setPhotoFile(null)}
                          className="h-9 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) { // 2MB limit
                            toast.error("Image must be less than 2MB");
                            e.target.value = "";
                            return;
                          }
                          setPhotoFile(file);
                        } else {
                          setPhotoFile(null);
                        }
                      }}
                      className="hidden"
                    />
                    <p className="text-xs text-neutral-500 mt-2 truncate w-full max-w-[280px]">
                      {photoFile ? `${photoFile.name} (${(photoFile.size / 1024 / 1024).toFixed(2)} MB)` : "Max size: 2MB (JPG/PNG)"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="px-6 py-4 border-t border-neutral-800/60 bg-neutral-900/30 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} className="text-neutral-400 hover:text-white hover:bg-neutral-800">
            Cancel
          </Button>
          <Button form="add-student-form" type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px] shadow-lg shadow-indigo-500/20">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState } from "react";
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

export function AddStudentModal({ defaultBatchId, trigger }: { defaultBatchId?: string, trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch batches unconditionally so we can check before opening
  const { data: batchesData } = useSWR("/batches", fetcher);
  const batches = batchesData?.data || [];
  
  // Sort batches alphabetically by name
  const sortedBatches = [...batches].sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  // Form State
  const [name, setName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [board, setBoard] = useState("CBSE");
  const [batchId, setBatchId] = useState(defaultBatchId || "");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [feeStartDate, setFeeStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  
  // Dynamic Phone Numbers
  const [phones, setPhones] = useState([
    { number: "", label: "student", isPrimary: true, receiveNotifications: true }
  ]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

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

      // If user selected a photo, handle upload first
      if (photoFile) {
        try {
          // 1. Get presigned URL
          const presignedRes = await api.post("/uploads/presigned-url", {
            filename: photoFile.name,
            contentType: photoFile.type,
            folder: "avatars"
          });
          
          const { uploadUrl, fileUrl } = presignedRes.data.data;

          // 2. Upload file directly to S3/R2
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

      await api.post("/students", {
        name,
        schoolName: schoolName || undefined,
        board: board || undefined,
        batchId,
        monthlyFee: monthlyFee ? Number(monthlyFee) : undefined,
        feeStartDate,
        photoUrl: finalPhotoUrl,
        phones: phones
      });

      mutate((key) => typeof key === "string" && key.startsWith("/students"));
      if (defaultBatchId) {
        mutate((key) => typeof key === "string" && key.startsWith(`/students?batchId=${defaultBatchId}`));
      }
      mutate("/dashboard/dashboard");
      
      toast.success("Student added successfully!");
      setOpen(false);
      
      setName("");
      setSchoolName("");
      setBoard("CBSE");
      setBatchId(defaultBatchId || "");
      setMonthlyFee("");
      setFeeStartDate(new Date().toISOString().split("T")[0]);
      setPhones([{ number: "", label: "student", isPrimary: true, receiveNotifications: true }]);
      setPhotoFile(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    if (!batchesData) {
      toast.error("Loading batches, please wait...");
      return;
    }
    if (batches.length === 0) {
      toast.error("Please create a batch first before adding a student.");
      return;
    }
    setOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        React.isValidElement(trigger) 
          ? React.cloneElement(trigger as React.ReactElement<any>, { onClick: (e: any) => { e.preventDefault(); handleOpen(); } }) 
          : <div onClick={handleOpen}>{trigger}</div>
      ) : (
        <Button onClick={handleOpen} className="bg-white text-black hover:bg-neutral-200">
          <Plus className="w-4 h-4 mr-2" /> Add Student
        </Button>
      )}
      <DialogContent className="sm:max-w-[700px] bg-[#0A0A0A] border-neutral-800 text-white p-0 overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
        <DialogHeader className="shrink-0 p-6 pb-4 border-b border-neutral-800/60 bg-neutral-900/30">
          <DialogTitle className="text-xl font-semibold tracking-tight">Add New Student</DialogTitle>
          <DialogDescription className="text-neutral-400 mt-1.5">
            Enter the details for the new student. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form id="add-student-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Personal Details Section */}
            <div className="space-y-5">
              <h3 className="text-sm font-medium text-indigo-400 tracking-wider uppercase">Personal Details</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-neutral-300 font-medium">Full Name <span className="text-red-400">*</span></Label>
                  <Input
                    id="name"
                    required
                    autoComplete="off"
                    value={name}
                    onChange={(e) => setName(capitalizeWords(e.target.value))}
                    placeholder="e.g. Rahul Sharma"
                    className="bg-neutral-900/70 border-neutral-800 focus:border-indigo-500 text-white placeholder:text-neutral-600 h-11"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName" className="text-neutral-300 font-medium">School Name</Label>
                    <Input
                      id="schoolName"
                      autoComplete="off"
                      value={schoolName}
                      onChange={(e) => setSchoolName(capitalizeWords(e.target.value))}
                      placeholder="e.g. Delhi Public School"
                      className="bg-neutral-900/70 border-neutral-800 focus:border-indigo-500 text-white placeholder:text-neutral-600 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="board" className="text-neutral-300 font-medium">Board</Label>
                    <select
                      id="board"
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                      className="w-full h-11 rounded-md bg-neutral-900/70 border border-neutral-800 px-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                    >
                      <option value="CBSE" className="bg-[#0A0A0A]">CBSE</option>
                      <option value="ICSE" className="bg-[#0A0A0A]">ICSE</option>
                      <option value="State Board" className="bg-[#0A0A0A]">State Board</option>
                      <option value="IB" className="bg-[#0A0A0A]">IB</option>
                      <option value="IGCSE" className="bg-[#0A0A0A]">IGCSE</option>
                      <option value="Other" className="bg-[#0A0A0A]">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details Section */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-indigo-400 tracking-wider uppercase">Contact Details</h3>
                <Button type="button" variant="ghost" onClick={addPhone} className="h-8 px-3 text-xs font-medium bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 rounded-full transition-colors">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Number
                </Button>
              </div>
              
              <div className="space-y-3">
                {phones.map((phone, index) => (
                  <div key={index} className="flex flex-col gap-3 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/80 hover:border-neutral-700/80 transition-colors">
                    <div className="flex gap-3 items-start">
                      <div className="flex-1 flex gap-3">
                        <Input
                          required
                          autoComplete="off"
                          value={phone.number}
                          onChange={(e) => handlePhoneChange(index, e.target.value)}
                          placeholder="e.g. 9876543210"
                          maxLength={10}
                          className="h-11 bg-neutral-950/50 border-neutral-800 focus:border-indigo-500 text-white placeholder:text-neutral-600"
                        />
                        <select
                          value={phone.label}
                          onChange={(e) => updatePhone(index, "label", e.target.value)}
                          className="w-[120px] shrink-0 h-11 rounded-md bg-neutral-950/50 border border-neutral-800 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none"
                          style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                        >
                          <option value="student" className="bg-[#0A0A0A]">Student</option>
                          <option value="father" className="bg-[#0A0A0A]">Father</option>
                          <option value="mother" className="bg-[#0A0A0A]">Mother</option>
                          <option value="guardian" className="bg-[#0A0A0A]">Guardian</option>
                          <option value="other" className="bg-[#0A0A0A]">Other</option>
                        </select>
                      </div>
                      {phones.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => removePhone(index)}
                          className="h-11 w-11 p-0 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 shrink-0 rounded-md"
                        >
                          &times; <span className="sr-only">Remove phone</span>
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-5 text-sm text-neutral-400 pl-1 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                        <input 
                          type="radio" 
                          name="primaryPhone" 
                          checked={phone.isPrimary} 
                          onChange={() => updatePhone(index, "isPrimary", true)}
                          className="accent-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        Primary Contact
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                        <input 
                          type="checkbox" 
                          checked={phone.receiveNotifications} 
                          onChange={(e) => updatePhone(index, "receiveNotifications", e.target.checked)}
                          className="accent-indigo-500 w-4 h-4 rounded-sm cursor-pointer"
                        />
                        Receive SMS/WhatsApp
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic & Financial Section */}
            <div className="space-y-5">
              <h3 className="text-sm font-medium text-indigo-400 tracking-wider uppercase">Academic & Financial</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchId" className="text-neutral-300 font-medium">Batch <span className="text-red-400">*</span></Label>
                  <select
                    id="batchId"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    required
                    className="w-full h-11 rounded-md bg-neutral-900/70 border border-neutral-800 px-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                  >
                    <option value="" disabled className="bg-[#0A0A0A]">Select a batch...</option>
                    {sortedBatches.map((b: any) => (
                      <option key={b.id} value={b.id} className="bg-[#0A0A0A]">{b.name} (₹{b.defaultFee}/mo)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feeStartDate" className="text-neutral-300 font-medium">Fee Start Date <span className="text-red-400">*</span></Label>
                  <div className="relative">
                    <Input
                      id="feeStartDate"
                      type="date"
                      required
                      value={feeStartDate}
                      onChange={(e) => setFeeStartDate(e.target.value)}
                      className="bg-neutral-900/70 border-neutral-800 focus:border-indigo-500 text-white [&::-webkit-calendar-picker-indicator]:invert h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="monthlyFee" className="text-neutral-300 font-medium">Monthly Fee (Custom)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">₹</span>
                    <Input
                      id="monthlyFee"
                      type="number"
                      autoComplete="off"
                      value={monthlyFee}
                      onChange={(e) => setMonthlyFee(e.target.value)}
                      placeholder="Leave blank to use batch default"
                      className="pl-7 bg-neutral-900/70 border-neutral-800 focus:border-indigo-500 text-white placeholder:text-neutral-600 h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-5">
              <h3 className="text-sm font-medium text-indigo-400 tracking-wider uppercase">Photo Profile (Optional)</h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
                    {photoFile ? (
                      <img src={URL.createObjectURL(photoFile)} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-neutral-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Label 
                      htmlFor="photo-upload" 
                      className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-neutral-900 border border-neutral-700 text-sm font-medium text-white hover:bg-neutral-800 cursor-pointer transition-colors"
                    >
                      <UploadCloud className="w-4 h-4 mr-2" />
                      {photoFile ? "Change Photo" : "Upload Photo"}
                    </Label>
                    {photoFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setPhotoFile(null)}
                        className="h-10 px-3 ml-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        Remove
                      </Button>
                    )}
                    <input 
                      id="photo-upload"
                      type="file" 
                      accept="image/*"
                      className="hidden"
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
        
        <div className="p-6 pt-4 border-t border-neutral-800/60 bg-neutral-900/30 flex justify-end gap-3 shrink-0">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="hover:bg-neutral-800 hover:text-white text-neutral-400 h-11 px-6">
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="add-student-form" 
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-6 min-w-[140px] font-medium transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Student
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState, useRef } from "react";
import { mutate } from "swr";
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
import { UploadCloud, FileText, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Papa from "papaparse";

export function BulkImportModal() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a valid CSV file");
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data.slice(0, 5)); // preview first 5 rows
        validateData(results.data);
      },
      error: (error: any) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const validateData = (data: any[]) => {
    const newErrors = [];
    if (data.length === 0) newErrors.push("File is empty");
    
    // Basic validation of headers
    const requiredHeaders = ["name", "phone", "batchId"];
    const firstRow = data[0] || {};
    const missingHeaders = requiredHeaders.filter(h => !Object.keys(firstRow).includes(h));
    
    if (missingHeaders.length > 0) {
      newErrors.push(`Missing required columns: ${missingHeaders.join(", ")}`);
    }

    setErrors(newErrors);
  };

  const removeFile = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    if (!file || errors.length > 0) return;
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const studentsToCreate = results.data.map((row: any) => ({
            name: row.name,
            batchId: row.batchId,
            schoolName: row.schoolName || undefined,
            board: row.board || undefined,
            monthlyFee: row.monthlyFee ? Number(row.monthlyFee) : undefined,
            phones: [{ number: row.phone, label: "student", isPrimary: true, receiveNotifications: true }]
          }));

          await api.post("/students/bulk", { students: studentsToCreate });
          
          toast.success(`Successfully imported ${studentsToCreate.length} students!`);
          mutate((key) => typeof key === "string" && key.startsWith("/students"));
          setOpen(false);
          removeFile();
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Failed to import students");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + "name,phone,batchId,schoolName,board,monthlyFee\nJohn Doe,9876543210,batch-id-here,Delhi Public School,CBSE,1500";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) removeFile();
    }}>
      <DialogTrigger render={
        <Button variant="outline" className="border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 hover:text-white">
          <UploadCloud className="w-4 h-4 mr-2" />
          Import CSV
        </Button>
      } />
      <DialogContent className="sm:max-w-[600px] bg-[#0A0A0A] border-neutral-800 text-white p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">Import Students</DialogTitle>
          <DialogDescription className="text-neutral-400 mt-1">
            Bulk upload students using a CSV file. <button onClick={downloadTemplate} className="text-indigo-400 hover:underline">Download template</button>
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          {!file ? (
            <div 
              className="border-2 border-dashed border-neutral-800 hover:border-indigo-500/50 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-neutral-900/20"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center mb-4 border border-neutral-800">
                <UploadCloud className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">Click to upload CSV</h3>
              <p className="text-sm text-neutral-500 max-w-xs">
                Upload a valid CSV file matching our template structure.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-white truncate">{file.name}</p>
                    <p className="text-xs text-neutral-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile} className="text-neutral-500 hover:text-red-400 shrink-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {errors.length > 0 ? (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium">Invalid CSV File</h4>
                    <ul className="text-sm mt-1 list-disc list-inside opacity-90">
                      {errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-3">
                    <CheckCircle2 className="w-4 h-4" /> Ready to import
                  </div>
                  <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Preview (First 5 rows)</div>
                  <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-neutral-400 border-b border-neutral-800">
                        <tr>
                          <th className="px-4 py-2 font-medium">Name</th>
                          <th className="px-4 py-2 font-medium">Phone</th>
                          <th className="px-4 py-2 font-medium">Batch ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800 text-neutral-300">
                        {preview.map((row, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 truncate max-w-[120px]">{row.name}</td>
                            <td className="px-4 py-2">{row.phone}</td>
                            <td className="px-4 py-2 font-mono text-xs">{row.batchId?.substring(0,8)}...</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv,text/csv" 
            onChange={handleFileChange} 
          />
        </div>

        <div className="p-6 pt-4 border-t border-neutral-800 bg-neutral-900/30 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)} className="hover:bg-neutral-800 hover:text-white text-neutral-400">
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || errors.length > 0 || loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import Students"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
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
import { Loader2, Banknote, QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RecordPaymentModal({ fee, onRecorded }: { fee: any, onRecorded: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const pendingAmount = parseFloat(fee.amount) - parseFloat(fee.amountPaid);
  
  const [formData, setFormData] = useState({
    amount: pendingAmount.toString(),
    mode: "cash",
    transactionId: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || isNaN(parseFloat(formData.amount))) return;
    
    setLoading(true);
    try {
      await api.post("/fees/payments/manual", {
        feeRecordId: fee.id,
        amount: parseFloat(formData.amount),
        mode: formData.mode,
        transactionId: formData.transactionId || undefined,
      });
      toast.success("Payment recorded successfully");
      onRecorded();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) {
        setFormData({ amount: pendingAmount.toString(), mode: "cash", transactionId: "" });
      }
    }}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50">
          <Banknote className="w-4 h-4 mr-1.5" />
          Pay
        </Button>
      } />
      <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Record Payment</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Record a manual payment for {fee.studentName || "this student"}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          
          <div className="bg-[#0A0A0A] p-4 rounded-xl border border-neutral-800 flex justify-between items-center">
            <div>
              <p className="text-xs text-neutral-500 font-medium">Pending Amount</p>
              <p className="text-xl font-bold text-orange-400">₹{pendingAmount.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500 font-medium">Total Amount</p>
              <p className="text-sm font-medium text-white">₹{parseFloat(fee.amount).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Amount Received (₹)</label>
              <Input
                type="number"
                min="1"
                step="0.01"
                max={pendingAmount}
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
                className="bg-neutral-950 border-neutral-800 focus:ring-1 focus:ring-emerald-500 text-white text-lg font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Payment Mode</label>
              <Select 
                value={formData.mode} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, mode: (val as "cash" | "online") || "cash" }))}
              >
                <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white">
                  <SelectValue placeholder="Select mode">
                    {formData.mode === "online" ? "Online / UPI" : "Cash"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                  <SelectItem value="cash" className="focus:bg-neutral-800 focus:text-white cursor-pointer">Cash</SelectItem>
                  <SelectItem value="online" className="focus:bg-neutral-800 focus:text-white cursor-pointer">Online / UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.mode !== "cash" && (
              <div className="space-y-4 pt-4 border-t border-neutral-800 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Transaction / Reference ID (Optional)</label>
                  <Input
                    placeholder="e.g. UTR1234567890"
                    value={formData.transactionId}
                    onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                    className="bg-neutral-950 border-neutral-800 focus:ring-1 focus:ring-emerald-500 text-white"
                  />
                </div>
                
                {fee.paymentLinkUrl ? (
                  <div className="bg-[#0A0A0A] p-4 rounded-xl border border-neutral-800 flex flex-col items-center justify-center space-y-3">
                    <p className="text-sm text-neutral-400 text-center">Scan to Pay via Razorpay</p>
                    <div className="bg-white p-3 rounded-xl shadow-lg">
                      <QRCode value={fee.paymentLinkUrl} size={150} />
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0A0A0A] p-4 rounded-xl border border-neutral-800 border-dashed flex flex-col items-center justify-center space-y-2">
                    <QrCode className="w-8 h-8 text-neutral-600 mb-1" />
                    <p className="text-sm text-neutral-400 text-center">No QR Code Available</p>
                    <p className="text-xs text-neutral-500 text-center max-w-[250px]">
                      Close this modal and click the <strong>Link icon</strong> on the fees table to generate a Razorpay link first.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
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
              disabled={loading || !formData.amount}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

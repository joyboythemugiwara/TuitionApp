"use client";

import { useEffect, useState } from "react";
import { useMetadata } from "@/providers/MetadataProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Loader2, Building2, MessageSquare, CreditCard, CalendarDays, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import useSWR from "swr";
import { useAuthStore } from "@/store/authStore";
import { capitalizeWords } from "@/lib/utils";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function SettingsPage() {
  const { setTitle } = useMetadata();
  const user = useAuthStore((state) => state.user);
  
  useEffect(() => {
    setTitle("Settings");
  }, [setTitle]);

  const { data: response, isLoading, mutate } = useSWR("/tenants/me", fetcher);
  const tenant = response?.data;

  const [saving, setSaving] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [showWhatsapp, setShowWhatsapp] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    feeDueDay: 10,
    wabaId: "",
    phoneNumberId: "",
    razorpayKeyId: "",
    razorpayKeySecret: "",
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || "",
        feeDueDay: tenant.feeDueDay || 10,
        wabaId: tenant.wabaId || "",
        phoneNumberId: tenant.phoneNumberId || "",
        razorpayKeyId: tenant.razorpayKeyId || "",
        razorpayKeySecret: tenant.razorpayKeySecret || "",
      });
    }
  }, [tenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        feeDueDay: Number(formData.feeDueDay),
        wabaId: formData.wabaId,
        phoneNumberId: formData.phoneNumberId,
        razorpayKeyId: formData.razorpayKeyId,
      };

      if (formData.razorpayKeySecret?.trim() !== "") {
        payload.razorpayKeySecret = formData.razorpayKeySecret;
      }

      await api.patch("/tenants/me", payload);
      toast.success("Settings saved successfully!");
      mutate(); // refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-neutral-400">Only administrators can manage workspace settings.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-12">
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Workspace Settings</h1>
        <p className="text-neutral-400">
          Manage your tuition center's automated billing and API integrations.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* General Settings */}
        <div className="bg-[#0A0A0A] border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Building2 className="w-32 h-32 text-indigo-500" />
          </div>
          
          <div className="flex items-center gap-3 border-b border-neutral-800/60 pb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Building2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">General Information</h2>
              <p className="text-sm text-neutral-400">Basic details about your tuition center.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Workspace Name</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: capitalizeWords(e.target.value) }))}
                className="bg-neutral-900 border-neutral-800 focus:ring-1 focus:ring-indigo-500 text-white"
                placeholder="E.g., Star Academics"
                required
              />
            </div>
          </div>
        </div>

        {/* Automation Settings */}
        <div className="bg-[#0A0A0A] border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <CalendarDays className="w-32 h-32 text-purple-500" />
          </div>
          
          <div className="flex items-center gap-3 border-b border-neutral-800/60 pb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <CalendarDays className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Billing Automation</h2>
              <p className="text-sm text-neutral-400">Configure when fees should be automatically generated.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Monthly Fee Due Day</label>
              <div className="flex gap-4 items-center">
                <Input 
                  type="number"
                  min="1"
                  max="28"
                  value={formData.feeDueDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, feeDueDay: parseInt(e.target.value) }))}
                  className="bg-neutral-900 border-neutral-800 focus:ring-1 focus:ring-purple-500 text-white max-w-[120px]"
                  required
                />
                <span className="text-sm text-neutral-500">Day of the month (1-28)</span>
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                The system will automatically generate pending fee invoices on this day every month for all active students.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Integration */}
        <div className="bg-[#0A0A0A] border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <CreditCard className="w-32 h-32 text-emerald-500" />
          </div>
          
          <div className="flex items-center gap-3 border-b border-neutral-800/60 pb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Payment Gateway</h2>
                {tenant?.razorpayKeyId && !showRazorpay && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowRazorpay(true)}
                    className="border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white"
                  >
                    Update Keys
                  </Button>
                )}
              </div>
              <p className="text-sm text-neutral-400">Razorpay API credentials for online fee collection.</p>
            </div>
          </div>
          
          <div className="relative z-10">
            {tenant?.razorpayKeyId && !showRazorpay ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-emerald-400 font-medium text-sm">Razorpay is successfully configured</p>
                  <p className="text-emerald-500/70 text-xs mt-0.5">Your tuition center is ready to accept online payments.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Razorpay Key ID</label>
                  <Input 
                    value={formData.razorpayKeyId}
                    onChange={(e) => setFormData(prev => ({ ...prev, razorpayKeyId: e.target.value }))}
                    className="bg-neutral-900 border-neutral-800 focus:ring-1 focus:ring-emerald-500 text-white font-mono text-sm"
                    placeholder="rzp_live_..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Razorpay Key Secret</label>
                  <Input 
                    type="password"
                    value={formData.razorpayKeySecret}
                    onChange={(e) => setFormData(prev => ({ ...prev, razorpayKeySecret: e.target.value }))}
                    className="bg-neutral-900 border-neutral-800 focus:ring-1 focus:ring-emerald-500 text-white font-mono text-sm"
                    placeholder="••••••••••••••••"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Integration */}
        <div className="bg-[#0A0A0A] border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <MessageSquare className="w-32 h-32 text-green-500" />
          </div>
          
          <div className="flex items-center gap-3 border-b border-neutral-800/60 pb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <MessageSquare className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">WhatsApp Business API</h2>
                {tenant?.wabaId && !showWhatsapp && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowWhatsapp(true)}
                    className="border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white"
                  >
                    Update Credentials
                  </Button>
                )}
              </div>
              <p className="text-sm text-neutral-400">Credentials for automated fee reminders and receipts.</p>
            </div>
          </div>
          
          <div className="relative z-10">
            {tenant?.wabaId && !showWhatsapp ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-green-400 font-medium text-sm">WhatsApp API is successfully configured</p>
                  <p className="text-green-500/70 text-xs mt-0.5">Your tuition center is ready to send automated messages.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">WABA ID</label>
                  <Input 
                    value={formData.wabaId}
                    onChange={(e) => setFormData(prev => ({ ...prev, wabaId: e.target.value }))}
                    className="bg-neutral-900 border-neutral-800 focus:ring-1 focus:ring-green-500 text-white font-mono text-sm"
                    placeholder="WhatsApp Business Account ID"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Phone Number ID</label>
                  <Input 
                    value={formData.phoneNumberId}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                    className="bg-neutral-900 border-neutral-800 focus:ring-1 focus:ring-green-500 text-white font-mono text-sm"
                    placeholder="Phone Number ID"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-neutral-800/60">
          <Button 
            type="submit" 
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl px-8"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Settings</>
            )}
          </Button>
        </div>
      </form>

    </div>
  );
}

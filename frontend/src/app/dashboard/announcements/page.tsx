"use client";

import { useState, useEffect } from "react";
import { useMetadata } from "@/providers/MetadataProvider";
import useSWR, { mutate } from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Megaphone, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NewAnnouncementModal } from "./NewAnnouncementModal";


const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function AnnouncementsPage() {
  const { setTitle } = useMetadata();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setTitle("Announcements");
  }, [setTitle]);

  const { data: response, error, isLoading } = useSWR(`/announcements`, fetcher);
  const announcements = response?.data || [];

  const filteredAnnouncements = announcements.filter((a: any) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Announcements</h1>
          <p className="text-neutral-400">Broadcast messages to students and parents.</p>
        </div>
        
        <NewAnnouncementModal />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/60 backdrop-blur-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[#0A0A0A] border-neutral-800 text-white focus:border-indigo-500/50 transition-colors h-10 w-full"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[#0A0A0A] border border-neutral-800 rounded-xl overflow-hidden shadow-2xl relative min-h-[400px]">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0A]/50 backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-neutral-400 font-medium">Loading announcements...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-red-400 font-medium bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">
              Failed to load announcements
            </div>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-4 border border-neutral-800">
              <Megaphone className="w-8 h-8 text-neutral-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No announcements found</h3>
            <p className="text-neutral-400 max-w-md">
              {searchQuery ? "No announcements match your search criteria." : "You haven't made any announcements yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {filteredAnnouncements.map((announcement: any) => (
              <div key={announcement.id} className="p-6 hover:bg-neutral-900/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-white">{announcement.title}</h3>
                  <span className="text-xs text-neutral-500 bg-neutral-900 px-2 py-1 rounded-md border border-neutral-800">
                    {new Date(announcement.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}
                  </span>
                </div>
                <div className="inline-flex mb-4">
                  <span className={`text-xs px-2 py-1 rounded-full border ${announcement.type === 'global' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                    {announcement.type === 'global' ? 'All Students' : 'Specific Batches'}
                  </span>
                </div>
                <p className="text-neutral-400 text-sm whitespace-pre-wrap">{announcement.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

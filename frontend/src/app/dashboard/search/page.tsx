"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMetadata } from "@/providers/MetadataProvider";
import { api } from "@/lib/api";
import useSWR from "swr";
import Link from "next/link";
import { 
  Search, Users, BookOpen, IndianRupee, Megaphone, Loader2, ArrowRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const fetcher = (url: string) => api.get(url).then(res => res.data);

function SearchContent() {
  const { setTitle } = useMetadata();
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const lowerQuery = query.toLowerCase();

  useEffect(() => {
    setTitle(`Search: ${query}`);
  }, [setTitle, query]);

  // Fetch all resources concurrently
  const { data: studentsRes, isLoading: isLoadingStudents } = useSWR("/students", fetcher);
  const { data: batchesRes, isLoading: isLoadingBatches } = useSWR("/batches", fetcher);
  const { data: feesRes, isLoading: isLoadingFees } = useSWR("/fees", fetcher);
  const { data: annRes, isLoading: isLoadingAnn } = useSWR("/announcements", fetcher);

  const isLoading = isLoadingStudents || isLoadingBatches || isLoadingFees || isLoadingAnn;

  // Perform client-side filtering
  const results = useMemo(() => {
    if (!lowerQuery) return { students: [], batches: [], fees: [], announcements: [] };
    
    const students = (studentsRes?.data || []).filter((s: any) => 
      s.name.toLowerCase().includes(lowerQuery) || 
      s.email?.toLowerCase().includes(lowerQuery) ||
      s.primaryPhone?.toLowerCase().includes(lowerQuery)
    );

    const batches = (batchesRes?.data || []).filter((b: any) => 
      b.name.toLowerCase().includes(lowerQuery) ||
      b.subject?.toLowerCase().includes(lowerQuery)
    );

    const fees = (feesRes?.data || []).filter((f: any) => 
      f.studentName?.toLowerCase().includes(lowerQuery) ||
      f.month?.toLowerCase().includes(lowerQuery) ||
      f.amount?.toString().includes(lowerQuery)
    );

    const announcements = (annRes?.data || []).filter((a: any) => 
      a.title.toLowerCase().includes(lowerQuery) ||
      a.message.toLowerCase().includes(lowerQuery)
    );

    return { students, batches, fees, announcements };
  }, [lowerQuery, studentsRes, batchesRes, feesRes, annRes]);

  const totalResults = results.students.length + results.batches.length + results.fees.length + results.announcements.length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p>Searching across your tuition hub...</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <Search className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg">Enter a search term above to find anything.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-10">
      <div className="border-b border-neutral-800 pb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Search Results</h1>
        <p className="text-neutral-400 mt-1">Found {totalResults} results for <span className="text-indigo-400 font-semibold">"{query}"</span></p>
      </div>

      {totalResults === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-neutral-500 bg-[#0A0A0A] rounded-2xl border border-neutral-800">
          <p className="text-lg">No results found matching your query.</p>
          <button onClick={() => router.back()} className="mt-4 text-indigo-400 hover:text-indigo-300">Go Back</button>
        </div>
      )}

      {/* Students */}
      {results.students.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Students ({results.students.length})
            </h2>
            <Link href="/dashboard/students" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.students.slice(0, 6).map((student: any) => (
              <Link key={student.id} href={`/dashboard/students/${student.id}`}>
                <Card className="bg-[#0A0A0A] border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/50 transition-colors h-full cursor-pointer">
                  <CardContent className="p-4 flex justify-between items-center h-full">
                    <div>
                      <p className="text-white font-medium">{student.name}</p>
                      <p className="text-xs text-neutral-400 mt-1">{student.email || student.primaryPhone}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Batches */}
      {results.batches.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-neutral-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" /> Batches ({results.batches.length})
            </h2>
            <Link href="/dashboard/batches" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.batches.slice(0, 6).map((batch: any) => (
              <Link key={batch.id} href={`/dashboard/batches/${batch.id}`}>
                <Card className="bg-[#0A0A0A] border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/50 transition-colors h-full cursor-pointer">
                  <CardContent className="p-4 h-full">
                    <p className="text-white font-medium">{batch.name}</p>
                    <p className="text-xs text-neutral-400 mt-1">{batch.subject || "No Subject"}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Fees */}
      {results.fees.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-neutral-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-400" /> Fees & Invoices ({results.fees.length})
            </h2>
            <Link href="/dashboard/fees" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.fees.slice(0, 6).map((fee: any) => (
              <Card key={fee.id} className="bg-[#0A0A0A] border-neutral-800 hover:border-neutral-700 transition-colors">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{fee.studentName}</p>
                    <p className="text-xs text-neutral-400 mt-1">{new Date(fee.month).toLocaleDateString(undefined, { month: 'short', year: 'numeric'})} • ₹{fee.amount}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${fee.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    {fee.status}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Announcements */}
      {results.announcements.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-neutral-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-pink-400" /> Announcements ({results.announcements.length})
            </h2>
            <Link href="/dashboard/announcements" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.announcements.slice(0, 6).map((ann: any) => (
              <Card key={ann.id} className="bg-[#0A0A0A] border-neutral-800 hover:border-neutral-700 transition-colors">
                <CardContent className="p-4">
                  <p className="text-white font-medium truncate">{ann.title}</p>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{ann.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-neutral-500" /></div>}>
      <SearchContent />
    </Suspense>
  );
}

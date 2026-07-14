"use client";

import { useEffect } from "react";
import { useMetadata } from "@/providers/MetadataProvider";
import useSWR, { useSWRConfig } from "swr";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  MapPin, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  User, 
  School,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Users,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EditStudentModal } from "../EditStudentModal";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function StudentProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { setTitle } = useMetadata();
  const id = params?.id as string;
  const { mutate } = useSWRConfig();

  const { data: response, isLoading, error } = useSWR(id ? `/students/${id}` : null, fetcher);
  const student = response?.data;
  const phones = response?.data?.phones || [];

  useEffect(() => {
    if (student) {
      setTitle(`Student Profile - ${student.name}`);
    } else {
      setTitle("Student Profile");
    }
  }, [setTitle, student]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Student Not Found</h2>
        <p className="text-neutral-400 max-w-md mb-6">We couldn't find the requested student. They may have been deleted or the ID is incorrect.</p>
        <Button onClick={() => router.push("/dashboard/students")} variant="default" className="bg-indigo-600 hover:bg-indigo-700">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Students
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 relative overflow-x-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full" />

      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/dashboard/students")}
          className="text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-all rounded-full px-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Students
        </Button>
        {student && (
          <EditStudentModal 
            student={student}
            onSuccess={() => mutate(`/students/${student.id}`)}
            trigger={
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] transition-all rounded-full px-6">
                <Edit className="w-4 h-4 mr-2" /> Edit Details
              </Button>
            }
          />
        )}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-8">
          <div className="h-[280px] bg-neutral-900/50 rounded-[2.5rem] border border-neutral-800/50" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="h-96 bg-neutral-900/50 rounded-[2rem] border border-neutral-800/50 lg:col-span-8" />
            <div className="h-96 bg-neutral-900/50 rounded-[2rem] border border-neutral-800/50 lg:col-span-4" />
          </div>
        </div>
      ) : student ? (
        <div className="space-y-8">
          {/* Header Hero Card */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-neutral-800/60 bg-[#0A0A0A]/80 backdrop-blur-xl shadow-2xl group">
            {/* Animated Gradient Banner */}
            <div className="h-40 w-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 border-b border-neutral-800/60 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 to-transparent" />
            </div>
            
            <div className="px-6 sm:px-10 pb-6 sm:pb-10 pt-0 relative">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8 -mt-16 sm:-mt-20">
                {/* Avatar with Glow */}
                <div className="relative group/avatar">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur opacity-30 group-hover/avatar:opacity-60 transition duration-500" />
                  <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-full border-[6px] border-[#0A0A0A] bg-neutral-900 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl">
                    {student.photoUrl ? (
                      <div key={student.photoUrl} className="contents">
                        <img src={student.photoUrl} alt={student.name} className="h-full w-full object-cover z-10 transition-transform duration-700 group-hover/avatar:scale-110" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                        <span className="hidden absolute inset-0 flex items-center justify-center text-neutral-400 font-bold text-4xl bg-neutral-900">
                          {student.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-neutral-400 font-bold text-5xl">
                        {student.name.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Status Indicator */}
                  <div className={`absolute bottom-3 right-3 h-6 w-6 rounded-full border-4 border-[#0A0A0A] shadow-lg z-20 flex items-center justify-center ${student.status === 'active' ? 'bg-emerald-500' : 'bg-neutral-500'}`} title={student.status}>
                    <div className="h-2 w-2 rounded-full bg-white/50 animate-pulse" />
                  </div>
                </div>

                {/* Name & Metadata */}
                <div className="flex-1 text-center md:text-left mb-3">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5 mb-3 mt-2 md:mt-0">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{student.name}</h1>
                    <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-sm font-semibold text-indigo-400 tracking-wider shadow-[0_0_15px_-3px_rgba(79,70,229,0.3)]">
                      STU-{student.id.substring(0, 6).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 text-neutral-400 text-sm font-medium">
                    <div className="flex items-center gap-1.5 bg-neutral-900/50 px-3 py-1.5 rounded-lg border border-neutral-800/50">
                      <School className="w-4 h-4 text-purple-400" /> {student.schoolName || "No school assigned"}
                    </div>
                    {student.board && (
                      <div className="flex items-center gap-1.5 bg-neutral-900/50 px-3 py-1.5 rounded-lg border border-neutral-800/50">
                        <BookOpen className="w-4 h-4 text-pink-400" /> {student.board}
                      </div>
                    )}
                    {student.batchName && (
                      <div className="flex items-center gap-1.5 bg-neutral-900/50 px-3 py-1.5 rounded-lg border border-neutral-800/50">
                        <Users className="w-4 h-4 text-indigo-400" /> {student.batchName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-8">
              {/* Contact Information */}
              <Card className="bg-[#0A0A0A]/60 backdrop-blur-md border-neutral-800/60 shadow-2xl rounded-[2rem] overflow-hidden">
                <div className="border-b border-neutral-800/40 bg-neutral-900/20 px-6 sm:px-8 py-5 flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    Contact Directory
                  </h3>
                </div>
                <CardContent className="p-6 sm:p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {phones.map((phone: any) => (
                      <div key={phone.id} className="group relative flex flex-col p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800/50 hover:border-indigo-500/30 hover:bg-neutral-900/60 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 group-hover:text-neutral-400 transition-colors">
                            {phone.label}
                          </span>
                          {phone.isPrimary && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_-2px_rgba(16,185,129,0.2)]">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-2xl font-semibold text-white mb-3 tracking-tight">{phone.number}</div>
                        {phone.receiveNotifications && (
                          <div className="flex items-center gap-2 text-xs font-medium text-indigo-400/80 mt-auto pt-3 border-t border-neutral-800/50 group-hover:border-indigo-500/20 transition-colors">
                            <MessageSquare className="w-4 h-4" /> Receives SMS Updates
                          </div>
                        )}
                      </div>
                    ))}
                    {phones.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-neutral-500 bg-neutral-900/20 rounded-2xl border border-neutral-800/30 border-dashed">
                        <Phone className="w-8 h-8 mb-3 opacity-20" />
                        <p>No contact numbers available.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Enrollment Info */}
              <Card className="bg-[#0A0A0A]/60 backdrop-blur-md border-neutral-800/60 shadow-2xl rounded-[2rem] overflow-hidden">
                <div className="border-b border-neutral-800/40 bg-neutral-900/20 px-6 sm:px-8 py-5">
                  <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    Enrollment Status
                  </h3>
                </div>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800/50">
                    <div className="p-6 sm:p-8 flex items-center gap-4 sm:gap-5 hover:bg-neutral-900/20 transition-colors">
                      <div className="p-4 rounded-2xl bg-neutral-900/80 text-neutral-400 shadow-inner border border-neutral-800">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-500 mb-1">Joined Date</p>
                        <p className="text-base sm:text-lg font-semibold text-white">
                          {new Date(student.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="p-6 sm:p-8 flex items-center gap-4 sm:gap-5 hover:bg-neutral-900/20 transition-colors">
                      <div className="p-3 sm:p-4 rounded-2xl bg-neutral-900/80 text-neutral-400 shadow-inner border border-neutral-800">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-500 mb-1">Current Status</p>
                        <div className="flex items-center gap-2 text-lg font-semibold text-white">
                          {student.status === 'active' ? (
                            <><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Active</>
                          ) : (
                            <><XCircle className="w-5 h-5 text-neutral-500" /> Inactive</>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Cards */}
            <div className="lg:col-span-4 space-y-8">
              {/* Financial Summary */}
              <Card className="bg-gradient-to-b from-[#0A0A0A]/90 to-[#0F0F0F]/90 backdrop-blur-xl border-neutral-800/60 shadow-2xl rounded-[2rem] overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full group-hover:bg-emerald-500/10 transition-colors" />
                <div className="border-b border-neutral-800/40 bg-neutral-900/20 px-6 py-5">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    Financials
                  </h3>
                </div>
                <CardContent className="p-6 sm:p-8 space-y-6 sm:space-y-8">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Monthly Fee</p>
                    <div className="flex items-baseline gap-1">
                      {student.monthlyFee ? (
                        <>
                          <span className="text-2xl font-bold text-emerald-500">₹</span>
                          <span className="text-5xl font-bold text-white tracking-tight">{student.monthlyFee}</span>
                        </>
                      ) : (
                        <span className="text-neutral-500 text-2xl italic font-medium">Batch Default</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-800 to-transparent opacity-50" />
                  
                  <div className="bg-neutral-900/40 rounded-2xl p-4 border border-neutral-800/50">
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Fee Cycle Start</p>
                    <div className="flex items-center gap-2.5 text-white font-medium whitespace-nowrap">
                      <div className="p-1.5 bg-neutral-800 rounded-md shrink-0">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                      </div>
                      <span className="truncate">
                        {new Date(student.feeStartDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

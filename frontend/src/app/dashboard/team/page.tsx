"use client";

import { useEffect, useState } from "react";
import { useMetadata } from "@/providers/MetadataProvider";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Shield, User, Mail, MoreHorizontal, UserCheck, Clock } from "lucide-react";
import { api } from "@/lib/api";
import useSWR from "swr";
import { InviteUserModal } from "./InviteUserModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/store/authStore";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function TeamPage() {
  const { setTitle } = useMetadata();
  const currentUser = useAuthStore(state => state.user);
  
  useEffect(() => {
    setTitle("Team Management");
  }, [setTitle]);

  const { data: response, isLoading } = useSWR("/users", fetcher);
  const users = response?.data || [];

  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-neutral-400">Only administrators can manage the team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Staff & Team
            <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-1 rounded-full border border-indigo-500/20 font-medium">
              {users.length} {users.length === 1 ? 'Member' : 'Members'}
            </span>
          </h1>
          <p className="text-neutral-400">Manage teachers and administrators in your workspace.</p>
        </div>
        <Button 
          onClick={() => setIsInviteOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all rounded-xl h-11 px-6 shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" /> Invite Member
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 bg-[#0A0A0A] border border-neutral-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-4 border border-neutral-800">
              <Shield className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No team members yet</h3>
            <p className="text-neutral-400 max-w-sm mb-6">
              Invite teachers or administrators to collaborate in your workspace.
            </p>
            <Button 
              onClick={() => setIsInviteOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Invite First Member
            </Button>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="bg-neutral-900/50 sticky top-0 z-10 border-b border-neutral-800 backdrop-blur-sm">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-neutral-400 font-medium h-12 w-[300px]">Member</TableHead>
                  <TableHead className="text-neutral-400 font-medium h-12">Role</TableHead>
                  <TableHead className="text-neutral-400 font-medium h-12">Status</TableHead>
                  <TableHead className="text-neutral-400 font-medium h-12">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow 
                    key={user.id} 
                    className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors group"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700 overflow-hidden shrink-0">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''}${user.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-neutral-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">
                            {user.name} {user.id === currentUser?.id && <span className="text-xs text-indigo-400 font-normal ml-1">(You)</span>}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className={`inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        user.role === 'admin' || user.role === 'super_admin'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : user.role === 'super_admin' ? 'Super Admin' : 'Teacher'}
                      </span>
                    </TableCell>

                    <TableCell>
                      {user.isActive ? (
                        <span className="inline-flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
                          <UserCheck className="w-3 h-3 mr-1.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3 mr-1.5" /> Pending Invite
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-sm text-neutral-400">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <InviteUserModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
    </div>
  );
}

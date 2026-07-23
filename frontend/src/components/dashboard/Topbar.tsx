"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Search, User as UserIcon, ChevronDown, Menu, Users, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";
import useSWR from "swr";
import { useUIStore } from "@/store/uiStore";
import Link from "next/link";
import { requestFCMToken } from "@/lib/fcm";
import posthog from "posthog-js";

const fetcher = (url: string) => api.get(url).then(res => res.data);

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function Topbar() {
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const logout = useAuthStore((state) => state.logout);
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: studentsRes } = useSWR("/students", fetcher);
  const { data: batchesRes } = useSWR("/batches", fetcher);

  const results = useMemo(() => {
    if (!debouncedQuery) return null;
    const q = debouncedQuery.toLowerCase();
    
    const students = (studentsRes?.data || []).filter((s: any) => 
      s.name.toLowerCase().includes(q) || s.primaryPhone?.toLowerCase().includes(q)
    ).slice(0, 3);
    
    const batches = (batchesRes?.data || []).filter((b: any) => 
      b.name.toLowerCase().includes(q) || b.subject?.toLowerCase().includes(q)
    ).slice(0, 3);
    
    return { students, batches };
  }, [debouncedQuery, studentsRes, batchesRes]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setIsFocused(false);
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      toast.info("Requesting notification permissions...");
      const token = await requestFCMToken();
      if (token) {
        await api.patch('/users/me', { fcmToken: token });
        toast.success("Notifications enabled successfully!");
      } else {
        toast.error("Could not get notification permission.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to enable notifications.");
    }
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (err) {
      console.error("Logout failed on server", err);
    } finally {
      posthog.capture('user_logged_out');
      posthog.reset();
      logout();
      toast.success("Successfully logged out");
      router.push("/auth/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-neutral-800 bg-[#0A0A0A] px-4 md:px-6 shadow-sm md:rounded-t-2xl">
      
      {/* Mobile Menu Button */}
      <button 
        type="button" 
        className="-m-2.5 p-2.5 text-neutral-400 hover:text-white md:hidden"
        onClick={toggleMobileMenu}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Search Bar */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div ref={searchContainerRef} className="relative flex flex-1 items-center">
          <form className="relative flex w-full" onSubmit={handleSearch}>
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <button 
              type="submit"
              className="absolute inset-y-0 left-0 h-full w-10 flex items-center justify-center text-neutral-500 hover:text-white cursor-pointer z-10"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
            <Input
              id="search-field"
              className="block h-full w-full border-0 bg-transparent py-2 pl-10 pr-12 text-white placeholder:text-neutral-500 focus:ring-0 sm:text-sm"
              placeholder="Search students, batches, fees..."
              type="search"
              name="search"
              autoComplete="off"
              value={searchQuery}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsFocused(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(e as any);
                }
              }}
            />
            {/* Visual Cue for Enter key */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute inset-y-0 right-8 hidden items-center sm:flex pointer-events-none">
                <kbd className="inline-flex items-center rounded border border-neutral-800 bg-neutral-900 px-2 font-sans text-xs font-medium text-neutral-400">
                  Enter
                </kbd>
              </div>
            )}
          </form>

          {/* Live Search Dropdown */}
          {isFocused && debouncedQuery.length > 0 && results && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
              {results.students.length === 0 && results.batches.length === 0 ? (
                <div className="p-4 text-center text-sm text-neutral-500">
                  No quick results found. Press enter to search everywhere.
                </div>
              ) : (
                <div className="p-2 space-y-4">
                  {results.students.length > 0 && (
                    <div>
                      <h3 className="px-2 py-1 text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3 h-3" /> Students
                      </h3>
                      <div className="mt-1 space-y-1">
                        {results.students.map((student: any) => (
                          <button
                            key={student.id}
                            onClick={() => {
                              setIsFocused(false);
                              router.push(`/dashboard/students/${student.id}`);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800/50 rounded-lg transition-colors flex items-center justify-between"
                          >
                            <span>{student.name}</span>
                            <span className="text-xs text-neutral-500">{student.primaryPhone}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.batches.length > 0 && (
                    <div>
                      <h3 className="px-2 py-1 text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Batches
                      </h3>
                      <div className="mt-1 space-y-1">
                        {results.batches.map((batch: any) => (
                          <button
                            key={batch.id}
                            onClick={() => {
                              setIsFocused(false);
                              router.push(`/dashboard/batches/${batch.id}`);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800/50 rounded-lg transition-colors flex items-center justify-between"
                          >
                            <span>{batch.name}</span>
                            <span className="text-xs text-neutral-500">{batch.subject}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="px-2 pt-2 border-t border-neutral-800/50">
                    <button
                      onClick={() => handleSearch()}
                      className="w-full text-center px-3 py-2 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors font-medium"
                    >
                      See all results for "{debouncedQuery}"
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Notifications */}
        <button 
          type="button" 
          onClick={handleEnableNotifications}
          className="-m-2.5 p-2.5 text-neutral-400 hover:text-neutral-300 relative"
          title="Enable Notifications"
        >
          <span className="sr-only">Enable notifications</span>
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span className="absolute top-2 right-2.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0A0A0A]" />
        </button>

        {/* Separator */}
        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-neutral-800" aria-hidden="true" />

        {/* Profile dropdown */}
        <div className="flex items-center gap-x-4 relative group cursor-pointer">
          <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700 overflow-hidden shrink-0">
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''}${user.avatarUrl}`} 
                alt="Profile" 
                className="h-full w-full object-cover" 
              />
            ) : (
              <UserIcon className="h-4 w-4 text-neutral-400" />
            )}
          </div>
          <span className="hidden lg:flex lg:items-center">
            <span className="ml-2 text-sm font-medium leading-6 text-white" aria-hidden="true">
              {user?.name || "Admin User"}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 text-neutral-500" aria-hidden="true" />
          </span>

          {/* Simple Dropdown Menu on Hover */}
          <div className="absolute right-0 top-full mt-2 w-48 rounded-md bg-neutral-900 border border-neutral-800 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right z-50">
            <div className="px-4 py-3 border-b border-neutral-800">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
            </div>
            <div className="p-1">
              <Link 
                href="/dashboard/profile"
                className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-md transition-colors mb-1"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                My Profile
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

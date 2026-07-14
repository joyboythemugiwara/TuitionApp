"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  IndianRupee, 
  Settings,
  Menu,
  Megaphone,
  Shield
} from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import useSWR from "swr";
import { api } from "@/lib/api";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Students", href: "/dashboard/students", icon: Users },
  { name: "Team", href: "/dashboard/team", icon: Shield },
  { name: "Batches", href: "/dashboard/batches", icon: BookOpen },
  { name: "Fees", href: "/dashboard/fees", icon: IndianRupee },
  { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ forceOpen = false }: { forceOpen?: boolean }) {
  const pathname = usePathname();
  const _isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const isSidebarOpen = forceOpen || _isSidebarOpen;
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  const { data: response } = useSWR("/tenants/me", fetcher, { 
    revalidateOnFocus: false, 
    dedupingInterval: 60000 
  });
  const tenantName = response?.data?.name || "TuitionHub";

  return (
    <div 
      className={cn(
        "flex h-full flex-col bg-[#0A0A0A] rounded-2xl border border-neutral-800 transition-all duration-300 ease-in-out overflow-hidden shadow-xl",
        isSidebarOpen ? "w-64" : "w-20"
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-neutral-800/50">
        <div className="flex items-center gap-3 overflow-hidden">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <BookOpen className="text-white h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent whitespace-nowrap animate-in fade-in duration-300 truncate max-w-[150px]">
                {tenantName}
              </span>
            </div>
          )}
        </div>
        <button 
          onClick={toggleSidebar}
          className={cn(
            "p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors flex-shrink-0",
            !isSidebarOpen && "mx-auto"
          )}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <nav className="flex-1 space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
                  isSidebarOpen ? "px-3 gap-3" : "justify-center px-0",
                  isActive
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                )}
                title={!isSidebarOpen ? item.name : undefined}
                onClick={() => {
                  if (forceOpen) closeMobileMenu();
                }}
              >
                <item.icon
                  className={cn(
                    "shrink-0 transition-colors",
                    isSidebarOpen ? "h-5 w-5" : "h-6 w-6",
                    isActive ? "text-indigo-400" : "text-neutral-500 group-hover:text-neutral-300"
                  )}
                  aria-hidden="true"
                />
                {isSidebarOpen && (
                  <span className="animate-in fade-in duration-300 whitespace-nowrap">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-neutral-800/50 p-4 overflow-hidden">
        <div className={cn(
          "rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 relative overflow-hidden group cursor-pointer hover:border-indigo-500/40 transition-all",
          isSidebarOpen ? "p-4" : "p-2 flex justify-center items-center h-12"
        )}>
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <BookOpen className={cn("transition-all", isSidebarOpen ? "w-12 h-12" : "w-6 h-6")} />
          </div>
          {isSidebarOpen ? (
            <>
              <h4 className="text-sm font-semibold text-indigo-400 mb-1 relative z-10 whitespace-nowrap">Pro Plan Active</h4>
              <p className="text-xs text-neutral-500 relative z-10 whitespace-nowrap">Unlimited students.</p>
            </>
          ) : (
            <BookOpen className="w-5 h-5 text-indigo-400 relative z-10" />
          )}
        </div>
      </div>
    </div>
  );
}

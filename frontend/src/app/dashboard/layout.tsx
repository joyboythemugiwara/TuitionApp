"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Protect the route
    if (mounted && (!user || !accessToken)) {
      router.replace("/auth/login");
    }
  }, [user, accessToken, mounted, router]);

  // Prevent flash of unauthenticated content during hydration
  if (!mounted || (!user && !accessToken)) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-neutral-400 font-medium animate-pulse">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-950 md:p-3 md:gap-3 text-neutral-100 font-sans selection:bg-indigo-500/30 overflow-hidden">
      <div className="hidden md:block h-full">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden relative md:rounded-2xl bg-[#0A0A0A] border-0 md:border md:border-neutral-800 shadow-2xl">
        {/* Subtle background glow for the whole dashboard */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <MobileSidebarOverlay />
    </div>
  );
}

// A simple overlay component that mounts the sidebar for mobile
function MobileSidebarOverlay() {
  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);

  if (!isMobileMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMobileMenu}></div>
      <div className="relative z-10 w-64 h-full bg-[#0A0A0A] shadow-2xl animate-in slide-in-from-left duration-300">
        <Sidebar forceOpen={true} />
      </div>
    </div>
  );
}

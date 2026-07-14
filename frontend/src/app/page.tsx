"use client";

import Link from 'next/link';
import { ArrowRight, BookOpen, Users, IndianRupee, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = !!accessToken;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || isAuthenticated) {
    return null; // Render nothing while hydrating or redirecting
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-neutral-900 dark:text-neutral-50 selection:bg-indigo-500/30 font-sans overflow-x-hidden transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="text-white h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">
              TuitionHub
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/auth/login" className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-black dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-md h-9 rounded-full px-5 text-sm font-semibold">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 relative">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-neutral-100/80 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-full px-4 py-1.5 mb-8 transition-colors duration-300">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">The ultimate tool for modern educators</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] text-neutral-900 dark:text-white transition-colors duration-300">
            Manage your tuition center <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              without the chaos.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed transition-colors duration-300">
            Everything you need to run your coaching center efficiently. Track students, manage batches, automate fee reminders, and focus purely on teaching.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/auth/signup">
              <Button className="bg-indigo-500 hover:bg-indigo-600 text-white h-12 px-8 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.3)] text-base font-semibold group">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-6xl mx-auto mt-32 relative z-10">
          <div className="grid md:grid-cols-3 gap-6">
            
            <div className="group bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/60 p-8 rounded-3xl hover:bg-neutral-100 dark:hover:bg-neutral-900/80 transition-colors duration-300">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Users className="text-blue-500 dark:text-blue-400 h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-white">Student Management</h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Maintain comprehensive profiles, track attendance, and organize students into unlimited batches seamlessly.
              </p>
            </div>

            <div className="group bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/60 p-8 rounded-3xl hover:bg-neutral-100 dark:hover:bg-neutral-900/80 transition-colors duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform relative z-10">
                <IndianRupee className="text-indigo-500 dark:text-indigo-400 h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 relative z-10 text-neutral-900 dark:text-white">Smart Fee Tracking</h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed relative z-10">
                Never lose track of payments again. Automated invoicing, pending dues dashboard, and seamless receipt generation.
              </p>
            </div>

            <div className="group bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/60 p-8 rounded-3xl hover:bg-neutral-100 dark:hover:bg-neutral-900/80 transition-colors duration-300">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform">
                <Zap className="text-purple-500 dark:text-purple-400 h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-white">Lightning Fast</h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Built on modern web technologies. Experience instant page loads, offline PWA support, and extreme reliability.
              </p>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200/50 dark:border-neutral-800/50 mt-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <BookOpen className="text-neutral-500 h-5 w-5" />
            <span className="text-neutral-600 dark:text-neutral-400 font-medium">TuitionHub © 2026</span>
          </div>
          <div className="flex space-x-6 text-sm text-neutral-600 dark:text-neutral-500">
            <a href="#" className="hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

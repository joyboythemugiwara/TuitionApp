import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-700">
        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-600 drop-shadow-sm mb-4">
          404
        </h1>
        <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-8 animate-pulse" />
        
        <h2 className="text-3xl font-bold text-white mb-4">Page not found</h2>
        <p className="text-neutral-400 max-w-md mx-auto mb-10 text-lg">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/" className={cn(buttonVariants({ variant: "default" }), "bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 px-8 h-12 text-base")}>
            <Home className="w-4 h-4 mr-2" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

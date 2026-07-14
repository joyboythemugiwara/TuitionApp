'use client';

import { useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-12 h-12 text-red-500 animate-pulse" />
        </div>
        
        <h2 className="text-4xl font-bold text-white mb-4">Something went wrong!</h2>
        <p className="text-neutral-400 max-w-md mx-auto mb-10 text-lg">
          An unexpected error occurred. We've been notified and are looking into it.
        </p>
        
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 mb-10 max-w-lg w-full overflow-hidden text-left">
          <p className="text-red-400 font-mono text-sm break-words">
            {error.message || "Unknown error"}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button 
            onClick={() => reset()}
            className="bg-white text-black hover:bg-neutral-200 rounded-xl px-8 h-12 text-base shadow-xl"
          >
            <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
          </Button>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "border-neutral-800 text-neutral-300 hover:text-white bg-transparent hover:bg-neutral-800 rounded-xl px-8 h-12 text-base")}>
            <Home className="w-4 h-4 mr-2" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

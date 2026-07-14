import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-full flex bg-neutral-50 dark:bg-neutral-950 overflow-hidden transition-colors duration-300">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center border-r border-neutral-200 dark:border-neutral-800">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,black,rgba(0,0,0,0))] dark:[mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 dark:opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-neutral-50 to-indigo-100/50 dark:from-blue-900/10 dark:via-neutral-950 dark:to-indigo-900/10 transition-colors duration-300"></div>
        
        <div className="z-10 text-center max-w-lg px-8">
          <div className="inline-flex h-16 w-16 bg-neutral-900 dark:bg-white rounded-2xl items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(255,255,255,0.3)] mb-6 transition-all duration-300">
            <span className="text-4xl font-black text-white dark:text-neutral-900">T</span>
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white tracking-tight mb-4 transition-colors duration-300">
            Welcome to TuitionHub
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed transition-colors duration-300">
            The ultimate platform for tutors and organizations to manage students, batches, and fee payments seamlessly.
          </p>
        </div>
      </div>
      
      {/* Right Side - Form Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 relative h-screen">
        <div className="absolute inset-0 bg-gradient-to-bl from-purple-100/50 via-neutral-50 to-neutral-50 dark:from-purple-900/10 dark:via-neutral-950 dark:to-neutral-950 lg:hidden transition-colors duration-300"></div>
        
        {/* Mobile Branding */}
        <div className="lg:hidden flex flex-col items-center mb-6 z-10">
          <div className="h-10 w-10 bg-neutral-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10 dark:shadow-white/20 mb-3 transition-colors duration-300">
            <span className="text-xl font-bold text-white dark:text-neutral-900">T</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight transition-colors duration-300">TuitionHub</h1>
        </div>
        
        {/* Form Content - Centered */}
        <div className="w-full max-w-[420px] z-10 flex flex-col justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}

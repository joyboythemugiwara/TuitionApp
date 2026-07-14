"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useMetadata } from '@/providers/MetadataProvider';
import { useEffect } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const { setTitle } = useMetadata();

  useEffect(() => {
    setTitle("Reset Password");
  }, [setTitle]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      await api.post('/auth/password/forgot', { email });
      setStatus('success');
      toast.success('If an account exists, a password reset link has been sent.');
    } catch (err: any) {
      setStatus('idle');
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    }
  };

  return (
    <div className="relative group">
      {/* Premium Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      
      <Card className="relative border-neutral-800/60 bg-neutral-900/80 backdrop-blur-2xl text-neutral-100 shadow-2xl p-2 rounded-xl">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-2xl text-center font-bold tracking-tight bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">Reset Password</CardTitle>
          <CardDescription className="text-center text-neutral-400 font-medium">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-neutral-300">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-neutral-950/50 border-neutral-800 focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 text-white h-11 transition-all placeholder:text-neutral-600"
                disabled={status === 'success'}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-white text-neutral-950 hover:bg-neutral-200 h-11 font-semibold text-base mt-2" 
              disabled={status === 'loading' || status === 'success'}
            >
              {status === 'loading' ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col pt-2 pb-4">
          <div className="text-center text-sm text-neutral-400 font-medium">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-white hover:underline transition-all">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

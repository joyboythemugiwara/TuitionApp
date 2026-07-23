"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useMetadata } from '@/providers/MetadataProvider';
import { useEffect } from 'react';
import posthog from 'posthog-js';

function GoogleLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [organization, setOrganization] = useState('');
  const [loading, setLoading] = useState(false);
  const { setTitle } = useMetadata();

  useEffect(() => {
    setTitle("Create Account");
  }, [setTitle]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/register', { 
        name,
        email, 
        password,
        organizationName: organization
      });
      
      const { user, tokens } = response.data.data;

      setAuth(user, tokens.accessToken, tokens.refreshToken);
      posthog.identify(user.id, { name: user.name, email: user.email, role: user.role });
      posthog.capture('user_signed_up', { method: 'email' });
      router.push('/dashboard');
      toast.success('Account created successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!organization.trim()) {
      toast.error('Please enter your Organization Name first!');
      return;
    }
    
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();

      const backendResponse = await api.post('/auth/register/firebase', { 
        token,
        tuitionCenterName: organization
      });
      
      const { user, tokens } = backendResponse.data.data;

      setAuth(user, tokens.accessToken, tokens.refreshToken);
      posthog.identify(user.id, { name: user.name, email: user.email, role: user.role });
      posthog.capture('user_signed_up', { method: 'google' });
      router.push('/dashboard');
      toast.success('Account created via Google successfully!');
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('auth/popup-closed-by-user') || err?.message?.includes('auth/cancelled-popup-request')) {
        return;
      }
      toast.error(err.message || 'Google Sign-Up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group">
      {/* Premium Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      
      <Card className="relative border-neutral-200 dark:border-neutral-800/60 bg-white/90 dark:bg-neutral-900/80 backdrop-blur-2xl text-neutral-900 dark:text-neutral-100 shadow-xl dark:shadow-2xl p-2 rounded-xl transition-colors duration-300">
        <CardHeader className="space-y-1.5 pb-4">
          <CardTitle className="text-2xl text-center font-bold tracking-tight bg-gradient-to-br from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">Create an account</CardTitle>
          <CardDescription className="text-center text-neutral-500 dark:text-neutral-400 font-medium">
            Enter your details below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleSignup} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-neutral-700 dark:text-neutral-300">Full Name</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder="John Doe" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-neutral-50 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 text-neutral-900 dark:text-white h-10 transition-all placeholder:text-neutral-500 dark:placeholder:text-neutral-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="organization" className="text-neutral-700 dark:text-neutral-300">Organization Name</Label>
              <Input 
                id="organization" 
                type="text" 
                placeholder="Doe Tuitions" 
                required 
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="bg-neutral-50 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 text-neutral-900 dark:text-white h-10 transition-all placeholder:text-neutral-500 dark:placeholder:text-neutral-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-neutral-700 dark:text-neutral-300">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-neutral-50 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 text-neutral-900 dark:text-white h-10 transition-all placeholder:text-neutral-500 dark:placeholder:text-neutral-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-neutral-700 dark:text-neutral-300">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-neutral-50 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-neutral-900 dark:text-white h-10 transition-all placeholder:text-neutral-500 dark:placeholder:text-neutral-600 pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button 
              disabled={loading} 
              type="submit" 
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-neutral-900/80 px-2 text-neutral-500 font-medium transition-colors duration-300">Or continue with</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full bg-neutral-50 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-all h-10"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <GoogleLogo className="mr-2 h-4 w-4" />
            Google
          </Button>
        </CardContent>
        <div className="bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800/60 p-4 rounded-b-xl mt-2 transition-colors duration-300">
          <div className="text-center text-sm text-neutral-500 dark:text-neutral-400 font-medium">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-all">
              Sign in
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

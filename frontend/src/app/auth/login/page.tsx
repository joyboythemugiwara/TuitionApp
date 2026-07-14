"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useMetadata } from '@/providers/MetadataProvider';
import { requestFCMToken } from '@/lib/fcm';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Type definitions for Google One Tap
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (notification?: (notification: any) => void) => void;
        };
      };
    };
  }
}

// A simple Google Logo SVG component
function GoogleLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // States for automatic signup from login
  const [showOrgDialog, setShowOrgDialog] = useState(false);
  const [organization, setOrganization] = useState('');
  const [pendingFirebaseToken, setPendingFirebaseToken] = useState<string | null>(null);

  const { setTitle } = useMetadata();

  useEffect(() => {
    setTitle("Sign In");
  }, [setTitle]);

  const handleRegisterWithOrganization = async () => {
    if (!organization.trim()) {
      toast.error('Please enter your Organization Name');
      return;
    }
    if (!pendingFirebaseToken) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/register/firebase', {
        token: pendingFirebaseToken,
        tuitionCenterName: organization
      });
      const { user, tokens } = response.data.data;
      
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      setShowOrgDialog(false);
      setPendingFirebaseToken(null);
      router.push('/dashboard');
      toast.success('Account created successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Try to get FCM Token if permission granted, otherwise it just returns null
      const fcmToken = await requestFCMToken();

      const response = await api.post('/auth/login', { 
        email, 
        password,
        fcmToken 
      });
      
      const { user, tokens } = response.data.data;
      
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      
      router.push('/dashboard');
      toast.success('Successfully signed in!');
    } catch (err: any) {
      toast.error(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize Google One Tap if the client ID is present
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (clientId && window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          setLoading(true);
          let token = '';
          try {
            // Convert Google JWT to Firebase Credential
            const credential = GoogleAuthProvider.credential(response.credential);
            const result = await signInWithCredential(auth, credential);
            token = await result.user.getIdToken();
            
            // Authenticate with our backend
            const backendResponse = await api.post('/auth/login/firebase', { token });
            const { user, tokens } = backendResponse.data.data;
            
            setAuth(user, tokens.accessToken, tokens.refreshToken);
            router.push('/dashboard');
            toast.success('Successfully signed in with Google One Tap!');
          } catch (err: any) {
            console.error(err);
            if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('auth/popup-closed-by-user') || err?.message?.includes('auth/cancelled-popup-request')) {
              return;
            }
            if (err.message === 'User does not exist in our records' || err.response?.data?.body?.message === 'User does not exist in our records') {
              setPendingFirebaseToken(token);
              setShowOrgDialog(true);
            } else {
              toast.error(err.message || 'One Tap Sign-In failed');
            }
          } finally {
            setLoading(false);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Prompt One Tap
      window.google.accounts.id.prompt();
    }
  }, [router, setAuth]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    let token = '';
    try {
      const result = await signInWithPopup(auth, googleProvider);
      token = await result.user.getIdToken();
      
      // Send Firebase ID token to backend
      const response = await api.post('/auth/login/firebase', { token });
      const { user, tokens } = response.data.data;
      
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      router.push('/dashboard');
      toast.success('Successfully signed in with Google!');
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('auth/popup-closed-by-user') || err?.message?.includes('auth/cancelled-popup-request')) {
        return;
      }
      if (err.message === 'User does not exist in our records' || err.response?.data?.body?.message === 'User does not exist in our records') {
        setPendingFirebaseToken(token);
        setShowOrgDialog(true);
      } else {
        toast.error(err.message || 'Google Sign-In failed');
      }
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
          <CardTitle className="text-2xl text-center font-bold tracking-tight bg-gradient-to-br from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">Welcome back</CardTitle>
          <CardDescription className="text-center text-neutral-500 dark:text-neutral-400 font-medium">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full bg-neutral-50 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-all h-10"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <GoogleLogo className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-neutral-900/80 px-2 text-neutral-500 font-medium transition-colors duration-300">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-neutral-700 dark:text-neutral-300">Password</Label>
                <Link href="/auth/forgot-password" className="text-sm font-medium text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
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
            
            <Button type="submit" className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 h-10 font-semibold mt-1 shadow-md dark:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-colors duration-300" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
        <div className="bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800/60 p-4 rounded-b-xl mt-2 transition-colors duration-300">
          <div className="text-center text-sm text-neutral-500 dark:text-neutral-400 font-medium">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-all">
              Sign up
            </Link>
          </div>
        </div>
      </Card>

      <Dialog open={showOrgDialog} onOpenChange={(open) => !open && setShowOrgDialog(false)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">Complete your profile</DialogTitle>
            <DialogDescription className="text-neutral-500 dark:text-neutral-400">
              We couldn't find an existing account. Please enter your organization name to finish creating your new account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                placeholder="E.g., John's Tuitions"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="bg-neutral-50 dark:bg-neutral-950/50"
              />
            </div>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowOrgDialog(false);
                setPendingFirebaseToken(null);
                setOrganization('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRegisterWithOrganization} disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { Loader2, Lock, AlertTriangle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockedUntil) {
      setLockCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 1000));
      setLockCountdown(remaining);
      if (remaining <= 0) {
        setLockedUntil(null);
        setRemainingAttempts(null);
        setError('');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (data: LoginFormData) => {
    if (lockedUntil && new Date(lockedUntil) > new Date()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await authService.login(data);
      setRemainingAttempts(null);
      setLockedUntil(null);
      login(response.token, response.user);
      router.push('/dashboard');
    } catch (err: any) {
      const responseData = err.response?.data;
      const status = err.response?.status;

      // Handle lockout (423)
      if (status === 423) {
        setLockedUntil(responseData?.lockedUntil || null);
        setRemainingAttempts(0);
        setError(responseData?.error || 'Account locked. Please try again later.');
        return;
      }

      // Handle pending approval (403)
      if (status === 403) {
        setError('Account pending approval. Please wait for Director review.');
        return;
      }

      // Handle failed login with remaining attempts
      if (responseData?.remainingAttempts !== undefined) {
        setRemainingAttempts(responseData.remainingAttempts);
      }

      setError(responseData?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isLocked = lockedUntil && lockCountdown > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Lockout banner */}
            {isLocked && (
              <Alert className="border-red-200 bg-red-50">
                <Lock className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  Account locked due to too many failed attempts.
                  <br />
                  Try again in <span className="font-mono font-bold">{formatCountdown(lockCountdown)}</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Remaining attempts warning */}
            {!isLocked && remainingAttempts !== null && remainingAttempts > 0 && remainingAttempts <= 5 && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  {remainingAttempts} login attempt{remainingAttempts !== 1 ? 's' : ''} remaining before your account is locked.
                </AlertDescription>
              </Alert>
            )}

            {/* General error */}
            {error && !isLocked && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                disabled={!!isLocked}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                disabled={!!isLocked}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !!isLocked}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
              ) : isLocked ? (
                <><Lock className="mr-2 h-4 w-4" /> Account Locked</>
              ) : (
                'Sign in'
              )}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

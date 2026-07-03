'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@drsiri/ui'
import { toast } from 'sonner'
import { KeyRound, Mail, Loader2 } from 'lucide-react'

// Validation Schemas
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
})

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
})

type LoginFormValues = z.infer<typeof loginSchema>
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function LoginPage() {
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [isLoading, setIsLoading] = useState(false)

  // Login Form Hook
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // Forgot Password Form Hook
  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: forgotErrors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onLogin = async (values: LoginFormValues) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        toast.error(error.message || 'Failed to sign in. Please try again.')
        setIsLoading(false)
        return
      }

      // Check if user is an admin
      const role = data.user?.app_metadata?.role
      if (role !== 'admin') {
        // Sign out user since they are not an admin
        await supabase.auth.signOut()
        toast.error('Access Denied. Only admin users can access this portal.')
        setIsLoading(false)
        return
      }

      toast.success('Successfully logged in!')
      window.location.href = '/'
    } catch (err) {
      toast.error('An unexpected error occurred during login.')
      setIsLoading(false)
    }
  }

  const onForgotPassword = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/reset-password`,
      })

      if (error) {
        toast.error(error.message || 'Failed to send recovery email.')
        return
      }

      toast.success('Recovery link sent! Please check your email inbox.')
      setMode('login')
    } catch (err) {
      toast.error('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      {/* Visual Accent Gradients */}
      <div className="absolute top-0 left-1/4 size-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 size-[500px] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="size-10 rounded-xl overflow-hidden border border-border shadow-sm flex items-center justify-center">
            <img src="/logo.jpg" alt="Dr. Siri Logo" className="size-full object-cover" />
          </div>
          <span className="font-display font-semibold text-2xl tracking-tight text-primary">
            Dr. Siri
          </span>
        </div>
        <h2 className="text-center font-display text-2xl font-bold tracking-tight text-foreground">
          {mode === 'login' ? 'Admin Portal Sign In' : 'Reset your password'}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {mode === 'login' ? (
            <>
              Women Supporting Women E-Commerce Admin
            </>
          ) : (
            'Enter your admin email to receive a recovery link'
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <Card className="shadow-lg border-border">
          <CardHeader className="sr-only">
            <CardTitle>{mode === 'login' ? 'Login Form' : 'Forgot Password Form'}</CardTitle>
            <CardDescription>Authentication form credentials entry</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {mode === 'login' ? (
              <form onSubmit={handleSubmitLogin(onLogin)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground/75" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@drsiri.com"
                      className="pl-9 bg-background border-border focus:border-primary/50"
                      {...registerLogin('email')}
                    />
                  </div>
                  {loginErrors.email && (
                    <span className="text-xs font-medium text-destructive mt-0.5">
                      {loginErrors.email.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs font-medium text-secondary hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground/75" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 bg-background border-border focus:border-primary/50"
                      {...registerLogin('password')}
                    />
                  </div>
                  {loginErrors.password && (
                    <span className="text-xs font-medium text-destructive mt-0.5">
                      {loginErrors.password.message}
                    </span>
                  )}
                </div>

                <Button type="submit" disabled={isLoading} className="w-full mt-2 cursor-pointer">
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmitForgot(onForgotPassword)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="forgot-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground/75" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="admin@drsiri.com"
                      className="pl-9 bg-background border-border focus:border-primary/50"
                      {...registerForgot('email')}
                    />
                  </div>
                  {forgotErrors.email && (
                    <span className="text-xs font-medium text-destructive mt-0.5">
                      {forgotErrors.email.message}
                    </span>
                  )}
                </div>

                <Button type="submit" disabled={isLoading} className="w-full mt-2 cursor-pointer">
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Sending reset link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 border-t border-border flex justify-center py-4">
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                Back to Sign In
              </button>
            )}
            {mode === 'login' && (
              <p className="text-xs text-muted-foreground text-center">
                Secure access for authorized administrators only.
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

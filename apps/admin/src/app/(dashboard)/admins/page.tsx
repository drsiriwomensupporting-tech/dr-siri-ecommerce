'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge
} from '@drsiri/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { 
  Plus, 
  Shield, 
  Mail, 
  Calendar,
  KeyRound,
  Loader2,
  Lock,
  UserCheck
} from 'lucide-react'
import { createAdminUser } from '@/app/actions/admins'
import { formatDate } from '@drsiri/utils'

// Zod Validation Schema
const newAdminSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
})

type NewAdminFormValues = z.infer<typeof newAdminSchema>

export default function AdminsPage() {
  const supabase = createClient()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Fetch admin list
  const { data: admins = [], isLoading, refetch } = useQuery({
    queryKey: ['admins-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: true })

      if (error) {
        toast.error('Failed to load administrator list: ' + error.message)
        throw error
      }
      return data
    }
  })

  // Form Setup
  const form = useForm<NewAdminFormValues>({
    resolver: zodResolver(newAdminSchema),
    defaultValues: { email: '', password: '' }
  })

  const onSubmit = async (values: NewAdminFormValues) => {
    setIsCreating(true)
    try {
      const result = await createAdminUser(values.email, values.password)
      
      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('New administrator created successfully!')
      setIsAddOpen(false)
      form.reset()
      refetch()
    } catch (err: any) {
      toast.error('An unexpected error occurred: ' + err.message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Admin Management</h2>
          <p className="text-sm text-muted-foreground">Manage administrative credentials. Public signup is disabled.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="cursor-pointer">
          <Plus className="size-4 mr-1.5" />
          Add Admin User
        </Button>
      </div>

      {/* Admin list Card */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/10 pb-4">
          <CardTitle className="font-display text-base font-bold flex items-center gap-1.5">
            <Shield className="size-4 text-primary" />
            Active Administrators
          </CardTitle>
          <CardDescription>Accounts authorized to manage sellers, categories, products, and inventory.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary mb-2" />
              <span>Fetching administrator profiles...</span>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No administrator accounts found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/5">
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin Email</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile UUID</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Created Date</th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id} className="hover:bg-muted/5 transition-colors">
                    <TableCell className="px-6 py-3.5 font-medium text-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs border border-primary/20">
                          {admin.email[0].toUpperCase()}
                        </div>
                        {admin.email}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-xs text-muted-foreground font-mono">
                      {admin.id}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-center">
                      <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200">
                        Active Admin
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-xs text-muted-foreground text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Calendar className="size-3 text-muted-foreground/75" />
                        {formatDate(admin.created_at)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Admin Dialog Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-bold flex items-center gap-1.5">
              <UserCheck className="size-4.5 text-primary" />
              Add Administrator
            </DialogTitle>
            <p className="text-xs text-muted-foreground">This registers a new administrator. Accounts are created and confirmed instantly.</p>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 py-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground/75" />
                <Input
                  type="email"
                  placeholder="newadmin@drsiri.com"
                  className="pl-9 bg-background border-border"
                  {...form.register('email')}
                />
              </div>
              {form.formState.errors.email && (
                <span className="text-xs text-destructive mt-0.5">{form.formState.errors.email.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Secure Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground/75" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-9 bg-background border-border"
                  {...form.register('password')}
                />
              </div>
              {form.formState.errors.password && (
                <span className="text-xs text-destructive mt-0.5">{form.formState.errors.password.message}</span>
              )}
            </div>

            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg text-[11px] text-rose-800 leading-normal mt-2">
              <Lock className="size-3.5 shrink-0 text-rose-600 mt-0.5" />
              <span>
                <strong>Warning:</strong> Newly created admins will have full read/write privileges to all records, including adding other admins. Please double check credentials.
              </span>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="border-border">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreating}>
                {isCreating && <Loader2 className="size-4 animate-spin mr-1.5" />}
                Register Admin
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

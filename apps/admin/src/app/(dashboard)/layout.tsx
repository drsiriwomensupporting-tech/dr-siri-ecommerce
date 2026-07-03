import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShellClient from './layout-client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const email = user.email || 'admin@drsiri.com'
  const role = user.app_metadata?.role || 'admin'

  return (
    <DashboardShellClient email={email} role={role}>
      {children}
    </DashboardShellClient>
  )
}

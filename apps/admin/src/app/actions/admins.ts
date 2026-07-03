'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createAdminUser(email: string, password: string) {
  try {
    // 1. Authenticate the caller
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Unauthorized. Please sign in.' }
    }

    // Verify current caller has admin rights
    const callerRole = user.app_metadata?.role
    if (callerRole !== 'admin') {
      return { error: 'Access Denied. Only admins can register new administrator accounts.' }
    }

    // 2. Instantiate the Admin SDK Client
    const supabaseAdmin = createAdminClient()

    // 3. Create the user under auth.users (email_confirm: true bypasses verification email)
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      return { error: 'Auth registration failed: ' + createError.message }
    }

    // 4. Update the user role inside public.profiles to 'admin'
    // Note: The on_profile_role_updated trigger automatically syncs this back to app_metadata (JWT claim).
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', authUser.user.id)

    if (profileError) {
      // Clean up the created auth user if profile assignment failed
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return { error: 'Profile configuration failed: ' + profileError.message }
    }

    revalidatePath('/admins')
    return { success: true }
  } catch (err: any) {
    return { error: 'An unexpected error occurred: ' + err.message }
  }
}

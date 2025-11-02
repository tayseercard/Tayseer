import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import SuperadminLayoutClient from './SuperadminLayoutClient'

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ❌ Not logged in → redirect to login
  if (!user) {
    redirect(`/auth/login?redirectTo=/superadmin`)
  }

  // ✅ Optional: check user role
  const { data: roles } = await supabase
    .from('me_effective_role')
    .select('role')
    .eq('user_id', user.id)

  const roleList = roles?.map((r) => r.role) || []
  if (!roleList.includes('superadmin')) {
    redirect('/auth/login')
  }

  return <SuperadminLayoutClient>{children}</SuperadminLayoutClient>
}

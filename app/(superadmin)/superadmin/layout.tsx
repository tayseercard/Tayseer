import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import SuperadminLayoutClient from './SuperadminLayoutClient'

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user) redirect('/auth/login')

    const { data: roles, error: roleErr } = await supabase
      .from('me_effective_role')
      .select('role')
      .eq('user_id', user.id)

    if (roleErr) {
      console.error('Role fetch error:', roleErr)
      redirect('/auth/login')
    }

    const roleList = roles?.map((r) => r.role) || []
    if (!roleList.includes('superadmin')) redirect('/auth/login')

    return <SuperadminLayoutClient>{children}</SuperadminLayoutClient>
  } catch (err) {
    console.error('❌ Superadmin layout error:', err)
    redirect('/auth/login')
  }
}

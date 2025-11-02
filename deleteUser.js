import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://djcotaizasnukiebjtjj.supabase.co',
  'YOUR_SERVICE_ROLE_KEY' // ⚠️ service role key only
)

async function deleteUser(userId) {
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) {
    console.error('❌ Failed to delete user:', error.message)
  } else {
    console.log('✅ User deleted successfully:', userId)
  }
}

deleteUser('1165917e-01cf-488d-8609-5bf4af1996e7')

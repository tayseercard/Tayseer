import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://djcotaizasnukiebjtjj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqY290YWl6YXNudWtpZWJqdGpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NTMzMiwiZXhwIjoyMDc2NTcxMzMyfQ.zqFC_8Wb8AMkYMxxZih4tEG7QZ2n9CuU9UkhQvJF2R8' // ⚠️ service role key only
)

async function deleteUser(userId) {
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) {
    console.error('❌ Failed to delete user:', error.message)
  } else {
    console.log('✅ User deleted successfully:', userId)
  }
}

deleteUser('d4462feb-db9a-4686-bd86-6a845ba5adca')

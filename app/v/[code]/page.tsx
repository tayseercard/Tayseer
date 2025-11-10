'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams } from 'next/navigation'

export default function VoucherDebugPage() {
  const { code } = useParams()
  const supabase = createClientComponentClient()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return
    ;(async () => {
      const { data, error } = await supabase
        .from('vouchers_public')
        .select('*')
        .eq('code', code)
        .maybeSingle()

      console.log('Supabase result:', { data, error })
      setData(data)
      if (error) setError(error.message)
    })()
  }, [code])

  if (error) return <p>❌ Error: {error}</p>
  if (!data) return <p>⏳ Loading or not found</p>

  return (
    <pre className="p-6 bg-gray-100 rounded">{JSON.stringify(data, null, 2)}</pre>
  )
}

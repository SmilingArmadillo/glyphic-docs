import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import LandingPage from '@/components/marketing/LandingPage'

export default async function Page() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (
    <Suspense fallback={null}>
      <LandingPage user={user} />
    </Suspense>
  )
}

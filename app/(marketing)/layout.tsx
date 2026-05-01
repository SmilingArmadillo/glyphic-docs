import { createSupabaseServerClient } from '@/lib/supabase-server'
import MarketingLayoutClient from './MarketingLayoutClient'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <MarketingLayoutClient user={user}>{children}</MarketingLayoutClient>
}

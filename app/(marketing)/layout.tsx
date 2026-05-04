import { createSupabaseServerClient } from '@/lib/supabase-server'
import MarketingLayoutClient from './MarketingLayoutClient'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  return <MarketingLayoutClient user={session?.user ?? null}>{children}</MarketingLayoutClient>
}

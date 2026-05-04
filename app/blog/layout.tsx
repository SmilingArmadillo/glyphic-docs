import DocsNav from '@/components/DocsNav'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  return (
    <>
      <DocsNav user={session?.user ?? null} />
      {children}
    </>
  )
}

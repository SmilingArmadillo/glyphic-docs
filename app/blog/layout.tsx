import DocsNav from '@/components/DocsNav'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (
    <>
      <DocsNav user={user} />
      {children}
    </>
  )
}

import { DocsLayout } from 'fumadocs-ui/layout'
import type { ReactNode } from 'react'
import { source } from '@/lib/source'
import { baseOptions } from '@/app/layout.config'
import DocsFooter from '@/components/DocsFooter'
import DocsNav from '@/components/DocsNav'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { perfStart } from '@/lib/perf-log'

export default async function Layout({ children }: { children: ReactNode }) {
  const end = perfStart('docs/layout')
  const treeSize = JSON.stringify(source.pageTree).length
  end()
  console.log(`[docs/layout] pageTree size: ${treeSize} bytes`)
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (
    <>
      <DocsNav user={user} />
      <DocsLayout tree={source.pageTree} {...baseOptions}>
        {children}
      </DocsLayout>
      <DocsFooter />
    </>
  )
}

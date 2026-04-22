import { DocsLayout } from 'fumadocs-ui/layout'
import type { ReactNode } from 'react'
import { source } from '@/lib/source'
import { baseOptions } from '@/app/layout.config'
import DocsNav from '@/components/DocsNav'
import DocsFooter from '@/components/DocsFooter'
import ThemePicker from '@/components/ThemePicker'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <DocsNav />
      <DocsLayout
        tree={source.pageTree}
        {...baseOptions}
        sidebar={{ footer: <ThemePicker /> }}
      >
        {children}
      </DocsLayout>
      <DocsFooter />
    </>
  )
}

import type { User } from '@supabase/supabase-js'
import NavUserMenuClient from '@/components/NavUserMenuClient'

interface Props {
  user: User | null
}

export default function NavUserMenu({ user }: Props) {
  return <NavUserMenuClient user={user} />
}

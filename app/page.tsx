import { Dashboard } from '@/components/dashboard'
import { getSessionUser } from '@/app/actions'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const isGuest = cookieStore.get('guest_mode')?.value === 'true'

  if (isGuest) {
    const guestUser = {
      id: 'guest',
      email: 'guest@xraix.system',
      profile: {
        id: 'guest',
        name: 'Guest User',
        role: 'guest',
        email: 'guest@xraix.system',
      },
    }
    return (
      <main className="min-h-screen bg-background">
        <Dashboard user={guestUser} />
      </main>
    )
  }

  const user = await getSessionUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-background">
      <Dashboard user={user} />
    </main>
  )
}

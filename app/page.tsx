import { Dashboard } from '@/components/dashboard'
import { getSessionUser } from '@/app/actions'
import { redirect } from 'next/navigation'

export default async function Page() {
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

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [autorizado, setAutorizado] = useState(false)

  useEffect(() => {
    const verificarSeguridad = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/')
      } else {
        setAutorizado(true)
      }
    }
    verificarSeguridad()
  }, [router])

  if (!autorizado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-700">🛡️ Verificando credenciales...</h2>
      </div>
    )
  }

  return <>{children}</>
}
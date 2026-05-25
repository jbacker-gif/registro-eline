'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Image from 'next/image'

const menuItems = [
  { label: 'Inicio', ruta: '/dashboard', clave: 'dashboard', requiereSeccion: false, icono: 'home' },
  { label: 'Asistencia', ruta: '/dashboard/asistencia', clave: 'asistencia', requiereSeccion: true, icono: 'calendar' },
  { label: 'Boletines', ruta: '/dashboard/boletines', clave: 'boletines', requiereSeccion: false, icono: 'report' },
  { label: 'Estudiantes', ruta: '/dashboard/estudiantes', clave: 'estudiantes', requiereSeccion: true, icono: 'users' },
  { label: 'Secciones', ruta: '/dashboard/secciones', clave: 'secciones', requiereSeccion: false, icono: 'layers' },
]

function Icono({ tipo }: { tipo: string }) {
  const base = 'h-4 w-4'
  if (tipo === 'home') return <path className={base} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10.5 12 3l9 7.5M5.25 9.75V21h13.5V9.75" />
  if (tipo === 'calendar') return <path className={base} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3v3m8-3v3M4 10h16M5 6h14a1 1 0 0 1 1 1v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Z" />
  if (tipo === 'report') return <path className={base} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 1v5h5M9 13h6M9 17h6M9 9h2" />
  if (tipo === 'users') return <path className={base} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 19a4 4 0 0 0-8 0m13 0a4 4 0 0 0-6-3.46M15 7a3 3 0 1 1 0 6m-6-1a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
  return <path className={base} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" />
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [validandoSesion, setValidandoSesion] = useState(true)

  useEffect(() => {
    const validarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/')
        return
      }
      setValidandoSesion(false)
    }

    validarSesion()
  }, [router])

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('ultimaSeccionActiva')
    router.push('/')
  }

  const navegarConContexto = (ruta: string, requiereSeccion = false) => {
    const params = new URLSearchParams(window.location.search)
    const seccionId = params.get('seccion_id') || localStorage.getItem('ultimaSeccionActiva')

    if (requiereSeccion && !seccionId) {
      alert('Primero selecciona una sección en el panel principal.')
      router.push('/dashboard')
      setMenuAbierto(false)
      return
    }

    if (requiereSeccion && seccionId) {
      router.push(`${ruta}?seccion_id=${seccionId}`)
    } else {
      router.push(ruta)
    }
    setMenuAbierto(false)
  }

  if (validandoSesion) {
    return <div className="p-8 text-center text-slate-500">Verificando sesión...</div>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <div className="fixed left-0 top-0 z-50 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="ELINE" width={24} height={24} className="rounded-md object-contain" />
          <span className="text-sm font-semibold tracking-wide text-slate-900">ELINE</span>
        </div>
        <button onClick={() => setMenuAbierto(!menuAbierto)} className="rounded-lg border border-slate-200 p-2 text-slate-600">
          {menuAbierto ? '✕' : '☰'}
        </button>
      </div>

      {menuAbierto && <div className="fixed inset-0 z-40 bg-slate-900/20 md:hidden" onClick={() => setMenuAbierto(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full flex-col border-r border-slate-200 bg-white transition-transform md:static md:translate-x-0 ${
          menuAbierto ? 'translate-x-0' : ''
        }`}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
          <Image src="/logo.png" alt="Logo" width={34} height={34} className="rounded-lg object-contain" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">ELINE</h2>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Panel docente</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6 mt-14 md:mt-0">
          {menuItems.map((item) => {
            const activo = pathname === item.ruta || (item.ruta !== '/dashboard' && pathname.includes(item.clave))
            return (
              <button
                key={item.ruta}
                onClick={() => navegarConContexto(item.ruta, item.requiereSeccion)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  activo ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                  <Icono tipo={item.icono} />
                </svg>
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <button
            onClick={cerrarSesion}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden pt-14 md:pt-0">{children}</main>
    </div>
  )
}

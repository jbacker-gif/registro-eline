'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Image from 'next/image'

type MenuItem = {
  label: string
  ruta: string
  clave: string
  requiereSeccion: boolean
  icono: string
  nivel?: 'Primaria' | 'Secundario'
}

const menuGroups: { titulo: string; items: MenuItem[] }[] = [
  {
    titulo: 'Inicio',
    items: [
      { label: 'Dashboard', ruta: '/dashboard', clave: 'dashboard', requiereSeccion: false, icono: 'home' },
    ],
  },
  {
    titulo: 'Registro Escolar',
    items: [
      { label: 'Lista Nivel Primario', ruta: '/dashboard/estudiantes', clave: 'estudiantes', requiereSeccion: true, icono: 'users', nivel: 'Primaria' },
      { label: 'Asistencia Primaria', ruta: '/dashboard/asistencia', clave: 'asistencia', requiereSeccion: true, icono: 'calendar', nivel: 'Primaria' },
      { label: 'Calificaciones Primaria', ruta: '/dashboard/calificaciones-masivas', clave: 'calificaciones-masivas', requiereSeccion: true, icono: 'upload', nivel: 'Primaria' },
      { label: 'Lista Nivel Secundario', ruta: '/dashboard/secundaria/estudiantes', clave: 'secundaria/estudiantes', requiereSeccion: true, icono: 'layers', nivel: 'Secundario' },
      { label: 'Asistencia Secundaria', ruta: '/dashboard/secundaria/asistencia', clave: 'secundaria/asistencia', requiereSeccion: true, icono: 'calendar', nivel: 'Secundario' },
      { label: 'Calificaciones Secundaria', ruta: '/dashboard/secundaria/calificaciones-masivas', clave: 'secundaria/calificaciones-masivas', requiereSeccion: true, icono: 'upload', nivel: 'Secundario' },
    ],
  },
  {
    titulo: 'Reportes',
    items: [
      { label: 'Resumen Primaria', ruta: '/dashboard/resumen', clave: 'resumen', requiereSeccion: true, icono: 'report', nivel: 'Primaria' },
      { label: 'Boletines Primaria', ruta: '/dashboard/boletines', clave: 'boletines', requiereSeccion: true, icono: 'file', nivel: 'Primaria' },
      { label: 'Reporte Secundaria', ruta: '/dashboard/secundaria/resumen', clave: 'secundaria/resumen', requiereSeccion: true, icono: 'report', nivel: 'Secundario' },
      { label: 'Boletines Secundaria', ruta: '/dashboard/secundaria/boletines', clave: 'secundaria/boletines', requiereSeccion: true, icono: 'file', nivel: 'Secundario' },
    ],
  },
  {
    titulo: 'Configuracion',
    items: [
      { label: 'Secciones', ruta: '/dashboard/secciones', clave: 'secciones', requiereSeccion: false, icono: 'layers' },
      { label: 'Plantillas', ruta: '/dashboard/plantillas', clave: 'plantillas', requiereSeccion: false, icono: 'download' },
      { label: 'Perfil y centro', ruta: '/dashboard/perfil', clave: 'perfil', requiereSeccion: false, icono: 'user' },
    ],
  },
  {
    titulo: 'Administracion',
    items: [
      { label: 'Panel admin', ruta: '/dashboard/admin', clave: 'admin', requiereSeccion: false, icono: 'shield' },
    ],
  },
]

function Icono({ tipo }: { tipo: string }) {
  if (tipo === 'home') return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10.5 12 3l9 7.5M5.25 9.75V21h13.5V9.75" />
  if (tipo === 'calendar') return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3v3m8-3v3M4 10h16M5 6h14a1 1 0 0 1 1 1v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Z" />
  if (tipo === 'users') return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 19a4 4 0 0 0-8 0m13 0a4 4 0 0 0-6-3.46M15 7a3 3 0 1 1 0 6m-6-1a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
  if (tipo === 'upload') return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16V4m0 0 4 4m-4-4-4 4M5 20h14" />
  if (tipo === 'report') return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 1v5h5M9 13h6M9 17h6" />
  if (tipo === 'file') return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3h7l5 5v13H8a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm7 0v6h5" />
  if (tipo === 'download') return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v11m0 0 4-4m-4 4-4-4M5 19h14" />
  if (tipo === 'user') return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 7.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 21a7.5 7.5 0 0 1 15 0" />
  if (tipo === 'shield') return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3 5 6v5c0 4.5 2.9 8.5 7 10 4.1-1.5 7-5.5 7-10V6l-7-3Zm0 7v5m0 3h.01" />
  return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" />
}

function fechaLocalISO() {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
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

      const appMetadata = session.user.app_metadata || {}
      const rol = String(appMetadata.rol || appMetadata.role || '')
      const esAdmin = rol === 'admin' || rol === 'super_admin'

      if (!esAdmin) {
        const { data: suscripcion, error } = await supabase
          .from('suscripciones')
          .select('activa, fecha_fin')
          .or(`user_id.eq.${session.user.id},email.eq.${session.user.email || ''}`)
          .maybeSingle()

        const suscripcionVencida = Boolean(suscripcion?.fecha_fin && suscripcion.fecha_fin < fechaLocalISO())

        if (!error && suscripcion && (suscripcion.activa === false || suscripcionVencida)) {
          router.replace('/suscripciones')
          return
        }
      }

      setValidandoSesion(false)
    }

    validarSesion()
  }, [router])

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('ultimaSeccionActiva')
    localStorage.removeItem('ultimaSeccionPrimaria')
    localStorage.removeItem('ultimaSeccionSecundaria')
    router.push('/')
  }

  const navegarConContexto = (item: MenuItem) => {
    const params = new URLSearchParams(window.location.search)
    const seccionId = item.nivel === 'Primaria'
      ? localStorage.getItem('ultimaSeccionPrimaria') || localStorage.getItem('ultimaSeccionActiva') || params.get('seccion_id')
      : item.nivel === 'Secundario'
        ? localStorage.getItem('ultimaSeccionSecundaria') || params.get('seccion_id')
        : params.get('seccion_id')

    if (item.requiereSeccion && !seccionId) {
      alert(`Primero selecciona una seccion de ${item.nivel || 'Primaria'} en el Dashboard.`)
      router.push('/dashboard')
      setMenuAbierto(false)
      return
    }

    router.push(item.requiereSeccion && seccionId ? `${item.ruta}?seccion_id=${seccionId}&nivel=${item.nivel || 'Primaria'}` : item.ruta)
    setMenuAbierto(false)
  }

  if (validandoSesion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">
        Verificando sesión...
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="fixed left-0 top-0 z-[70] flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:hidden">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="ELINE" width={26} height={26} className="rounded-md object-contain" />
          <span className="text-sm font-semibold tracking-wide text-slate-900">ELINE</span>
        </div>
        <button
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600"
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            {menuAbierto ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 6 12 12M18 6 6 18" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {menuAbierto && <button className="fixed inset-0 z-[55] bg-slate-950/25 md:hidden" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú" />}

      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex w-72 max-w-[86vw] -translate-x-full flex-col border-r border-slate-200 bg-white shadow-xl transition-transform md:static md:w-64 md:max-w-none md:translate-x-0 md:shadow-none ${
          menuAbierto ? 'translate-x-0' : ''
        }`}
      >
        <div className="border-b border-slate-100 px-5 py-5">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo ELINE" width={34} height={34} className="rounded-md object-contain" />
            <div>
              <h2 className="text-base font-semibold text-slate-950">ELINE</h2>
              <p className="text-xs font-medium text-slate-500">Panel docente</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5 mt-14 md:mt-0" aria-label="Navegación principal">
          {menuGroups.map((group) => (
            <div key={group.titulo}>
              <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-widest text-slate-400">{group.titulo}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const activo = pathname === item.ruta || (item.ruta !== '/dashboard' && pathname.includes(item.clave))
                  return (
                    <button
                      key={item.ruta}
                      onClick={() => navegarConContexto(item)}
                      className={`flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                        activo ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 shrink-0">
                        <Icono tipo={item.icono} />
                      </svg>
                      <span className="min-w-0 flex-1 leading-5">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <button
            onClick={cerrarSesion}
            className="flex h-10 w-full items-center justify-center rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-14 md:pt-0">{children}</main>
    </div>
  )
}

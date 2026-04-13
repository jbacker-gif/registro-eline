'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Image from 'next/image'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [seccionId, setSeccionId] = useState<string | null>(null)

  useEffect(() => {
    let id = searchParams.get('seccion_id')
    if (!id) {
      id = localStorage.getItem('ultimaSeccionActiva')
    }
    setSeccionId(id)
  }, [searchParams])

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('ultimaSeccionActiva')
    router.push('/')
  }

  const navegarConContexto = (ruta: string) => {
    if (!seccionId) {
      alert('Por favor, selecciona una sección en el panel principal primero.')
      router.push('/dashboard')
      setMenuAbierto(false)
      return
    }
    router.push(`${ruta}?seccion_id=${seccionId}`)
    setMenuAbierto(false) 
  }

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden font-sans">
      
      {/* ========================================================
          BARRA SUPERIOR MÓVIL (Minimalista)
          ======================================================== */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md text-slate-800 z-50 flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <Image src="/Logo.bmp" alt="Logo" width={28} height={28} className="object-contain" />
          <span className="font-black text-lg tracking-tight text-blue-900">ELINE</span>
        </div>
        <button onClick={() => setMenuAbierto(!menuAbierto)} className="p-2 text-slate-500 hover:text-slate-800 transition-colors focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuAbierto ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* FONDO OSCURO PARA MÓVIL (Cuando el menú está abierto) */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-slate-900/20 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMenuAbierto(false)}
        ></div>
      )}

      {/* ========================================================
          MENÚ LATERAL (SIDEBAR MINIMALISTA)
          ======================================================== */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${menuAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Logo en Sidebar (Escritorio) */}
        <div className="hidden md:flex p-6 border-b border-slate-100 items-center gap-3">
          <Image src="/Logo.bmp" alt="Logo" width={36} height={36} className="object-contain" />
          <div>
            <h2 className="text-xl font-black text-blue-900 tracking-tight leading-none">ELINE</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Registro</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto mt-16 md:mt-0">
          
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Académico</p>
          
          <button 
            onClick={() => { router.push('/dashboard'); setMenuAbierto(false); }} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${
              pathname === '/dashboard' 
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">🏠</span> Inicio
          </button>
          
          <button 
            onClick={() => navegarConContexto('/dashboard/asistencia')} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${
              pathname.includes('asistencia') 
              ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">📅</span> Asistencia
          </button>
          
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-8 mb-3">Administración</p>
          
          <button 
            onClick={() => navegarConContexto('/dashboard/estudiantes')} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${
              pathname.includes('estudiantes') 
              ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">👥</span> Estudiantes
          </button>
          
          <button 
            onClick={() => { router.push('/dashboard/secciones'); setMenuAbierto(false); }} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${
              pathname.includes('secciones') 
              ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">📚</span> Secciones
          </button>
        </nav>

        {/* Botón de Cerrar Sesión Sutil */}
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={cerrarSesion} 
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all text-sm font-semibold group"
          >
            <svg className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ========================================================
          CONTENIDO PRINCIPAL
          ======================================================== */}
      <main className="flex-1 flex flex-col overflow-hidden pt-[60px] md:pt-0">
        {children}
      </main>

    </div>
  )
}
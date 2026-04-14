'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type TipoMensaje = 'info' | 'exito' | 'error' | ''

interface EstadoMensaje {
  texto: string
  tipo: TipoMensaje
}

export default function Login() {
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false) // NUEVO: Estado para ver contraseña
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<EstadoMensaje>({ texto: '', tipo: '' })

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje({ texto: 'Autenticando credenciales...', tipo: 'info' })

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setMensaje({ texto: '¡Acceso concedido! Redirigiendo...', tipo: 'exito' })
      router.push('/dashboard')
    } catch (error: any) {
      setMensaje({ texto: 'Credenciales incorrectas. Verifica tu correo y contraseña.', tipo: 'error' })
      setCargando(false)
    }
  }

  const clasesMensaje = {
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    exito: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    '': 'hidden'
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-200 font-sans">
      
      {/* Lado Izquierdo: Branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-b from-blue-900 to-blue-800 p-12 flex-col justify-between relative overflow-hidden shadow-2xl z-0">
        <div className="relative z-10 flex flex-col h-full justify-center">
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-sm border border-white/20 shadow-xl">
              <Image src="/Logo.bmp" alt="ELINE Logo" width={80} height={80} className="object-contain" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-sm">ELINE</h1>
              <p className="text-xl font-medium text-blue-200 tracking-wide">Registro Escolar</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">Tu gestión educativa, <br/><span className="text-blue-300">más simple que nunca.</span></h2>
          <p className="text-blue-100/80 text-lg max-w-md leading-relaxed font-light">Sistema adaptado a los estándares oficiales para el control de asistencia y calificaciones.</p>
        </div>
      </div>

      {/* Lado Derecho: Formulario */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md p-10 sm:p-12 rounded-[2rem] shadow-2xl border border-white">
          
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-800">Iniciar Sesión</h2>
            <p className="text-slate-500 mt-2 text-sm">Ingresa tus datos de acceso institucional.</p>
          </div>

          <form onSubmit={manejarLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Correo Electrónico</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                placeholder="docente@institucion.edu.do" disabled={cargando}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
              <div className="relative">
                <input 
                  type={verPassword ? "text" : "password"} // Cambia dinámicamente
                  required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium pr-12"
                  placeholder="••••••••" disabled={cargando}
                />
                {/* BOTÓN OJO */}
                <button 
                  type="button" 
                  onClick={() => setVerPassword(!verPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {verPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
            </div>

            {mensaje.tipo !== '' && (
              <div className={`p-4 rounded-xl text-sm font-semibold border ${clasesMensaje[mensaje.tipo]} animate-in fade-in slide-in-from-top-2`}>
                {mensaje.texto}
              </div>
            )}

            <button 
              type="submit" disabled={cargando}
              className={`w-full text-white font-bold py-4 rounded-xl transition-all shadow-lg mt-2 flex justify-center items-center gap-2 ${cargando ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800 active:scale-[0.98]'}`}
            >
              {cargando ? 'Verificando...' : 'Acceder al Sistema'}
            </button>
          </form>

          <div className="mt-10 border-t border-slate-100 pt-6">
            <p className="text-center text-xs font-medium text-slate-400">
              &copy; {new Date().getFullYear()} ELINE Registro Escolar <br/>
              <span className="inline-block mt-1 px-2 py-1 bg-slate-100 rounded-md text-slate-500">Versión 1.0</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
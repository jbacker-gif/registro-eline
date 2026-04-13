'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// 1. TIPADO ESTRICTO PARA EL MANEJO DE ESTADO
type TipoMensaje = 'info' | 'exito' | 'error' | ''

interface EstadoMensaje {
  texto: string
  tipo: TipoMensaje
}

export default function Login() {
  const router = useRouter()
  
  // Estados
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<EstadoMensaje>({ texto: '', tipo: '' })

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje({ texto: 'Autenticando credenciales...', tipo: 'info' })

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setMensaje({ texto: '¡Acceso concedido! Redirigiendo...', tipo: 'exito' })
      router.push('/dashboard')
    } catch (error: any) {
      setMensaje({ texto: 'Credenciales incorrectas. Por favor, verifica tu correo y contraseña.', tipo: 'error' })
      setCargando(false)
    }
  }

  // Clases dinámicas para el feedback visual
  const clasesMensaje = {
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    exito: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    '': 'hidden'
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-200 font-sans">
      
      {/* ==========================================
          LADO IZQUIERDO: Branding para Escritorio
          ========================================== */}
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

          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            Tu gestión educativa, <br/>
            <span className="text-blue-300">más simple que nunca.</span>
          </h2>
          <p className="text-blue-100/80 text-lg max-w-md leading-relaxed font-light">
            Sistema centralizado para el pase de asistencia, cálculo de calificaciones y administración de estudiantes según los estándares oficiales.
          </p>
        </div>

        {/* Efectos de luz abstractos de fondo */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-40"></div>
          <div className="absolute top-1/2 -right-20 w-80 h-80 bg-cyan-400 rounded-full mix-blend-screen filter blur-[100px] opacity-30"></div>
        </div>
      </div>

      {/* ==========================================
          LADO DERECHO: Tarjeta de Formulario
          ========================================== */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md p-10 sm:p-12 rounded-[2rem] shadow-2xl border border-white">
          
          {/* Encabezado Móvil (Oculto en Desktop) */}
          <div className="lg:hidden flex flex-col items-center justify-center gap-4 mb-10">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
              <Image src="/Logo.bmp" alt="ELINE Logo" width={60} height={60} className="object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black text-blue-900 tracking-tight">ELINE</h1>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest">Registro Escolar</p>
            </div>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-800">Iniciar Sesión</h2>
            <p className="text-slate-500 mt-2 text-sm">Ingresa tus datos de acceso institucional.</p>
          </div>

          <form onSubmit={manejarLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Correo Electrónico</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-slate-700 font-medium"
                placeholder="docente@institucion.edu.do"
                disabled={cargando}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-slate-700 font-medium"
                placeholder="••••••••"
                disabled={cargando}
              />
            </div>

            {/* Feedback Visual Dinámico */}
            {mensaje.tipo !== '' && (
              <div className={`p-4 rounded-xl text-sm font-semibold border ${clasesMensaje[mensaje.tipo]} animate-in fade-in slide-in-from-top-2 duration-300`}>
                {mensaje.texto}
              </div>
            )}

            <button 
              type="submit" 
              disabled={cargando}
              className={`w-full text-white font-bold py-4 rounded-xl transition-all shadow-lg mt-2 flex justify-center items-center gap-2 ${
                cargando 
                  ? 'bg-blue-400 shadow-none cursor-not-allowed' 
                  : 'bg-blue-700 hover:bg-blue-800 hover:shadow-blue-900/20 active:scale-[0.98]'
              }`}
            >
              {cargando ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </>
              ) : (
                'Acceder al Sistema'
              )}
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
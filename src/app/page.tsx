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
  const [verPassword, setVerPassword] = useState(false)
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
    } catch {
      setMensaje({ texto: 'Credenciales incorrectas. Verifica tu correo y contraseña.', tipo: 'error' })
      setCargando(false)
    }
  }

  const clasesMensaje = {
    info: 'border-sky-200 bg-sky-50 text-sky-700',
    exito: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    '': 'hidden',
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-10 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_45%)]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)] lg:grid-cols-2">
        <aside className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-12 flex items-center gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-2">
                <Image src="/Logo.bmp" alt="ELINE" width={44} height={44} className="object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">ELINE</h1>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Registro escolar</p>
              </div>
            </div>
            <h2 className="text-3xl font-semibold leading-tight text-balance">
              Gestión educativa clara, rápida y sin distracciones.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
              Controla asistencia, calificaciones y secciones con una interfaz moderna enfocada en lo esencial.
            </p>
          </div>
          <p className="text-xs text-slate-400">Ciclo 2025–2026 · Panel docente</p>
        </aside>

        <section className="p-7 sm:p-10 lg:p-12">
          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Bienvenido</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-slate-500">Ingresa tus credenciales institucionales para continuar.</p>
          </div>

          <form onSubmit={manejarLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Correo electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={cargando}
                placeholder="docente@institucion.edu.do"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Contraseña</label>
              <div className="relative">
                <input
                  type={verPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={cargando}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword(!verPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {verPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {mensaje.tipo !== '' && (
              <p className={`rounded-xl border px-4 py-3 text-sm font-medium ${clasesMensaje[mensaje.tipo]}`}>{mensaje.texto}</p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className={`flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                cargando ? 'cursor-not-allowed bg-slate-400' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {cargando ? 'Verificando…' : 'Entrar al sistema'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-500">© {new Date().getFullYear()} ELINE · Versión 1.1</p>
        </section>
      </div>
    </div>
  )
}

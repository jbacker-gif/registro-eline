'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function RecuperarContrasena() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [verificando, setVerificando] = useState(true)
  const [puedeActualizar, setPuedeActualizar] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setPuedeActualizar(true)
        setVerificando(false)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setPuedeActualizar(Boolean(session))
      setVerificando(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const actualizarContrasena = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      setMensaje({ texto: 'La contraseña debe tener al menos 6 caracteres.', tipo: 'error' })
      return
    }

    if (password !== confirmacion) {
      setMensaje({ texto: 'Las contraseñas no coinciden.', tipo: 'error' })
      return
    }

    setCargando(true)
    setMensaje({ texto: 'Actualizando contraseña...', tipo: 'info' })

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMensaje({ texto: 'No pudimos actualizar la contraseña. Solicita un nuevo enlace.', tipo: 'error' })
      setCargando(false)
      return
    }

    await supabase.auth.signOut()
    setMensaje({ texto: 'Contraseña actualizada. Ya puedes iniciar sesión.', tipo: 'exito' })
    setCargando(false)
    setTimeout(() => router.push('/'), 1800)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-4 py-10 text-[#142037]">
      <section className="w-full max-w-md border border-[#e3e5ea] bg-white shadow-[0_18px_45px_rgba(20,32,55,0.08)]">
        <div className="border-b border-[#e3e5ea] px-7 pb-6 pt-7">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#142037]">
            <span className="font-mono text-[10px]">EL</span>
          </span>
          <h1 className="font-serif text-xl font-medium">Crear nueva contraseña</h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#5b6472]">
            Recuperación de acceso
          </p>
        </div>

        {verificando ? (
          <div className="px-7 py-7 text-sm font-medium text-[#5b6472]">Verificando enlace...</div>
        ) : puedeActualizar ? (
          <form className="space-y-5 px-7 py-7" onSubmit={actualizarContrasena}>
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#5b6472]">
                Nueva contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#e3e5ea] bg-transparent px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#142037]"
                placeholder="Mínimo 6 caracteres"
                disabled={cargando}
              />
            </div>

            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#5b6472]">
                Confirmar contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                className="w-full border border-[#e3e5ea] bg-transparent px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#142037]"
                placeholder="Repite la contraseña"
                disabled={cargando}
              />
            </div>

            {mensaje.texto && (
              <div className={`border px-4 py-3 text-[12px] font-medium ${
                mensaje.tipo === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}>
                {mensaje.texto}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#142037] py-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-[#f6f7f9] transition-colors hover:bg-[#26344f] disabled:cursor-not-allowed disabled:bg-[#5b6472]"
            >
              {cargando ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        ) : (
          <div className="space-y-5 px-7 py-7">
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">
              El enlace no es válido o ya expiró. Solicita uno nuevo desde el acceso docente.
            </div>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full bg-[#142037] py-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-[#f6f7f9] transition-colors hover:bg-[#26344f]"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

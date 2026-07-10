'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Mensaje = { texto: string; tipo: 'info' | 'exito' | 'error' | '' }
type Plan = 'Gratis' | 'Mensual' | 'Trimestral' | 'Anual'

type Suscripcion = {
  id: string
  user_id: string | null
  email: string
  plan: Plan
  activa: boolean
  fecha_inicio: string | null
  fecha_fin: string | null
  notas: string | null
  updated_at: string | null
}

const planes: Plan[] = ['Gratis', 'Mensual', 'Trimestral', 'Anual']
const campoBase = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100'

function fechaLocalISO() {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

function estaVencida(item: Pick<Suscripcion, 'fecha_fin'>) {
  return Boolean(item.fecha_fin && item.fecha_fin < fechaLocalISO())
}

export default function AdminPage() {
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [esAdmin, setEsAdmin] = useState(false)
  const [userId, setUserId] = useState('')
  const [mensaje, setMensaje] = useState<Mensaje>({ texto: '', tipo: '' })
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState({
    email: '',
    user_id: '',
    plan: 'Mensual' as Plan,
    activa: true,
    fecha_inicio: new Date().toISOString().slice(0, 10),
    fecha_fin: '',
    notas: '',
  })

  const suscripcionesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return suscripciones
    return suscripciones.filter((item) =>
      [item.email, item.plan, item.notas || '', item.user_id || ''].some((valor) => valor.toLowerCase().includes(texto))
    )
  }, [busqueda, suscripciones])

  const resumen = useMemo(() => {
    const vencidas = suscripciones.filter(estaVencida).length
    const activas = suscripciones.filter((item) => item.activa && !estaVencida(item)).length
    const pausadas = suscripciones.filter((item) => !item.activa).length
    return { total: suscripciones.length, activas, pausadas, vencidas }
  }, [suscripciones])

  useEffect(() => {
    cargarPanel()
  }, [])

  const cargarPanel = async () => {
    setCargando(true)
    setMensaje({ texto: '', tipo: '' })

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      setUserId(session.user.id)

      const appMetadata = session.user.app_metadata || {}
      const rol = String(appMetadata.rol || appMetadata.role || '')
      const admin = rol === 'admin' || rol === 'super_admin'
      setEsAdmin(admin)

      if (!admin) {
        setMensaje({ texto: 'Tu usuario no tiene permisos de administracion.', tipo: 'error' })
        return
      }

      const { data, error } = await supabase
        .from('suscripciones')
        .select('*')
        .order('updated_at', { ascending: false })
        .order('email', { ascending: true })

      if (error) throw error
      setSuscripciones((data || []) as Suscripcion[])
    } catch (error) {
      console.error(error)
      setMensaje({ texto: 'No se pudo cargar el panel. Verifica que la migracion de suscripciones este aplicada en Supabase.', tipo: 'error' })
    } finally {
      setCargando(false)
    }
  }

  const guardarSuscripcion = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!esAdmin) return

    const email = form.email.trim().toLowerCase()
    if (!email) {
      setMensaje({ texto: 'Indica el correo del usuario.', tipo: 'error' })
      return
    }

    setGuardando(true)
    setMensaje({ texto: 'Guardando suscripcion...', tipo: 'info' })

    try {
      const payload = {
        email,
        user_id: form.user_id.trim() || null,
        plan: form.plan,
        activa: form.activa,
        fecha_inicio: form.fecha_inicio || new Date().toISOString().slice(0, 10),
        fecha_fin: form.fecha_fin || null,
        notas: form.notas.trim() || null,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      }

      const { error } = await supabase
        .from('suscripciones')
        .upsert(payload, { onConflict: 'email' })

      if (error) throw error

      setForm({
        email: '',
        user_id: '',
        plan: 'Mensual',
        activa: true,
        fecha_inicio: new Date().toISOString().slice(0, 10),
        fecha_fin: '',
        notas: '',
      })
      setMensaje({ texto: 'Suscripcion guardada correctamente.', tipo: 'exito' })
      await cargarPanel()
    } catch (error) {
      console.error(error)
      setMensaje({ texto: 'No se pudo guardar. Revisa el correo, el user ID opcional y tus permisos de administrador.', tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async (item: Suscripcion, activa: boolean) => {
    if (!esAdmin) return

    setMensaje({ texto: activa ? 'Activando suscripcion...' : 'Pausando suscripcion...', tipo: 'info' })

    try {
      const { error } = await supabase
        .from('suscripciones')
        .update({
          activa,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', item.id)

      if (error) throw error

      setSuscripciones((actuales) => actuales.map((actual) => actual.id === item.id ? { ...actual, activa } : actual))
      setMensaje({ texto: activa ? 'Suscripcion activada.' : 'Suscripcion pausada.', tipo: 'exito' })
    } catch (error) {
      console.error(error)
      setMensaje({ texto: 'No se pudo cambiar el estado de la suscripcion.', tipo: 'error' })
    }
  }

  const editar = (item: Suscripcion) => {
    setForm({
      email: item.email,
      user_id: item.user_id || '',
      plan: item.plan,
      activa: item.activa,
      fecha_inicio: item.fecha_inicio || new Date().toISOString().slice(0, 10),
      fecha_fin: item.fecha_fin || '',
      notas: item.notas || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (cargando) return <div className="p-10 text-center text-slate-500 font-medium">Cargando panel de administracion...</div>

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Administracion</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Panel administrativo</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Control manual de suscripciones. Este apartado queda preparado para sumar cambio de clave, carga masiva, calificaciones y asistencia para maestros.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        {!esAdmin ? (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
            <h2 className="text-base font-bold">Acceso restringido</h2>
            <p className="mt-2 text-sm leading-6">Para usar este panel, el usuario debe tener `app_metadata.rol` o `app_metadata.role` con valor `admin` en Supabase Auth.</p>
          </section>
        ) : (
          <>
            <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ResumenCard label="Suscripciones" value={resumen.total} />
              <ResumenCard label="Activas" value={resumen.activas} tono="emerald" />
              <ResumenCard label="Pausadas" value={resumen.pausadas} tono="rose" />
              <ResumenCard label="Vencidas" value={resumen.vencidas} tono="amber" />
            </section>

            <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-1">
                <h2 className="text-base font-bold text-slate-900">Crear o editar suscripcion</h2>
                <p className="text-sm text-slate-500">El correo es la llave principal. El user ID es opcional, pero ayuda a enlazar la cuenta exacta de Supabase Auth.</p>
              </div>

              <form onSubmit={guardarSuscripcion} className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-3">
                  <Label texto="Correo" />
                  <input type="email" className={campoBase} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="lg:col-span-3">
                  <Label texto="User ID opcional" />
                  <input className={campoBase} value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} placeholder="UUID de auth.users" />
                </div>
                <div className="lg:col-span-2">
                  <Label texto="Plan" />
                  <select className={campoBase} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as Plan })}>
                    {planes.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <Label texto="Inicio" />
                  <input type="date" className={campoBase} value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
                </div>
                <div className="lg:col-span-2">
                  <Label texto="Fin" />
                  <input type="date" className={campoBase} value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
                </div>
                <div className="lg:col-span-9">
                  <Label texto="Notas internas" />
                  <input className={campoBase} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Pago, contacto o comentario administrativo" />
                </div>
                <label className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2.5 lg:col-span-1">
                  <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
                  <span className="text-sm font-semibold text-slate-700">Activa</span>
                </label>
                <button type="submit" disabled={guardando} className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 lg:col-span-2">
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </form>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Suscripciones registradas</h2>
                  <p className="mt-1 text-sm text-slate-500">Activa o pausa el acceso docente desde esta tabla.</p>
                </div>
                <input
                  className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100 md:w-80"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por correo, plan o nota"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Usuario</th>
                      <th className="px-5 py-3">Plan</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3">Vigencia</th>
                      <th className="px-5 py-3">Notas</th>
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suscripcionesFiltradas.map((item) => {
                      const vencida = estaVencida(item)
                      const estadoClase = vencida
                        ? 'bg-amber-50 text-amber-700'
                        : item.activa
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      const estadoTexto = vencida ? 'Vencida' : item.activa ? 'Activa' : 'Pausada'

                      return (
                        <tr key={item.id} className="align-top">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">{item.email}</p>
                            <p className="mt-1 font-mono text-[11px] text-slate-400">{item.user_id || 'Sin user ID enlazado'}</p>
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-700">{item.plan}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${estadoClase}`}>
                              {estadoTexto}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            <p>{item.fecha_inicio || 'Sin inicio'}</p>
                            <p className={`mt-1 text-xs ${vencida ? 'font-semibold text-amber-700' : 'text-slate-400'}`}>
                              {item.fecha_fin ? `Hasta ${item.fecha_fin}` : 'Sin fecha final'}
                            </p>
                          </td>
                          <td className="max-w-xs px-5 py-4 text-slate-500">{item.notas || '-'}</td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => editar(item)} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">
                                Editar
                              </button>
                              {item.activa ? (
                                <button onClick={() => cambiarEstado(item, false)} className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100">
                                  Pausar
                                </button>
                              ) : (
                                <button onClick={() => cambiarEstado(item, true)} className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100">
                                  Activar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {suscripcionesFiltradas.length === 0 && (
                <div className="p-8 text-center text-sm font-medium text-slate-500">No hay suscripciones para mostrar.</div>
              )}
            </section>
          </>
        )}

        {mensaje.texto && (
          <div className={`mt-6 rounded-lg border p-4 text-sm font-semibold ${
            mensaje.tipo === 'error' ? 'border-red-200 bg-red-50 text-red-700' :
            mensaje.tipo === 'exito' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
            'border-blue-200 bg-blue-50 text-blue-700'
          }`}>
            {mensaje.texto}
          </div>
        )}
      </main>
    </div>
  )
}

function Label({ texto }: { texto: string }) {
  return <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{texto}</label>
}

function ResumenCard({ label, value, tono = 'slate' }: { label: string; value: number; tono?: 'slate' | 'emerald' | 'rose' | 'amber' }) {
  const tonos = {
    slate: 'text-slate-950',
    emerald: 'text-emerald-700',
    rose: 'text-rose-700',
    amber: 'text-amber-700',
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tonos[tono]}`}>{value}</p>
    </div>
  )
}

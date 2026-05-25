'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Mensaje = { texto: string; tipo: 'info' | 'exito' | 'error' | '' }

type Colegio = {
  id: string
  nombre?: string | null
  codigo_centro?: string | null
  telefono_centro?: string | null
  distrito_educativo?: string | null
  regional_educacion?: string | null
  provincia?: string | null
  municipio?: string | null
  tanda?: string | null
}

const campoBase = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

export default function PerfilMaestro() {
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje>({ texto: '', tipo: '' })
  const [userId, setUserId] = useState<string | null>(null)
  const [colegios, setColegios] = useState<Colegio[]>([])
  const [colegioId, setColegioId] = useState('')
  const [nombreDocente, setNombreDocente] = useState('')

  const [nombreCentro, setNombreCentro] = useState('')
  const [codigoCentro, setCodigoCentro] = useState('')
  const [telefonoCentro, setTelefonoCentro] = useState('')
  const [distritoEducativo, setDistritoEducativo] = useState('')
  const [regionalEducacion, setRegionalEducacion] = useState('')
  const [provincia, setProvincia] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [tanda, setTanda] = useState('')

  useEffect(() => {
    cargarPerfil()
  }, [])

  const cargarPerfil = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      setUserId(session.user.id)

      const [{ data: perfil }, { data: centros }] = await Promise.all([
        supabase.from('perfiles').select('*').eq('id', session.user.id).maybeSingle(),
        supabase.from('colegios').select('*').order('nombre', { ascending: true }),
      ])

      setColegios(centros || [])
      setNombreDocente(perfil?.nombre_completo || session.user.email || '')

      const centroSeleccionado = (centros || []).find(centro => centro.id === perfil?.colegio_id) || (centros || [])[0]
      if (centroSeleccionado) {
        cargarCentroEnFormulario(centroSeleccionado)
        setColegioId(centroSeleccionado.id)
      }
    } catch (error) {
      console.error(error)
      setMensaje({ texto: 'No se pudo cargar el perfil.', tipo: 'error' })
    } finally {
      setCargando(false)
    }
  }

  const cargarCentroEnFormulario = (centro: Colegio | null) => {
    setNombreCentro(centro?.nombre || '')
    setCodigoCentro(centro?.codigo_centro || '')
    setTelefonoCentro(centro?.telefono_centro || '')
    setDistritoEducativo(centro?.distrito_educativo || '')
    setRegionalEducacion(centro?.regional_educacion || '')
    setProvincia(centro?.provincia || '')
    setMunicipio(centro?.municipio || '')
    setTanda(centro?.tanda || '')
  }

  const manejarCambioCentro = (id: string) => {
    setColegioId(id)
    const centro = colegios.find(item => item.id === id)
    if (centro) cargarCentroEnFormulario(centro)
  }

  const guardarPerfil = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!userId) return

    setGuardando(true)
    setMensaje({ texto: 'Guardando perfil...', tipo: 'info' })

    try {
      let centroIdFinal = colegioId
      const datosCentro = {
        nombre: nombreCentro.trim(),
        codigo_centro: codigoCentro.trim() || null,
        telefono_centro: telefonoCentro.trim() || null,
        distrito_educativo: distritoEducativo.trim() || null,
        regional_educacion: regionalEducacion.trim() || null,
        provincia: provincia.trim() || null,
        municipio: municipio.trim() || null,
        tanda: tanda.trim() || null,
      }

      if (!datosCentro.nombre) {
        setMensaje({ texto: 'El nombre del centro educativo es obligatorio.', tipo: 'error' })
        return
      }

      if (centroIdFinal) {
        const { error } = await supabase.from('colegios').update(datosCentro).eq('id', centroIdFinal)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('colegios').insert(datosCentro).select('id').single()
        if (error) throw error
        centroIdFinal = data.id
      }

      const { error: perfilError } = await supabase.from('perfiles').upsert({
        id: userId,
        nombre_completo: nombreDocente.trim(),
        colegio_id: centroIdFinal,
        rol: 'profesor',
      })
      if (perfilError) throw perfilError

      setColegioId(centroIdFinal)
      await cargarPerfil()
      setMensaje({ texto: 'Perfil guardado. Estos datos se usaran en los boletines.', tipo: 'exito' })
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3500)
    } catch (error) {
      console.error(error)
      setMensaje({ texto: 'No se pudo guardar. Verifica que los campos SQL ya existan en Supabase.', tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="p-10 text-center text-slate-500 font-medium">Cargando perfil...</div>

  return (
    <div className="h-full overflow-y-auto bg-slate-50/50">
      <div className="mx-auto max-w-5xl p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight text-slate-800">Perfil del maestro</h1>
          <p className="mt-1 text-sm text-slate-500">
            Completa tus datos y los del centro educativo para que se arrastren automaticamente a los boletines.
          </p>
        </div>

        <form onSubmit={guardarPerfil} className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-800">Datos del docente</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Nombre completo</label>
                <input className={campoBase} value={nombreDocente} onChange={(e) => setNombreDocente(e.target.value)} required />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Centro asociado</label>
                <select className={campoBase} value={colegioId} onChange={(e) => manejarCambioCentro(e.target.value)}>
                  <option value="">Crear nuevo centro</option>
                  {colegios.map(centro => (
                    <option key={centro.id} value={centro.id}>{centro.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Datos del centro educativo</h2>
                <p className="mt-1 text-sm text-slate-500">Estos campos alimentan la portada del informe de aprendizaje.</p>
              </div>
              {colegioId && (
                <button
                  type="button"
                  onClick={() => {
                    setColegioId('')
                    cargarCentroEnFormulario(null)
                  }}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Crear otro centro
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Campo label="Centro educativo" value={nombreCentro} onChange={setNombreCentro} required />
              <Campo label="Codigo del centro" value={codigoCentro} onChange={setCodigoCentro} />
              <Campo label="Telefono del centro" value={telefonoCentro} onChange={setTelefonoCentro} />
              <Campo label="Distrito educativo" value={distritoEducativo} onChange={setDistritoEducativo} />
              <Campo label="Regional educativa" value={regionalEducacion} onChange={setRegionalEducacion} />
              <Campo label="Provincia" value={provincia} onChange={setProvincia} />
              <Campo label="Municipio" value={municipio} onChange={setMunicipio} />
              <Campo label="Tanda general del centro" value={tanda} onChange={setTanda} />
            </div>
          </section>

          {mensaje.texto && (
            <div className={`rounded-lg border p-4 text-sm font-semibold ${
              mensaje.tipo === 'error' ? 'border-red-200 bg-red-50 text-red-700' :
              mensaje.tipo === 'exito' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
              'border-blue-200 bg-blue-50 text-blue-700'
            }`}>
              {mensaje.texto}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-slate-900 px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Campo({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <input className={campoBase} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  )
}

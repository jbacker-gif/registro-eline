'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function MisSecciones() {
  const [secciones, setSecciones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  const [grado, setGrado] = useState('')
  const [identificador, setIdentificador] = useState('')
  const [anoEscolar, setAnoEscolar] = useState('2025-2026')

  useEffect(() => {
    cargarSecciones()
  }, [])

  const cargarSecciones = async () => {
    try {
      // 1. Obtenemos el ID del maestro que tiene la sesión iniciada
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      // 2. Filtramos la consulta por user_id
      const { data, error } = await supabase
        .from('secciones')
        .select('*')
        .eq('user_id', session.user.id) // <--- CLAVE: Solo mis secciones
        .order('grado', { ascending: true })

      if (error) throw error
      setSecciones(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  const manejarCambioSeccion = (valor: string) => {
    const soloLetras = valor.replace(/[^a-zA-Z]/g, '').toUpperCase()
    setIdentificador(soloLetras)
  }

  const agregarSeccion = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensaje('Verificando...')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // 1. VALIDACIÓN DE DUPLICADOS (Solo dentro de MIS secciones)
      const { data: existe } = await supabase
        .from('secciones')
        .select('id')
        .eq('grado', grado)
        .eq('identificador', identificador)
        .eq('user_id', session.user.id) // <--- Busca si YO ya tengo esa sección
        .maybeSingle()

      if (existe) {
        setMensaje(`❌ Ya tienes registrada la sección ${grado} "${identificador}".`)
        return
      }

      // 2. GUARDAR con el ID del usuario
      const { error } = await supabase.from('secciones').insert([{ 
        grado, 
        identificador,
        ano_escolar: anoEscolar,
        nivel: 'Primaria',
        user_id: session.user.id // <--- Le asignamos el dueño
      }])

      if (error) throw error

      setMensaje('✅ ¡Sección creada con éxito!')
      setGrado('')
      setIdentificador('')
      cargarSecciones()
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      console.error(error)
      setMensaje('❌ Error al guardar.')
    }
  }

  const eliminarSeccion = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la sección ${nombre}?`)) return
    try {
      const { error } = await supabase.from('secciones').delete().eq('id', id)
      if (error) throw error
      cargarSecciones()
    } catch (error) {
      console.error(error)
      alert('Error al eliminar.')
    }
  }

  if (cargando) return <div className="p-10 text-center">Cargando tus registros... ⏳</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link href="/dashboard" className="text-blue-600 hover:underline text-sm font-medium mb-4 inline-block">
        ← Volver al Dashboard
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Mis Secciones y Grados</h1>
        <p className="text-gray-600">Gestión de tus registros personales.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Nueva Sección</h2>
            <form onSubmit={agregarSeccion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grado</label>
                <select required value={grado} onChange={(e) => setGrado(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">-- Selecciona --</option>
                  <option value="1ro">1ro</option>
                  <option value="2do">2do</option>
                  <option value="3ro">3ro</option>
                  <option value="4to">4to</option>
                  <option value="5to">5to</option>
                  <option value="6to">6to</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sección</label>
                <input type="text" required maxLength={1} value={identificador} onChange={(e) => manejarCambioSeccion(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="Ej: A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año Escolar</label>
                <input type="text" required value={anoEscolar} onChange={(e) => setAnoEscolar(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">+ Crear Registro</button>
              {mensaje && <p className={`text-sm text-center font-medium p-2 rounded ${mensaje.includes('Error') ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>{mensaje}</p>}
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {secciones.length === 0 ? (
              <div className="sm:col-span-2 p-8 bg-white border rounded-xl text-center text-gray-500 italic">No tienes registros creados todavía.</div>
            ) : (
              secciones.map((sec) => (
                <div key={sec.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-xl text-gray-800">{sec.grado} "{sec.identificador}"</h3>
                    <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block mt-1">Primaria | {sec.ano_escolar}</p>
                  </div>
                  <button onClick={() => eliminarSeccion(sec.id, `${sec.grado} ${sec.identificador}`)} className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50">🗑️</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
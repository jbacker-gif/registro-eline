'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function MisEstudiantes() {
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')

  const [seccionId, setSeccionId] = useState<string | null>(null)
  const [infoSeccion, setInfoSeccion] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Referencia para el input oculto de archivos
  const archivoInputRef = useRef<HTMLInputElement>(null)

  // Estados del formulario
  const [nuevoNumero, setNuevoNumero] = useState('')
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [sexo, setSexo] = useState('')
  const [nacionalidad, setNacionalidad] = useState('Dominicana')
  const [tutor, setTutor] = useState('')
  const [telefono, setTelefono] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const secId = params.get('seccion_id')
    if (secId) {
      setSeccionId(secId)
      inicializarDatos(secId)
    } else {
      setCargando(false)
    }
  }, [])

  const inicializarDatos = async (secId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)

      const { data: secData } = await supabase.from('secciones').select('grado, identificador').eq('id', secId).eq('user_id', session.user.id).single()
      if (secData) setInfoSeccion(secData)

      cargarEstudiantes(secId, session.user.id)
    } catch (error) {
      console.error('Error inicializando:', error)
      setCargando(false)
    }
  }

  const cargarEstudiantes = async (secId: string, maestroId: string) => {
    try {
      const { data, error } = await supabase.from('estudiantes').select('*').eq('seccion_id', secId).eq('user_id', maestroId).order('numero_orden', { ascending: true })
      if (error) throw error
      setEstudiantes(data || [])
      
      if (data && data.length > 0) {
        const ultimoNumero = Math.max(...data.map(e => e.numero_orden))
        setNuevoNumero((ultimoNumero + 1).toString())
      } else {
        setNuevoNumero('1')
      }
    } catch (error) {
      setMensaje('❌ Error al cargar la lista.')
    } finally {
      setCargando(false)
    }
  }

  const agregarEstudiante = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!seccionId || !userId) return
    setMensaje('Guardando...')
    
    try {
      const nombreCompletoGenerado = `${apellidos}, ${nombres}`

      const { error } = await supabase.from('estudiantes').insert([{ 
        numero_orden: Number(nuevoNumero),
        nombre_completo: nombreCompletoGenerado,
        nombres: nombres,
        apellidos: apellidos,
        sexo: sexo,
        nacionalidad: nacionalidad,
        nombre_tutor: tutor,
        telefono_contacto: telefono,
        seccion_id: seccionId,
        user_id: userId 
      }])

      if (error) throw error

      setMensaje('✅ ¡Estudiante registrado con éxito!')
      setNombres(''); setApellidos(''); setSexo(''); setNacionalidad('Dominicana'); setTutor(''); setTelefono('');
      cargarEstudiantes(seccionId, userId)
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      setMensaje('❌ Error al guardar.')
    }
  }

  // ==========================================
  // MAGIA: Lector de Excel a CSV
  // ==========================================
  const manejarImportacionCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !seccionId || !userId) return

    setMensaje('⏳ Procesando archivo Excel/CSV...')
    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        
        // Separamos por líneas y limpiamos espacios o retornos de carro invisibles
        const lineas = text.split('\n').map(line => line.replace('\r', '').trim()).filter(line => line !== '')

        // Saltamos la fila 1 (los títulos) y procesamos el resto
        const datosAInsertar = lineas.slice(1).map(linea => {
          // Soporta CSV separados por coma (,) o por punto y coma (;)
          const valores = linea.split(/,|;/)
          
          const numero = Number(valores[0]) || 0
          const nom = valores[1]?.trim() || ''
          const ape = valores[2]?.trim() || ''
          const sex = valores[3]?.trim()?.toUpperCase() || ''
          const nac = valores[4]?.trim() || 'Dominicana'

          return {
            numero_orden: numero,
            nombres: nom,
            apellidos: ape,
            nombre_completo: `${ape}, ${nom}`,
            sexo: sex,
            nacionalidad: nac,
            seccion_id: seccionId,
            user_id: userId
          }
        }).filter(est => est.nombres !== '') // Evitamos guardar filas vacías

        if (datosAInsertar.length === 0) {
          setMensaje('⚠️ El archivo parece estar vacío o no tiene el formato correcto.')
          return
        }

        setMensaje(`⏳ Guardando ${datosAInsertar.length} estudiantes en la base de datos...`)

        const { error } = await supabase.from('estudiantes').insert(datosAInsertar)
        if (error) throw error

        setMensaje(`✅ ¡${datosAInsertar.length} estudiantes importados con éxito!`)
        cargarEstudiantes(seccionId, userId)
        
        // Limpiamos el input para que pueda subir otro archivo si quiere
        if (archivoInputRef.current) archivoInputRef.current.value = ''
        setTimeout(() => setMensaje(''), 4000)

      } catch (error) {
        console.error(error)
        setMensaje('❌ Error al leer el archivo. Verifica que sea un CSV válido.')
      }
    }
    
    // Leemos el archivo en español/latino (UTF-8) para no perder tildes ni la 'ñ'
    reader.readAsText(file, 'UTF-8')
  }

  const eliminarEstudiante = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar a ${nombre}?`)) return
    try {
      const { error } = await supabase.from('estudiantes').delete().eq('id', id)
      if (error) throw error
      if (seccionId && userId) cargarEstudiantes(seccionId, userId)
    } catch (error) {
      alert('Error al eliminar.')
    }
  }

  if (cargando) return <div className="p-10 text-center">Cargando base de datos... ⏳</div>
  if (!seccionId) return <div className="p-10 text-center text-red-500 font-bold">Falta contexto. Vuelve al Dashboard.</div>

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Link href="/dashboard" className="text-blue-600 hover:underline text-sm font-medium mb-4 inline-block">← Volver al Dashboard</Link>
      
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Registro de Estudiantes</h1>
          <p className="text-gray-600">Completa la ficha o importa tu lista completa.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* INPUT OCULTO DE ARCHIVO */}
          <input 
            type="file" 
            accept=".csv" 
            ref={archivoInputRef}
            onChange={manejarImportacionCSV} 
            className="hidden" 
          />
          {/* BOTÓN QUE ACTIVA EL INPUT */}
          <button 
            onClick={() => archivoInputRef.current?.click()} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
          >
            📂 Importar CSV
          </button>

          {infoSeccion && (
            <div className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg text-center hidden sm:block">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">Sección Activa</p>
              <p className="text-xl font-bold">{infoSeccion.grado} "{infoSeccion.identificador}"</p>
            </div>
          )}
        </div>
      </div>

      {mensaje && (
        <div className={`mb-6 p-3 rounded-lg text-center font-bold text-sm ${mensaje.includes('Error') || mensaje.includes('⚠️') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {mensaje}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Formulario Individual */}
        <div className="xl:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Agregar uno por uno</h2>
            
            <form onSubmit={agregarEstudiante} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">No. Lista</label>
                  <input type="number" required value={nuevoNumero} onChange={(e) => setNuevoNumero(e.target.value)} className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 font-bold text-center"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Sexo</label>
                  <select required value={sexo} onChange={(e) => setSexo(e.target.value)} className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Seleccione</option>
                    <option value="M">Masculino (M)</option>
                    <option value="F">Femenino (F)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Nombres</label>
                <input type="text" required value={nombres} onChange={(e) => setNombres(e.target.value)} className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Apellidos</label>
                <input type="text" required value={apellidos} onChange={(e) => setApellidos(e.target.value)} className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Nacionalidad</label>
                <input type="text" required value={nacionalidad} onChange={(e) => setNacionalidad(e.target.value)} className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors mt-2 shadow-sm">
                + Guardar Alumno
              </button>
            </form>
          </div>
        </div>

        {/* Tabla */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-800 text-white text-xs uppercase tracking-wider">
                  <th className="p-3 text-center w-12">No.</th>
                  <th className="p-3 w-48">Apellidos, Nombres</th>
                  <th className="p-3 text-center w-16">Sexo</th>
                  <th className="p-3 w-24">Nacionalidad</th>
                  <th className="p-3 text-center w-16">Acción</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 italic">No hay estudiantes en esta sección.</td>
                  </tr>
                ) : (
                  estudiantes.map((est) => (
                    <tr key={est.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors text-sm">
                      <td className="p-3 text-center text-gray-500 font-bold">{est.numero_orden}</td>
                      <td className="p-3 font-bold text-gray-800">{est.nombre_completo}</td>
                      <td className="p-3 text-center font-medium">{est.sexo || '-'}</td>
                      <td className="p-3 text-gray-600 truncate">{est.nacionalidad || '-'}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => eliminarEstudiante(est.id, est.nombre_completo)} className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors">🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function GeneradorBoletines() {
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState('')
  const [boletin, setBoletin] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [cargandoBoletin, setCargandoBoletin] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // 1. Cargar la lista de estudiantes para el selector
  useEffect(() => {
    const cargarEstudiantes = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        setUserId(session.user.id)

        const { data, error } = await supabase.from('estudiantes').select('*').eq('user_id', session.user.id).order('numero_orden', { ascending: true })
        if (error) throw error
        setEstudiantes(data || [])
      } catch (error) {
        console.error(error)
      } finally {
        setCargando(false)
      }
    }
    cargarEstudiantes()
  }, [])

  // 2. Cuando el profesor elige un estudiante, generamos su boletín
  useEffect(() => {
    if (!estudianteSeleccionado) {
      setBoletin([])
      return
    }
    generarBoletin(estudianteSeleccionado)
  }, [estudianteSeleccionado, userId])

  const generarBoletin = async (idEstudiante: string) => {
    if (!userId) return
    setCargandoBoletin(true)
    try {
      // Traemos todas las materias
      const { data: asignaturas, error: errAsig } = await supabase.from('asignaturas').select('*')
      if (errAsig) throw errAsig

      // Traemos TODAS las notas de este estudiante en específico
      const { data: notas, error: errNotas } = await supabase
        .from('calificaciones')
        .select('*')
        .eq('estudiante_id', idEstudiante)
        .eq('user_id', userId)
      if (errNotas) throw errNotas

      // Armamos la tabla final cruzando materias y notas
      const reporteFinal = asignaturas.map(materia => {
        // Buscamos las notas de esta materia
        const c1 = notas.find(n => n.asignatura_id === materia.id && n.competencia === 'C1')?.nota || null
        const c2 = notas.find(n => n.asignatura_id === materia.id && n.competencia === 'C2')?.nota || null
        const c3 = notas.find(n => n.asignatura_id === materia.id && n.competencia === 'C3')?.nota || null

        // Calculamos el promedio
        const notasValidas = [c1, c2, c3].filter(n => n !== null)
        let promedio = 0
        let literal = '-'

        if (notasValidas.length > 0) {
          promedio = Math.round(notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length)
          // Asignamos el literal (Puedes ajustar esta escala según tu colegio)
          if (promedio >= 90) literal = 'A'
          else if (promedio >= 80) literal = 'B'
          else if (promedio >= 70) literal = 'C'
          else literal = 'D'
        }

        return {
          id: materia.id,
          nombre: materia.nombre,
          c1: c1 || '--',
          c2: c2 || '--',
          c3: c3 || '--',
          promedio: notasValidas.length > 0 ? promedio : '--',
          literal: literal
        }
      })

      setBoletin(reporteFinal)
    } catch (error) {
      console.error(error)
    } finally {
      setCargandoBoletin(false)
    }
  }

  const imprimirBoletin = () => {
    window.print()
  }

  if (cargando) return <div className="p-10 text-center">Cargando base de datos... ⏳</div>

  const datosEstudiante = estudiantes.find(e => e.id === estudianteSeleccionado)

  return (
    <div className="p-8">
      {/* SECCIÓN INTERACTIVA (Se oculta al imprimir) */}
      <div className="mb-8 print:hidden">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Generador de Boletines</h1>
        <p className="text-gray-600 mb-6">Selecciona un estudiante para consolidar sus calificaciones del período.</p>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4 items-center">
          <label className="font-semibold text-gray-700">Seleccionar Alumno:</label>
          <select 
            className="flex-1 border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
            value={estudianteSeleccionado}
            onChange={(e) => setEstudianteSeleccionado(e.target.value)}
          >
            <option value="">-- Elige un estudiante de la lista --</option>
            {estudiantes.map(est => (
              <option key={est.id} value={est.id}>{est.numero_orden}. {est.nombre_completo}</option>
            ))}
          </select>

          {estudianteSeleccionado && (
            <button 
              onClick={imprimirBoletin}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              🖨️ Imprimir
            </button>
          )}
        </div>
      </div>

      {/* BOLETÍN LISTO PARA IMPRIMIR */}
      {cargandoBoletin ? (
        <div className="text-center py-12 text-gray-500">Generando cálculos... ⚙️</div>
      ) : estudianteSeleccionado && datosEstudiante ? (
        <div className="bg-white p-10 rounded-xl shadow-lg border border-gray-200 print:shadow-none print:border-none print:p-0">
          
          {/* Encabezado del Documento */}
          <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
            <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">Colegio Santa Maria Goretti</h1>
            <h2 className="text-xl text-gray-700 font-semibold mb-1">Boletín de Calificaciones - Primer Período</h2>
            <p className="text-sm text-gray-500">Año Escolar 2025-2026 | Nivel Primaria - 4to Grado</p>
          </div>

          <div className="flex justify-between items-end mb-6 bg-gray-50 p-4 rounded-lg print:bg-transparent print:p-0">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Datos del Estudiante</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{datosEstudiante.nombre_completo}</p>
              <p className="text-sm text-gray-600 mt-1">Número de Orden: <span className="font-semibold">{datosEstudiante.numero_orden}</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Prof. Titular: <span className="font-semibold">Belkis</span></p>
            </div>
          </div>

          {/* Tabla de Calificaciones */}
          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="bg-gray-800 text-white border border-gray-800">
                <th className="p-3 font-semibold uppercase text-sm">Asignatura</th>
                <th className="p-3 font-semibold text-center w-20">C1</th>
                <th className="p-3 font-semibold text-center w-20">C2</th>
                <th className="p-3 font-semibold text-center w-20">C3</th>
                <th className="p-3 font-semibold text-center w-24 bg-gray-700">Promedio</th>
                <th className="p-3 font-semibold text-center w-24">Literal</th>
              </tr>
            </thead>
            <tbody>
              {boletin.map((fila, index) => (
                <tr key={fila.id} className={`border border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="p-3 font-medium text-gray-800 border-r border-gray-200">{fila.nombre}</td>
                  <td className="p-3 text-center text-gray-600 border-r border-gray-200">{fila.c1}</td>
                  <td className="p-3 text-center text-gray-600 border-r border-gray-200">{fila.c2}</td>
                  <td className="p-3 text-center text-gray-600 border-r border-gray-200">{fila.c3}</td>
                  <td className="p-3 text-center font-bold text-gray-900 border-r border-gray-200 bg-gray-100">{fila.promedio}</td>
                  <td className={`p-3 text-center font-bold text-lg 
                    ${fila.literal === 'A' ? 'text-green-600' : 
                      fila.literal === 'B' ? 'text-blue-600' : 
                      fila.literal === 'C' ? 'text-yellow-600' : 
                      fila.literal === 'D' ? 'text-red-600' : 'text-gray-400'}`}>
                    {fila.literal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Firmas */}
          <div className="flex justify-between mt-16 pt-8 px-12">
            <div className="text-center">
              <div className="w-48 border-t border-gray-800 mb-2 mx-auto"></div>
              <p className="font-semibold text-gray-700">Firma del Docente</p>
            </div>
            <div className="text-center">
              <div className="w-48 border-t border-gray-800 mb-2 mx-auto"></div>
              <p className="font-semibold text-gray-700">Firma del Director(a)</p>
            </div>
          </div>
          
        </div>
      ) : null}
    </div>
  )
}
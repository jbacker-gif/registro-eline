'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function MatrizCalificaciones() {
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  
  const [seccionId, setSeccionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [infoSeccion, setInfoSeccion] = useState<any>(null)
  const [materiaNombre, setMateriaNombre] = useState('')
  const [tituloVisible, setTituloVisible] = useState('')

  const [vista, setVista] = useState('P1') 

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const secId = params.get('seccion_id')
    const mat = params.get('materia') || ''
    const tit = params.get('titulo') || ''
    
    if (secId) {
      setSeccionId(secId)
      setMateriaNombre(mat)
      setTituloVisible(tit)
      inicializarMatriz(secId, mat)
    } else {
      setCargando(false)
    }
  }, [])

  const inicializarMatriz = async (secId: string, matNombre: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)

      const { data: secData } = await supabase.from('secciones').select('*').eq('id', secId).single()
      setInfoSeccion(secData)

      const { data: asigData } = await supabase.from('asignaturas').select('id').eq('nombre', matNombre).single()
      if (!asigData) return

      const { data: listaEst } = await supabase.from('estudiantes').select('*').eq('seccion_id', secId).order('numero_orden', { ascending: true })

      const { data: notasBD } = await supabase.from('calificaciones').select('*').eq('seccion_id', secId).eq('asignatura_id', asigData.id)

      const datosCompletos = listaEst?.map(est => {
        const notasEst = notasBD?.filter(n => n.estudiante_id === est.id) || []
        
        const getNota = (p: string, c: string) => notasEst.find(n => n.periodo === p && n.competencia === c)?.nota || ''

        return { 
          id: est.id, numero: est.numero_orden, nombre: est.nombre_completo, 
          notas: {
            P1: { C1: getNota('P1', 'C1'), C1_RP: getNota('P1', 'C1_RP'), C2: getNota('P1', 'C2'), C2_RP: getNota('P1', 'C2_RP'), C3: getNota('P1', 'C3'), C3_RP: getNota('P1', 'C3_RP') },
            P2: { C1: getNota('P2', 'C1'), C1_RP: getNota('P2', 'C1_RP'), C2: getNota('P2', 'C2'), C2_RP: getNota('P2', 'C2_RP'), C3: getNota('P2', 'C3'), C3_RP: getNota('P2', 'C3_RP') },
            P3: { C1: getNota('P3', 'C1'), C1_RP: getNota('P3', 'C1_RP'), C2: getNota('P3', 'C2'), C2_RP: getNota('P3', 'C2_RP'), C3: getNota('P3', 'C3'), C3_RP: getNota('P3', 'C3_RP') },
            P4: { C1: getNota('P4', 'C1'), C1_RP: getNota('P4', 'C1_RP'), C2: getNota('P4', 'C2'), C2_RP: getNota('P4', 'C2_RP'), C3: getNota('P4', 'C3'), C3_RP: getNota('P4', 'C3_RP') }
          }
        }
      })

      setEstudiantes(datosCompletos || [])
    } catch (error) {
      console.error(error)
      setMensaje('❌ Error al cargar datos.')
    } finally {
      setCargando(false)
    }
  }

  const manejarCambioNota = (id: string, periodo: string, competencia: string, valor: string) => {
    if (valor !== '' && (Number(valor) < 0 || Number(valor) > 100)) return
    
    setEstudiantes(prev => prev.map(est => {
      if (est.id === id) {
        // Lógica de limpieza: Si cambian la nota normal a >= 65, se borra automáticamente la recuperación
        let nuevaRP = est.notas[periodo][`${competencia}_RP`]
        if (!competencia.includes('_RP') && valor !== '' && Number(valor) >= 65) {
            nuevaRP = ''
        }

        return {
          ...est,
          notas: { 
            ...est.notas, 
            [periodo]: { 
                ...est.notas[periodo], 
                [competencia]: valor,
                ...(!competencia.includes('_RP') ? { [`${competencia}_RP`]: nuevaRP } : {})
            } 
          }
        }
      }
      return est
    }))
  }

  const esPrimerCiclo = ['1ro', '2do'].includes(infoSeccion?.grado)

  const calcularResumen = (notas: any) => {
    const promediosC: any = {};
    
    ['C1', 'C2', 'C3'].forEach(comp => {
      let suma = 0;
      let cantidadReportados = 0;

      ['P1', 'P2', 'P3', 'P4'].forEach(p => {
        const notaNormal = Number(notas[p][comp]);
        const notaRP = Number(notas[p][`${comp}_RP`]);

        if (notaNormal > 0) {
          cantidadReportados++;
          // Si no es primer ciclo y hay nota de RP, el RP reemplaza a la nota normal
          if (!esPrimerCiclo && notaRP > 0) {
            suma += notaRP;
          } else {
            suma += notaNormal;
          }
        }
      });

      promediosC[comp] = cantidadReportados > 0 ? Math.round(suma / cantidadReportados) : null;
    });

    const valoresFinales = [promediosC.C1, promediosC.C2, promediosC.C3].filter(n => n !== null)
    const calificacionFinal = valoresFinales.length > 0 ? Math.round(valoresFinales.reduce((a, b) => a + b, 0) / valoresFinales.length) : '-'
    
    let literal = '-'
    if (calificacionFinal !== '-') {
      if (esPrimerCiclo) {
        if (calificacionFinal >= 90) literal = 'S'
        else if (calificacionFinal >= 80) literal = 'L'
        else if (calificacionFinal >= 70) literal = 'P'
        else literal = 'I'
      } else {
        if (calificacionFinal >= 89) literal = 'D'
        else if (calificacionFinal >= 77) literal = 'L'
        else if (calificacionFinal >= 65) literal = 'P'
        else literal = 'I'
      }
    }

    return { promC1: promediosC.C1 || '-', promC2: promediosC.C2 || '-', promC3: promediosC.C3 || '-', final: calificacionFinal, literal }
  }

  const guardarNotas = async () => {
    if (!seccionId || !userId) return
    setMensaje('Guardando...')
    try {
      const { data: asig } = await supabase.from('asignaturas').select('id').eq('nombre', materiaNombre).single()
      
      await supabase.from('calificaciones').delete().eq('seccion_id', seccionId).eq('asignatura_id', asig?.id).eq('user_id', userId)

      const nuevasNotas: any[] = []
      estudiantes.forEach(est => {
        ['P1', 'P2', 'P3', 'P4'].forEach(periodo => {
          ['C1', 'C1_RP', 'C2', 'C2_RP', 'C3', 'C3_RP'].forEach(comp => {
            const valor = est.notas[periodo][comp]
            if (valor !== '') {
              nuevasNotas.push({
                estudiante_id: est.id, seccion_id: seccionId, user_id: userId, asignatura_id: asig?.id,
                periodo: periodo, competencia: comp, nota: Number(valor)
              })
            }
          })
        })
      })

      if (nuevasNotas.length > 0) {
        const { error } = await supabase.from('calificaciones').insert(nuevasNotas)
        if (error) throw error
      }
      setMensaje('✅ ¡Notas guardadas con éxito!')
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      setMensaje('❌ Error al guardar.')
    }
  }

  if (cargando) return <div className="p-10 text-center">Cargando matriz... ⏳</div>
  if (!seccionId) return <div className="p-10 text-center text-red-500 font-bold">⚠️ Error: No se seleccionó una sección.</div>

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/dashboard" className="text-blue-600 hover:underline text-sm font-medium mb-1 inline-block">← Volver al Panel</Link>
          <h1 className="text-2xl font-bold text-gray-800">{tituloVisible}</h1>
          <p className="text-gray-500 font-medium">Registro: {infoSeccion?.grado} "{infoSeccion?.identificador}"</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-blue-600">{mensaje}</span>
          {vista !== 'RESUMEN' && (
            <button onClick={guardarNotas} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-bold shadow-md transition-all">
              Guardar Calificaciones
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
        {['P1', 'P2', 'P3', 'P4'].map(periodo => (
          <button key={periodo} onClick={() => setVista(periodo)} className={`px-6 py-2 rounded-lg font-bold transition-colors ${vista === periodo ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
            Período {periodo.replace('P', '')}
          </button>
        ))}
        <div className="flex-1"></div>
        <button onClick={() => setVista('RESUMEN')} className={`px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${vista === 'RESUMEN' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300'}`}>
          📊 Ver Resumen Final
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            {vista === 'RESUMEN' ? (
              <tr className="bg-gray-800 text-white text-sm uppercase tracking-wider">
                <th className="p-4 text-center w-16">No.</th>
                <th className="p-4">Nombre del Estudiante</th>
                <th className="p-4 text-center w-24">Prom. C1</th>
                <th className="p-4 text-center w-24">Prom. C2</th>
                <th className="p-4 text-center w-24">Prom. C3</th>
                <th className="p-4 text-center w-32 bg-gray-700">Calif. Final</th>
                <th className="p-4 text-center w-20">Literal</th>
              </tr>
            ) : (
              <tr className="bg-gray-800 text-white text-sm uppercase tracking-wider">
                <th className="p-4 text-center w-12 border-r border-gray-700">No.</th>
                <th className="p-4 border-r border-gray-700">Nombre del Estudiante</th>
                <th className="p-4 text-center border-r border-gray-700" colSpan={esPrimerCiclo ? 1 : 2}>Competencia 1</th>
                <th className="p-4 text-center border-r border-gray-700" colSpan={esPrimerCiclo ? 1 : 2}>Competencia 2</th>
                <th className="p-4 text-center" colSpan={esPrimerCiclo ? 1 : 2}>Competencia 3</th>
              </tr>
            )}
            
            {/* Subcabecera para 3ro a 6to grado (P y RP) */}
            {vista !== 'RESUMEN' && !esPrimerCiclo && (
              <tr className="bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider">
                <th className="p-2 border-r border-b border-gray-200"></th>
                <th className="p-2 border-r border-b border-gray-200"></th>
                <th className="p-2 text-center border-r border-b border-gray-200 w-20">Nota (P)</th>
                <th className="p-2 text-center border-r border-b border-gray-200 w-20 text-orange-600 bg-orange-50/50">Rec. (RP)</th>
                <th className="p-2 text-center border-r border-b border-gray-200 w-20">Nota (P)</th>
                <th className="p-2 text-center border-r border-b border-gray-200 w-20 text-orange-600 bg-orange-50/50">Rec. (RP)</th>
                <th className="p-2 text-center border-r border-b border-gray-200 w-20">Nota (P)</th>
                <th className="p-2 text-center border-b border-gray-200 w-20 text-orange-600 bg-orange-50/50">Rec. (RP)</th>
              </tr>
            )}
          </thead>

          <tbody>
            {estudiantes.map((est) => {
              if (vista === 'RESUMEN') {
                const res = calcularResumen(est.notas);
                return (
                  <tr key={est.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-center text-gray-400 font-bold border-r border-gray-100">{est.numero}</td>
                    <td className="p-4 font-semibold text-gray-700 border-r border-gray-100">{est.nombre}</td>
                    <td className="p-4 text-center text-gray-600 font-medium border-r border-gray-100">{res.promC1}</td>
                    <td className="p-4 text-center text-gray-600 font-medium border-r border-gray-100">{res.promC2}</td>
                    <td className="p-4 text-center text-gray-600 font-medium border-r border-gray-100">{res.promC3}</td>
                    <td className="p-4 text-center font-black text-blue-800 bg-blue-50/50 text-lg border-r border-gray-100">{res.final}</td>
                    <td className={`p-4 text-center font-black text-xl 
                      ${['S', 'D'].includes(res.literal) ? 'text-blue-600' : 
                        ['L'].includes(res.literal) ? 'text-green-600' : 
                        ['P'].includes(res.literal) ? 'text-yellow-500' : 
                        ['I'].includes(res.literal) ? 'text-red-600' : 'text-gray-400'}`}>
                      {res.literal}
                    </td>
                  </tr>
                )
              }

              // Columnas iterables de C1, C2, C3
              return (
                <tr key={est.id} className="border-b hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 text-center text-gray-400 font-bold border-r border-gray-100">{est.numero}</td>
                  <td className="p-4 font-semibold text-gray-700 border-r border-gray-100">{est.nombre}</td>
                  
                  {['C1', 'C2', 'C3'].map((comp, idx) => {
                    const notaP = Number(est.notas[vista][comp]);
                    // Bloqueamos la RP si la nota está vacía o es >= 65
                    const deshabilitarRP = est.notas[vista][comp] === '' || notaP >= 65;

                    return (
                      <td key={comp} colSpan={esPrimerCiclo ? 1 : 2} className={`p-2 border-gray-100 ${idx < 2 ? 'border-r' : ''}`}>
                        <div className="flex gap-2 justify-center">
                          <input 
                            type="number" 
                            value={est.notas[vista][comp]} 
                            onChange={(e) => manejarCambioNota(est.id, vista, comp, e.target.value)} 
                            className={`w-16 text-center border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none font-medium ${!esPrimerCiclo && est.notas[vista][`${comp}_RP`] ? 'text-gray-400 line-through' : 'border-gray-300'}`} 
                            placeholder="--" 
                          />
                          {!esPrimerCiclo && (
                            <input 
                              type="number" 
                              value={est.notas[vista][`${comp}_RP`]} 
                              disabled={deshabilitarRP}
                              onChange={(e) => manejarCambioNota(est.id, vista, `${comp}_RP`, e.target.value)} 
                              className={`w-16 text-center border rounded p-2 focus:ring-2 focus:ring-orange-500 outline-none font-medium ${deshabilitarRP ? 'bg-gray-100 border-gray-200 cursor-not-allowed text-transparent' : 'bg-orange-50 border-orange-300 text-orange-700 shadow-inner'}`} 
                              placeholder={deshabilitarRP ? "" : "RP"} 
                              title={deshabilitarRP ? "Solo disponible si la nota es menor a 65" : "Recuperación Pedagógica"}
                            />
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
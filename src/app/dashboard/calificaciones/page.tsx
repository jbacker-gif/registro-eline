'use client'

import { useState, useEffect, useRef } from 'react'
import { anoEscolarCerrado } from '../../../lib/ano-escolar'
import { supabase } from '../../../lib/supabase'

export default function MatrizCalificaciones() {
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  
  const [seccionId, setSeccionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [infoSeccion, setInfoSeccion] = useState<any>(null)
  const anoCerrado = anoEscolarCerrado(infoSeccion?.ano_escolar)
  const [materiaNombre, setMateriaNombre] = useState('')
  const [tituloVisible, setTituloVisible] = useState('')

  const [vista, setVista] = useState('P1') 
  const contenedorPrincipalRef = useRef<HTMLDivElement>(null)

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

      const { data: secData } = await supabase.from('secciones').select('*').eq('id', secId).eq('user_id', session.user.id).single()
      if (!secData) {
        setMensaje({ texto: 'No tienes permisos para acceder a esta sección.', tipo: 'error' })
        return
      }
      setInfoSeccion(secData)

      const { data: asigData } = await supabase.from('asignaturas').select('id').eq('nombre', matNombre).single()
      if (!asigData) return

      const { data: listaEst } = await supabase.from('estudiantes').select('*').eq('seccion_id', secId).eq('user_id', session.user.id).order('numero_orden', { ascending: true })
      const { data: notasBD } = await supabase.from('calificaciones').select('*').eq('seccion_id', secId).eq('asignatura_id', asigData.id).eq('user_id', session.user.id)

      const datosCompletos = listaEst?.map(est => {
        const notasEst = notasBD?.filter(n => n.estudiante_id === est.id) || []
        const getNota = (p: string, c: string) => notasEst.find(n => n.periodo === p && n.competencia === c)?.nota || ''

        return { 
          id: est.id, 
          sigerd_id: est.sigerd_id,
          numero: est.numero_orden, 
          nombre: est.nombre_completo, 
          estado: est.estado || 'Activo',
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
      setMensaje({ texto: 'Error al cargar datos de calificaciones.', tipo: 'error' })
    } finally {
      setCargando(false)
    }
  }

  const manejarCambioNota = (id: string, periodo: string, competencia: string, valor: string) => {
    if (valor !== '' && (Number(valor) < 0 || Number(valor) > 100)) return
    
    setEstudiantes(prev => prev.map(est => {
      if (est.id === id) {
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

  // =================================================================
  // MAGIA 1 ACTUALIZADA: NAVEGACIÓN TIPO EXCEL (DE ARRIBA HACIA ABAJO)
  // =================================================================
  const manejarTeclaEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      
      // Tomamos TODOS los inputs numéricos de la tabla (incluyendo los deshabilitados para no romper la cuadrícula)
      const inputs = Array.from(document.querySelectorAll('tbody input[type="number"]')) as HTMLInputElement[];
      
      // Calculamos cuántos inputs hay exactamente en UNA fila
      const inputsPorFila = document.querySelector('tbody tr')?.querySelectorAll('input[type="number"]').length || 1;
      
      const index = inputs.indexOf(e.currentTarget);
      
      // El input de abajo está a una distancia exacta equivalente al total de inputs de una fila
      let nextIndex = index + inputsPorFila;

      // Buscamos hacia abajo. Si la fila de abajo está "Retirada" (disabled), saltamos a la siguiente.
      while (nextIndex < inputs.length) {
        const nextInput = inputs[nextIndex];
        if (!nextInput.disabled) {
          nextInput.focus();
          nextInput.select();
          break;
        }
        nextIndex += inputsPorFila; // Sumamos otra fila para seguir bajando
      }
    }
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
    if (anoCerrado) return
    if (!seccionId || !userId) return
    setMensaje({ texto: 'Guardando calificaciones...', tipo: 'info' })
    try {
      const { data: asig } = await supabase.from('asignaturas').select('id').eq('nombre', materiaNombre).single()
      
      await supabase.from('calificaciones').delete().eq('seccion_id', seccionId).eq('asignatura_id', asig?.id).eq('user_id', userId)

      const nuevasNotas: any[] = []
      estudiantes.forEach(est => {
        if (est.estado === 'Retirado') return 

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
      setMensaje({ texto: '✅ ¡Notas guardadas con éxito!', tipo: 'exito' })
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
    } catch (error) {
      setMensaje({ texto: 'Error al guardar las calificaciones.', tipo: 'error' })
    }
  }

  if (cargando) return <div className="p-10 text-center text-slate-500 font-medium w-full">Cargando matriz de evaluación... </div>
  if (!seccionId) return <div className="p-10 text-center text-slate-500 font-bold w-full">Por favor selecciona una sección en el Panel de Control.</div>

  return (
    <div ref={contenedorPrincipalRef} className="h-full w-full overflow-y-auto bg-slate-50/50">
      <div className="p-4 md:p-8 max-w-[1500px] mx-auto">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{tituloVisible}</h1>
              {anoCerrado && <p className="mt-1 text-sm font-semibold text-amber-800">Año escolar inactivo · Solo lectura</p>}
            <p className="text-sm text-slate-500 font-medium mt-1">Registro: {infoSeccion?.grado} "{infoSeccion?.identificador}" {infoSeccion?.tanda ? `(${infoSeccion.tanda})` : ''}</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {seccionId && (
              <a href={`/dashboard/calificaciones-masivas?seccion_id=${seccionId}`} className="w-full md:w-auto rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-center text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:text-blue-700">
                Carga masiva
              </a>
            )}
            {vista !== 'RESUMEN' && (
              <button disabled={anoCerrado} onClick={guardarNotas} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2">
                Guardar Notas
              </button>
            )}
          </div>
        </div>

        {mensaje.texto && (
          <div className={`mb-6 p-4 rounded-lg text-sm font-semibold border shadow-sm ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-200' : mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
            {mensaje.texto}
          </div>
        )}

        {/* PESTAÑAS (TABS) */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['P1', 'P2', 'P3', 'P4'].map(periodo => (
            <button key={periodo} onClick={() => setVista(periodo)} className={`px-5 py-2 rounded-t-lg font-bold transition-all text-sm whitespace-nowrap border-t border-l border-r ${vista === periodo ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'}`}>
              Período {periodo.replace('P', '')}
            </button>
          ))}
          <div className="flex-1 min-w-[20px] border-b border-blue-600"></div>
          <button onClick={() => setVista('RESUMEN')} className={`px-5 py-2 rounded-t-lg font-bold transition-all flex items-center gap-2 text-sm whitespace-nowrap border-t border-l border-r ${vista === 'RESUMEN' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'}`}>
            Resumen Final
          </button>
        </div>

        {/* TABLA ESTILO EXCEL */}
        <div className="bg-white shadow-md border border-slate-300 overflow-hidden w-full min-w-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[900px] text-sm">
              
              <thead className="bg-blue-600 text-white">
                {vista === 'RESUMEN' ? (
                  <tr className="uppercase tracking-wider">
                    <th className="p-3 text-center w-12 font-bold border border-slate-300">No.</th>
                    <th className="p-3 font-bold border border-slate-300">Nombre del Estudiante</th>
                    <th className="p-3 text-center font-bold border border-slate-300">Prom. C1</th>
                    <th className="p-3 text-center font-bold border border-slate-300">Prom. C2</th>
                    <th className="p-3 text-center font-bold border border-slate-300">Prom. C3</th>
                    <th className="p-3 text-center font-black bg-blue-700 border border-slate-300">Calif. Final</th>
                    <th className="p-3 text-center font-bold border border-slate-300 w-20">Literal</th>
                  </tr>
                ) : (
                  <tr className="uppercase tracking-wider">
                    <th className="p-3 text-center w-12 font-bold border border-slate-300">No.</th>
                    <th className="p-3 font-bold border border-slate-300">Nombre del Estudiante</th>
                    <th className="p-3 text-center font-bold border border-slate-300" colSpan={esPrimerCiclo ? 1 : 2}>Competencia 1</th>
                    <th className="p-3 text-center font-bold border border-slate-300" colSpan={esPrimerCiclo ? 1 : 2}>Competencia 2</th>
                    <th className="p-3 text-center font-bold border border-slate-300" colSpan={esPrimerCiclo ? 1 : 2}>Competencia 3</th>
                  </tr>
                )}
                
                {vista !== 'RESUMEN' && !esPrimerCiclo && (
                  <tr className="bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider">
                    <th className="p-2 border border-slate-300"></th>
                    <th className="p-2 border border-slate-300"></th>
                    <th className="p-2 text-center border border-slate-300 w-24">Nota (P)</th>
                    <th className="p-2 text-center border border-slate-300 w-24">Rec. (RP)</th>
                    <th className="p-2 text-center border border-slate-300 w-24">Nota (P)</th>
                    <th className="p-2 text-center border border-slate-300 w-24">Rec. (RP)</th>
                    <th className="p-2 text-center border border-slate-300 w-24">Nota (P)</th>
                    <th className="p-2 text-center border border-slate-300 w-24">Rec. (RP)</th>
                  </tr>
                )}
              </thead>

              <tbody className="bg-white">
                {estudiantes.map((est, index) => {
                  const esRetirado = est.estado === 'Retirado';
                  const rowClass = esRetirado
                    ? 'bg-slate-200 grayscale opacity-60 pointer-events-none'
                    : index % 2 === 0 ? 'bg-white hover:bg-yellow-50' : 'bg-slate-50 hover:bg-yellow-50';

                  if (vista === 'RESUMEN') {
                    const res = esRetirado ? { promC1: '-', promC2: '-', promC3: '-', final: '-', literal: '-' } : calcularResumen(est.notas);
                    return (
                      <tr key={est.id} className={rowClass}>
                        <td className="p-3 text-center text-slate-500 font-bold border border-slate-300">{est.numero}</td>
                        <td className="p-3 font-semibold text-slate-800 border border-slate-300 flex items-center justify-between">
                          {est.nombre}
                          {esRetirado && <span className="text-[10px] bg-slate-300 text-slate-700 px-2 py-0.5 rounded uppercase font-bold">Retirado</span>}
                        </td>
                        <td className="p-3 text-center text-slate-600 border border-slate-300">{res.promC1}</td>
                        <td className="p-3 text-center text-slate-600 border border-slate-300">{res.promC2}</td>
                        <td className="p-3 text-center text-slate-600 border border-slate-300">{res.promC3}</td>
                        <td className="p-3 text-center font-black text-slate-900 bg-slate-100 border border-slate-300 text-lg">{res.final}</td>
                        <td className={`p-3 text-center font-black text-lg border border-slate-300
                          ${['S', 'D'].includes(res.literal) ? 'text-blue-700' : 
                            ['L'].includes(res.literal) ? 'text-emerald-700' : 
                            ['P'].includes(res.literal) ? 'text-amber-600' : 
                            ['I'].includes(res.literal) ? 'text-red-600' : 'text-slate-400'}`}>
                          {res.literal}
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={est.id} className={rowClass}>
                      <td className="p-2 text-center text-slate-500 font-bold border border-slate-300">{est.numero}</td>
                      <td className="p-2 font-semibold text-slate-800 border border-slate-300 flex items-center justify-between">
                        {est.nombre}
                        {esRetirado && <span className="text-[10px] bg-slate-300 text-slate-700 px-2 py-0.5 rounded uppercase font-bold">Retirado</span>}
                      </td>
                      
                      {['C1', 'C2', 'C3'].map((comp) => {
                        const notaP = Number(est.notas[vista][comp]);
                        const deshabilitarRP = est.notas[vista][comp] === '' || notaP >= 65 || esRetirado;

                        return (
                          <td key={comp} colSpan={esPrimerCiclo ? 1 : 2} className="p-0 border border-slate-300">
                            <div className="flex h-full w-full">
                              <div className="flex-1 border-r border-slate-200">
                                <input 
                                  type="number" 
                                  value={est.notas[vista][comp]} 
                                  disabled={anoCerrado || esRetirado}
                                  onChange={(e) => manejarCambioNota(est.id, vista, comp, e.target.value)} 
                                  onKeyDown={manejarTeclaEnter} 
                                  className={`w-full h-full text-center p-2 outline-none font-bold transition-all focus:ring-2 focus:ring-inset focus:ring-blue-600 ${
                                    !esPrimerCiclo && est.notas[vista][`${comp}_RP`] 
                                      ? 'text-slate-400 line-through bg-slate-100' 
                                      : 'bg-transparent text-slate-800 focus:bg-white'
                                  }`} 
                                  placeholder="-" 
                                />
                              </div>

                              {!esPrimerCiclo && (
                                <div className="flex-1 bg-orange-50/30">
                                  <input 
                                    type="number" 
                                    value={est.notas[vista][`${comp}_RP`]} 
                                    disabled={anoCerrado || deshabilitarRP}
                                    onChange={(e) => manejarCambioNota(est.id, vista, `${comp}_RP`, e.target.value)} 
                                    onKeyDown={manejarTeclaEnter} 
                                    className={`w-full h-full text-center p-2 outline-none font-bold transition-all focus:ring-2 focus:ring-inset focus:ring-blue-600 ${
                                      deshabilitarRP 
                                        ? 'bg-transparent cursor-not-allowed text-transparent placeholder-transparent' 
                                        : 'bg-orange-50 text-orange-700 focus:bg-white'
                                    }`} 
                                    placeholder={deshabilitarRP ? "" : "RP"} 
                                  />
                                </div>
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

      </div>
    </div>
  )
}

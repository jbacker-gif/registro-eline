'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { getCsvValue, readCsvFile } from '../../../lib/csv'

export default function MisEstudiantes() {
  const [estudiantes, setEstudiantes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [pestanaFormulario, setPestanaFormulario] = useState<'generales' | 'salud' | 'responsable'>('generales')

  const [seccionId, setSeccionId] = useState<string | null>(null)
  const [infoSeccion, setInfoSeccion] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const archivoInputRef = useRef<HTMLInputElement>(null)
  // Referencia para controlar el scroll interno de esta página
  const contenedorPrincipalRef = useRef<HTMLDivElement>(null)

  // ==========================================
  // ESTADOS DEL FORMULARIO
  // ==========================================
  const [idEditando, setIdEditando] = useState<string | null>(null)
  const [nuevoNumero, setNuevoNumero] = useState('')
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [sigerdId, setSigerdId] = useState('')
  const [sexo, setSexo] = useState('')
  const [nacionalidad, setNacionalidad] = useState('Dominicana')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [tutor, setTutor] = useState('')
  const [telefono, setTelefono] = useState('')
  const [libro, setLibro] = useState('')
  const [folio, setFolio] = useState('')
  const [parentescoVive, setParentescoVive] = useState('')
  const [direccionResidencia, setDireccionResidencia] = useState('')
  const [fechaNuevoInscrito, setFechaNuevoInscrito] = useState('')
  const [fechaRetiro, setFechaRetiro] = useState('')
  const [condicionInicial, setCondicionInicial] = useState('')
  const [neae, setNeae] = useState('')
  const [enfermedadesAlergias, setEnfermedadesAlergias] = useState('')
  const [medicamentosUsa, setMedicamentosUsa] = useState('')
  const [emergenciaNombre, setEmergenciaNombre] = useState('')
  const [emergenciaTelefono, setEmergenciaTelefono] = useState('')
  const [responsableNombre, setResponsableNombre] = useState('')
  const [responsableParentesco, setResponsableParentesco] = useState('')
  const [responsableCedula, setResponsableCedula] = useState('')
  const [responsableDocumentoExtranjero, setResponsableDocumentoExtranjero] = useState(false)
  const [responsableTelefono, setResponsableTelefono] = useState('')
  const [responsableProfesion, setResponsableProfesion] = useState('')
  const [responsableNivelEducativo, setResponsableNivelEducativo] = useState('')

  const condicionInicialOpciones = ['Promovido', 'Repitiente', 'Reentrante']
  const nacionalidadOpciones = ['Dominicana', 'Haitiana', 'Venezolana', 'Estadounidense', 'Española', 'Colombiana', 'Cubana', 'Otra']
  const parentescoViveOpciones = ['Madre', 'Padre', 'Abuelo/a', 'Tio/a', 'Hermano/a', 'Tutor/a', 'Otro']
  const responsableParentescoOpciones = ['Padre', 'Madre', 'Tutor/a']
  const responsableNivelOpciones = ['Sin escolaridad', 'Primaria incompleta', 'Primaria completa', 'Secundaria incompleta', 'Secundaria completa', 'Superior incompleto', 'Superior completo', 'Desconocido']

  const soloDigitos = (valor: string) => valor.replace(/\D/g, '')

  const formatearTelefono = (valor: string) => {
    const digitos = soloDigitos(valor).slice(0, 10)
    if (digitos.length <= 3) return digitos
    if (digitos.length <= 6) return `(${digitos.slice(0, 3)}) ${digitos.slice(3)}`
    return `(${digitos.slice(0, 3)}) ${digitos.slice(3, 6)}-${digitos.slice(6)}`
  }

  const formatearCedula = (valor: string) => {
    const digitos = soloDigitos(valor).slice(0, 11)
    if (digitos.length <= 3) return digitos
    if (digitos.length <= 10) return `${digitos.slice(0, 3)}-${digitos.slice(3)}`
    return `${digitos.slice(0, 3)}-${digitos.slice(3, 10)}-${digitos.slice(10)}`
  }

  const abrirNuevoEstudiante = () => {
    limpiarFormulario()
    setPestanaFormulario('generales')
    setFormularioAbierto(true)
  }

  const cerrarFormulario = () => {
    limpiarFormulario()
    setFormularioAbierto(false)
    setPestanaFormulario('generales')
  }

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

      const { data: secData } = await supabase.from('secciones').select('*').eq('id', secId).eq('user_id', session.user.id).single()
      if (secData) setInfoSeccion(secData)

      cargarEstudiantes(secId, session.user.id)
    } catch (error) {
      setCargando(false)
    }
  }

  const cargarEstudiantes = async (secId: string, maestroId: string) => {
    try {
      const { data, error } = await supabase.from('estudiantes').select('*').eq('seccion_id', secId).eq('user_id', maestroId).order('numero_orden', { ascending: true })
      if (error) throw error
      const idsEstudiantes = (data || []).map(est => est.id)
      let responsablesPorEstudiante = new Map<string, any>()

      if (idsEstudiantes.length > 0) {
        const { data: responsables, error: responsablesError } = await supabase
          .from('responsables_estudiante')
          .select('*')
          .in('estudiante_id', idsEstudiantes)
          .eq('user_id', maestroId)
          .eq('es_principal', true)

        if (!responsablesError) {
          responsablesPorEstudiante = new Map((responsables || []).map(resp => [resp.estudiante_id, resp]))
        }
      }

      setEstudiantes((data || []).map(est => ({
        ...est,
        responsable_principal: responsablesPorEstudiante.get(est.id) || null,
      })))
      
      if (!idEditando) {
        if (data && data.length > 0) {
          const ultimoNumero = Math.max(...data.map(e => e.numero_orden))
          setNuevoNumero((ultimoNumero + 1).toString())
        } else {
          setNuevoNumero('1')
        }
      }
    } catch (error) {
      setMensaje({ texto: 'Error al cargar la lista.', tipo: 'error' })
    } finally {
      setCargando(false)
    }
  }

  // ==========================================
  // LÓGICA DE GUARDAR / ACTUALIZAR
  // ==========================================
  const guardarEstudiante = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!seccionId || !userId) return
    setMensaje({ texto: 'Guardando...', tipo: 'info' })
    
    try {
      if (!nuevoNumero || !nombres.trim() || !apellidos.trim() || !sexo || !nacionalidad.trim()) {
        setPestanaFormulario('generales')
        setMensaje({ texto: 'Completa los datos obligatorios del estudiante.', tipo: 'error' })
        return
      }

      if (!condicionInicial || !fechaNacimiento || !direccionResidencia.trim() || !parentescoVive) {
        setPestanaFormulario('generales')
        setMensaje({ texto: 'Completa condicion inicial, fecha de nacimiento, direccion y parentesco con quien vive.', tipo: 'error' })
        return
      }

      if (!neae.trim() || !enfermedadesAlergias.trim() || !emergenciaNombre.trim() || soloDigitos(emergenciaTelefono).length !== 10) {
        setPestanaFormulario('salud')
        setMensaje({ texto: 'Completa NEAE, salud y contacto de emergencia. Marca Ninguna cuando no aplique.', tipo: 'error' })
        return
      }

      const cedulaDigitos = soloDigitos(responsableCedula)
      if (
        !responsableNombre.trim() ||
        !responsableParentesco ||
        !responsableTelefono.trim() ||
        soloDigitos(responsableTelefono).length !== 10 ||
        !responsableNivelEducativo ||
        (!responsableDocumentoExtranjero && cedulaDigitos.length !== 11) ||
        (responsableDocumentoExtranjero && !responsableCedula.trim())
      ) {
        setPestanaFormulario('responsable')
        setMensaje({ texto: 'Completa los datos obligatorios del responsable.', tipo: 'error' })
        return
      }

      const nombreCompletoGenerado = `${apellidos}, ${nombres}`

      const datosEstudiante = {
        numero_orden: Number(nuevoNumero),
        nombre_completo: nombreCompletoGenerado,
        nombres: nombres,
        apellidos: apellidos,
        sigerd_id: sigerdId || null,
        sexo: sexo,
        nacionalidad: nacionalidad,
        fecha_nacimiento: fechaNacimiento || null,
        nombre_tutor: tutor,
        telefono_contacto: telefono,
        libro: libro.trim() || null,
        folio: folio.trim() || null,
        parentesco_con_quien_vive: parentescoVive.trim() || null,
        direccion_residencia: direccionResidencia.trim() || null,
        fecha_nuevo_inscrito: fechaNuevoInscrito || null,
        fecha_retiro: fechaRetiro || null,
        condicion_inicial: condicionInicial || null,
        neae: neae.trim() || null,
        enfermedades_alergias: enfermedadesAlergias.trim() || null,
        medicamentos_usa: medicamentosUsa.trim() || null,
        emergencia_nombre: emergenciaNombre.trim() || null,
        emergencia_telefono: emergenciaTelefono.trim() || null,
        seccion_id: seccionId,
        user_id: userId 
      }

      let estudianteIdFinal = idEditando
      if (idEditando) {
        const { error } = await supabase.from('estudiantes').update(datosEstudiante).eq('id', idEditando).eq('user_id', userId)
        if (error) throw error
        setMensaje({ texto: '✅ ¡Estudiante actualizado!', tipo: 'exito' })
      } else {
        const { data, error } = await supabase.from('estudiantes').insert([datosEstudiante]).select('id').single()
        if (error) throw error
        estudianteIdFinal = data.id
        setMensaje({ texto: '✅ ¡Estudiante registrado!', tipo: 'exito' })
      }

      if (estudianteIdFinal) {
        await guardarResponsablePrincipal(estudianteIdFinal, {
          nombre_completo: responsableNombre,
          parentesco: responsableParentesco,
          cedula: responsableCedula,
          telefono: responsableTelefono,
          profesion_oficio: responsableProfesion,
          nivel_educativo: responsableNivelEducativo,
          borrarSiVacio: Boolean(idEditando),
        })
      }

      limpiarFormulario()
      setFormularioAbierto(false)
      setPestanaFormulario('generales')
      cargarEstudiantes(seccionId, userId)
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
    } catch (error) {
      console.error('Error al guardar estudiante:', error)
      const detalle = error instanceof Error ? error.message : 'Revisa la consola para mas detalles.'
      setMensaje({ texto: `Error al guardar datos. ${detalle}`, tipo: 'error' })
    }
  }

  // ==========================================
  // PREPARAR PARA EDITAR
  // ==========================================
  const cargarParaEditar = (est: any) => {
    const nombreResponsable = est.responsable_principal?.nombre_completo || est.nombre_tutor || ''
    const telefonoResponsable = est.responsable_principal?.telefono || est.telefono_contacto || ''
    const documentoResponsable = est.responsable_principal?.cedula || ''
    const esDocumentoExtranjero = Boolean(documentoResponsable && soloDigitos(documentoResponsable).length !== 11)

    setIdEditando(est.id)
    setNuevoNumero(est.numero_orden.toString())
    setNombres(est.nombres || '')
    setApellidos(est.apellidos || '')
    setSigerdId(est.sigerd_id || '')
    setSexo(est.sexo || '')
    setNacionalidad(est.nacionalidad || 'Dominicana')
    setFechaNacimiento(est.fecha_nacimiento || '')
    setTutor(nombreResponsable)
    setTelefono(formatearTelefono(telefonoResponsable))
    setLibro(est.libro || '')
    setFolio(est.folio || '')
    setParentescoVive(est.parentesco_con_quien_vive || '')
    setDireccionResidencia(est.direccion_residencia || '')
    setFechaNuevoInscrito(est.fecha_nuevo_inscrito || '')
    setFechaRetiro(est.fecha_retiro || '')
    setCondicionInicial(est.condicion_inicial || '')
    setNeae(est.neae || '')
    setEnfermedadesAlergias(est.enfermedades_alergias || '')
    setMedicamentosUsa(est.medicamentos_usa || '')
    setEmergenciaNombre(est.emergencia_nombre || '')
    setEmergenciaTelefono(formatearTelefono(est.emergencia_telefono || ''))
    setResponsableNombre(nombreResponsable)
    setResponsableParentesco(est.responsable_principal?.parentesco || '')
    setResponsableCedula(esDocumentoExtranjero ? documentoResponsable : formatearCedula(documentoResponsable))
    setResponsableTelefono(formatearTelefono(telefonoResponsable))
    setResponsableProfesion(est.responsable_principal?.profesion_oficio || '')
    setResponsableNivelEducativo(est.responsable_principal?.nivel_educativo || '')
    setResponsableDocumentoExtranjero(esDocumentoExtranjero)
    setPestanaFormulario('generales')
    setFormularioAbierto(true)
    
    // Hacemos scroll suave hacia arriba en el contenedor interno
    if (contenedorPrincipalRef.current) {
      contenedorPrincipalRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const limpiarFormulario = () => {
    setIdEditando(null)
    setNombres(''); setApellidos(''); setSigerdId(''); setSexo(''); setNacionalidad('Dominicana'); setFechaNacimiento(''); setTutor(''); setTelefono('');
    setLibro(''); setFolio(''); setParentescoVive(''); setDireccionResidencia(''); setFechaNuevoInscrito(''); setFechaRetiro(''); setCondicionInicial('');
    setNeae(''); setEnfermedadesAlergias(''); setMedicamentosUsa(''); setEmergenciaNombre(''); setEmergenciaTelefono('');
    setResponsableNombre(''); setResponsableParentesco(''); setResponsableCedula(''); setResponsableTelefono(''); setResponsableProfesion(''); setResponsableNivelEducativo('');
    setResponsableDocumentoExtranjero(false)
  }

  const normalizarFechaNacimientoCSV = (fechaDirecta: string, diaCsv: string, mesCsv: string, anoCsv: string) => {
    const confirmarFechaValida = (valor: string) => {
      const fecha = new Date(`${valor}T00:00:00`)
      if (Number.isNaN(fecha.getTime())) return null

      const [ano, mes, dia] = valor.split('-').map(Number)
      if (fecha.getFullYear() !== ano || fecha.getMonth() + 1 !== mes || fecha.getDate() !== dia) return null
      return valor
    }

    const fecha = fechaDirecta.trim()
    if (fecha) {
      const iso = fecha.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
      if (iso) {
        const [, ano, mes, dia] = iso
        return confirmarFechaValida(`${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`)
      }

      const local = fecha.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/)
      if (local) {
        const [, primero, segundo, ano] = local
        const primerNumero = Number(primero)
        const segundoNumero = Number(segundo)
        const dia = primerNumero > 12 ? primero : segundoNumero > 12 ? segundo : primero
        const mes = primerNumero > 12 ? segundo : segundoNumero > 12 ? primero : segundo
        return confirmarFechaValida(`${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`)
      }

      return null
    }

    const dia = diaCsv.trim()
    const mes = mesCsv.trim()
    const ano = anoCsv.trim()
    if (!dia && !mes && !ano) return null
    if (!dia || !mes || !ano) return null

    return confirmarFechaValida(`${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`)
  }

  const guardarResponsablePrincipal = async (
    estudianteId: string,
    responsable: {
      nombre_completo?: string | null
      parentesco?: string | null
      cedula?: string | null
      telefono?: string | null
      profesion_oficio?: string | null
      nivel_educativo?: string | null
      borrarSiVacio?: boolean
    }
  ) => {
    if (!userId) return

    const nombre = responsable.nombre_completo?.trim() || ''
    if (!nombre) {
      if (!responsable.borrarSiVacio) return

      const { error } = await supabase
        .from('responsables_estudiante')
        .delete()
        .eq('estudiante_id', estudianteId)
        .eq('user_id', userId)
        .eq('es_principal', true)
      if (error) throw error
      return
    }

    const datosResponsable = {
      estudiante_id: estudianteId,
      user_id: userId,
      nombre_completo: nombre,
      parentesco: responsable.parentesco?.trim() || null,
      cedula: responsable.cedula?.trim() || null,
      telefono: responsable.telefono?.trim() || null,
      profesion_oficio: responsable.profesion_oficio?.trim() || null,
      nivel_educativo: responsable.nivel_educativo?.trim() || null,
      es_principal: true,
      updated_at: new Date().toISOString(),
    }

    const { data: responsableExistente, error: responsableBuscarError } = await supabase
      .from('responsables_estudiante')
      .select('id')
      .eq('estudiante_id', estudianteId)
      .eq('user_id', userId)
      .eq('es_principal', true)
      .maybeSingle()
    if (responsableBuscarError) throw responsableBuscarError

    const { error } = responsableExistente
      ? await supabase
          .from('responsables_estudiante')
          .update(datosResponsable)
          .eq('id', responsableExistente.id)
          .eq('user_id', userId)
      : await supabase
          .from('responsables_estudiante')
          .insert([datosResponsable])
    if (error) throw error
  }

  // ==========================================
  // LECTOR DE CSV (Fechas incluidas)
  // ==========================================
  const manejarImportacionCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !seccionId || !userId) return

    setMensaje({ texto: 'Procesando archivo CSV...', tipo: 'info' })
    try {
      const filas = await readCsvFile(file)
      const requeridos = [
        ['numero_orden', 'no_lista', 'numero', 'orden'],
        ['nombres', 'nombre'],
        ['apellidos', 'apellido'],
      ]
      const tieneColumnasBase = filas.length > 0 && requeridos.every(opciones =>
        opciones.some(opcion => Object.prototype.hasOwnProperty.call(filas[0], opcion))
      )

      if (!tieneColumnasBase) {
        setMensaje({ texto: 'La plantilla debe incluir numero_orden, nombres y apellidos.', tipo: 'error' })
        return
      }

      let filasIgnoradas = 0
      let fechasInvalidas = 0
      const datosCsv = filas.map(row => {
        const numero = Number(getCsvValue(row, ['numero_orden', 'no_lista', 'numero', 'orden'])) || 0
        const nom = getCsvValue(row, ['nombres', 'nombre']).trim()
        const ape = getCsvValue(row, ['apellidos', 'apellido']).trim()
        const sex = getCsvValue(row, ['sexo']).trim().toUpperCase()
        const nac = getCsvValue(row, ['nacionalidad']).trim() || 'Dominicana'
        const sigerd = getCsvValue(row, ['sigerd_id', 'id_sigerd', 'sigerd']).trim() || null
        const tutorCsv = getCsvValue(row, ['nombre_tutor', 'tutor', 'padre_madre_tutor']).trim()
        const telefonoCsv = getCsvValue(row, ['telefono_contacto', 'telefono', 'celular']).trim()
        const estadoCsv = getCsvValue(row, ['estado']).trim() || 'Activo'
        const fechaDirecta = getCsvValue(row, ['fecha_nacimiento', 'nacimiento']).trim()
        const dia = getCsvValue(row, ['dia_nacimiento', 'dia']).trim()
        const mes = getCsvValue(row, ['mes_nacimiento', 'mes']).trim()
        const ano = getCsvValue(row, ['ano_nacimiento', 'anio_nacimiento', 'ano', 'anio']).trim()
        const fechaSQL = normalizarFechaNacimientoCSV(fechaDirecta, dia, mes, ano)
        const fechaNuevoInscritoCsv = getCsvValue(row, ['fecha_nuevo_inscrito', 'nuevo_inscrito']).trim()
        const fechaRetiroCsv = getCsvValue(row, ['fecha_retiro', 'retiro']).trim()
        const fechaNuevoInscritoSQL = fechaNuevoInscritoCsv ? normalizarFechaNacimientoCSV(fechaNuevoInscritoCsv, '', '', '') : null
        const fechaRetiroSQL = fechaRetiroCsv ? normalizarFechaNacimientoCSV(fechaRetiroCsv, '', '', '') : null
        const responsableNombreCsv = getCsvValue(row, ['responsable_nombre', 'nombre_responsable']).trim() || tutorCsv
        const responsableTelefonoCsv = getCsvValue(row, ['responsable_telefono', 'telefono_responsable']).trim() || telefonoCsv

        if ((fechaDirecta || dia || mes || ano) && !fechaSQL) {
          fechasInvalidas++
        }
        if (fechaNuevoInscritoCsv && !fechaNuevoInscritoSQL) fechasInvalidas++
        if (fechaRetiroCsv && !fechaRetiroSQL) fechasInvalidas++

        return {
          numero_orden: numero,
          nombres: nom,
          apellidos: ape,
          nombre_completo: `${ape}, ${nom}`,
          sigerd_id: sigerd,
          sexo: sex,
          nacionalidad: nac,
          fecha_nacimiento: fechaSQL,
          nombre_tutor: tutorCsv,
          telefono_contacto: telefonoCsv,
          libro: getCsvValue(row, ['libro']).trim() || null,
          folio: getCsvValue(row, ['folio']).trim() || null,
          parentesco_con_quien_vive: getCsvValue(row, ['parentesco_con_quien_vive', 'vive_con', 'parentesco_vive']).trim() || null,
          direccion_residencia: getCsvValue(row, ['direccion_residencia', 'direccion']).trim() || null,
          fecha_nuevo_inscrito: fechaNuevoInscritoSQL,
          fecha_retiro: fechaRetiroSQL,
          condicion_inicial: getCsvValue(row, ['condicion_inicial']).trim() || null,
          neae: getCsvValue(row, ['neae', 'apoyo_educativo']).trim() || null,
          enfermedades_alergias: getCsvValue(row, ['enfermedades_alergias', 'salud']).trim() || null,
          medicamentos_usa: getCsvValue(row, ['medicamentos_usa', 'medicamentos']).trim() || null,
          emergencia_nombre: getCsvValue(row, ['emergencia_nombre', 'contacto_emergencia']).trim() || null,
          emergencia_telefono: getCsvValue(row, ['emergencia_telefono', 'telefono_emergencia']).trim() || null,
          seccion_id: seccionId,
          user_id: userId,
          estado: estadoCsv,
          responsable_principal_csv: {
            nombre_completo: responsableNombreCsv,
            parentesco: getCsvValue(row, ['responsable_parentesco', 'parentesco_responsable']).trim(),
            cedula: getCsvValue(row, ['responsable_cedula', 'cedula_responsable']).trim(),
            telefono: responsableTelefonoCsv,
            profesion_oficio: getCsvValue(row, ['responsable_profesion', 'responsable_oficio', 'profesion_oficio']).trim(),
            nivel_educativo: getCsvValue(row, ['responsable_nivel_educativo', 'nivel_educativo_responsable']).trim(),
          },
        }
      }).filter(est => {
        const valido = est.numero_orden > 0 && est.nombres !== '' && est.apellidos !== ''
        if (!valido) filasIgnoradas++
        return valido
      })

      if (datosCsv.length === 0) {
        setMensaje({ texto: 'El archivo está vacío o tiene un formato incorrecto.', tipo: 'error' })
        return
      }

      const { data: existentes, error: errorExistentes } = await supabase
        .from('estudiantes')
        .select('id, numero_orden, sigerd_id')
        .eq('seccion_id', seccionId)
        .eq('user_id', userId)
      if (errorExistentes) throw errorExistentes

      const porSigerd = new Map((existentes || []).filter(est => est.sigerd_id).map(est => [String(est.sigerd_id).trim(), est]))
      const porNumero = new Map((existentes || []).map(est => [Number(est.numero_orden), est]))
      let creados = 0
      let actualizados = 0

      for (const datos of datosCsv) {
        const { responsable_principal_csv: responsableCsv, ...datosEstudianteCsv } = datos
        const existente = (datosEstudianteCsv.sigerd_id ? porSigerd.get(datosEstudianteCsv.sigerd_id) : undefined) || porNumero.get(datosEstudianteCsv.numero_orden)

        if (existente) {
          const { error } = await supabase.from('estudiantes').update(datosEstudianteCsv).eq('id', existente.id).eq('user_id', userId)
          if (error) throw error
          await guardarResponsablePrincipal(existente.id, responsableCsv)
          if (datosEstudianteCsv.sigerd_id) porSigerd.set(datosEstudianteCsv.sigerd_id, existente)
          porNumero.set(datosEstudianteCsv.numero_orden, existente)
          actualizados++
        } else {
          const { data: creado, error } = await supabase.from('estudiantes').insert([datosEstudianteCsv]).select('id, numero_orden, sigerd_id').single()
          if (error) throw error
          if (creado?.id) await guardarResponsablePrincipal(creado.id, responsableCsv)
          if (creado?.sigerd_id) porSigerd.set(String(creado.sigerd_id).trim(), creado)
          if (creado) porNumero.set(Number(creado.numero_orden), creado)
          creados++
        }
      }

      cargarEstudiantes(seccionId, userId)
      setMensaje({ texto: `Importación lista: ${creados} creados y ${actualizados} actualizados. Filas ignoradas: ${filasIgnoradas}. Fechas incompletas o inválidas: ${fechasInvalidas}.`, tipo: 'exito' })
      if (archivoInputRef.current) archivoInputRef.current.value = ''
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000)
    } catch (error) {
      console.error(error)
      const detalle = error instanceof Error ? error.message : 'revisa la plantilla CSV.'
      setMensaje({ texto: `No se pudo importar estudiantes: ${detalle}`, tipo: 'error' })
    }
  }

  // ==========================================
  // ACCIONES: RETIRAR Y ELIMINAR
  // ==========================================
  const cambiarEstadoEstudiante = async (id: string, nombre: string, estadoActual: string) => {
    if (!userId) return
    const nuevoEstado = estadoActual === 'Activo' ? 'Retirado' : 'Activo'
    if (!window.confirm(`¿Seguro que quieres marcar a ${nombre} como ${nuevoEstado}?`)) return
    
    setMensaje({ texto: 'Actualizando estado...', tipo: 'info' })
    try {
      const { error } = await supabase.from('estudiantes').update({ estado: nuevoEstado }).eq('id', id).eq('user_id', userId)
      if (error) throw error
      
      setMensaje({ texto: `✅ Estudiante marcado como ${nuevoEstado}`, tipo: 'exito' })
      if (seccionId && userId) cargarEstudiantes(seccionId, userId)
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000)
    } catch (error) {
      setMensaje({ texto: 'Error al cambiar el estado.', tipo: 'error' })
    }
  }

  const eliminarEstudiante = async (id: string, nombre: string) => {
    if (!userId) return
    if (!window.confirm(`¿Seguro que quieres eliminar definitivamente a ${nombre}?`)) return
    try {
      const { error } = await supabase.from('estudiantes').delete().eq('id', id).eq('user_id', userId)
      if (error) throw error
      if (seccionId && userId) cargarEstudiantes(seccionId, userId)
      if (idEditando === id) cerrarFormulario()
    } catch (error) {
      alert('Error al eliminar.')
    }
  }

  if (cargando) return <div className="p-10 text-center text-slate-500 font-medium w-full">Cargando base de datos... </div>
  if (!seccionId) return <div className="p-10 text-center text-slate-500 font-bold w-full">Por favor selecciona una sección en el Panel de Control.</div>

  return (
    <div ref={contenedorPrincipalRef} className="h-full w-full overflow-y-auto bg-slate-50/50">
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
        
        {/* ENCABEZADO Y BOTÓN IMPORTAR */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Registro de Estudiantes</h1>
            <p className="text-sm text-slate-500 mt-1">
              {infoSeccion ? `Sección Activa: ${infoSeccion.grado} "${infoSeccion.identificador}" ${infoSeccion.tanda ? `(${infoSeccion.tanda})` : ''}` : 'Ficha oficial del alumno.'}
            </p>
          </div>
          
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <input type="file" accept=".csv" ref={archivoInputRef} onChange={manejarImportacionCSV} className="hidden" />
            <button
              onClick={abrirNuevoEstudiante}
              className="w-full rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 sm:w-auto"
            >
              + Nuevo estudiante
            </button>
            <button 
              onClick={() => archivoInputRef.current?.click()} 
              className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-300 px-5 py-2.5 rounded-xl font-bold transition-all flex justify-center items-center gap-2 shadow-sm text-sm"
            >
              <span className="text-emerald-500 text-lg">📄</span> Importar CSV
            </button>
            <a
              href="/plantillas/plantilla_estudiantes.csv"
              download
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-center text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 sm:w-auto"
            >
              Plantilla
            </a>
          </div>
        </div>

        {mensaje.texto && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-semibold border shadow-sm ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-200' : mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
          
          {/* ========================================================
              FORMULARIO (min-w-0 evita que empuje la cuadrícula)
              ======================================================== */}
          <div
            className={`${formularioAbierto ? 'fixed inset-0 z-40 flex justify-end bg-slate-950/35 backdrop-blur-[1px]' : 'hidden'}`}
            onClick={cerrarFormulario}
          >
            <div
              className="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl md:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  {idEditando ? 'Editando Alumno' : 'Nuevo Alumno'}
                </h2>
                <button onClick={cerrarFormulario} type="button" className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="mb-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-500">
                {[
                  ['generales', 'Generales'],
                  ['salud', 'Salud'],
                  ['responsable', 'Responsable'],
                ].map(([clave, etiqueta]) => (
                  <button
                    key={clave}
                    type="button"
                    onClick={() => setPestanaFormulario(clave as typeof pestanaFormulario)}
                    className={`rounded-lg px-3 py-2 transition-colors ${pestanaFormulario === clave ? 'bg-white text-blue-700 shadow-sm' : 'hover:text-slate-800'}`}
                  >
                    {etiqueta}
                  </button>
                ))}
              </div>
              
              <form onSubmit={guardarEstudiante} className="space-y-4">
                {pestanaFormulario === 'generales' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">No. de orden</label>
                        <input type="number" readOnly value={nuevoNumero} className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-center font-black text-slate-500 outline-none"/>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Sexo</label>
                        <select required value={sexo} onChange={(e) => setSexo(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500">
                          <option value="">Seleccione</option>
                          <option value="F">Femenino</option>
                          <option value="M">Masculino</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Nombres</label>
                        <input type="text" required value={nombres} onChange={(e) => setNombres(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Apellidos</label>
                        <input type="text" required value={apellidos} onChange={(e) => setApellidos(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Condicion inicial de inscripcion</label>
                      <select required value={condicionInicial} onChange={(e) => setCondicionInicial(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500">
                        <option value="">Seleccione una condicion</option>
                        {condicionInicialOpciones.map(opcion => <option key={opcion} value={opcion}>{opcion}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Fecha de nacimiento</label>
                        <input type="date" required value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Nacionalidad</label>
                        <input list="nacionalidades-estudiante" required value={nacionalidad} onChange={(e) => setNacionalidad(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                        <datalist id="nacionalidades-estudiante">
                          {nacionalidadOpciones.map(opcion => <option key={opcion} value={opcion} />)}
                        </datalist>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Direccion donde reside</label>
                      <textarea required value={direccionResidencia} onChange={(e) => setDireccionResidencia(e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Parentesco de la persona con quien vive</label>
                      <select required value={parentescoVive} onChange={(e) => setParentescoVive(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500">
                        <option value="">Seleccione</option>
                        {parentescoViveOpciones.map(opcion => <option key={opcion} value={opcion}>{opcion}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">ID SIGERD</label>
                        <input type="text" value={sigerdId} onChange={(e) => setSigerdId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Libro / folio</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={libro} onChange={(e) => setLibro(e.target.value)} placeholder="Libro" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                          <input type="text" value={folio} onChange={(e) => setFolio(e.target.value)} placeholder="Folio" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">Situacion de inscripcion</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Nuevo inscrito</label>
                          <input type="date" value={fechaNuevoInscrito} onChange={(e) => setFechaNuevoInscrito(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Retirado</label>
                          <input type="date" value={fechaRetiro} onChange={(e) => setFechaRetiro(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {pestanaFormulario === 'salud' && (
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">NEAE</label>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <input type="checkbox" checked={neae === 'Ninguna'} onChange={(e) => setNeae(e.target.checked ? 'Ninguna' : '')} className="h-4 w-4 rounded border-slate-300"/>
                          Ninguna
                        </label>
                      </div>
                      <textarea value={neae === 'Ninguna' ? '' : neae} disabled={neae === 'Ninguna'} onChange={(e) => setNeae(e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"/>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Enfermedades o condiciones alergicas</label>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <input type="checkbox" checked={enfermedadesAlergias === 'Ninguna'} onChange={(e) => setEnfermedadesAlergias(e.target.checked ? 'Ninguna' : '')} className="h-4 w-4 rounded border-slate-300"/>
                          Ninguna
                        </label>
                      </div>
                      <textarea value={enfermedadesAlergias === 'Ninguna' ? '' : enfermedadesAlergias} disabled={enfermedadesAlergias === 'Ninguna'} onChange={(e) => setEnfermedadesAlergias(e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"/>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Medicamentos que usa</label>
                      <input type="text" value={medicamentosUsa} onChange={(e) => setMedicamentosUsa(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Contacto de emergencia</label>
                      <input type="text" required value={emergenciaNombre} onChange={(e) => setEmergenciaNombre(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Telefono de emergencia</label>
                      <input type="tel" inputMode="numeric" maxLength={14} required value={emergenciaTelefono} onChange={(e) => setEmergenciaTelefono(formatearTelefono(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                    </div>
                  </div>
                )}

                {pestanaFormulario === 'responsable' && (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Nombre y apellido del responsable</label>
                      <input type="text" required value={responsableNombre} onChange={(e) => { setResponsableNombre(e.target.value); setTutor(e.target.value) }} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Parentesco</label>
                      <select required value={responsableParentesco} onChange={(e) => setResponsableParentesco(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500">
                        <option value="">Seleccione</option>
                        {responsableParentescoOpciones.map(opcion => <option key={opcion} value={opcion}>{opcion}</option>)}
                      </select>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Cedula o documento</label>
                        <button type="button" onClick={() => { setResponsableDocumentoExtranjero(!responsableDocumentoExtranjero); setResponsableCedula('') }} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-700">
                          {responsableDocumentoExtranjero ? 'Usar cedula' : 'Es extranjero / Pasaporte'}
                        </button>
                      </div>
                      <input type="text" required inputMode={responsableDocumentoExtranjero ? 'text' : 'numeric'} maxLength={responsableDocumentoExtranjero ? 30 : 13} value={responsableCedula} onChange={(e) => setResponsableCedula(responsableDocumentoExtranjero ? e.target.value.toUpperCase() : formatearCedula(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Telefono</label>
                      <input type="tel" inputMode="numeric" maxLength={14} required value={responsableTelefono} onChange={(e) => { const telefonoFormateado = formatearTelefono(e.target.value); setResponsableTelefono(telefonoFormateado); setTelefono(telefonoFormateado) }} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Profesion u oficio</label>
                      <input type="text" value={responsableProfesion} onChange={(e) => setResponsableProfesion(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500"/>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Nivel educativo alcanzado</label>
                      <select required value={responsableNivelEducativo} onChange={(e) => setResponsableNivelEducativo(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-blue-500">
                        <option value="">Seleccione</option>
                        {responsableNivelOpciones.map(opcion => <option key={opcion} value={opcion}>{opcion}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <button type="submit" className={`w-full text-white font-bold py-4 rounded-xl transition-all shadow-md mt-4 flex justify-center items-center gap-2 ${idEditando ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {idEditando ? 'Actualizar Alumno' : '+ Guardar Alumno'}
                </button>
              </form>
            </div>
          </div>

          {/* ========================================================
              TABLA (min-w-0 permite overflow-x-auto)
              ======================================================== */}
          <div className="xl:col-span-12 min-w-0">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden w-full">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 text-[11px] uppercase tracking-widest">
                      <th className="p-4 font-bold text-center w-12">No.</th>
                      <th className="p-4 font-bold">Apellidos, Nombres</th>
                      <th className="p-4 font-bold">SIGERD</th>
                      <th className="p-4 font-bold text-center">Sexo</th>
                      <th className="p-4 font-bold">Nacimiento</th>
                      <th className="p-4 font-bold text-center">Estado</th>
                      <th className="p-4 font-bold text-center w-[120px]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {estudiantes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                          No hay estudiantes registrados.<br/>
                          <span className="text-sm font-normal">Agrega uno o importa tu archivo CSV.</span>
                        </td>
                      </tr>
                    ) : (
                      estudiantes.map((est) => (
                        <tr key={est.id} className="hover:bg-slate-50/80 transition-colors text-sm group">
                          <td className="p-4 text-center font-bold text-slate-400">{est.numero_orden}</td>
                          <td className="p-4 font-bold text-slate-800 flex flex-col">
                            {est.nombre_completo}
                            <span className="text-[10px] text-slate-400 font-normal uppercase mt-0.5 truncate max-w-[200px]">Tutor: {est.responsable_principal?.nombre_completo || est.nombre_tutor || 'No registrado'}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-xs text-slate-600">{est.sigerd_id || '-'}</span>
                          </td>
                          <td className="p-4 text-center">
                            {est.sexo === 'M' ? (
                              <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold border border-blue-100" title="Masculino">M</span>
                            ) : est.sexo === 'F' ? (
                              <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg bg-pink-50 text-pink-600 font-bold border border-pink-100" title="Femenino">F</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-slate-700 font-medium">{est.fecha_nacimiento ? new Date(est.fecha_nacimiento).toLocaleDateString('es-DO', {timeZone: 'UTC'}) : '-'}</span>
                              <span className="text-[10px] text-slate-400 uppercase">{est.nacionalidad}</span>
                            </div>
                          </td>
                          
                          {/* COLUMNA DE ESTADO */}
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                              est.estado === 'Retirado' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            }`}>
                              {est.estado || 'Activo'}
                            </span>
                          </td>

                          {/* COLUMNA DE ACCIONES */}
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              
                              {/* EDITAR */}
                              <button onClick={() => cargarParaEditar(est)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              
                              {/* RETIRAR / REACTIVAR */}
                              <button 
                                onClick={() => cambiarEstadoEstudiante(est.id, est.nombre_completo, est.estado || 'Activo')} 
                                className={`p-2 rounded-lg transition-colors ${est.estado === 'Retirado' ? 'text-emerald-500 hover:bg-emerald-50' : 'text-orange-400 hover:text-orange-600 hover:bg-orange-50'}`} 
                                title={est.estado === 'Retirado' ? 'Reactivar Alumno' : 'Retirar Alumno'}
                              >
                                {est.estado === 'Retirado' ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                )}
                              </button>

                              {/* ELIMINAR */}
                              <button onClick={() => eliminarEstudiante(est.id, est.nombre_completo)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
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
      </div>
    </div>
  )
}

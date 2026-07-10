const plantillas = [
  {
    nombre: 'Estudiantes',
    descripcion: 'Alta y actualización de estudiantes por sección, con datos académicos, contacto, salud y responsable principal.',
    archivo: '/plantillas/plantilla_estudiantes.csv',
    columnas: 'numero_orden, nombres, apellidos, sexo, nacionalidad, fecha_nacimiento, sigerd_id, contacto, estado y datos del responsable.',
  },
  {
    nombre: 'Estudiantes Secundaria',
    descripcion: 'Alta y actualizacion de estudiantes del Nivel Secundario por seccion activa, con RNE, SIGERD, condicion y responsable principal.',
    archivo: '/plantillas/plantilla_estudiantes_secundaria.csv',
    columnas: 'numero_orden, nombres, apellidos, sexo, rne, sigerd_id, cedula_pasaporte, correo, tutor, condicion_inicial y resultado_final.',
  },
  {
    nombre: 'Calificaciones',
    descripcion: 'Matriz por período con una fila por estudiante y columnas por asignatura y competencia.',
    archivo: '/plantillas/plantilla_calificaciones.csv',
    columnas: 'numero_orden, sigerd_id, lengua_c1, lengua_c2, matematica_c1, sociales_c3, naturales_c1, etc.',
  },
  {
    nombre: 'Asistencia',
    descripcion: 'Matriz mensual con una fila por estudiante y una columna por fecha del mes activo.',
    archivo: '/plantillas/plantilla_asistencia.csv',
    columnas: 'numero_orden, fechas del mes abierto como columnas. Usa P, A, E o T; las celdas vacías se ignoran.',
  },
]

export default function Plantillas() {
  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <header className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recursos</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Plantillas CSV</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Formatos oficiales para importar información académica. Todos los archivos usan punto y coma como separador.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {plantillas.map((plantilla, index) => (
            <section key={plantilla.nombre} className="flex min-h-72 flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 font-mono text-xs font-semibold text-white">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h2 className="text-base font-semibold text-slate-950">{plantilla.nombre}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{plantilla.descripcion}</p>
              <p className="mt-4 rounded-md bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-600">
                {plantilla.columnas}
              </p>
              <a
                href={plantilla.archivo}
                download
                className="mt-auto inline-flex h-10 w-full items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Descargar CSV
              </a>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

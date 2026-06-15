const plantillas = [
  {
    nombre: 'Estudiantes',
    descripcion: 'Alta y actualizacion de estudiantes por seccion, ficha extendida y responsable principal. Usa SIGERD o numero de lista para actualizar sin duplicar.',
    archivo: '/plantillas/plantilla_estudiantes.csv',
    columnas: 'numero_orden, nombres, apellidos, sexo, nacionalidad, fecha_nacimiento, sigerd_id, tutor, estado, libro, folio, direccion, salud, emergencia y responsable.',
  },
  {
    nombre: 'Calificaciones',
    descripcion: 'Carga notas por estudiante, periodo y competencias. En grados con RP puede incluir c1_rp, c2_rp y c3_rp.',
    archivo: '/plantillas/plantilla_calificaciones.csv',
    columnas: 'numero_orden, sigerd_id, asignatura, periodo, c1, c1_rp, c2, c2_rp, c3 y c3_rp.',
  },
  {
    nombre: 'Asistencia',
    descripcion: 'Carga asistencia por fecha. Estados permitidos: P, A, E y T.',
    archivo: '/plantillas/plantilla_asistencia.csv',
    columnas: 'numero_orden, sigerd_id, fecha y estado.',
  },
]

export default function Plantillas() {
  return (
    <div className="h-full overflow-y-auto bg-slate-50/50">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight text-slate-800">Plantillas CSV</h1>
          <p className="mt-1 text-sm text-slate-500">
            Descarga los formatos oficiales para importar estudiantes, calificaciones y asistencia.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {plantillas.map(plantilla => (
            <section key={plantilla.nombre} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v11m0 0 4-4m-4 4-4-4M5 19h14" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-800">{plantilla.nombre}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{plantilla.descripcion}</p>
              <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500">
                {plantilla.columnas}
              </p>
              <a
                href={plantilla.archivo}
                download
                className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
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

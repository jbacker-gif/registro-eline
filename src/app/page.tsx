'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

const servicios = [
  {
    titulo: 'Impresiones y copias',
    descripcion: 'Material académico, documentos institucionales y trabajos listos para entregar con terminación profesional.',
  },
  {
    titulo: 'Encuadernación',
    descripcion: 'Presentación cuidada para tesis, monográficos, informes, manuales y documentos educativos.',
  },
  {
    titulo: 'Diagramación',
    descripcion: 'Organización visual de proyectos, portadas, reportes y materiales impresos o digitales.',
  },
  {
    titulo: 'Asesoría de proyectos',
    descripcion: 'Acompañamiento para estructurar ideas, objetivos, metodologías y entregables académicos.',
  },
  {
    titulo: 'Análisis de datos',
    descripcion: 'Apoyo en organización, revisión e interpretación de datos para proyectos e investigaciones.',
  },
  {
    titulo: 'Formato de tesis',
    descripcion: 'Adecuación de trabajos, tesis y monográficos según normas de presentación académica.',
  },
  {
    titulo: 'Corrección de plagio',
    descripcion: 'Revisión, orientación y mejora de textos para fortalecer la originalidad del contenido.',
  },
  {
    titulo: 'Registro Escolar Digital',
    descripcion: 'Panel docente para asistencia, calificaciones, boletines, plantillas y resumen académico.',
  },
]

const valores = [
  {
    titulo: 'Misión',
    texto: 'Ofrecer soluciones tecnológicas y profesionales que optimicen procesos educativos, académicos y administrativos.',
  },
  {
    titulo: 'Vision',
    texto: 'Ser referente nacional en servicios académicos y digitalización escolar con herramientas eficientes.',
  },
  {
    titulo: 'Valores',
    texto: 'Integridad, innovación, compromiso con la educación, confidencialidad y excelencia en el servicio.',
  },
]

const modulosRegistro = [
  'Asistencia',
  'Calificaciones',
  'Boletines',
  'Plantillas',
]

const funcionesRegistro = [
  'Registro de asistencia mensual',
  'Carga y resumen de calificaciones',
  'Generación de boletines',
  'Descarga de plantillas CSV',
]

const preguntas = [
  {
    pregunta: '¿Qué incluye el registro escolar digital?',
    respuesta: 'Un entorno para que los maestros gestionen asistencia, calificaciones, boletines, plantillas y reportes escolares.',
  },
  {
    pregunta: '¿Quiénes pueden acceder?',
    respuesta: 'Los docentes y usuarios autorizados por la institución mediante sus credenciales de acceso.',
  },
  {
    pregunta: '¿Cómo entra un maestro a la app?',
    respuesta: 'Desde el botón Acceso docente, el maestro abre el portal e inicia sesión con su correo y contraseña asignados.',
  },
  {
    pregunta: '¿Qué hago si olvidé mi contraseña?',
    respuesta: 'Debe contactar a ADSP o al responsable institucional para validar la cuenta y solicitar asistencia con el acceso.',
  },
  {
    pregunta: '¿La plataforma permite asistencia y calificaciones?',
    respuesta: 'Sí. Permite registrar asistencia, cargar calificaciones, consultar resúmenes y trabajar con plantillas descargables.',
  },
]

export default function HomeInstitucional() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [mostrarLogin, setMostrarLogin] = useState(false)
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje({ texto: 'Autenticando...', tipo: 'info' })

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setMensaje({ texto: 'Acceso concedido.', tipo: 'exito' })
      router.push('/dashboard')
    } catch {
      setMensaje({ texto: 'Credenciales incorrectas.', tipo: 'error' })
      setCargando(false)
    }
  }

  const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  const abrirWhatsApp = () => window.open('https://wa.me/18496297248', '_blank', 'noopener,noreferrer')

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#142037] selection:bg-[#efd9a8]">
      <nav className="fixed z-50 w-full border-b border-[#e3e5ea] bg-[#f6f7f9]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
          <button
            className="flex items-center gap-3"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Ir al inicio"
          >
            <Image
              src="/logo_adsp.png"
              alt="AD Soluciones Profesionales"
              width={142}
              height={44}
              className="h-11 w-auto object-contain"
              priority
            />
          </button>

          <div className="hidden gap-10 font-mono text-[12px] uppercase tracking-[0.14em] text-[#5b6472] md:flex">
            <button onClick={() => scrollToSection('nosotros')} className="transition-colors hover:text-[#142037]">Nosotros</button>
            <button onClick={() => scrollToSection('servicios')} className="transition-colors hover:text-[#142037]">Servicios</button>
            <button onClick={() => scrollToSection('registro')} className="transition-colors hover:text-[#142037]">Registro</button>
            <button onClick={() => scrollToSection('faq')} className="transition-colors hover:text-[#142037]">Preguntas</button>
          </div>

          <button
            onClick={() => setMostrarLogin(true)}
            className="border border-[#142037] px-5 py-2 font-mono text-[12px] uppercase tracking-[0.12em] transition-colors hover:bg-[#142037] hover:text-[#f6f7f9]"
          >
            Acceso docente
          </button>
        </div>
      </nav>

      <main>
        <section className="px-6 pb-24 pt-40 lg:pb-32 lg:pt-48">
          <div className="mx-auto grid max-w-6xl items-start gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-[#b8862e]" />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#5c4419]">
                  AD Soluciones Profesionales
                </span>
              </div>
              <h1 className="mb-7 max-w-xl font-serif text-[2.75rem] font-medium leading-[1.12] tracking-tight md:text-[3.4rem]">
                Servicios académicos y registro escolar, con el mismo estándar profesional.
              </h1>
              <p className="mb-10 max-w-md text-[15px] leading-relaxed text-[#5b6472]">
                ADSP acompaña a docentes, estudiantes e instituciones con soporte académico, producción de documentos y herramientas digitales para la gestión escolar.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <button
                  onClick={() => scrollToSection('servicios')}
                  className="bg-[#142037] px-7 py-3.5 text-[13px] font-medium text-[#f6f7f9] transition-colors hover:bg-[#26344f]"
                >
                  Ver servicios
                </button>
                <button
                  onClick={abrirWhatsApp}
                  className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[#5b6472] transition-colors hover:text-[#142037]"
                >
                  WhatsApp <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-3 -top-5 z-10 flex h-[88px] w-[88px] -rotate-[12deg] items-center justify-center rounded-full border border-[#b8862e] text-center text-[#5c4419]">
                <span className="font-mono text-[8px] uppercase leading-[1.3] tracking-[0.08em]">
                  Documento<br />verificado<br />ELINE
                </span>
              </div>

              <div className="border border-[#e3e5ea] bg-white">
                <div className="flex items-center justify-between border-b border-[#e3e5ea] px-6 py-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#5b6472]">Panel docente</p>
                    <p className="font-serif text-lg font-medium">Registro escolar digital</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#142037]">
                    <span className="font-mono text-[10px]">EL</span>
                  </span>
                </div>

                <div className="divide-y divide-[#e3e5ea]">
                  {modulosRegistro.map((item, index) => (
                    <div key={item} className="flex items-center justify-between px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-[#5b6472]">{String(index + 1).padStart(2, '0')}</span>
                        <span className="text-[13px]">{item}</span>
                      </div>
                      <span className="font-mono text-[11px] text-[#5c4419]">OK</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#e3e5ea] px-6 py-4">
                  <button
                    onClick={() => setMostrarLogin(true)}
                    className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[#5c4419] transition-colors hover:text-[#142037]"
                  >
                    Acceder al panel <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="nosotros" className="border-y border-[#e3e5ea] px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 max-w-2xl">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#5c4419]">Identidad institucional</p>
              <h2 className="font-serif text-3xl font-medium leading-snug md:text-[2.25rem]">
                ADSP combina atención profesional, soluciones académicas y herramientas digitales.
              </h2>
            </div>

            <div className="grid divide-y divide-[#e3e5ea] border-t border-[#e3e5ea] md:grid-cols-3 md:divide-x md:divide-y-0">
              {valores.map((valor) => (
                <div key={valor.titulo} className="px-0 py-8 first:pl-0 md:px-10 md:py-0">
                  <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-[#5c4419]">{valor.titulo}</p>
                  <p className="text-[14px] leading-relaxed text-[#5b6472]">{valor.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="servicios" className="px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#5c4419]">Servicios ADSP</p>
                <h2 className="font-serif text-3xl font-medium leading-snug md:text-[2.25rem]">
                  Soluciones para estudiantes, docentes e instituciones.
                </h2>
              </div>
              <p className="max-w-sm text-[14px] leading-relaxed text-[#5b6472]">
                Cada servicio se trabaja con enfoque profesional, presentación limpia y orientación práctica para tus entregas académicas.
              </p>
            </div>

            <div className="grid grid-cols-1 border-l border-t border-[#e3e5ea] sm:grid-cols-2 lg:grid-cols-4">
              {servicios.map((servicio, index) => (
                <article key={servicio.titulo} className="border-b border-r border-[#e3e5ea] px-6 py-7 transition-colors hover:bg-white">
                  <p className="mb-5 font-mono text-[11px] text-[#5b6472]">{String(index + 1).padStart(2, '0')}</p>
                  <h3 className="mb-2 font-serif text-[16px] font-medium">{servicio.titulo}</h3>
                  <p className="text-[13px] leading-relaxed text-[#5b6472]">{servicio.descripcion}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="registro" className="border-y border-[#e3e5ea] bg-white px-6 py-24">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#5c4419]">Aplicación destacada</p>
              <div className="mb-5 flex items-center gap-4">
                <Image src="/logo.png" alt="Logo del registro escolar" width={54} height={54} className="object-contain" />
                <h2 className="font-serif text-3xl font-medium leading-snug md:text-[2.25rem]">Panel para maestros</h2>
              </div>
              <p className="text-[15px] leading-relaxed text-[#5b6472]">
                Herramienta de ADSP para registrar datos escolares, consultar información por sección y mantener organizado el proceso académico.
              </p>
            </div>

            <div className="divide-y divide-[#e3e5ea] border border-[#e3e5ea]">
              {funcionesRegistro.map((item, index) => (
                <div key={item} className="flex items-center gap-4 px-6 py-4">
                  <span className="font-mono text-[10px] text-[#5b6472]">{String(index + 1).padStart(2, '0')}</span>
                  <span className="text-[14px]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="px-6 py-24">
          <div className="mx-auto max-w-3xl">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#5c4419]">Preguntas frecuentes</p>
            <h2 className="mb-12 font-serif text-3xl font-medium leading-snug md:text-[2.25rem]">
              Dudas comunes sobre el acceso docente
            </h2>
            <div className="divide-y divide-[#e3e5ea] border-y border-[#e3e5ea]">
              {preguntas.map((item) => (
                <details key={item.pregunta} className="group px-1 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-[14px] font-medium">
                    {item.pregunta}
                    <span className="font-mono text-[12px] text-[#5b6472] transition-transform group-open:rotate-180">⌄</span>
                  </summary>
                  <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-[#5b6472]">{item.respuesta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#142037] text-[#f6f7f9]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 px-6 py-16 md:flex-row md:items-end">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30">
              <span className="font-mono text-[11px]">AD</span>
            </span>
            <span className="font-mono text-[13px] uppercase tracking-[0.18em]">ADSP</span>
          </div>
          <div className="text-left md:text-right">
            <p className="mb-2 font-mono text-[12px] text-white/70">WhatsApp (849) 629-7248 · @adsp_rd</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">Desarrollado por AD Soluciones Profesionales</p>
            <p className="mt-1 font-mono text-[10px] text-white/30">
              &copy; {new Date().getFullYear()} ADSP S.R.L. Santo Domingo, República Dominicana.
            </p>
          </div>
        </div>
      </footer>

      {mostrarLogin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#142037]/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Acceso docente">
          <div className="w-full max-w-md border border-[#e3e5ea] bg-white">
            <div className="flex items-start justify-between gap-4 border-b border-[#e3e5ea] px-7 pb-6 pt-7">
              <div>
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#142037]">
                  <span className="font-mono text-[10px]">EL</span>
                </span>
                <h2 className="font-serif text-xl font-medium">Acceso docente</h2>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#5b6472]">Registro escolar digital</p>
              </div>
              <button
                onClick={() => setMostrarLogin(false)}
                className="font-mono text-lg text-[#5b6472] transition-colors hover:text-[#142037]"
                aria-label="Cerrar acceso docente"
              >
                ×
              </button>
            </div>

            <form className="space-y-5 px-7 py-7" onSubmit={manejarLogin}>
              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#5b6472]">Email institucional</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#e3e5ea] bg-transparent px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#142037]"
                  placeholder="usuario@adsp.com.do"
                  disabled={cargando}
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#5b6472]">Contraseña</label>
                <div className="relative">
                  <input
                    type={verPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-[#e3e5ea] bg-transparent px-4 py-3 pr-20 text-[14px] outline-none transition-colors focus:border-[#142037]"
                    placeholder="********"
                    disabled={cargando}
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword(!verPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#5b6472] hover:text-[#142037]"
                  >
                    {verPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              {mensaje.texto && (
                <div className={`border px-4 py-3 text-[12px] font-medium ${
                  mensaje.tipo === 'error'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}>
                  {mensaje.texto}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-[#142037] py-3.5 font-mono text-[12px] uppercase tracking-[0.14em] text-[#f6f7f9] transition-colors hover:bg-[#26344f] disabled:cursor-not-allowed disabled:bg-[#5b6472]"
              >
                {cargando ? 'Cargando...' : 'Entrar al registro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

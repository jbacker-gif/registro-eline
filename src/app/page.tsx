'use client'

import { useState } from 'react'
import Image from 'next/image'
import CatalogoServicios from '../components/CatalogoServicios'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

const gruposServicios = [
  {
    id: 'academicos',
    titulo: 'Servicios académicos',
    descripcion: 'Apoyo para estudiantes, tesistas y maestrantes en la preparación de sus trabajos.',
    servicios: ['Formato académico', 'Corrección de estilo', 'Revisión de originalidad y citación', 'Asesoría metodológica', 'Análisis de datos'],
    accion: 'Cotizar apoyo académico',
  },
  {
    id: 'impresion',
    titulo: 'Impresión y terminación',
    descripcion: 'Impresión y acabados para trabajos académicos, materiales educativos y documentos.',
    servicios: ['Impresión y copias', 'Encuadernación y empastado', 'Diagramación', 'Escaneo y digitalización'],
    accion: 'Cotizar impresión o terminación',
  },
  {
    id: 'instituciones',
    titulo: 'Para instituciones',
    descripcion: 'Atención a centros educativos, organizaciones y empresas según su volumen y necesidades.',
    servicios: ['Impresión por volumen', 'Materiales institucionales', 'Evaluación de soluciones digitales'],
    accion: 'Solicitar una reunión',
  },
]

const enlaceWhatsApp = (consulta: string) =>
  `https://wa.me/18496297248?text=${encodeURIComponent(`Hola ADSP, ${consulta}`)}`

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

const canalesContacto = [
  {
    titulo: 'WhatsApp',
    valor: '(849) 629-7248',
    href: 'https://wa.me/18496297248',
  },
  {
    titulo: 'Correo electrónico',
    valor: 'info@adsp.com.do',
    href: 'mailto:info@adsp.com.do',
  },
  {
    titulo: 'Dirección',
    valor: 'Dr. Dolores Alfonseca, #5, Distrito Nacional, Ciudad Universitaria',
    href: null,
  },
  {
    titulo: 'Redes sociales',
    valor: '@adsp_rd',
    href: 'https://www.instagram.com/adsp_rd',
  },
]

const serviciosContacto = [
  ...gruposServicios.flatMap(({ servicios }) => servicios),
  'ELINE Registro Escolar',
  'Otro servicio',
]

export default function HomeInstitucional() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailRecuperacion, setEmailRecuperacion] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [mostrarLogin, setMostrarLogin] = useState(false)
  const [mostrarMenuMovil, setMostrarMenuMovil] = useState(false)
  const [modoAcceso, setModoAcceso] = useState<'login' | 'recuperacion'>('login')
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })
  const [contacto, setContacto] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    servicio: serviciosContacto[0],
    detalle: '',
  })

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

  const manejarRecuperacion = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje({ texto: 'Enviando enlace de recuperación...', tipo: 'info' })

    try {
      const redirectTo = `${window.location.origin}/recuperar-contrasena`
      const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperacion, { redirectTo })
      if (error) throw error
      setMensaje({
        texto: 'Si el correo pertenece a una cuenta activa, recibirá un enlace para crear una nueva contraseña.',
        tipo: 'exito',
      })
    } catch (error) {
      const authError = error as {
        message?: string
        name?: string
        status?: number
        code?: string
        cause?: { message?: string }
      }
      const detalle = authError.message || String(error || '')
      const detalleNormalizado = detalle.toLowerCase()
      const diagnostico = [
        authError.name ? `tipo: ${authError.name}` : null,
        typeof authError.status === 'number' ? `status: ${authError.status}` : null,
        authError.code ? `codigo: ${authError.code}` : null,
        authError.cause?.message ? `causa: ${authError.cause.message}` : null,
      ].filter(Boolean).join(' | ')

      if (authError.status === 0 || detalle === '0') {
        setMensaje({
          texto: 'Error de conexión con Supabase Auth. Revisa que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY estén configuradas en Vercel para esta rama y vuelve a desplegar.',
          tipo: 'error',
        })
      } else if (detalleNormalizado.includes('not authorized')) {
        setMensaje({
          texto: 'Supabase gratis solo envía correos a miembros del equipo del proyecto. Agrega ese correo al equipo o configura SMTP propio.',
          tipo: 'error',
        })
      } else if (detalleNormalizado.includes('rate limit')) {
        setMensaje({
          texto: 'Se alcanzó el límite de correos de Supabase gratis. Espera una hora o configura SMTP propio.',
          tipo: 'error',
        })
      } else if (detalleNormalizado.includes('redirect')) {
        setMensaje({
          texto: 'La URL de recuperación no está autorizada en Supabase. Agrégala en Authentication > URL Configuration > Redirect URLs.',
          tipo: 'error',
        })
      } else {
        setMensaje({
          texto: diagnostico
            ? `${detalle || 'No pudimos enviar el enlace.'} (${diagnostico})`
            : detalle || 'No pudimos enviar el enlace. Revisa la configuración de correo en Supabase Auth.',
          tipo: 'error',
        })
      }

      console.error('Error enviando recuperación de contraseña:', error)
    } finally {
      setCargando(false)
    }
  }

  const abrirLogin = () => {
    setMostrarMenuMovil(false)
    setModoAcceso('login')
    setMensaje({ texto: '', tipo: '' })
    setMostrarLogin(true)
  }

  const abrirRecuperacion = () => {
    setModoAcceso('recuperacion')
    setEmailRecuperacion(email)
    setPassword('')
    setMensaje({ texto: '', tipo: '' })
  }

  const scrollToSection = (id: string) => {
    setMostrarMenuMovil(false)
    const section = document.getElementById(id)
    if (!section) return

    const navOffset = window.innerWidth >= 768 ? 96 : 80
    const top = section.getBoundingClientRect().top + window.scrollY - navOffset
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const manejarContacto = (e: React.FormEvent) => {
    e.preventDefault()

    const texto = [
      'Hola ADSP, deseo solicitar información.',
      `Nombre: ${contacto.nombre}`,
      `Correo: ${contacto.correo}`,
      `Teléfono: ${contacto.telefono || 'No indicado'}`,
      `Servicio: ${contacto.servicio}`,
      `Detalle: ${contacto.detalle}`,
    ].join('\n')

    window.open(`https://wa.me/18496297248?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#142037] selection:bg-[#efd9a8]">
      <nav className="fixed z-50 w-full border-b border-[#e3e5ea] bg-[#f6f7f9]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 md:h-24 md:px-6">
          <button
            className="flex items-center gap-3"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Ir al inicio"
          >
            <Image
              src="/logo_adsp.png"
              alt="AD Soluciones Profesionales"
              width={387}
              height={120}
              className="h-12 w-32 object-contain md:h-16 md:w-auto"
              priority
            />
          </button>

          <div className="hidden gap-5 text-sm font-semibold text-[#5b6472] lg:flex">
            <button onClick={() => scrollToSection('nosotros')} className="transition-colors hover:text-[#142037]">Nosotros</button>
            <button onClick={() => scrollToSection('servicios')} className="transition-colors hover:text-[#142037]">Servicios</button>
            <button onClick={() => scrollToSection('catalogo')} className="transition-colors hover:text-[#142037]">Precios</button>
            <button onClick={() => scrollToSection('registro')} className="transition-colors hover:text-[#142037]">Eline</button>
            <button onClick={() => scrollToSection('faq')} className="transition-colors hover:text-[#142037]">Preguntas Frecuentes</button>
            <button onClick={() => scrollToSection('contacto')} className="transition-colors hover:text-[#142037]">Contacto</button>
          </div>

          <div className="flex items-center gap-2 md:block">
            <button
              type="button"
              onClick={() => setMostrarMenuMovil((abierto) => !abierto)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 border border-[#142037] lg:hidden"
              aria-label={mostrarMenuMovil ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mostrarMenuMovil}
              aria-controls="menu-movil"
            >
              <span className="h-px w-[18px] bg-[#142037]" />
              <span className="h-px w-[18px] bg-[#142037]" />
              <span className="h-px w-[18px] bg-[#142037]" />
            </button>

            <button
              onClick={abrirLogin}
              className="border border-[#142037] px-3 py-2.5 font-mono text-[11px] font-medium uppercase transition-colors hover:bg-[#142037] hover:text-[#f6f7f9] sm:px-4 sm:text-[12px] md:px-6 md:py-3 md:text-[14px]"
            >
              Entrar a ELINE
            </button>
          </div>
        </div>

        {mostrarMenuMovil && (
          <div id="menu-movil" className="border-t border-[#e3e5ea] bg-[#f6f7f9] px-5 py-5 shadow-[0_14px_28px_rgba(20,32,55,0.12)] lg:hidden">
            <div className="mx-auto grid max-w-6xl gap-px bg-[#d7dbe2] font-mono text-[13px] font-medium uppercase text-[#142037]">
              <button onClick={() => scrollToSection('nosotros')} className="bg-[#f6f7f9] px-4 py-3.5 text-left">Nosotros</button>
              <button onClick={() => scrollToSection('servicios')} className="bg-[#f6f7f9] px-4 py-3.5 text-left">Servicios</button>
              <button onClick={() => scrollToSection('registro')} className="bg-[#f6f7f9] px-4 py-3.5 text-left">Eline</button>
              <button onClick={() => scrollToSection('faq')} className="bg-[#f6f7f9] px-4 py-3.5 text-left">Preguntas frecuentes</button>
              <button onClick={() => scrollToSection('contacto')} className="bg-[#f6f7f9] px-4 py-3.5 text-left">Contacto</button>
              <button onClick={() => scrollToSection('catalogo')} className="bg-[#ffc107] px-4 py-3.5 text-left">Catálogo y precios</button>
            </div>
          </div>
        )}
      </nav>

      <main>
        <section className="bg-[#101b31] px-5 pb-16 pt-32 text-white sm:px-6 md:pb-20 md:pt-40">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.45fr_1fr] lg:gap-16">
            <div>
              <h1 className="max-w-2xl font-serif text-4xl leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
                Servicios académicos, impresión y tecnología escolar
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-200 md:text-lg">
                ADSP apoya a estudiantes, docentes e instituciones con sus trabajos académicos, documentos impresos y registros escolares.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => scrollToSection('servicios')} className="rounded-lg bg-[#ffc107] px-5 py-3.5 font-bold text-[#142037] hover:bg-[#ffd04a]">Explorar servicios</button>
                <button onClick={() => scrollToSection('catalogo')} className="rounded-lg border border-white/50 px-5 py-3.5 font-semibold hover:bg-white/10">Ver precios</button>
              </div>
            </div>
            <div className="divide-y divide-white/15 rounded-2xl border border-white/20 bg-white/5 px-5 sm:px-6">
              {gruposServicios.map(({ id, titulo }) => (
                <button key={id} onClick={() => scrollToSection(id)} className="flex w-full items-center justify-between gap-4 py-4 text-left font-semibold hover:text-[#ffc107]">
                  {titulo}<span aria-hidden="true">↗</span>
                </button>
              ))}
              <button onClick={() => scrollToSection('registro')} className="flex w-full items-center justify-between gap-4 py-4 text-left font-semibold hover:text-[#ffc107]">
                ELINE · Registro escolar digital<span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
        </section>

        <section id="servicios" className="bg-white px-5 py-16 sm:px-6 md:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-serif text-4xl tracking-tight text-[#142037] md:text-5xl">Servicios de ADSP</h2>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {gruposServicios.map(({ id, titulo, descripcion, servicios, accion }) => (
                <article id={id} key={id} className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="font-serif text-2xl text-[#142037]">{titulo}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{descripcion}</p>
                  <ul className="my-5 space-y-2 text-sm font-medium text-slate-800">
                    {servicios.map((servicio) => <li key={servicio} className="flex gap-2"><span aria-hidden="true" className="text-amber-700">•</span>{servicio}</li>)}
                  </ul>
                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                    <a href={enlaceWhatsApp(id === 'instituciones' ? 'quisiera coordinar una reunión para mi institución.' : `quisiera consultar por ${titulo.toLowerCase()}.`)} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#142037] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#263a5a]">{accion}</a>
                    {id === 'impresion' && <button onClick={() => scrollToSection('catalogo')} className="px-2 py-2.5 text-sm font-semibold text-[#142037] underline underline-offset-4">Ver precios</button>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <CatalogoServicios />

        <section id="registro" className="bg-[#101b31] px-6 py-24 text-white">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#ffc107]">Aplicación de ADSP</p>
              <div className="mb-5 flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white">
                  <Image src="/logo.png" alt="Logo del registro escolar" width={54} height={54} className="object-contain" />
                </span>
                <h2 className="font-serif text-3xl font-medium leading-snug md:text-[2.25rem]">ELINE Registro Escolar</h2>
              </div>
              <p className="max-w-md text-[15px] leading-relaxed text-white/72">
                Nuestra aplicación para docentes reúne asistencia, calificaciones y boletines en un registro escolar digital.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button onClick={abrirLogin} className="rounded-lg bg-white px-4 py-2.5 font-bold text-[#142037] hover:bg-slate-100">Entrar a ELINE</button>
                <a href={enlaceWhatsApp("quisiera solicitar una demostración de ELINE.")} target="_blank" rel="noopener noreferrer" className="py-2.5 font-semibold underline underline-offset-4">Solicitar demostración</a>
              </div>
            </div>

            <div className="grid gap-3">
              {funcionesRegistro.map((item, index) => (
                <div key={item} className="flex items-center gap-4 border border-white/12 bg-white px-6 py-4 text-[#142037] shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
                  <span className="font-mono text-[10px] text-[#5c4419]">{String(index + 1).padStart(2, '0')}</span>
                  <span className="text-[14px] font-semibold">{item}</span>
                </div>
              ))}
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

        <section id="faq" className="border-y border-[#dfe6ec] bg-[#f4f8fb] px-6 py-24">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div className="lg:sticky lg:top-40">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#007f99]">Preguntas frecuentes</p>
              <h2 className="mb-5 font-serif text-3xl font-medium leading-snug text-[#142037] md:text-[2.25rem]">
                Respuestas claras antes de solicitar un servicio.
              </h2>
              <p className="max-w-md text-[15px] leading-relaxed text-[#5b6472]">
                Reunimos las dudas más comunes sobre el acceso docente, los servicios académicos y el acompañamiento de ADSP para que puedas avanzar con confianza.
              </p>
              <div className="mt-8 border-l-2 border-[#00a8cc] bg-white px-5 py-4 shadow-[0_18px_45px_rgba(20,32,55,0.08)]">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#007f99]">Soporte directo</p>
                <p className="mt-2 text-[14px] leading-relaxed text-[#142037]">
                  Si tu caso necesita revisión personalizada, puedes escribirnos desde el formulario de contacto.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {preguntas.map((item, index) => (
                <details key={item.pregunta} className="group border border-[#dfe6ec] bg-white shadow-[0_18px_45px_rgba(20,32,55,0.07)] transition-colors open:border-[#00a8cc]">
                  <summary className="grid cursor-pointer list-none grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-5 text-left">
                    <span className="font-mono text-[11px] font-semibold text-[#007f99]">{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-[15px] font-semibold leading-snug text-[#142037]">{item.pregunta}</span>
                    <span className="flex h-8 w-8 items-center justify-center border border-[#dfe6ec] font-mono text-[18px] leading-none text-[#007f99] transition-colors group-open:border-[#00a8cc] group-open:bg-[#00a8cc] group-open:text-white">
                      <span className="group-open:hidden">+</span>
                      <span className="hidden group-open:block">-</span>
                    </span>
                  </summary>
                  <div className="px-5 pb-6 pl-[4.25rem]">
                    <p className="max-w-2xl border-t border-[#eef2f5] pt-4 text-[14px] leading-relaxed text-[#5b6472]">{item.respuesta}</p>
                  </div>
                </details>
              ))}

              <div className="mt-2 flex flex-col justify-between gap-4 border border-[#c8e9ef] bg-[#e8f8fb] px-5 py-5 sm:flex-row sm:items-center">
                <p className="text-[14px] font-medium text-[#142037]">¿Tienes otra pregunta o necesitas cotizar un servicio?</p>
                <button
                  onClick={() => scrollToSection('contacto')}
                  className="border border-[#142037] px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#142037] transition-colors hover:bg-[#142037] hover:text-white"
                >
                  Ir a contacto
                </button>
              </div>
            </div>
          </div>
        </section>
        <section id="contacto" className="border-t border-[#e3e5ea] bg-white px-6 py-24">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#5c4419]">Contacto y solicitudes</p>
              <h2 className="mb-5 font-serif text-3xl font-medium leading-snug md:text-[2.25rem]">
                Hablemos de tu proyecto académico, institucional o escolar.
              </h2>
              <p className="mb-10 max-w-md text-[15px] leading-relaxed text-[#5b6472]">
                Escríbenos para cotizar servicios, solicitar orientación, coordinar trabajos académicos o recibir asistencia sobre ELINE Registro Escolar.
              </p>

              <div className="grid border-l border-t border-[#e3e5ea] sm:grid-cols-2">
                {canalesContacto.map((canal) => (
                  <div key={canal.titulo} className="border-b border-r border-[#e3e5ea] p-5">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#5c4419]">{canal.titulo}</p>
                    {canal.href ? (
                      <a href={canal.href} target="_blank" rel="noreferrer" className="text-[14px] font-semibold text-[#142037] underline-offset-4 hover:underline">
                        {canal.valor}
                      </a>
                    ) : (
                      <p className="text-[14px] font-semibold text-[#142037]">{canal.valor}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={manejarContacto} className="border border-[#e3e5ea] bg-[#f6f7f9] p-6 md:p-8">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#5b6472]">Nombre</label>
                  <input
                    required
                    value={contacto.nombre}
                    onChange={(e) => setContacto({ ...contacto, nombre: e.target.value })}
                    className="w-full border border-[#e3e5ea] bg-white px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#142037]"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#5b6472]">Teléfono</label>
                  <input
                    value={contacto.telefono}
                    onChange={(e) => setContacto({ ...contacto, telefono: e.target.value })}
                    className="w-full border border-[#e3e5ea] bg-white px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#142037]"
                    placeholder="809 / 829 / 849"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#5b6472]">Correo</label>
                  <input
                    type="email"
                    required
                    value={contacto.correo}
                    onChange={(e) => setContacto({ ...contacto, correo: e.target.value })}
                    className="w-full border border-[#e3e5ea] bg-white px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#142037]"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#5b6472]">Servicio</label>
                  <select
                    value={contacto.servicio}
                    onChange={(e) => setContacto({ ...contacto, servicio: e.target.value })}
                    className="w-full border border-[#e3e5ea] bg-white px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#142037]"
                  >
                    {serviciosContacto.map((servicio) => (
                      <option key={servicio} value={servicio}>{servicio}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#5b6472]">Mensaje</label>
                <textarea
                  required
                  rows={5}
                  value={contacto.detalle}
                  onChange={(e) => setContacto({ ...contacto, detalle: e.target.value })}
                  className="w-full resize-none border border-[#e3e5ea] bg-white px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#142037]"
                  placeholder="Cuéntanos qué necesitas, fecha estimada, cantidad de documentos o tipo de asistencia."
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="bg-[#142037] px-7 py-3.5 font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#26344f]"
                >
                  Enviar por WhatsApp
                </button>
                <a
                  href="mailto:info@adsp.com.do"
                  className="border border-[#142037] px-7 py-3.5 text-center font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-[#142037] transition-colors hover:bg-white"
                >
                  Escribir por correo
                </a>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="bg-[#142037] text-[#f6f7f9]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 px-6 py-16 md:flex-row md:items-end">
          <div className="flex items-center gap-3">
            <Image
              src="/logo_footer_gris.png"
              alt="AD Soluciones Profesionales"
              width={320}
              height={160}
              className="h-20 w-auto object-contain"
            />
          </div>
          <div className="text-left md:text-right">
            <p className="mb-2 font-mono text-[12px] text-white/70">Tel/WhatsApp (849) 629-7248 · info@adsp.com.do · @adsp_rd</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">Desarrollado por AD Soluciones Profesionales</p>
            <p className="mt-1 font-mono text-[10px] text-white/30">
              &copy; {new Date().getFullYear()} ADSP S.R.L. Dr. Dolores Alfonseca, #5, Distrito Nacional, Ciudad Universitaria.
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
                <h2 className="font-serif text-xl font-medium">
                  {modoAcceso === 'login' ? 'Acceso docente' : 'Recuperar contraseña'}
                </h2>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#5b6472]">
                  {modoAcceso === 'login' ? 'Registro escolar digital' : 'Enlace seguro por correo'}
                </p>
              </div>
              <button
                onClick={() => {
                  setMostrarLogin(false)
                  setModoAcceso('login')
                  setMensaje({ texto: '', tipo: '' })
                }}
                className="font-mono text-lg text-[#5b6472] transition-colors hover:text-[#142037]"
                aria-label="Cerrar acceso docente"
              >
                ×
              </button>
            </div>

            {modoAcceso === 'login' ? (
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

              <button
                type="button"
                onClick={abrirRecuperacion}
                className="w-full text-center font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b6472] underline-offset-4 transition-colors hover:text-[#142037] hover:underline"
              >
                Olvidé mi contraseña
              </button>
            </form>
            ) : (
            <form className="space-y-5 px-7 py-7" onSubmit={manejarRecuperacion}>
              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#5b6472]">Email institucional</label>
                <input
                  type="email"
                  required
                  value={emailRecuperacion}
                  onChange={(e) => setEmailRecuperacion(e.target.value)}
                  className="w-full border border-[#e3e5ea] bg-transparent px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#142037]"
                  placeholder="usuario@adsp.com.do"
                  disabled={cargando}
                />
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
                {cargando ? 'Enviando...' : 'Enviar enlace'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setModoAcceso('login')
                  setMensaje({ texto: '', tipo: '' })
                }}
                className="w-full text-center font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b6472] underline-offset-4 transition-colors hover:text-[#142037] hover:underline"
              >
                Volver al acceso
              </button>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

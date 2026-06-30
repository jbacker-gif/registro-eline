'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const servicios = [
  { titulo: 'Impresiones y copias', descripcion: 'Material académico, documentos institucionales y trabajos listos para entregar con terminación profesional.', icono: '🖨️', tono: 'from-blue-50 to-sky-100 text-blue-700' },
  { titulo: 'Encuadernación', descripcion: 'Presentación cuidada para tesis, monográficos, informes, manuales y documentos educativos.', icono: '📚', tono: 'from-amber-50 to-orange-100 text-amber-700' },
  { titulo: 'Diagramación', descripcion: 'Organización visual de proyectos, portadas, reportes y materiales impresos o digitales.', icono: '🎨', tono: 'from-indigo-50 to-violet-100 text-indigo-700' },
  { titulo: 'Asesoría de proyectos', descripcion: 'Acompañamiento para estructurar ideas, objetivos, metodologías y entregables académicos.', icono: '🧭', tono: 'from-emerald-50 to-teal-100 text-emerald-700' },
  { titulo: 'Análisis de datos', descripcion: 'Apoyo en organización, revisión e interpretación de datos para proyectos e investigaciones.', icono: '📊', tono: 'from-cyan-50 to-blue-100 text-cyan-700' },
  { titulo: 'Formato de tesis', descripcion: 'Adecuación de trabajos, tesis y monográficos según normas de presentación académica.', icono: '🎓', tono: 'from-slate-100 to-slate-200 text-slate-700' },
  { titulo: 'Corrección de plagio', descripcion: 'Revisión, orientación y mejora de textos para fortalecer la originalidad del contenido.', icono: '✅', tono: 'from-rose-50 to-red-100 text-rose-700' },
  { titulo: 'Registro Escolar Digital', descripcion: 'Panel docente para asistencia, calificaciones, boletines, plantillas y resumen académico.', icono: '💻', tono: 'from-blue-600 to-slate-900 text-white' },
]

const preguntas = [
  { pregunta: '¿Qué incluye el registro escolar digital?', respuesta: 'Un entorno para que los maestros gestionen asistencia, calificaciones, boletines, plantillas y reportes escolares.' },
  { pregunta: '¿Quiénes pueden acceder?', respuesta: 'Los docentes y usuarios autorizados por la institución mediante sus credenciales de acceso.' },
  { pregunta: '¿Cómo entra un maestro a la app?', respuesta: 'Desde el botón “Acceso docente”, el maestro abre el portal e inicia sesión con su correo y contraseña asignados.' },
  { pregunta: '¿Qué hago si olvidé mi contraseña?', respuesta: 'Debe contactar a ADSP o al responsable institucional para validar la cuenta y solicitar asistencia con el acceso.' },
  { pregunta: '¿La plataforma permite asistencia y calificaciones?', respuesta: 'Sí. Permite registrar asistencia, cargar calificaciones, consultar resúmenes y trabajar con plantillas descargables.' },
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
      setMensaje({ texto: '¡Acceso concedido!', tipo: 'exito' })
      router.push('/dashboard')
    } catch {
      setMensaje({ texto: 'Credenciales incorrectas.', tipo: 'error' })
      setCargando(false)
    }
  }

  const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  const abrirWhatsApp = () => window.open('https://wa.me/18496297248', '_blank', 'noopener,noreferrer')

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">
      <nav className="fixed z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <button className="flex items-center" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Ir al inicio">
            <Image src="/logo_adsp.png" alt="ADSP Logo" width={160} height={50} className="object-contain" priority />
          </button>
          <div className="hidden gap-8 text-sm font-bold uppercase tracking-wider text-slate-500 md:flex">
            <button onClick={() => scrollToSection('nosotros')} className="transition-colors hover:text-blue-600">Nosotros</button>
            <button onClick={() => scrollToSection('servicios')} className="transition-colors hover:text-blue-600">Servicios</button>
            <button onClick={() => scrollToSection('eline')} className="transition-colors hover:text-blue-600">Registro</button>
            <button onClick={() => scrollToSection('faq')} className="transition-colors hover:text-blue-600">Preguntas</button>
          </div>
          <button onClick={() => setMostrarLogin(true)} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95">Acceso docente</button>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-white px-6 pb-20 pt-32 lg:pb-28 lg:pt-44">
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-br from-blue-50 via-white to-amber-50" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
            <span className="mb-4 inline-flex rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-blue-600 shadow-sm">AD Soluciones Profesionales</span>
            <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">Servicios académicos y tecnología escolar en un solo lugar.</h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-slate-600 lg:mx-0">ADSP acompaña a docentes, estudiantes e instituciones con soluciones profesionales, soporte académico y herramientas digitales para la gestión escolar.</p>
            <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
              <button onClick={() => scrollToSection('servicios')} className="rounded-2xl bg-slate-950 px-8 py-4 font-bold text-white shadow-xl transition hover:bg-slate-800">Ver servicios</button>
              <button onClick={() => setMostrarLogin(true)} className="rounded-2xl border border-blue-200 bg-blue-50 px-8 py-4 font-bold text-blue-700 transition hover:bg-blue-100">Acceso docente</button>
              <button onClick={abrirWhatsApp} className="rounded-2xl border border-emerald-200 bg-white px-8 py-4 font-bold text-emerald-700 transition hover:bg-emerald-50">WhatsApp</button>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-8 text-white">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white"><Image src="/logo.png" alt="Logo del registro escolar" width={52} height={52} className="object-contain" /></div>
                <div><p className="text-xs font-black uppercase tracking-[0.25em] text-blue-200">App destacada</p><h2 className="text-2xl font-black">Registro Escolar Digital</h2></div>
              </div>
              <p className="mb-8 text-blue-50/90">Panel docente para gestionar la información escolar con rapidez, orden y una experiencia simple.</p>
              <div className="grid grid-cols-2 gap-3 text-sm font-semibold">{['Asistencia', 'Calificaciones', 'Boletines', 'Plantillas'].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">{item}</div>)}</div>
              <button onClick={() => setMostrarLogin(true)} className="mt-8 w-full rounded-2xl bg-white px-6 py-4 font-black text-blue-700 transition hover:bg-blue-50">Acceso docente</button>
            </div>
          </div>
        </div>
      </section>

      <section id="nosotros" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-14 max-w-3xl"><span className="mb-3 block text-xs font-black uppercase tracking-[0.3em] text-blue-600">Identidad institucional</span><h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">ADSP combina atención profesional, soluciones académicas y herramientas digitales.</h2></div>
        <div className="grid gap-6 md:grid-cols-3">{[['🎯', 'Misión', 'Ofrecer soluciones tecnológicas y profesionales que optimicen procesos educativos, académicos y administrativos.'], ['👁️', 'Visión', 'Ser referente nacional en servicios académicos y digitalización escolar con herramientas eficientes.'], ['⭐', 'Valores', 'Integridad, innovación, compromiso con la educación, confidencialidad y excelencia en el servicio.']].map(([icono, titulo, texto]) => <div key={titulo} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-xl"><div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">{icono}</div><h3 className="mb-3 text-xl font-bold text-slate-900">{titulo}</h3><p className="text-sm font-medium leading-relaxed text-slate-500">{texto}</p></div>)}</div>
      </section>

      <section id="servicios" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl"><div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><span className="mb-3 block text-xs font-black uppercase tracking-[0.3em] text-blue-600">Servicios ADSP</span><h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Soluciones para estudiantes, docentes e instituciones.</h2></div><p className="max-w-xl text-sm font-medium leading-relaxed text-slate-500">Cada servicio se trabaja con enfoque profesional, presentación limpia y orientación práctica para apoyar tus entregas académicas y procesos escolares.</p></div><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">{servicios.map((servicio) => <article key={servicio.titulo} className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className={`flex h-36 items-center justify-center bg-gradient-to-br ${servicio.tono}`}><span className="text-5xl transition group-hover:scale-110">{servicio.icono}</span></div><div className="p-6"><h3 className="mb-3 text-lg font-black text-slate-900">{servicio.titulo}</h3><p className="text-sm font-medium leading-relaxed text-slate-500">{servicio.descripcion}</p></div></article>)}</div></div>
      </section>

      <section id="eline" className="px-6 py-20"><div className="mx-auto grid max-w-7xl gap-10 rounded-[2.5rem] bg-slate-950 p-8 text-white md:p-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"><div><Image src="/logo.png" alt="Logo del registro escolar" width={92} height={92} className="mb-6 rounded-2xl bg-white p-2" /><h2 className="mb-4 text-3xl font-black tracking-tight md:text-4xl">Panel para maestros</h2><p className="mb-8 leading-relaxed text-slate-300">Acceso rápido para registrar datos escolares, consultar información por sección y mantener organizado el proceso académico.</p><button onClick={() => setMostrarLogin(true)} className="rounded-2xl bg-blue-600 px-8 py-4 font-black text-white shadow-lg transition hover:bg-blue-500">Acceso docente</button></div><div className="grid gap-4 sm:grid-cols-2">{['Registro de asistencia mensual', 'Carga y resumen de calificaciones', 'Generación de boletines', 'Descarga de plantillas CSV'].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-5 font-bold text-blue-50">{item}</div>)}</div></div></section>

      <section id="faq" className="bg-white px-6 py-20"><div className="mx-auto max-w-4xl"><div className="mb-12 text-center"><span className="mb-3 block text-xs font-black uppercase tracking-[0.3em] text-blue-600">Preguntas frecuentes</span><h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Dudas comunes sobre el acceso docente</h2></div><div className="space-y-4">{preguntas.map((item) => <details key={item.pregunta} className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 open:bg-white open:shadow-md"><summary className="cursor-pointer list-none text-base font-black text-slate-900">{item.pregunta}</summary><p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">{item.respuesta}</p></details>)}</div></div></section>

      <footer className="border-t border-slate-200 bg-white py-12 text-slate-500"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row"><Image src="/logo_adsp.png" alt="ADSP Logo" width={200} height={60} className="object-contain" /><div className="text-center md:text-right"><p className="mb-2 text-sm font-bold text-slate-800">WhatsApp: (849) 629-7248 · Redes: @adsp_rd</p><p className="text-xs font-bold uppercase tracking-widest text-slate-700">Desarrollado por AD Soluciones Profesionales</p><p className="mt-1 text-[10px] font-medium opacity-80">&copy; {new Date().getFullYear()} ADSP S.R.L. Santo Domingo, República Dominicana. Todos los derechos reservados.</p></div></div></footer>

      {mostrarLogin && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Acceso docente"><div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl"><div className="mb-6 flex items-start justify-between gap-4"><div><Image src="/logo.png" alt="Logo del registro escolar" width={68} height={68} className="mb-3 object-contain" /><h2 className="text-2xl font-black text-slate-900">Acceso docente</h2><p className="text-sm font-bold uppercase tracking-widest text-slate-400">Registro Escolar Digital</p></div><button onClick={() => setMostrarLogin(false)} className="rounded-full border border-slate-200 px-3 py-1 text-lg font-bold text-slate-500 hover:bg-slate-50" aria-label="Cerrar acceso docente">×</button></div><form onSubmit={manejarLogin} className="space-y-4"><div><label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Email Institucional</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="usuario@adsp.com.do" disabled={cargando} /></div><div><label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-slate-400">Contraseña</label><div className="relative"><input type={verPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 pr-12 font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500" placeholder="••••••••" disabled={cargando} /><button type="button" onClick={() => setVerPassword(!verPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-600">{verPassword ? 'Ocultar' : 'Ver'}</button></div></div>{mensaje.texto && <div className={`rounded-xl border p-4 text-xs font-bold ${mensaje.tipo === 'error' ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>{mensaje.texto}</div>}<button type="submit" disabled={cargando} className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white shadow-xl transition-all ${cargando ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}`}>{cargando ? 'Cargando Entorno...' : 'Entrar al Registro'}</button></form></div></div>}
    </div>
  )
}

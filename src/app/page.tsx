'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function HomeInstitucional() {
  const router = useRouter()
  
  // Estados para el Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
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
    } catch (error: any) {
      setMensaje({ texto: 'Credenciales incorrectas.', tipo: 'error' })
      setCargando(false)
    }
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      
      {/* ==========================================
          BARRA DE NAVEGACIÓN
          ========================================== */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <div className="bg-blue-600 p-2 rounded-xl">
              <Image src="/Logo.bmp" alt="ADSP Logo" width={32} height={32} className="object-contain brightness-0 invert" />
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tight">ADSP</span>
          </div>
          <div className="hidden md:flex gap-8 font-bold text-sm text-slate-500 uppercase tracking-wider">
            <button onClick={() => scrollToSection('nosotros')} className="hover:text-blue-600 transition-colors">Nosotros</button>
            <button onClick={() => scrollToSection('historia')} className="hover:text-blue-600 transition-colors">Historia</button>
            <button onClick={() => scrollToSection('servicios')} className="hover:text-blue-600 transition-colors">Servicios</button>
          </div>
          <button onClick={() => scrollToSection('portal-docente')} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors">
            Portal Docente
          </button>
        </div>
      </nav>

      {/* ==========================================
          HERO SECTION & LOGIN (PORTAL DOCENTE)
          ========================================== */}
      <section id="portal-docente" className="pt-32 pb-20 px-6 lg:pt-48 lg:pb-32 bg-gradient-to-br from-blue-900 to-blue-950 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-blue-500 blur-[120px]"></div>
          <div className="absolute top-[60%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500 blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
          
          {/* Textos Institucionales */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight mb-6 tracking-tight">
              AD <span className="text-blue-400">Soluciones Profesionales</span>
            </h1>
            <p className="text-lg lg:text-xl text-blue-100/80 mb-8 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
              Transformando la educación a través de la tecnología, la capacitación continua y la innovación. Únete al futuro de la gestión escolar con ELINE.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <button onClick={() => scrollToSection('nosotros')} className="border border-white/30 text-white hover:bg-white/10 px-8 py-3.5 rounded-xl font-bold transition-all">
                Conocer ADSP
              </button>
            </div>
          </div>

          {/* Tarjeta de Login Docente */}
          <div className="w-full max-w-md mx-auto bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 p-2 rounded-lg text-xl">👨‍🏫</span> Portal Docente
              </h2>
              <p className="text-slate-500 mt-2 text-sm font-medium">Ingresa para gestionar tus secciones y estudiantes.</p>
            </div>

            <form onSubmit={manejarLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Institucional</label>
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  placeholder="docente@adsp.com.do" disabled={cargando}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contraseña</label>
                <div className="relative">
                  <input 
                    type={verPassword ? "text" : "password"} 
                    required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium pr-12"
                    placeholder="••••••••" disabled={cargando}
                  />
                  <button type="button" onClick={() => setVerPassword(!verPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                    {verPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {mensaje.texto && (
                <div className={`p-4 rounded-xl text-sm font-semibold border ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                  {mensaje.texto}
                </div>
              )}

              <button type="submit" disabled={cargando} className={`w-full text-white font-bold py-4 rounded-xl transition-all shadow-lg mt-2 ${cargando ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {cargando ? 'Verificando...' : 'Iniciar Sesión'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ==========================================
          MISION, VISIÓN, VALORES
          ========================================== */}
      <section id="nosotros" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Nuestra Identidad</h2>
          <div className="w-20 h-1.5 bg-blue-600 mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-6">🎯</div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Misión</h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              Empoderar a los centros educativos y profesionales a través de herramientas tecnológicas eficientes que simplifiquen la gestión y potencien los resultados, permitiendo enfocar los esfuerzos en la calidad integral.
            </p>
          </div>

          <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-6">👁️</div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Visión</h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              Ser la institución líder a nivel nacional en el desarrollo de soluciones profesionales y modernización de procesos, estableciendo el más alto estándar de eficiencia y seguridad.
            </p>
          </div>

          <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mb-6">⭐</div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Valores</h3>
            <ul className="text-slate-600 font-medium space-y-3">
              <li className="flex items-center gap-2"><span className="text-amber-500">✔</span> Innovación Constante</li>
              <li className="flex items-center gap-2"><span className="text-amber-500">✔</span> Integridad y Transparencia</li>
              <li className="flex items-center gap-2"><span className="text-amber-500">✔</span> Vocación de Servicio</li>
              <li className="flex items-center gap-2"><span className="text-amber-500">✔</span> Excelencia Profesional</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ==========================================
          HISTORIA
          ========================================== */}
      <section id="historia" className="py-24 px-6 bg-white border-y border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-8">Nuestra Historia</h2>
          <p className="text-lg text-slate-600 leading-relaxed font-medium mb-6">
            <strong className="text-slate-800">AD Soluciones Profesionales (ADSP)</strong> nació ante la necesidad urgente de optimizar procesos administrativos y operativos. Observamos cómo las instituciones invertían cientos de horas en tareas manuales que restaban tiempo valioso a su misión principal.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            Con este enfoque hemos desarrollado herramientas como ELINE (Entorno Lógico Integrado Nacional Educativo), un ecosistema diseñado específicamente bajo estándares rigurosos, llevando la gestión hacia la era digital con total confianza y seguridad.
          </p>
        </div>
      </section>

      {/* ==========================================
          SERVICIOS
          ========================================== */}
      <section id="servicios" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Servicios e Innovación</h2>
          <div className="w-20 h-1.5 bg-blue-600 mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex gap-6 items-start bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 shrink-0 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl">💻</div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Plataforma ELINE</h3>
              <p className="text-slate-600 font-medium">Software en la nube para el control de asistencia automatizado y cálculo de calificaciones oficiales. Disponible 24/7 desde cualquier dispositivo.</p>
            </div>
          </div>

          <div className="flex gap-6 items-start bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 shrink-0 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl">📊</div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Soluciones Analíticas</h3>
              <p className="text-slate-600 font-medium">Generación de reportes instantáneos y procesamiento de datos para la toma de decisiones estratégicas e institucionales en tiempo real.</p>
            </div>
          </div>
          
          <div className="flex gap-6 items-start bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 shrink-0 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-3xl">🎓</div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Capacitación y Consultoría</h3>
              <p className="text-slate-600 font-medium">Asesoramiento integral y talleres enfocados en la integración de herramientas digitales para potenciar el flujo de trabajo de tu equipo.</p>
            </div>
          </div>

          <div className="flex gap-6 items-start bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 shrink-0 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-3xl">🛡️</div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Seguridad de Datos</h3>
              <p className="text-slate-600 font-medium">Respaldos automáticos y arquitectura cifrada para garantizar la privacidad, conservación e integridad de tu información institucional.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          FOOTER
          ========================================== */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Image src="/Logo.bmp" alt="ADSP Logo" width={32} height={32} className="object-contain grayscale opacity-50" />
            <span className="text-xl font-black text-slate-200 tracking-tight">ADSP</span>
          </div>
          <p className="text-sm font-medium md:text-right">
            &copy; {new Date().getFullYear()} AD Soluciones Profesionales. <br className="md:hidden"/> Todos los derechos reservados.
          </p>
        </div>
      </footer>

    </div>
  )
}
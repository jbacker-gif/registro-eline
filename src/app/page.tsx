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
          BARRA DE NAVEGACIÓN (Logo ADSP)
          ========================================== */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <div className="relative w-12 h-12 overflow-hidden rounded-lg">
              <Image 
                src="/logo_adsp.jpg" 
                alt="ADSP Logo" 
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-800 leading-none">ADSP</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Soluciones Profesionales</span>
            </div>
          </div>
          <div className="hidden md:flex gap-8 font-bold text-sm text-slate-500 uppercase tracking-wider">
            <button onClick={() => scrollToSection('nosotros')} className="hover:text-blue-600 transition-colors">Nosotros</button>
            <button onClick={() => scrollToSection('historia')} className="hover:text-blue-600 transition-colors">Historia</button>
            <button onClick={() => scrollToSection('servicios')} className="hover:text-blue-600 transition-colors">Servicios</button>
          </div>
          <button onClick={() => scrollToSection('portal-docente')} className="bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md">
            Acceso Docente
          </button>
        </div>
      </nav>

      {/* ==========================================
          HERO SECTION & PORTAL ELINE (Logo Eline)
          ========================================== */}
      <section id="portal-docente" className="pt-32 pb-20 px-6 lg:pt-48 lg:pb-32 bg-gradient-to-br from-slate-900 to-blue-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-30">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-blue-500 blur-[120px]"></div>
          <div className="absolute top-[60%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500 blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
          
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight mb-6 tracking-tight">
              Innovación Digital para el <span className="text-blue-400">Éxito Escolar</span>
            </h1>
            <p className="text-lg lg:text-xl text-blue-100/80 mb-8 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
              AD Soluciones Profesionales presenta **ELINE**, el entorno lógico diseñado para modernizar el registro de asistencia y calificaciones bajo los estándares de excelencia.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <button onClick={() => scrollToSection('servicios')} className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 px-8 py-3.5 rounded-xl font-bold transition-all">
                Ver Soluciones
              </button>
            </div>
          </div>

          {/* Tarjeta de Login (Portal ELINE) */}
          <div className="w-full max-w-md mx-auto bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-white/20">
            <div className="mb-8 text-center">
              <div className="bg-slate-50 w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center p-2 shadow-inner border border-slate-100">
                <Image src="/logo.bmp" alt="ELINE Logo" width={60} height={60} className="object-contain" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Portal ELINE</h2>
              <p className="text-slate-500 mt-1 text-sm font-medium tracking-tight">Entorno Lógico Integrado Nacional Educativo</p>
            </div>

            <form onSubmit={manejarLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Usuario / Email</label>
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-slate-700"
                  placeholder="ejemplo@adsp.com.do" disabled={cargando}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
                <div className="relative">
                  <input 
                    type={verPassword ? "text" : "password"} 
                    required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium pr-12 text-slate-700"
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
                <div className={`p-4 rounded-xl text-xs font-bold border ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                  {mensaje.texto}
                </div>
              )}

              <button type="submit" disabled={cargando} className={`w-full text-white font-bold py-4 rounded-2xl transition-all shadow-xl mt-2 flex justify-center items-center gap-2 ${cargando ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}`}>
                {cargando ? 'Cargando Entorno...' : 'Entrar al Registro'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECCIÓN NOSOTROS (ADSP)
          ========================================== */}
      <section id="nosotros" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-blue-600 font-black text-xs uppercase tracking-[0.3em] mb-3">Quiénes Somos</span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Identidad ADSP</h2>
          <div className="w-12 h-1 bg-blue-600 mt-6 rounded-full"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-6">🎯</div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Misión</h3>
            <p className="text-slate-500 leading-relaxed text-sm font-medium">
              Proveer soluciones profesionales de vanguardia que simplifiquen los procesos operativos y administrativos, permitiendo que las instituciones alcancen su máximo potencial a través de la eficiencia digital.
            </p>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-6">👁️</div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Visión</h3>
            <p className="text-slate-500 leading-relaxed text-sm font-medium">
              Consolidarnos como el aliado tecnológico número uno para el desarrollo institucional en el Caribe, siendo reconocidos por nuestra integridad, seguridad y capacidad de respuesta.
            </p>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mb-6">🛡️</div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Seguridad</h3>
            <p className="text-slate-500 leading-relaxed text-sm font-medium">
              Nuestra prioridad absoluta es la protección de la información. Implementamos arquitecturas robustas para garantizar que cada dato institucional esté respaldado y cifrado.
            </p>
          </div>
        </div>
      </section>

      {/* ==========================================
          FOOTER (Logo ADSP)
          ========================================== */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 overflow-hidden rounded-lg grayscale opacity-50">
              <Image src="/logo_adsp.jpg" alt="ADSP Logo" fill className="object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-200 tracking-tight leading-none">ADSP</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Soluciones Profesionales</span>
            </div>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Desarrollado por AD Soluciones Profesionales</p>
            <p className="text-[10px] font-medium opacity-60">
              &copy; {new Date().getFullYear()} ADSP S.R.L. Santo Domingo, República Dominicana. <br/>
              ELINE es una marca registrada bajo licencia de ADSP.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
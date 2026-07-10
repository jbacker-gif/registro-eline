import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planes y Suscripciones | ELINE',
  description: 'Elige entre 4 planes de suscripción para ELINE. Activación manual vía WhatsApp.',
}

const whatsapp = '18496297248'

type Plan = {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  badge: string
  label?: string
  ctaLabel: string
  message: string
}

const plans: Plan[] = [
  {
    name: 'Gratis',
    price: 'RD$0.00',
    period: 'para siempre',
    description: 'Ideal para comenzar y explorar la plataforma.',
    features: ['Acceso básico', '1 sección', '15 estudiantes', 'Soporte por comunidad', 'Funciones esenciales'],
    badge: 'Para empezar',
    ctaLabel: 'Comenzar gratis',
    message: 'Hola ADSP, quiero activar el plan Gratis (RD$0.00). ¿Me pueden ayudar con la activación?',
  },
  {
    name: 'Mensual',
    price: 'RD$399.00',
    period: 'por mes',
    description: 'Flexibilidad total con pago mes a mes.',
    features: ['Todo lo del plan Gratis', 'Sección ilimitada', 'Estudiantes ilimitados', 'Soporte prioritario', 'Funciones avanzadas'],
    badge: 'Pago mensual',
    ctaLabel: 'Activar Mensual',
    message: 'Hola ADSP, quiero activar el plan Mensual (RD$399.00). Por favor ayúdenme con la activación manual.',
  },
  {
    name: 'Trimestral',
    price: 'RD$1,100.00',
    period: 'cada 3 meses',
    description: 'El favorito de nuestros clientes. Ahorra frente al mensual.',
    features: ['Todo lo del plan Mensual', 'Ahorro del ~8%', 'Reportes avanzados', 'Acompañamiento personalizado'],
    badge: 'Recomendado',
    label: 'Recomendado',
    ctaLabel: 'Activar Trimestral',
    message: 'Hola ADSP, quiero activar el plan Trimestral (RD$1,100.00). Por favor ayúdenme con la activación manual.',
  },
  {
    name: 'Anual',
    price: 'RD$3,990.00',
    period: 'por año',
    description: 'El mejor precio. Paga una vez y olvídate.',
    features: ['Todo lo del plan Trimestral', 'Máximo ahorro anual', 'Soporte dedicado', 'Acceso anticipado a novedades'],
    badge: 'Mayor ahorro',
    ctaLabel: 'Activar Anual',
    message: 'Hola ADSP, quiero activar el plan Anual (RD$3,990.00). Por favor ayúdenme con la activación manual.',
  },
]

function waLink(message: string) {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0f172a]">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0 text-[#536b91]">
      <path fill="currentColor" d="M12 2.75 14.45 9.55 21.25 12l-6.8 2.45L12 21.25l-2.45-6.8L2.75 12l6.8-2.45L12 2.75Z" />
    </svg>
  )
}

export default function SuscripcionesPage() {
  return (
    <div className="min-h-screen bg-white text-[#020817]">
      <header className="border-b border-[#e3e5ea] bg-[#f6f7f9]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[104px] max-w-6xl items-center justify-between px-5 md:h-[140px] md:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Volver al inicio">
            <Image src="/logo_adsp.png" alt="AD Soluciones Profesionales" width={387} height={120} className="h-[84px] w-auto object-contain md:h-[120px]" priority />
          </Link>

          <nav className="hidden gap-6 font-mono text-[14px] font-medium uppercase tracking-[0.12em] text-[#5b6472] md:flex">
            <Link href="/#nosotros" className="transition-colors hover:text-[#142037]">Nosotros</Link>
            <Link href="/#servicios" className="transition-colors hover:text-[#142037]">Servicios</Link>
            <Link href="/#registro" className="transition-colors hover:text-[#142037]">ELINE</Link>
            <Link href="/suscripciones" className="text-[#142037]">Planes</Link>
            <Link href="/#contacto" className="transition-colors hover:text-[#142037]">Contacto</Link>
          </nav>

          <Link href="/" className="border border-[#142037] px-4 py-2.5 font-mono text-[12px] font-medium uppercase tracking-[0.08em] transition-colors hover:bg-[#142037] hover:text-[#f6f7f9] md:px-6 md:py-3 md:text-[14px] md:tracking-[0.1em]">
            Acceso docente
          </Link>
        </div>
      </header>
      <main>
        <section className="mx-auto max-w-6xl px-6 pb-12 pt-20 text-center">
          <div className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#dbe3ef] bg-white px-3 py-1 text-xs font-medium text-[#475569] shadow-sm">
            <SparklesIcon />
            Planes hechos para ti
          </div>
	 <h1 className="mt-6 text-4xl font-bold tracking-tight text-[#020817] sm:text-5xl">Elige el plan perfecto</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#536b91] sm:text-lg">
            Suscripciones flexibles en RD$. Activación rápida vía WhatsApp, sin complicaciones.
          </p>
        </section>

        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-24 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className="flex min-h-[430px] flex-col rounded-2xl border bg-white p-6 shadow-sm transition"
              style={plan.label ? { borderColor: '#d97706', backgroundColor: '#fffbeb', boxShadow: '0 0 0 2px rgba(251, 191, 36, 0.35)' } : { borderColor: '#dbe3ef' }}
            >
              <div className="mb-4 flex h-7 items-center">
                <span
                  className="rounded-full border px-3 py-1 text-xs font-semibold shadow-sm"
                  style={
                    plan.label
                      ? { borderColor: '#d97706', backgroundColor: '#d97706', color: '#ffffff' }
                      : { borderColor: '#dbe3ef', backgroundColor: '#f8fafc', color: '#536b91' }
                  }
                >
                  {plan.badge}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-[#020817]">{plan.name}</h2>
              <p className="mt-2 min-h-10 text-sm leading-6 text-[#536b91]">{plan.description}</p>

              <div className="mt-7">
                <div className="text-3xl font-bold tracking-tight text-[#020817]">{plan.price}</div>
                <div className="mt-1 text-xs text-[#536b91]">{plan.period}</div>
              </div>

              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[#020817]">
                    <CheckIcon />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={waLink(plan.message)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:opacity-90"
                style={plan.label ? { borderColor: '#d97706', backgroundColor: '#d97706', color: '#ffffff' } : { borderColor: '#dbe3ef', backgroundColor: '#ffffff', color: '#020817' }}
              >
                <MessageIcon />
                {plan.ctaLabel}
              </a>
            </article>
          ))}
        </section>
      </main>

      <footer className="bg-[#142037] text-[#f6f7f9]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 px-6 py-16 md:flex-row md:items-end">
          <div className="flex items-center gap-3">
            <Image src="/logo_footer_gris.png" alt="AD Soluciones Profesionales" width={320} height={160} className="h-20 w-auto object-contain" />
          </div>
          <div className="text-left md:text-right">
            <p className="mb-2 font-mono text-[12px] text-white/70">Tel/WhatsApp (849) 629-7248 - info@adsp.com.do - @adsp_rd</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">Desarrollado por AD Soluciones Profesionales</p>
            <p className="mt-1 font-mono text-[10px] text-white/30">
              &copy; {new Date().getFullYear()} ADSP S.R.L. Dr. Dolores Alfonseca, #5, Distrito Nacional, Ciudad Universitaria.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

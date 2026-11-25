import catalogo from '../data/catalogo-servicios.json'

const categorias = [...new Set(catalogo.map((servicio) => servicio.categoria))]
const moneda = new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function CatalogoServicios() {
  return (
    <section id="catalogo" className="scroll-mt-36 border-t border-[#e3e5ea] bg-[#f4f8fb] px-5 py-16 md:scroll-mt-44 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-serif text-3xl font-medium text-[#142037] md:text-4xl">Catálogo y precios</h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#5b6472]">
          Consulta los formatos, variantes y precios en pesos dominicanos. Solicita tu trabajo por WhatsApp indicando la cantidad y la fecha de entrega que necesitas.
        </p>
        <div className="mt-8 space-y-5">
          {categorias.map((categoria) => (
            <details key={categoria} open={categoria === categorias[0]} className="border border-[#dfe6ec] bg-white">
              <summary className="cursor-pointer px-5 py-5 text-lg font-semibold text-[#142037] md:px-6">{categoria}</summary>
              <ul className="divide-y divide-[#e3e5ea] border-t border-[#e3e5ea]">
                {catalogo.filter((servicio) => servicio.categoria === categoria).map((servicio) => {
                  const detalle = [servicio.servicio, servicio.formato, servicio.variante].filter(Boolean).join(' · ')
                  const mensaje = `Hola ADSP, deseo cotizar ${detalle} (${servicio.codigo}). Cantidad: . Fecha de entrega deseada: .`
                  return (
                    <li key={servicio.codigo} className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_11rem_12rem] md:items-center md:px-6">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[#142037]">{servicio.servicio}</h3>
                        <p className="mt-1 text-sm text-[#5b6472]">{[servicio.formato, servicio.variante].filter(Boolean).join(' · ')}</p>
                        {servicio.nota && <p className="mt-2 text-sm text-[#5b6472]">{servicio.nota}</p>}
                      </div>
                      <div>
                        <p className="text-lg font-bold tabular-nums text-[#142037]">{servicio.precio === null ? 'A cotizar' : `RD$${moneda.format(servicio.precio)}`}</p>
                        <p className="text-sm text-[#5b6472]">Por {servicio.unidad.toLowerCase()}</p>
                      </div>
                      <a
                        href={`https://wa.me/18496297248?text=${encodeURIComponent(mensaje)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Solicitar cotización de ${detalle}`}
                        className="inline-flex min-h-11 items-center justify-center border border-[#142037] px-4 py-3 text-center text-sm font-semibold text-[#142037] transition-colors hover:bg-[#142037] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0056b3]"
                      >
                        Solicitar cotización
                      </a>
                    </li>
                  )
                })}
              </ul>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

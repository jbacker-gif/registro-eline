import { redirect } from 'next/navigation'
import { buildSecondaryModuleUrl } from '../../../../lib/secundariaRouting'

export default async function BoletinesSecundariaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  redirect(buildSecondaryModuleUrl(await searchParams, 'boletin', 'boletines'))
}

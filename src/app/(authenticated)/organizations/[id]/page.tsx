import { redirect } from 'next/navigation'

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/organizations/${id}/events`)
}

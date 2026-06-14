import { redirect } from 'next/navigation';

export default async function ViewPageRedirect({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  redirect(`/card/${uuid}`);
}

import type { RecipientAccessState } from '@/services/server/card-store';

export default function RecipientClaimGate({
  cardId,
  recipientName,
  creatorName,
  expiresAt,
  state,
}: {
  cardId: string;
  recipientName: string;
  creatorName: string;
  expiresAt?: string | null;
  state: RecipientAccessState;
}) {
  const unavailable = state === 'claimed';
  return (
    <main className="min-h-screen bg-[#fff1f6] px-4 py-12 text-[#3d1a2e] flex items-center justify-center">
      <section className="w-full max-w-xl rounded-[2rem] border border-pink-200 bg-white/90 p-7 text-center shadow-2xl shadow-pink-200/50 sm:p-10">
        <div className="text-6xl">{unavailable ? '🔒' : '💌'}</div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-pink-500">Private VibeCheck</p>
        <h1 className="mt-3 font-serif text-4xl font-black">
          {unavailable ? 'Already unsealed' : `${recipientName}, this is for you`}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm font-semibold leading-7 text-[#7b3f6e]">
          {unavailable
            ? 'This card has already been claimed on its intended browser. Ask the sender to check the address they shared.'
            : `${creatorName} made a private card for one person. Open it on the browser and device you want to keep using.`}
        </p>
        {!unavailable && (
          <>
            <form action={`/card/${cardId}/claim`} method="post" className="mt-7">
              <button className="w-full rounded-2xl bg-linear-to-r from-pink-500 to-amber-500 px-6 py-4 font-black text-white shadow-xl shadow-pink-200">
                Unseal on this device
              </button>
            </form>
            <p className="mt-4 text-xs leading-6 text-[#8f687d]">
              Link previews do not claim the card. Only this deliberate click does. Once claimed, another browser cannot reuse the link.
              {expiresAt ? ` Access ends ${new Date(expiresAt).toLocaleString('en-IN')}.` : ''}
            </p>
          </>
        )}
      </section>
    </main>
  );
}

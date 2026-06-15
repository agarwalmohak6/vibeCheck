export default function Loading() {
  return (
    <main className="vc-loading-page" aria-busy="true" aria-live="polite">
      <div className="vc-loading-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p>Preparing the vibe</p>
    </main>
  );
}

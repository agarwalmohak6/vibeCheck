export default function AmbientBackground() {
  return <div className="vc-romance-ambient" aria-hidden="true">
    <div className="vc-romance-halo" />
    {Array.from({ length: 16 }, (_, index) => <span key={index} style={{ left: `${(index * 37 + 7) % 97}%`, top: `${(index * 23 + 9) % 96}%`, animationDelay: `${-index * .6}s`, animationDuration: `${4 + index % 5}s`, fontSize: `${13 + index % 4 * 7}px` }}>{['♡', '✧', '♥', '✦'][index % 4]}</span>)}
  </div>;
}

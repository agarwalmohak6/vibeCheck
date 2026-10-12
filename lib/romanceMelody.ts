/** The HTML invitation's original music-box tune; no remote audio dependencies. */
export function createRomanceMelody() {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0.5; master.connect(context.destination);
  const melody = [72,76,79,76,74,77,81,77,71,74,79,74,72,76,79,84,76,79,81,79,74,77,79,77,71,74,76,74,72,67,76,72];
  const chords = [[48,52,55],[53,57,60],[55,59,62],[48,52,55]];
  let nextBeat = context.currentTime + .04, beat = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const tone = (note: number, time: number, duration: number, volume: number) => {
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
    gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(volume, time + .025); gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    oscillator.connect(gain); gain.connect(master); oscillator.start(time); oscillator.stop(time + duration + .05);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  };
  const schedule = () => {
    if (context.state !== 'running') return;
    if (nextBeat < context.currentTime - .5) nextBeat = context.currentTime + .04;
    while (nextBeat < context.currentTime + .4) {
      tone(melody[beat % melody.length], nextBeat, 1.35, .12);
      if (beat % 4 === 0) chords[Math.floor(beat / 8) % 4].forEach((note, i) => tone(note, nextBeat + i * .035, 2.45, .034));
      nextBeat += .43; beat++;
    }
  };
  return {
    async play() { await context.resume(); schedule(); if (!timer) timer = setInterval(schedule, 120); },
    pause() { if (timer) clearInterval(timer); timer = null; void context.suspend(); },
    dispose() { if (timer) clearInterval(timer); timer = null; void context.close(); },
  };
}

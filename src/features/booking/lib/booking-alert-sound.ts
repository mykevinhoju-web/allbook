const ALERTS_ENABLED_KEY = "allbook-booking-alerts-enabled";

/** Peak gain per note — tuned for phone speakers (louder but below clipping). */
const NOTE_VOLUME = 0.72;
const MASTER_VOLUME = 0.92;

export function isBookingAlertsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ALERTS_ENABLED_KEY) === "1";
}

export function setBookingAlertsEnabled(enabled: boolean) {
  if (enabled) {
    sessionStorage.setItem(ALERTS_ENABLED_KEY, "1");
  } else {
    sessionStorage.removeItem(ALERTS_ENABLED_KEY);
  }
}

export async function unlockBookingAudio(): Promise<AudioContext> {
  const context = new AudioContext();
  await context.resume();

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  gain.gain.value = 0.0001;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.05);

  return context;
}

/**
 * iPhone Tri-Tone–inspired alert (E6 → C6 → G5), played twice for clarity on mobile.
 */
export function playBookingChime(context: AudioContext | null) {
  const audio = context ?? new AudioContext();

  if (audio.state === "suspended") {
    void audio.resume();
  }

  const master = audio.createGain();
  master.gain.value = MASTER_VOLUME;
  master.connect(audio.destination);

  const playNote = (
    frequency: number,
    start: number,
    duration: number,
    volume = NOTE_VOLUME,
  ) => {
    const tone = audio.createOscillator();
    const harmonic = audio.createOscillator();
    const envelope = audio.createGain();
    const harmonicMix = audio.createGain();

    tone.type = "triangle";
    tone.frequency.value = frequency;
    harmonic.type = "sine";
    harmonic.frequency.value = frequency * 2;
    harmonicMix.gain.value = 0.18;

    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    envelope.gain.setValueAtTime(volume * 0.9, start + duration * 0.4);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    tone.connect(envelope);
    harmonic.connect(harmonicMix);
    harmonicMix.connect(envelope);
    envelope.connect(master);

    tone.start(start);
    harmonic.start(start);
    tone.stop(start + duration + 0.04);
    harmonic.stop(start + duration + 0.04);
  };

  const playTriTone = (offset: number) => {
    const base = audio.currentTime + offset;
    playNote(1318.51, base, 0.15); // E6
    playNote(1046.5, base + 0.14, 0.15); // C6
    playNote(783.99, base + 0.28, 0.32); // G5 — held slightly longer
  };

  playTriTone(0);
  playTriTone(0.62);
}

export function vibrateForBooking() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([160, 80, 160, 80, 240]);
  }
}

export function showBookingNotification(staffName: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!document.hidden) return;

  new Notification("New booking request", {
    body: `${staffName} — tap to open admin`,
    tag: "allbook-booking",
    silent: false,
  });
}

export function triggerBookingAlert(
  staffName: string,
  audioContext: AudioContext | null,
) {
  playBookingChime(audioContext);
  vibrateForBooking();
  showBookingNotification(staffName);
}

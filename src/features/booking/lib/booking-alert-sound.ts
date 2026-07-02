const ALERTS_ENABLED_KEY = "allbook-booking-alerts-enabled";
const ALERT_SOUND_PATH = "/sounds/booking-alert.mp3";

/** Normal playback — rely on iOS push notification sound when app is in background. */
const MP3_GAIN = 1;

let sharedAudioContext: AudioContext | null = null;
let decodedAlertBuffer: AudioBuffer | null = null;
let bufferLoadPromise: Promise<AudioBuffer> | null = null;

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

async function getAudioContext(): Promise<AudioContext> {
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContext();
  }

  if (sharedAudioContext.state === "suspended") {
    await sharedAudioContext.resume();
  }

  return sharedAudioContext;
}

async function loadAlertBuffer(context: AudioContext): Promise<AudioBuffer> {
  if (decodedAlertBuffer) return decodedAlertBuffer;
  if (bufferLoadPromise) return bufferLoadPromise;

  bufferLoadPromise = fetch(ALERT_SOUND_PATH)
    .then((response) => response.arrayBuffer())
    .then((data) => context.decodeAudioData(data))
    .then((buffer) => {
      decodedAlertBuffer = buffer;
      return buffer;
    });

  return bufferLoadPromise;
}

function playAmplifiedBuffer(
  context: AudioContext,
  buffer: AudioBuffer,
  startAt: number,
  gainValue: number,
) {
  const source = context.createBufferSource();
  const gain = context.createGain();

  source.buffer = buffer;
  gain.gain.value = gainValue;
  source.connect(gain);
  gain.connect(context.destination);
  source.start(startAt);
}

function playTriToneFallback(context: AudioContext, startAt: number) {
  const master = context.createGain();
  master.gain.value = 0.45;
  master.connect(context.destination);

  const playNote = (frequency: number, start: number, duration: number) => {
    const tone = context.createOscillator();
    const envelope = context.createGain();

    tone.type = "sine";
    tone.frequency.value = frequency;

    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(0.35, start + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    tone.connect(envelope);
    envelope.connect(master);

    tone.start(start);
    tone.stop(start + duration + 0.02);
  };

  playNote(880, startAt, 0.12);
  playNote(988, startAt + 0.1, 0.14);
}

async function playAlertOnce(context: AudioContext) {
  try {
    const buffer = await loadAlertBuffer(context);
    playAmplifiedBuffer(context, buffer, context.currentTime, MP3_GAIN);
  } catch {
    playTriToneFallback(context, context.currentTime);
  }
}

/** Unlocks audio on iOS — call from a user tap. Does not play a sound. */
export async function unlockBookingAudio(): Promise<AudioContext> {
  const context = await getAudioContext();
  await loadAlertBuffer(context);
  return context;
}

export async function playBookingChime() {
  const context = await getAudioContext();
  await playAlertOnce(context);
}

export function vibrateForBooking() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(200);
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

/** Foreground only — background alerts use iOS/Web Push system sound. */
export async function triggerBookingAlert(staffName: string) {
  if (typeof document !== "undefined" && document.hidden) {
    return;
  }

  await playBookingChime();
  vibrateForBooking();
  showBookingNotification(staffName);
}

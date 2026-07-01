const ALERTS_ENABLED_KEY = "allbook-booking-alerts-enabled";
const ALERT_SOUND_PATH = "/sounds/booking-alert.mp3";

/** Boost above 1.0 — uses Web Audio gain (louder on phone speakers). */
const MP3_GAIN = 3.5;
const TONE_GAIN = 2.2;
const REPEAT_GAP_SEC = 0.55;

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

function playTriTone(context: AudioContext, startAt: number, masterGain: number) {
  const master = context.createGain();
  master.gain.value = masterGain;
  master.connect(context.destination);

  const playNote = (frequency: number, start: number, duration: number) => {
    const tone = context.createOscillator();
    const harmonic = context.createOscillator();
    const envelope = context.createGain();
    const harmonicMix = context.createGain();

    tone.type = "square";
    tone.frequency.value = frequency;
    harmonic.type = "sine";
    harmonic.frequency.value = frequency;
    harmonicMix.gain.value = 0.35;

    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(0.85, start + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    tone.connect(envelope);
    harmonic.connect(harmonicMix);
    harmonicMix.connect(envelope);
    envelope.connect(master);

    tone.start(start);
    harmonic.start(start);
    tone.stop(start + duration + 0.02);
    harmonic.stop(start + duration + 0.02);
  };

  playNote(1318.51, startAt, 0.16);
  playNote(1046.5, startAt + 0.14, 0.16);
  playNote(783.99, startAt + 0.28, 0.34);
}

async function playLoudAlertSequence(context: AudioContext) {
  const buffer = await loadAlertBuffer(context);
  const duration = buffer.duration;
  const now = context.currentTime;

  playAmplifiedBuffer(context, buffer, now, MP3_GAIN);
  playTriTone(context, now, TONE_GAIN);

  const repeatAt = now + duration + REPEAT_GAP_SEC;
  playAmplifiedBuffer(context, buffer, repeatAt, MP3_GAIN);
  playTriTone(context, repeatAt, TONE_GAIN);
}

/** Unlocks audio on iOS — call from a user tap. */
export async function unlockBookingAudio(): Promise<AudioContext> {
  const context = await getAudioContext();
  await loadAlertBuffer(context);
  await playLoudAlertSequence(context);
  return context;
}

export async function playBookingChime() {
  const context = await getAudioContext();
  await playLoudAlertSequence(context);
}

export function vibrateForBooking() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([200, 100, 200, 100, 300]);
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

export async function triggerBookingAlert(staffName: string) {
  await playBookingChime();
  vibrateForBooking();
  showBookingNotification(staffName);
}

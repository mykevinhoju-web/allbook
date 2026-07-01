const ALERTS_ENABLED_KEY = "allbook-booking-alerts-enabled";
const ALERT_SOUND_PATH = "/sounds/booking-alert.mp3";

let sharedAlertAudio: HTMLAudioElement | null = null;

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

function createAlertAudio(): HTMLAudioElement {
  const audio = new Audio(ALERT_SOUND_PATH);
  audio.preload = "auto";
  audio.volume = 1;
  audio.setAttribute("playsinline", "true");
  return audio;
}

export async function unlockBookingAudio(): Promise<HTMLAudioElement> {
  const audio = sharedAlertAudio ?? createAlertAudio();
  sharedAlertAudio = audio;

  audio.currentTime = 0;
  await audio.play();
  audio.pause();
  audio.currentTime = 0;

  return audio;
}

export async function playBookingChime(audio?: HTMLAudioElement | null) {
  const element = audio ?? sharedAlertAudio ?? createAlertAudio();
  sharedAlertAudio = element;

  element.volume = 1;
  element.currentTime = 0;

  try {
    await element.play();
    return;
  } catch {
    // Web Audio fallback if MP3 blocked
  }

  playWebAudioFallback();
}

function playWebAudioFallback() {
  const context = new AudioContext();
  void context.resume().then(() => {
    const master = context.createGain();
    master.gain.value = 0.9;
    master.connect(context.destination);

    const playNote = (frequency: number, start: number, duration: number) => {
      const tone = context.createOscillator();
      const envelope = context.createGain();
      tone.type = "triangle";
      tone.frequency.value = frequency;
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(0.75, start + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      tone.connect(envelope);
      envelope.connect(master);
      tone.start(start);
      tone.stop(start + duration);
    };

    const base = context.currentTime;
    playNote(1318.51, base, 0.15);
    playNote(1046.5, base + 0.14, 0.15);
    playNote(783.99, base + 0.28, 0.32);
  });
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

export async function triggerBookingAlert(
  staffName: string,
  audio: HTMLAudioElement | null,
) {
  await playBookingChime(audio);
  vibrateForBooking();
  showBookingNotification(staffName);
}

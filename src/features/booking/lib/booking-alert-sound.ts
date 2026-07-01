const ALERTS_ENABLED_KEY = "allbook-booking-alerts-enabled";

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

export function playBookingChime(context: AudioContext | null) {
  const audio = context ?? new AudioContext();

  const playTone = (frequency: number, start: number, duration: number) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  };

  const now = audio.currentTime;
  playTone(880, now, 0.18);
  playTone(1174.66, now + 0.16, 0.22);
}

export function vibrateForBooking() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([120, 60, 120, 60, 200]);
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

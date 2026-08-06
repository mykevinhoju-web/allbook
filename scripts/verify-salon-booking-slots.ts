/**
 * Quick assertion for the documented Emma example.
 * Run: npx tsx scripts/verify-salon-booking-slots.ts
 */
import { generateTimeSlots } from "../src/features/salon-booking/generateTimeSlots";

const slots = generateTimeSlots({
  date: "2026-08-10",
  serviceDurationMinutes: 60,
  bufferMinutes: 10,
  intervalMinutes: 15,
  businessHours: { open: "09:00", close: "18:00", closed: false },
  staffHours: { startTime: "09:00", endTime: "17:00", isDayOff: false },
  staffBreaks: [{ startTime: "12:00", endTime: "13:00" }],
  staffLeaves: [],
  existingBookings: [
    {
      startTime: "09:30",
      endTime: "10:30",
      bufferMinutes: 10,
      status: "confirmed",
    },
  ],
});

const available = slots.filter((s) => s.available).map((s) => s.startTime);
console.log("Available starts:", available.join(", "));

// After 09:30–10:30 + 10m buffer → free from 10:40 until lunch at 12:00.
const mustInclude = ["10:40", "10:45", "11:00", "13:00", "14:00"];
const mustExclude = ["09:00", "09:30", "10:00", "10:30", "11:40", "12:00", "12:30"];

let failed = false;
for (const t of mustInclude) {
  if (!available.includes(t)) {
    console.error(`Missing expected slot ${t}`);
    failed = true;
  }
}
for (const t of mustExclude) {
  if (available.includes(t)) {
    console.error(`Unexpected slot ${t}`);
    failed = true;
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("OK — Emma example rules hold.");
}

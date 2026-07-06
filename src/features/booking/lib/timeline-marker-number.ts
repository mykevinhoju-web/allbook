const CIRCLED_NUMBERS = ["➊", "➋", "➌", "➍", "➎", "➏", "➐", "➑", "➒", "➓"];

export function formatTimelineMarkerNumber(index: number): string {
  if (index >= 0 && index < CIRCLED_NUMBERS.length) {
    return CIRCLED_NUMBERS[index];
  }
  return `${index + 1}.`;
}

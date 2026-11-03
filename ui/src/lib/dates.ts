const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const ordinal = (n: number) => {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
};

export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
export const shortDay = (d: Date) => DAYS[d.getDay()];
export const pad = (n: number) => String(n).padStart(2, "0");

/** "Today, 30th Oct" */
export const todayLabel = (d = new Date()) => `Today, ${ordinal(d.getDate())} ${MONTHS[d.getMonth()]}`;
/** "30th, Oct 2026" */
export const slotHeading = (d: Date) => `${ordinal(d.getDate())}, ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
/** "Saturday, Oct 31" */
export const longDay = (d: Date) => `${DAYS_LONG[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
/** "10:00 AM" */
export const clock = (d: Date) => {
  const h = d.getHours();
  return `${pad(h % 12 === 0 ? 12 : h % 12)}:${pad(d.getMinutes())} ${h < 12 ? "AM" : "PM"}`;
};
/** "Friday, Oct 30 at 10:00 AM" */
export const whenLong = (d: Date) => `${longDay(d)} at ${clock(d)}`;

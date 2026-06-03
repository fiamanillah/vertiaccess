const timelineDate = "2026-06-10";
const parts = timelineDate.split('-');
const year = Number(parts[0]);
const month = Number(parts[1]);
const day = Number(parts[2]);

console.log("Parts parsed:", { year, month, day });

const bookings = [
  {
    startTime: "2026-06-10T08:00:00.000Z",
    endTime: "2026-06-10T09:00:00.000Z",
    status: "PENDING",
  }
];

const hours = Array.from({ length: 20 }, (_, i) => 5 + i);

const hourlySlots = hours.map((hour) => {
  const slotStart = new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0));
  const slotEnd = new Date(Date.UTC(year, month - 1, day, hour + 1, 0, 0, 0));

  const overlapping = bookings.find((b) => {
    const bStart = new Date(b.startTime);
    const bEnd = new Date(b.endTime);
    return bStart < slotEnd && bEnd > slotStart;
  });

  return {
    hour,
    label: `${hour.toString().padStart(2, '0')}:00`,
    status: overlapping ? 'pending' : 'available',
    overlapping: !!overlapping,
  };
});

const matched = hourlySlots.filter(s => s.overlapping);
console.log("Matched slots count:", matched.length);
console.log("Matched slots details:", matched);

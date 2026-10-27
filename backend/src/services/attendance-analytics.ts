export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface AttendanceEntry {
  workDate: string;
  status: AttendanceStatus;
}

export interface DailyAttendanceSummary {
  day: string;
  date: string;
  rate: number | null;
  recordedCount: number;
  presentCount: number;
  lateCount: number;
  absenceCount: number;
}

export interface DailyAttendanceCounts {
  _id: string;
  recordedCount: number;
  presentCount: number;
  lateCount: number;
  absenceCount: number;
}

export function attendanceRate(rows: AttendanceEntry[]): number | null {
  if (rows.length === 0) return null;
  const attended = rows.filter((row) => row.status === 'present' || row.status === 'late').length;
  return Math.round((attended / rows.length) * 100);
}

export function summarizeAttendance(rows: AttendanceEntry[]) {
  const byMonth = new Map<string, AttendanceEntry[]>();
  for (const row of rows) {
    const month = row.workDate.slice(0, 7);
    byMonth.set(month, [...(byMonth.get(month) ?? []), row]);
  }

  return {
    totalWorkDays: new Set(rows.map((row) => row.workDate)).size,
    avgAttendanceRate: attendanceRate(rows),
    totalAbsences: rows.filter((row) => row.status === 'absent').length,
    totalLateArrivals: rows.filter((row) => row.status === 'late').length,
    monthlyTrends: [...byMonth.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([month, monthRows]) => ({ month, rate: attendanceRate(monthRows) ?? 0 })),
  };
}

export function weeklyAttendance(rows: AttendanceEntry[], endDate: string): DailyAttendanceSummary[] {
  const end = new Date(`${endDate}T00:00:00.000Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const dailyRows = rows.filter((row) => row.workDate === key);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      date: key,
      rate: attendanceRate(dailyRows),
      recordedCount: dailyRows.length,
      presentCount: dailyRows.filter((row) => row.status === 'present').length,
      lateCount: dailyRows.filter((row) => row.status === 'late').length,
      absenceCount: dailyRows.filter((row) => row.status === 'absent').length,
    };
  });
}

export function weeklyAttendanceFromCounts(rows: DailyAttendanceCounts[], endDate: string): DailyAttendanceSummary[] {
  const byDate = new Map(rows.map((row) => [row._id, row]));
  const end = new Date(`${endDate}T00:00:00.000Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const counts = byDate.get(key);
    const recordedCount = counts?.recordedCount ?? 0;
    const presentCount = counts?.presentCount ?? 0;
    const lateCount = counts?.lateCount ?? 0;
    const absenceCount = counts?.absenceCount ?? 0;
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      date: key,
      rate: recordedCount ? Math.round(((presentCount + lateCount) / recordedCount) * 100) : null,
      recordedCount,
      presentCount,
      lateCount,
      absenceCount,
    };
  });
}

export function isValidDateRange(startDate: unknown, endDate: unknown): startDate is string {
  const valid = (value: unknown): value is string =>
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;

  return valid(startDate) && valid(endDate) && startDate <= endDate;
}

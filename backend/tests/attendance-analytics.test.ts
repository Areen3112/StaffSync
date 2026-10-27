import { attendanceRate, isValidDateRange, summarizeAttendance, weeklyAttendance, weeklyAttendanceFromCounts } from '../src/services/attendance-analytics';

describe('recorded attendance analytics', () => {
  it('counts late attendance as attended while reporting late and explicit absence records separately', () => {
    const rows = [
      { workDate: '2026-10-02', status: 'present' as const },
      { workDate: '2026-10-02', status: 'late' as const },
      { workDate: '2026-10-03', status: 'absent' as const },
    ];
    expect(attendanceRate(rows)).toBe(67);
    expect(summarizeAttendance(rows)).toMatchObject({
      totalWorkDays: 2,
      avgAttendanceRate: 67,
      totalAbsences: 1,
      totalLateArrivals: 1,
      monthlyTrends: [{ month: '2026-10', rate: 67 }],
    });
  });

  it('represents empty days as unavailable rather than as zero-percent attendance', () => {
    expect(attendanceRate([])).toBeNull();
    expect(summarizeAttendance([])).toMatchObject({ totalWorkDays: 0, avgAttendanceRate: null, totalAbsences: 0, monthlyTrends: [] });
    const week = weeklyAttendance([{ workDate: '2026-10-27', status: 'present' }], '2026-10-27');
    expect(week).toHaveLength(7);
    expect(week[0].rate).toBeNull();
    expect(week[6]).toMatchObject({ date: '2026-10-27', rate: 100, recordedCount: 1, presentCount: 1 });
  });

  it('preserves weekly summaries when daily attendance counts are grouped in MongoDB', () => {
    const week = weeklyAttendanceFromCounts([
      { _id: '2026-10-26', recordedCount: 3, presentCount: 2, lateCount: 1, absenceCount: 0 },
      { _id: '2026-10-27', recordedCount: 2, presentCount: 1, lateCount: 0, absenceCount: 1 },
    ], '2026-10-27');
    expect(week[5]).toMatchObject({ date: '2026-10-26', rate: 100, recordedCount: 3, presentCount: 2, lateCount: 1, absenceCount: 0 });
    expect(week[6]).toMatchObject({ date: '2026-10-27', rate: 50, recordedCount: 2, presentCount: 1, lateCount: 0, absenceCount: 1 });
    expect(weeklyAttendanceFromCounts([], '2026-10-27')[6].rate).toBeNull();
  });

  it('accepts only real, ordered ISO calendar date ranges', () => {
    expect(isValidDateRange('2026-10-01', '2026-10-31')).toBe(true);
    expect(isValidDateRange('2026-10-32', '2026-11-01')).toBe(false);
    expect(isValidDateRange('2026-11-01', '2026-10-01')).toBe(false);
  });
});

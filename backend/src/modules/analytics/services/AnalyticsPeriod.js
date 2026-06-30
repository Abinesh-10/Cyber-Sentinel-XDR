export function normalizePeriod(input = {}) {
  const end = input.end ? new Date(input.end) : new Date();
  const start = input.start ? new Date(input.start) : new Date(end.getTime() - 24 * 60 * 60 * 1000);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function bucketForPeriod(period) {
  const start = new Date(period.start);
  const end = new Date(period.end);
  const hours = Math.max(1, (end.getTime() - start.getTime()) / (60 * 60 * 1000));
  return hours > 72 ? "day" : "hour";
}

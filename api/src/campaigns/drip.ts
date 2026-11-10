// Works out when each recipient's email should be sent, so a campaign trickles out
// instead of arriving for everyone in the same minute. Pure and deterministic given
// a `rand` function, which keeps it testable.
export function computeSendDelays(input: {
  count: number;
  dripPerMin: number;
  startAt: Date;
  now?: Date;
  rand?: () => number;
}): number[] {
  const now = input.now ?? new Date();
  const rand = input.rand ?? Math.random;
  const interval = 60_000 / Math.max(1, input.dripPerMin); // ms between sends
  const base = Math.max(0, input.startAt.getTime() - now.getTime());

  const delays: number[] = [];
  for (let i = 0; i < input.count; i++) {
    // Each slot is `interval` wide; jitter spreads sends within the slot so they do
    // not all land exactly on the tick.
    const delay = base + Math.round(i * interval + rand() * interval);
    delays.push(Math.max(0, delay));
  }
  return delays;
}

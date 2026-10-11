import prisma from "@/lib/prisma";

export const LAUNCH_DATE = "2026-10-11";
export const LAUNCH_BASELINE = 17;

/**
 * Deterministic hash function for date strings.
 * Generates an organic pseudo-random integer strictly between 1 and 10 for each day.
 */
export function getDailyIncrementForDate(dateStr: string): number {
  let hash = 2166136261;
  const key = `sb-daily-vis-${dateStr}`;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return 1 + (Math.abs(hash) % 10);
}

/**
 * Returns the current date in YYYY-MM-DD format based on local/IST time.
 */
export function getFormattedDateString(d: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
}

/**
 * Cumulative daily random increments added since launch day.
 * For every day after launch (2026-10-11), adds that day's random integer in [1, 10].
 */
export function calculateDailyAccumulated(now: Date = new Date()): number {
  const todayStr = getFormattedDateString(now);
  const start = new Date(`${LAUNCH_DATE}T00:00:00Z`);
  const current = new Date(`${todayStr}T00:00:00Z`);

  let sum = 0;
  const loopDate = new Date(start);

  while (loopDate < current) {
    loopDate.setDate(loopDate.getDate() + 1);
    const dStr = getFormattedDateString(loopDate);
    sum += getDailyIncrementForDate(dStr);
  }

  return sum;
}

/**
 * Deterministic fallback calculation in case the database is offline.
 */
export function calculateDeterministicVisitorCount(now: Date = new Date()): {
  totalCount: number;
  todayIncrement: number;
  todayDateStr: string;
} {
  const todayStr = getFormattedDateString(now);
  const dailyBonus = calculateDailyAccumulated(now);
  const todayIncrement = getDailyIncrementForDate(todayStr);

  return {
    totalCount: LAUNCH_BASELINE + dailyBonus,
    todayIncrement,
    todayDateStr: todayStr,
  };
}

/**
 * Retrieves the live visitor count, synchronizing with Neon PostgreSQL.
 * Logic:
 * Total = 17 (baseline) + [every viewer visit / reload] + [daily random 1-10 increment for each day after launch]
 */
export async function getLiveVisitorCount(): Promise<{
  totalCount: number;
  todayIncrement: number;
  todayDateStr: string;
}> {
  const todayDateStr = getFormattedDateString();
  const dailyBonus = calculateDailyAccumulated();
  const todayIncrement = getDailyIncrementForDate(todayDateStr);

  if (!process.env.DATABASE_URL) {
    return {
      totalCount: LAUNCH_BASELINE + dailyBonus,
      todayIncrement,
      todayDateStr,
    };
  }

  try {
    const record = await prisma.siteVisitor.findUnique({
      where: { id: "singleton" },
    });

    if (!record) {
      await prisma.siteVisitor.create({
        data: {
          id: "singleton",
          baseCount: LAUNCH_BASELINE,
          extraVisits: 0,
          lastUpdatedDate: todayDateStr,
        },
      });
      return {
        totalCount: LAUNCH_BASELINE + dailyBonus,
        todayIncrement,
        todayDateStr,
      };
    }

    const totalCount = LAUNCH_BASELINE + dailyBonus + record.extraVisits;

    return {
      totalCount,
      todayIncrement,
      todayDateStr,
    };
  } catch (err) {
    console.warn("[Visitor Count] DB read failed, using baseline logic:", err);
    return {
      totalCount: LAUNCH_BASELINE + dailyBonus,
      todayIncrement,
      todayDateStr,
    };
  }
}

/**
 * Increments the visitor count by 1 on every visit by any viewer or returning visitor.
 */
export async function recordVisitorHit(): Promise<number> {
  const todayDateStr = getFormattedDateString();
  const dailyBonus = calculateDailyAccumulated();

  if (!process.env.DATABASE_URL) {
    return LAUNCH_BASELINE + dailyBonus;
  }

  try {
    const updated = await prisma.siteVisitor.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        baseCount: LAUNCH_BASELINE,
        extraVisits: 1,
        lastUpdatedDate: todayDateStr,
      },
      update: {
        extraVisits: { increment: 1 },
      },
    });

    return LAUNCH_BASELINE + dailyBonus + updated.extraVisits;
  } catch (err) {
    console.warn("[Visitor Count] DB increment failed:", err);
    return LAUNCH_BASELINE + dailyBonus;
  }
}

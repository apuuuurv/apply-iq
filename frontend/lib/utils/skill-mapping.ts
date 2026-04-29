/**
 * Maps a proficiency percentage (0-100) to a database skill level (1-5)
 */
export function percentToLevel(percent: number): number {
  return Math.max(1, Math.min(5, Math.ceil(percent / 20)))
}

/**
 * Maps a database skill level (1-5) to a proficiency percentage (0-100)
 */
export function levelToPercent(level: number): number {
  return Math.max(0, Math.min(100, level * 20))
}

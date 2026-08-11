export const POLL_TYPES = ['multi', 'yes/no', 'rank'] as const;
export type PollType = (typeof POLL_TYPES)[number];

export function isPollType(value: unknown): value is PollType {
  return typeof value === 'string' && (POLL_TYPES as readonly string[]).includes(value);
}

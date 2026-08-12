import { isPollType, type PollType } from '@/lib/polls/poll-types';

export const POLL_LIMITS = {
  titleMax: 200,
  descriptionMax: 2000,
  optionsMin: 1,
  optionsMax: 20,
  optionTitleMax: 200,
  optionDescriptionMax: 1000,
} as const;

export type CreatePollOptionInput = {
  name: string;
  description: string;
};

export type CreatePollPayload = {
  title: string;
  description: string;
  type: PollType;
  options: CreatePollOptionInput[];
};

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.trim();
}

/**
 * Validates and normalizes a create-poll JSON payload.
 * Returns trimmed strings so callers can insert without re-checking.
 */
export function validateCreatePollPayload(
  raw: unknown
): { ok: true; data: CreatePollPayload } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Invalid payload' };
  }

  const body = raw as Record<string, unknown>;

  const title = asTrimmedString(body.title);
  if (title === null) {
    return { ok: false, error: 'Title must be a string' };
  }
  if (!title) {
    return { ok: false, error: 'Title is required' };
  }
  if (title.length > POLL_LIMITS.titleMax) {
    return { ok: false, error: `Title must be at most ${POLL_LIMITS.titleMax} characters` };
  }

  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== 'string'
  ) {
    return { ok: false, error: 'Description must be a string' };
  }
  const normalizedDescription =
    typeof body.description === 'string' ? body.description.trim() : '';
  if (normalizedDescription.length > POLL_LIMITS.descriptionMax) {
    return {
      ok: false,
      error: `Description must be at most ${POLL_LIMITS.descriptionMax} characters`,
    };
  }

  if (!isPollType(body.type)) {
    return { ok: false, error: 'Invalid poll type. Must be one of: multi, yes/no, rank' };
  }

  if (!Array.isArray(body.options)) {
    return { ok: false, error: 'Options must be an array' };
  }
  if (body.options.length < POLL_LIMITS.optionsMin) {
    return { ok: false, error: 'At least one option is required' };
  }
  if (body.options.length > POLL_LIMITS.optionsMax) {
    return {
      ok: false,
      error: `At most ${POLL_LIMITS.optionsMax} options are allowed`,
    };
  }

  const options: CreatePollOptionInput[] = [];
  for (let i = 0; i < body.options.length; i++) {
    const option = body.options[i];
    if (!option || typeof option !== 'object') {
      return { ok: false, error: `Option ${i + 1} is invalid` };
    }
    const opt = option as Record<string, unknown>;

    const name = asTrimmedString(opt.name);
    if (name === null) {
      return { ok: false, error: `Option ${i + 1} name must be a string` };
    }
    if (!name) {
      return { ok: false, error: `Option ${i + 1} name is required` };
    }
    if (name.length > POLL_LIMITS.optionTitleMax) {
      return {
        ok: false,
        error: `Option ${i + 1} name must be at most ${POLL_LIMITS.optionTitleMax} characters`,
      };
    }

    if (
      opt.description !== undefined &&
      opt.description !== null &&
      typeof opt.description !== 'string'
    ) {
      return { ok: false, error: `Option ${i + 1} description must be a string` };
    }
    const normalizedOptionDescription =
      typeof opt.description === 'string' ? opt.description.trim() : '';
    if (normalizedOptionDescription.length > POLL_LIMITS.optionDescriptionMax) {
      return {
        ok: false,
        error: `Option ${i + 1} description must be at most ${POLL_LIMITS.optionDescriptionMax} characters`,
      };
    }

    options.push({
      name,
      description: normalizedOptionDescription,
    });
  }

  return {
    ok: true,
    data: {
      title,
      description: normalizedDescription,
      type: body.type,
      options,
    },
  };
}

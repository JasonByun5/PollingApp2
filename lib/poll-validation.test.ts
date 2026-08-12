import { describe, expect, it } from 'vitest';
import { POLL_LIMITS, validateCreatePollPayload } from '@/lib/poll-validation';

const validPayload = {
  title: 'Lunch spot?',
  description: 'Pick one',
  type: 'multi',
  options: [
    { name: 'Pizza', description: 'Cheesy' },
    { name: 'Sushi', description: '' },
  ],
};

describe('validateCreatePollPayload', () => {
  it('accepts a valid payload and trims strings', () => {
    const result = validateCreatePollPayload({
      title: '  Lunch spot?  ',
      description: '  Pick one  ',
      type: 'multi',
      options: [
        { name: '  Pizza  ', description: '  Cheesy  ' },
        { name: 'Sushi', description: undefined },
      ],
    });

    expect(result).toEqual({
      ok: true,
      data: {
        title: 'Lunch spot?',
        description: 'Pick one',
        type: 'multi',
        options: [
          { name: 'Pizza', description: 'Cheesy' },
          { name: 'Sushi', description: '' },
        ],
      },
    });
  });

  it('rejects non-object payloads', () => {
    expect(validateCreatePollPayload(null)).toEqual({
      ok: false,
      error: 'Invalid payload',
    });
    expect(validateCreatePollPayload('nope')).toEqual({
      ok: false,
      error: 'Invalid payload',
    });
  });

  it('requires a non-empty title string', () => {
    expect(validateCreatePollPayload({ ...validPayload, title: '' })).toEqual({
      ok: false,
      error: 'Title is required',
    });
    expect(validateCreatePollPayload({ ...validPayload, title: 42 })).toEqual({
      ok: false,
      error: 'Title must be a string',
    });
  });

  it('enforces title max length', () => {
    const result = validateCreatePollPayload({
      ...validPayload,
      title: 'a'.repeat(POLL_LIMITS.titleMax + 1),
    });
    expect(result).toEqual({
      ok: false,
      error: `Title must be at most ${POLL_LIMITS.titleMax} characters`,
    });
  });

  it('rejects invalid poll types', () => {
    expect(validateCreatePollPayload({ ...validPayload, type: 'weighted' })).toEqual({
      ok: false,
      error: 'Invalid poll type. Must be one of: multi, yes/no, rank',
    });
  });

  it('requires options to be a non-empty array within limits', () => {
    expect(validateCreatePollPayload({ ...validPayload, options: [] })).toEqual({
      ok: false,
      error: 'At least one option is required',
    });
    expect(validateCreatePollPayload({ ...validPayload, options: 'x' })).toEqual({
      ok: false,
      error: 'Options must be an array',
    });

    const tooMany = Array.from({ length: POLL_LIMITS.optionsMax + 1 }, (_, i) => ({
      name: `Option ${i + 1}`,
      description: '',
    }));
    expect(validateCreatePollPayload({ ...validPayload, options: tooMany })).toEqual({
      ok: false,
      error: `At most ${POLL_LIMITS.optionsMax} options are allowed`,
    });
  });

  it('requires option names and enforces option name max length', () => {
    expect(
      validateCreatePollPayload({
        ...validPayload,
        options: [{ name: '', description: '' }],
      })
    ).toEqual({
      ok: false,
      error: 'Option 1 name is required',
    });

    expect(
      validateCreatePollPayload({
        ...validPayload,
        options: [{ name: 'a'.repeat(POLL_LIMITS.optionTitleMax + 1), description: '' }],
      })
    ).toEqual({
      ok: false,
      error: `Option 1 name must be at most ${POLL_LIMITS.optionTitleMax} characters`,
    });
  });

  it('accepts yes/no and rank types', () => {
    expect(validateCreatePollPayload({ ...validPayload, type: 'yes/no' }).ok).toBe(true);
    expect(validateCreatePollPayload({ ...validPayload, type: 'rank' }).ok).toBe(true);
  });
});

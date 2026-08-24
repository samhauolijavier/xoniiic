/*
 * The questions we hand somebody who has agreed to write a testimonial.
 *
 * Two problems this solves.
 *
 * The first is blankness. "Write a few lines about working with us" produces
 * "Spencer is great to work with, highly recommend" — polite, true, and worth
 * nothing to a business owner deciding whether to hire from here. A specific
 * question gets a specific answer.
 *
 * The second is sameness. Fifteen people given one list will mostly answer the
 * first two questions on it, and a testimonials section where every entry has
 * the same shape reads as scripted. So the questions are grouped by the KIND of
 * sentence they produce — a before, a result, a texture, a recommendation — and
 * we ask for answers from different groups. Variety comes from the structure
 * rather than from hoping people choose differently.
 *
 * One source, two consumers: the invitation email and the dashboard form. The
 * email is long gone by the time somebody sits down to write, so the same
 * prompts have to be at the keyboard too.
 */

export interface PromptGroup {
  key: string
  title: string
  /** What this group is for — shown to the writer, not internal. */
  hint: string
  questions: string[]
}

/** Pick this many, from at least two different groups. */
export const PROMPTS_TO_ANSWER = 3

export const PROMPT_GROUPS: PromptGroup[] = [
  {
    key: 'before',
    title: 'Where you were before',
    hint: 'The starting point is what makes the rest mean anything.',
    questions: [
      'What were you doing for work before this, and what was it paying?',
      'What was the hardest part of trying to get hired online?',
      'Were you turned down before? What did people say they wanted that you did not have?',
      'What worried you most about working for someone overseas?',
    ],
  },
  {
    key: 'result',
    title: 'What actually happened',
    hint: 'Numbers and timeframes, wherever you are comfortable giving them.',
    questions: [
      'What kind of work do you do now, and roughly how many hours a week?',
      'What changed financially? A comparison is fine if you would rather not give a figure — "about double what I made locally" says plenty.',
      'How long was it from starting to actually being hired?',
      'What can you do now that you could not do a year ago?',
      'Has anything changed at home because of it?',
    ],
  },
  {
    key: 'texture',
    title: 'What it is really like',
    hint: 'The details nobody puts in a job post. These are the lines people believe.',
    questions: [
      'Describe an ordinary day. What does the work actually look like?',
      'What is the best part that nobody warned you about?',
      'What is genuinely hard about it that someone considering this should know?',
      'What are your clients like to work with?',
      'What surprised you most in the first month?',
    ],
  },
  {
    key: 'advice',
    title: 'What you would tell someone else',
    hint: 'Written to a friend who has not started yet, not to us.',
    questions: [
      'What would you say to someone who is thinking about this but has not started?',
      'What is the one thing you would tell them to do first?',
      'What do you wish somebody had told you at the beginning?',
      'Who is this genuinely not a good fit for?',
    ],
  },
]

/**
 * The rule that matters most, and the reason it exists.
 *
 * A named client is somebody else's business in our marketing, and some of
 * these placements are under agreements that would not welcome it. The
 * substitution costs nothing: "a US real estate agency" carries the same
 * credibility as the actual name, because the reader has never heard of the
 * actual name either.
 */
export const NO_NAMES_RULE =
  'Please do not name the company you work for. Describe it instead — "a US real estate agency", "an e-commerce brand in Australia", "a marketing agency in Texas". It reads exactly as well and it keeps your client out of our marketing.'

/** Shown once, because one example teaches register faster than any instruction. */
export const EXAMPLE_WEAK =
  'Spencer is great to work with and I would recommend Virtual Freaks to anybody looking for remote work.'

export const EXAMPLE_STRONG =
  'I was doing admin at a BPO in Cebu and I had applied to about forty online jobs without a single reply — nobody wanted someone with no proof they could do it. Six weeks in I was working mornings for a US real estate agency for more than I had been making full time. The part nobody mentions is the schedule; it took me a month to stop feeling wrecked, and I would tell anyone starting to sort that out first.'

export const LENGTH_GUIDE = 'Three to six sentences is the sweet spot — long enough to be specific, short enough that people finish reading it.'

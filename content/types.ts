export type Theme = 'dark' | 'light';

export type MockLine =
  | { kind: 'nav'; items: string[]; active?: string }
  | { kind: 'row'; label: string; sub?: string }
  | { kind: 'button'; label: string; primary?: boolean }
  | { kind: 'chips'; items: string[]; active?: string }
  | { kind: 'status'; label: string }
  | { kind: 'itinerary'; items: string[]; doneCount?: number }
  | { kind: 'checkbox'; label: string }
  | { kind: 'big'; label: string }
  | { kind: 'qr' };

export interface Step {
  /** '1'–'5' for numbered slides, 'A'–'C' for the lettered refill slide. */
  marker: string;
  caption: string;
  mockTitle?: string;
  mock: MockLine[];
}

export interface Callout {
  title: string;
  body: string;
}

export interface Stat {
  value: string;
  body: string;
}

export interface OverviewCard {
  number: string;
  title: string;
  body: string;
}

export interface QuizOption {
  label: string;
  correct: boolean;
}

export interface Quiz {
  question: string;
  options: QuizOption[];
  correctFeedback: string;
  retryFeedback: string;
}

export type SlideBody =
  | { kind: 'cover'; presentedBy: string[]; intro: string }
  | { kind: 'overview'; cards: OverviewCard[] }
  | { kind: 'steps'; callout?: Callout; stat?: Stat; steps: Step[]; lettered?: boolean }
  | { kind: 'video'; embedUrl: string; posterTitle: string; posterBody: string }
  | { kind: 'practice'; tasks: string[]; quiz: Quiz; help: Callout };

export interface Slide {
  id: string;
  /** Display only — '01'…'11'. */
  number: string;
  /** Short name for progress dots and screen-reader announcements. */
  label: string;
  eyebrow?: string;
  title: string;
  lede?: string;
  theme: Theme;
  body: SlideBody;
  /** Narration script. Also rendered as on-screen captions. */
  speakerNotes: string;
}

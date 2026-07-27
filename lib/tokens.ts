export const PALETTE = {
  care: '#E4572E',
  careText: '#BC421D',
  steel: '#5980a6',
  steelMid: '#416180',
  steelLt: '#94bce3',
  paper: '#f2f2f3',
  ink: '#1d1f20',
  inkSoft: '#424244',
  steel900: '#1d2d3d',
  onDark: '#d6ebff',
  onDarkSoft: '#bdd8f2',
} as const;

export interface ColourPair {
  fg: string;
  bg: string;
}

/** Pairs used for text below 24px. Must meet 4.5:1. */
export const BODY_TEXT_PAIRS: ColourPair[] = [
  { fg: PALETTE.ink, bg: PALETTE.paper },
  { fg: PALETTE.inkSoft, bg: PALETTE.paper },
  { fg: PALETTE.steelMid, bg: PALETTE.paper },
  { fg: PALETTE.careText, bg: PALETTE.paper },
  { fg: PALETTE.paper, bg: PALETTE.steel900 },
  { fg: PALETTE.onDark, bg: PALETTE.steel900 },
  { fg: PALETTE.onDarkSoft, bg: PALETTE.steel900 },
  { fg: PALETTE.steelLt, bg: PALETTE.steel900 },
];

/** Pairs used only for headings, large numerals, rules and control chrome. */
export const LARGE_TEXT_PAIRS: ColourPair[] = [
  { fg: PALETTE.care, bg: PALETTE.paper },
  { fg: PALETTE.care, bg: PALETTE.steel900 },
  { fg: PALETTE.steel, bg: PALETTE.paper },
];

import type { PartName } from './sprite-types';

// ---------------------------------------------------------------------------
// Viseme-based mouth frame imports
// Based on Meta OVRLipSync viseme reference:
// https://developers.meta.com/horizon/documentation/native/audio-ovrlipsync-viseme-reference/
//
// Viseme key → phonemes covered:
//   neutral  — silent / rest position
//   pbm      — P, B, M  (lips pressed together)
//   fv       — F, V     (lower lip to upper teeth)
//   th       — TH       (tongue between teeth)
//   tdkgn    — T, D, K, G, N (tongue tip or back pressed to palate)
//   ss       — S, Z     (teeth together, slight opening)
//   ch       — SH, CH, J (teeth together, lips slightly rounded)
//   r        — R        (lips slightly rounded, tongue curled)
//   aa       — A as in "car", "father"
//   e        — E as in "bed", "red"
//   i        — I as in "tip", "sit"
//   o        — O as in "go", "boat"
//   u        — U as in "you", "blue", OO as in "food"
// ---------------------------------------------------------------------------
import MOUTH_NEUTRAL from '../assets/frames/mouth/mouth_neutral.png';
import MOUTH_PBM from '../assets/frames/mouth/mouth_pbm.png';
import MOUTH_FV from '../assets/frames/mouth/mouth_fv.png';
import MOUTH_TH from '../assets/frames/mouth/mouth_th.png';
import MOUTH_TDKGN from '../assets/frames/mouth/mouth_tdkgn.png';
import MOUTH_SS from '../assets/frames/mouth/mouth_ss.png';
import MOUTH_CH from '../assets/frames/mouth/mouth_ch.png';
import MOUTH_R from '../assets/frames/mouth/mouth_r.png';
import MOUTH_AA from '../assets/frames/mouth/mouth_aa.png';
import MOUTH_EH from '../assets/frames/mouth/mouth_eh.png';
import MOUTH_I from '../assets/frames/mouth/mouth_i.png';
import MOUTH_O from '../assets/frames/mouth/mouth_o.png';
import MOUTH_U from '../assets/frames/mouth/mouth_u.png';
import MOUTH_EY from '../assets/frames/mouth/mouth_ey.png';
import MOUTH_EE from '../assets/frames/mouth/mouth_ee.png';
import MOUTH_AAA from '../assets/frames/mouth/mouth_aaa.png';
import MOUTH_OO from '../assets/frames/mouth/mouth_oo.png';
import MOUTH_A from '../assets/frames/mouth/mouth_a.png';

// ---------------------------------------------------------------------------
// Eyebrow frame imports
// ---------------------------------------------------------------------------
import BROWS_IDLE from '../assets/frames/brows/brows_idle.png';
import BROWS_LU from '../assets/frames/brows/brows_lu.png';
import BROWS_RU from '../assets/frames/brows/brows_ru.png';
import BROWS_BU from '../assets/frames/brows/brows_bu.png';
import BROWS_TG from '../assets/frames/brows/brows_tg.png';

// ---------------------------------------------------------------------------
// Eye frame imports
// ---------------------------------------------------------------------------
import EYES_IDLE from '../assets/frames/eyes/eyes_idle.png';
import EYES_CLOSED from '../assets/frames/eyes/eyes_closed.png';
import EYES_BHC from '../assets/frames/eyes/eyes_bhc.png';
import EYES_LHC from '../assets/frames/eyes/eyes_lhc.png';
import EYES_RHC from '../assets/frames/eyes/eyes_rhc.png';
import EYES_FIRE from '../assets/frames/eyes/eyes_fire.png';
import EYES_GOLDEN from '../assets/frames/eyes/eyes_golden.png';
import EYES_WIDE from '../assets/frames/eyes/eyes_wide.png';

// --- Re-export frame assets for external use ---
// "closed" is kept as an alias for neutral to maintain backward compatibility
// with avatar-compositor.ts (MOUTH_FRAMES.closed).
export const MOUTH_FRAMES = {
  // Backward-compatible alias
  closed: MOUTH_NEUTRAL,

  // Viseme frames
  neutral: MOUTH_NEUTRAL,
  pbm: MOUTH_PBM,
  fv: MOUTH_FV,
  th: MOUTH_TH,
  tdkgn: MOUTH_TDKGN,
  ss: MOUTH_SS,
  ch: MOUTH_CH,
  r: MOUTH_R,
  aa: MOUTH_AA,
  eh: MOUTH_EH,
  i: MOUTH_I,
  o: MOUTH_O,
  u: MOUTH_U,
  ey: MOUTH_EY,
  ee: MOUTH_EE,
  aaa: MOUTH_AAA,
  oo: MOUTH_OO,
  a: MOUTH_A
} as const;

export const BROW_FRAMES = {
  idle: BROWS_IDLE,
  lu: BROWS_LU,
  ru: BROWS_RU,
  bu: BROWS_BU,
  tg: BROWS_TG,
} as const;

export const EYE_FRAMES = {
  idle: EYES_IDLE,
  closed: EYES_CLOSED,
  bhc: EYES_BHC,
  lhc: EYES_LHC,
  rhc: EYES_RHC,
  fire: EYES_FIRE,
  golden: EYES_GOLDEN,
  wide: EYES_WIDE,
} as const;

/**
 * Per-part frame sequence for a single word.
 * Only parts that change during speech need entries.
 * Omitted parts keep their current animation.
 */
export type WordFrames = Partial<Record<PartName, string[]>>;

/**
 * Pause configuration driven by trailing punctuation.
 * The number of times the last frame of a word is duplicated
 * to simulate a hold/pause after that word.
 */
export const PUNCTUATION_PAUSE_FRAMES: Record<string, number> = {
  '.': 3,   // Full stop — moderate pause
  '!': 3,   // Exclamation — moderate pause
  '?': 4,   // Question — slightly longer (suggests thinking)
  ',': 2,   // Comma — short breath pause
  ';': 2,   // Semicolon — short pause
  ':': 2,   // Colon — short pause
  '...': 5, // Ellipsis — long dramatic pause
};

/**
 * Default frame sequence used for any word not in the map.
 * A generic open-close mouth cycle using viseme vowels.
 */
export const DEFAULT_WORD_FRAMES: WordFrames = {
  mouth: [MOUTH_NEUTRAL, MOUTH_AA, MOUTH_EH, MOUTH_AA, MOUTH_NEUTRAL],
};

// ---------------------------------------------------------------------------
//  WORD → VISEME FRAME MAP
//
//  Each word is broken into its constituent phonemes and mapped to the
//  corresponding viseme mouth frame. This produces a sequence of mouth
//  shapes that approximate how the word is actually articulated.
//
//  Viseme shape legend (Meta OVRLipSync):
//    neutral  — rest / silent mouth
//    pbm      — P, B, M (bilabial closure)
//    fv       — F, V (labiodental)
//    th       — TH (interdental)
//    tdkgn    — T, D, K, G, N (alveolar / velar stops & nasal)
//    ss       — S, Z (alveolar sibilants)
//    ch       — SH, CH, J (post-alveolar)
//    r        — R (retroflex / rounded)
//    aa       — open vowel (car, father)
//    e        — mid-front vowel (bed, get)
//    i        — close-front vowel (tip, sit)
//    o        — mid-back rounded vowel (go, boat)
//    u        — close-back rounded vowel (you, food)
// ---------------------------------------------------------------------------
export const WORD_FRAME_MAP: Record<string, WordFrames> = {
  // ── Greetings ──────────────────────────────────────────────────────────
  'hello': {
    // EH-lOH
    mouth: [MOUTH_EH, MOUTH_O],
  },
  'hi': {
    // AY
    mouth: [MOUTH_AA],
  },
  'hey': {
    // EY 
    mouth: [MOUTH_EY],
  },
  'bye': {
    // b-AY → pbm, aa, i
    mouth: [MOUTH_PBM, MOUTH_EE],
  },
  'welcome': {
    // w-EH-l-k-AH-m → u(w), el, k, aa, pbm(m)
    mouth: [MOUTH_U, MOUTH_EH, MOUTH_TDKGN, MOUTH_AA, MOUTH_PBM],
  },
  'goodbye': {
    // UH-d-b-AY → u, tdkgn(d)-pbm(b), ey
    mouth: [MOUTH_U, MOUTH_PBM, MOUTH_EY],
  },

  // ── Pronouns & determiners ─────────────────────────────────────────────
  'i': {
    // AY → aa
    mouth: [MOUTH_EY],
  },
  'a': {
    // AH → aa
    mouth: [MOUTH_AA],
  },
  'the': {
    // DH-AH → th
    mouth: [MOUTH_TH],
  },
  'this': {
    // DH-IH-S → th, i, ss
    mouth: [MOUTH_SS],
  },
  'that': {
    // DH-AE-T → aa, tdkgn
    mouth: [MOUTH_AA, MOUTH_TDKGN],
  },
  'you': {
    // Y-UW →  u
    mouth: [MOUTH_U],
  },
  'your': {
    // Y-OR →  o, r
    mouth: [MOUTH_O, MOUTH_R],
  },
  'my': {
    // M-AY → pbm, i
    mouth: [MOUTH_PBM, MOUTH_EY],
  },
  'me': {
    // M-IY → pbm, ee
    mouth: [MOUTH_PBM, MOUTH_EE],
  },
  'we': {
    // W-IY → u, ee
    mouth: [MOUTH_U, MOUTH_EE],
  },
  'he': {
    // H-IY → ee
    mouth: [MOUTH_EE],
  },
  'she': {
    // SH-IY → ch, ee
    mouth: [MOUTH_CH, MOUTH_EE],
  },
  'it': {
    // IH-T → i
    mouth: [MOUTH_EE],
  },
  'they': {
    // DH-EY → th, ey
    mouth: [MOUTH_TH, MOUTH_EY],
  },
  'them': {
    // DH-EH-M → eh, pbm
    mouth: [MOUTH_EH, MOUTH_PBM],
  },
  'their': {
    // DH-EH-R → eh, r
    mouth: [MOUTH_TH, MOUTH_R],
  },
  'our': {
    // AW-R → aa, r
    mouth: [MOUTH_U, MOUTH_R],
  },

  // ── Common be / have / do ──────────────────────────────────────────────
  'is': {
    // IH-Z → i, ss
    mouth: [MOUTH_EE, MOUTH_SS],
  },
  'am': {
    // AE-M → aa, pbm
    mouth: [MOUTH_AA, MOUTH_PBM],
  },
  'are': {
    // AA-R → aa, r
    mouth: [MOUTH_AA, MOUTH_R],
  },
  'was': {
    // W-AH-Z → aa, ss
    mouth: [MOUTH_AA, MOUTH_SS],
  },
  'were': {
    // W-ER → eh, r
    mouth: [MOUTH_EH, MOUTH_R],
  },
  'be': {
    // B-IY → pbm, ee
    mouth: [MOUTH_PBM, MOUTH_EE],
  },
  'been': {
    // B-IH-N → pbm, ee
    mouth: [MOUTH_PBM, MOUTH_EE],
  },
  'have': {
    // H-AE-V → aa, fv
    mouth: [MOUTH_AA, MOUTH_FV],
  },
  'has': {
    // H-AE-Z → aa, ss
    mouth: [MOUTH_AA, MOUTH_SS],
  },
  'had': {
    // H-AE-D → aa, tdkgn
    mouth: [MOUTH_AA, MOUTH_TDKGN],
  },
  'do': {
    // D-UW → u
    mouth: [MOUTH_U],
  },
  'doing': {
    // D-UW-ING → u - ee
    mouth: [MOUTH_U, MOUTH_EE],
  },
  'does': {
    // D-AH-Z → aa, ss
    mouth: [MOUTH_AA, MOUTH_SS],
  },
  'did': {
    // D-IH-D → tdkgn
    mouth: [MOUTH_TDKGN],
  },

  // ── Common short words ─────────────────────────────────────────────────
  'to': {
    // T-UW → u
    mouth: [MOUTH_U],
  },
  'of': {
    // AH-V → aa, fv
    mouth: [MOUTH_AA, MOUTH_FV],
  },
  'in': {
    // IH-N → i
    mouth: [MOUTH_TDKGN],
  },
  'on': {
    // AA-N → aa
    mouth: [MOUTH_O],
  },
  'at': {
    // AE-T → aa
    mouth: [MOUTH_AA],
  },
  'an': {
    // AE-N → aa
    mouth: [MOUTH_AA],
  },
  'or': {
    // AO-R → o, r
    mouth: [MOUTH_O, MOUTH_R],
  },
  'and': {
    // AE-N-D → aa, tdkgn
    mouth: [MOUTH_AA, MOUTH_TDKGN],
  },
  'but': {
    // B-AH-T → pbm, aa
    mouth: [MOUTH_PBM, MOUTH_AA],
  },
  'so': {
    // S-OW → ss, o
    mouth: [MOUTH_SS, MOUTH_O],
  },
  'if': {
    // IH-F → fv
    mouth: [MOUTH_FV],
  },
  'for': {
    // F-AO-R → fv, o
    mouth: [MOUTH_FV, MOUTH_O],
  },
  'with': {
    // W-IH-TH → i, th
    mouth: [MOUTH_I, MOUTH_TH],
  },
  'from': {
    // F-R-AH-M → fv, aa, pbm
    mouth: [MOUTH_FV, MOUTH_AA, MOUTH_PBM],
  },
  'up': {
    // AH-P → aa, pbm
    mouth: [MOUTH_AA, MOUTH_PBM],
  },
  'out': {
    // AW-T → aa, u
    mouth: [MOUTH_AA, MOUTH_U],
  },
  'just': {
    // JH-AH-S-T → ch, aa, ss
    mouth: [MOUTH_AA, MOUTH_SS],
  },
  'like': {
    // L-AY-K → aa, tdkgn
    mouth: [MOUTH_AA, MOUTH_TDKGN],
  },
  'about': {
    // AH-B-AW-T → aa, pbm, aa
    mouth: [MOUTH_AA, MOUTH_PBM, MOUTH_AA],
  },

  // ── Affirmation / negation ─────────────────────────────────────────────
  'yes': {
    // Y-EH-S → eh, ss
    mouth: [MOUTH_EH, MOUTH_SS],
  },
  'no': {
    // N-OW → o
    mouth: [MOUTH_O],
  },
  'not': {
    // N-AA-T → aa, tdkgn
    mouth: [MOUTH_AA, MOUTH_TDKGN],
  },
  'ok': {
    // OW-K-EY → o, ey
    mouth: [MOUTH_O, MOUTH_EY],
  },
  'okay': {
    // OW-K-EY → o, tdkgn, ey
    mouth: [MOUTH_O, MOUTH_TDKGN, MOUTH_EY],
  },
  'sure': {
    // SH-UH-R →  u, r
    mouth: [MOUTH_U, MOUTH_R],
  },

  // ── Question / reaction words ──────────────────────────────────────────
  'what': {
    // W-AH-T → aa, tdkgn
    mouth: [MOUTH_OO, MOUTH_TDKGN],
  },
  'why': {
    // W-AY → aa, ey 
    mouth: [MOUTH_U, MOUTH_EY],
  },
  'how': {
    // H-AW → aa, u
    mouth: [MOUTH_AA, MOUTH_U],
  },
  'when': {
    // W-EH-N → eh, tdkgn
    mouth: [MOUTH_U, MOUTH_TDKGN],
  },
  'where': {
    // W-EH-R → eh, r
    mouth: [MOUTH_U, MOUTH_R],
  },
  'who': {
    // H-UW → u
    mouth: [MOUTH_OO],
  },
  'which': {
    // W-IH-CH → i, ch
    mouth: [MOUTH_U, MOUTH_CH],
  },
  'huh': {
    // H-AH → aa
    mouth: [MOUTH_AA],
  },
  'hmm': {
    // M (sustained hum) → pbm held
    mouth: [MOUTH_PBM, MOUTH_PBM],
  },
  'oh': {
    // OW → o
    mouth: [MOUTH_O, MOUTH_O],
  },
  'wow': {
    // W-AW → aa, u
    mouth: [MOUTH_OO, MOUTH_AAA],
  },
  'please': {
    // P-L-IY-Z → pbm, ee, ss
    mouth: [MOUTH_PBM, MOUTH_EE, MOUTH_SS],
  },
  'thanks': {
    // TH-AE-NG-K-S → th, aa, ss
    mouth: [MOUTH_A, MOUTH_SS, MOUTH_SS],
  },
  'thank': {
    // TH-AE-NG-K → th, aa, tdkgn
    mouth: [MOUTH_A],
  },
  'sorry': {
    // S-AA-R-IY → ss, aa, r, ee
    mouth: [MOUTH_U, MOUTH_R, MOUTH_EE],
  },

  // ── Action words ───────────────────────────────────────────────────────
  'think': {
    // TH-IH-NG-K → th, i, tdkgn
    mouth: [MOUTH_TH, MOUTH_TDKGN],
  },
  'know': {
    // N-OW → o
    mouth: [MOUTH_O],
  },
  'see': {
    // S-IY → ss, ee
    mouth: [MOUTH_SS, MOUTH_EE],
  },
  'look': {
    // L-UH-K → u, tdkgn
    mouth: [MOUTH_OO],
  },
  'go': {
    // G-OW → o
    mouth: [MOUTH_OO],
  },
  'come': {
    // K-AH-M → aa, pbm
    mouth: [MOUTH_AA, MOUTH_PBM],
  },
  'stop': {
    // S-T-AA-P → ss, aa, pbm
    mouth: [MOUTH_SS, MOUTH_AA, MOUTH_PBM],
  },
  'start': {
    // S-T-AA-R-T → ss, aa, r
    mouth: [MOUTH_SS, MOUTH_AA, MOUTH_R],
  },
  'want': {
    // W-AA-N-T → aa, tdkgn
    mouth: [MOUTH_AA, MOUTH_TDKGN],
  },
  'need': {
    // N-IY-D → ee, tdkgn
    mouth: [MOUTH_EE, MOUTH_TDKGN],
  },
  'get': {
    // G-EH-T → eh, tdkgn
    mouth: [MOUTH_TDKGN],
  },
  'give': {
    // G-IH-V → i, fv
    mouth: [MOUTH_I, MOUTH_FV],
  },
  'take': {
    // T-EY-K → ey, tdkgn
    mouth: [MOUTH_EY, MOUTH_TDKGN],
  },
  'make': { // [HERE]
    // M-EY-K → pbm, ey, tdkgn
    mouth: [MOUTH_PBM, MOUTH_EY, MOUTH_TDKGN],
  },
  'say': {
    // S-EY → ss, ey
    mouth: [MOUTH_SS, MOUTH_EY],
  },
  'said': {
    // S-EH-D → ss, eh
    mouth: [MOUTH_SS, MOUTH_EH],
  },
  'tell': {
    // T-EH-L → eh, tdkgn
    mouth: [MOUTH_EH, MOUTH_TDKGN],
  },
  'help': {
    // HH-EH-L-P → eh, pbm
    mouth: [MOUTH_EH, MOUTH_PBM],
  },
  'try': {
    // T-R-AY → r, ey
    mouth: [MOUTH_R, MOUTH_EY],
  },
  'find': {
    // F-AY-N-D → fv, ey, tdkgn
    mouth: [MOUTH_FV, MOUTH_EY, MOUTH_TDKGN],
  },
  'feel': {
    // F-IY-L → fv, ee
    mouth: [MOUTH_FV, MOUTH_EE],
  },
  'love': {
    // L-AH-V → aa, fv
    mouth: [MOUTH_AA, MOUTH_FV],
  },
  'run': {
    // R-AH-N → r, aa
    mouth: [MOUTH_R, MOUTH_AA],
  },
  'move': {
    // M-UW-V → pbm, u, fv
    mouth: [MOUTH_PBM, MOUTH_U, MOUTH_FV],
  },

  // ── Contractions ───────────────────────────────────────────────────────
  "don't": {
    // D-OW-N-T → o, tdkgn
    mouth: [MOUTH_O, MOUTH_TDKGN],
  },
  "can't": {
    // K-AE-N-T → aa, tdkgn
    mouth: [MOUTH_AA, MOUTH_TDKGN],
  },
  "won't": {
    // W-OW-N-T → o, tdkgn
    mouth: [MOUTH_O, MOUTH_TDKGN],
  },
  "i'm": {
    // AY-M → ey, pbm
    mouth: [MOUTH_EY, MOUTH_PBM],
  },
  "it's": {
    // IH-T-S → i, ss
    mouth: [MOUTH_I, MOUTH_SS],
  },
  "that's": {
    // DH-AE-T-S → aa, ss
    mouth: [MOUTH_AA, MOUTH_SS],
  },
  "let's": {
    // L-EH-T-S → eh, ss
    mouth: [MOUTH_EH, MOUTH_SS],
  },
  "didn't": {
    // D-IH-D-N-T → i, tdkgn
    mouth: [MOUTH_I, MOUTH_TDKGN],
  },
  "you're": {
    // Y-UH-R → u, r
    mouth: [MOUTH_U, MOUTH_R],
  },
  "we're": {
    // W-IY-R → ee, r
    mouth: [MOUTH_EE, MOUTH_R],
  },

  // ── Adjectives / descriptors ───────────────────────────────────────────
  'good': {
    // G-UH-D → u, tdkgn
    mouth: [MOUTH_U, MOUTH_TDKGN],
  },
  'great': {
    // G-R-EY-T → r, ey, tdkgn
    mouth: [MOUTH_R, MOUTH_EY, MOUTH_TDKGN],
  },
  'bad': {
    // B-AE-D → pbm, aa
    mouth: [MOUTH_PBM, MOUTH_AA],
  },
  'big': {
    // B-IH-G → pbm, i
    mouth: [MOUTH_PBM, MOUTH_I],
  },
  'small': {
    // S-M-AO-L → ss, pbm, aa
    mouth: [MOUTH_SS, MOUTH_PBM, MOUTH_AA],
  },
  'new': {
    // N-UW → u
    mouth: [MOUTH_U],
  },
  'old': {
    // OW-L-D → o, tdkgn
    mouth: [MOUTH_O, MOUTH_TDKGN],
  },
  'right': {
    // R-AY-T → r, ey
    mouth: [MOUTH_R, MOUTH_EY],
  },
  'wrong': {
    // R-AO-NG → r, o
    mouth: [MOUTH_R, MOUTH_O],
  },
  'happy': {
    // H-AE-P-IY → aa, pbm, ee
    mouth: [MOUTH_AA, MOUTH_PBM, MOUTH_EE],
  },
  'sad': {
    // S-AE-D → ss, aa
    mouth: [MOUTH_SS, MOUTH_AA],
  },
  'fast': {
    // F-AE-S-T → fv, aa, ss
    mouth: [MOUTH_FV, MOUTH_AA, MOUTH_SS],
  },
  'slow': {
    // S-L-OW → ss, o
    mouth: [MOUTH_SS, MOUTH_O],
  },
  'very': {
    // V-EH-R-IY → fv, eh, r, ee
    mouth: [MOUTH_FV, MOUTH_EH, MOUTH_R, MOUTH_EE],
  },
  'much': {
    // M-AH-CH → pbm, aa, ch
    mouth: [MOUTH_PBM, MOUTH_AA, MOUTH_CH],
  },
  'more': {
    // M-AO-R → pbm, o, r
    mouth: [MOUTH_PBM, MOUTH_O, MOUTH_R],
  },

  // ── Nouns ──────────────────────────────────────────────────────────────
  'name': {
    // N-EY-M → ey, pbm
    mouth: [MOUTH_EY, MOUTH_PBM],
  },
  'time': {
    // T-AY-M → ey, pbm
    mouth: [MOUTH_EY, MOUTH_PBM],
  },
  'thing': {
    // TH-IH-NG → th, i
    mouth: [MOUTH_TH, MOUTH_I],
  },
  'world': {
    // W-ER-L-D → eh, r, tdkgn
    mouth: [MOUTH_EH, MOUTH_R, MOUTH_TDKGN],
  },
  'people': {
    // P-IY-P-AH-L → pbm, ee, pbm, aa
    mouth: [MOUTH_PBM, MOUTH_EE, MOUTH_PBM, MOUTH_AA],
  },
  'friend': {
    // F-R-EH-N-D → fv, r, eh, tdkgn
    mouth: [MOUTH_FV, MOUTH_R, MOUTH_EH, MOUTH_TDKGN],
  },
  'here': {
    // H-IH-R → i, r
    mouth: [MOUTH_I, MOUTH_R],
  },
  'there': {
    // DH-EH-R → th, eh, r
    mouth: [MOUTH_TH, MOUTH_EH, MOUTH_R],
  },
  'now': {
    // N-AW → aa, u
    mouth: [MOUTH_AA, MOUTH_U],
  },
  'way': {
    // W-EY → ey
    mouth: [MOUTH_EY],
  },

  // ── Modals / auxiliary ─────────────────────────────────────────────────
  'can': {
    // K-AE-N → aa, tdkgn
    mouth: [MOUTH_AA, MOUTH_TDKGN],
  },
  'will': {
    // W-IH-L → i, tdkgn
    mouth: [MOUTH_I, MOUTH_TDKGN],
  },
  'would': {
    // W-UH-D → u, tdkgn
    mouth: [MOUTH_U, MOUTH_TDKGN],
  },
  'could': {
    // K-UH-D → u, tdkgn
    mouth: [MOUTH_U, MOUTH_TDKGN],
  },
  'should': {
    // SH-UH-D → ch, u, tdkgn
    mouth: [MOUTH_CH, MOUTH_U, MOUTH_TDKGN],
  },
  'must': {
    // M-AH-S-T → pbm, aa, ss
    mouth: [MOUTH_PBM, MOUTH_AA, MOUTH_SS],
  },
  'may': {
    // M-EY → pbm, ey
    mouth: [MOUTH_PBM, MOUTH_EY],
  },
  'might': {
    // M-AY-T → pbm, ey
    mouth: [MOUTH_PBM, MOUTH_EY],
  },
  'let': {
    // L-EH-T → eh, tdkgn
    mouth: [MOUTH_EH, MOUTH_TDKGN],
  },

  // ── Misc high-frequency words ──────────────────────────────────────────
  'all': {
    // AO-L → aa
    mouth: [MOUTH_AA],
  },
  'some': {
    // S-AH-M → ss, aa, pbm
    mouth: [MOUTH_SS, MOUTH_AA, MOUTH_PBM],
  },
  'one': {
    // W-AH-N → aa
    mouth: [MOUTH_AA],
  },
  'two': {
    // T-UW → u
    mouth: [MOUTH_U],
  },
  'three': {
    // TH-R-IY → th, r, ee
    mouth: [MOUTH_TH, MOUTH_R, MOUTH_EE],
  },
  'four': {
    // F-AO-R → fv, o, r
    mouth: [MOUTH_FV, MOUTH_O, MOUTH_R],
  },
  'five': {
    // F-AY-V → fv, ey, fv
    mouth: [MOUTH_FV, MOUTH_EY, MOUTH_FV],
  },
  'every': {
    // EH-V-R-IY → eh, fv, r, ee
    mouth: [MOUTH_EH, MOUTH_FV, MOUTH_R, MOUTH_EE],
  },
  'never': {
    // N-EH-V-ER → eh, fv, r
    mouth: [MOUTH_EH, MOUTH_FV, MOUTH_R],
  },
  'always': {
    // AO-L-W-EY-Z → aa, ey, ss
    mouth: [MOUTH_AA, MOUTH_EY, MOUTH_SS],
  },
  'really': {
    // R-IY-L-IY → r, ee, tdkgn, ee
    mouth: [MOUTH_R, MOUTH_EE, MOUTH_TDKGN, MOUTH_EE],
  },
  'maybe': {
    // M-EY-B-IY → pbm, ey, pbm, ee
    mouth: [MOUTH_PBM, MOUTH_EY, MOUTH_PBM, MOUTH_EE],
  },
  'something': {
    // S-AH-M-TH-IH-NG → ss, aa, pbm, th, i
    mouth: [MOUTH_SS, MOUTH_AA, MOUTH_PBM, MOUTH_TH, MOUTH_I],
  },
  'nothing': {
    // N-AH-TH-IH-NG → aa, th, i
    mouth: [MOUTH_AA, MOUTH_TH, MOUTH_I],
  },
  'everything': {
    // EH-V-R-IY-TH-IH-NG → eh, fv, r, ee, th, i
    mouth: [MOUTH_EH, MOUTH_FV, MOUTH_R, MOUTH_EE, MOUTH_TH, MOUTH_I],
  },
  'because': {
    // B-IH-K-AH-Z → pbm, i, aa, ss
    mouth: [MOUTH_PBM, MOUTH_I, MOUTH_AA, MOUTH_SS],
  },

  // ── Test-sentence words (for exercising all visemes) ───────────────────
  'car': {
    // K-AA-R → aa, r
    mouth: [MOUTH_AA, MOUTH_R],
  },
  'chair': {
    // CH-EH-R → ch, eh, r
    mouth: [MOUTH_CH, MOUTH_EH, MOUTH_R],
  },
  'bed': {
    // B-EH-D → pbm, eh
    mouth: [MOUTH_PBM, MOUTH_EH],
  },
  'fat': {
    // F-AE-T → fv, aa
    mouth: [MOUTH_FV, MOUTH_AA],
  },
  'vat': {
    // V-AE-T → fv, aa
    mouth: [MOUTH_FV, MOUTH_AA],
  },
  'tip': {
    // T-IH-P → i, pbm
    mouth: [MOUTH_I, MOUTH_PBM],
  },
  'sit': {
    // S-IH-T → ss, i
    mouth: [MOUTH_SS, MOUTH_I],
  },
  'boat': {
    // B-OW-T → pbm, o
    mouth: [MOUTH_PBM, MOUTH_O],
  },
  'food': {
    // F-UW-D → fv, u
    mouth: [MOUTH_FV, MOUTH_U],
  },
  'blue': {
    // B-L-UW → pbm, u
    mouth: [MOUTH_PBM, MOUTH_U],
  },
  'red': {
    // R-EH-D → r, eh
    mouth: [MOUTH_R, MOUTH_EH],
  },
  'mother': {
    // M-AH-DH-ER → pbm, aa, th, r
    mouth: [MOUTH_PBM, MOUTH_AA, MOUTH_TH, MOUTH_R],
  },
  'father': {
    // F-AA-DH-ER → fv, aa, th, r
    mouth: [MOUTH_FV, MOUTH_AA, MOUTH_TH, MOUTH_R],
  },
  'fish': {
    // F-IH-SH → fv, i, ch
    mouth: [MOUTH_FV, MOUTH_I, MOUTH_CH],
  },
  'ship': {
    // SH-IH-P → ch, i, pbm
    mouth: [MOUTH_CH, MOUTH_I, MOUTH_PBM],
  },
  'thin': {
    // TH-IH-N → th, i
    mouth: [MOUTH_TH, MOUTH_I],
  },
  'rain': {
    // R-EY-N → r, ey
    mouth: [MOUTH_R, MOUTH_EY],
  },
  'sun': {
    // S-AH-N → ss, aa
    mouth: [MOUTH_SS, MOUTH_AA],
  },
  'moon': {
    // M-UW-N → pbm, u
    mouth: [MOUTH_PBM, MOUTH_U],
  },
  'book': {
    // B-UH-K → pbm, u
    mouth: [MOUTH_PBM, MOUTH_U],
  },
  'voice': {
    // V-OY-S → fv, o, ss
    mouth: [MOUTH_FV, MOUTH_O, MOUTH_SS],
  },
  'jump': {
    // JH-AH-M-P → ch, aa, pbm
    mouth: [MOUTH_CH, MOUTH_AA, MOUTH_PBM],
  },
  'quick': {
    // K-W-IH-K → u, i, tdkgn
    mouth: [MOUTH_U, MOUTH_I, MOUTH_TDKGN],
  },
  'brown': {
    // B-R-AW-N → pbm, r, aa
    mouth: [MOUTH_PBM, MOUTH_R, MOUTH_AA],
  },
  'fox': {
    // F-AA-K-S → fv, aa, ss
    mouth: [MOUTH_FV, MOUTH_AA, MOUTH_SS],
  },
  'lazy': {
    // L-EY-Z-IY → ey, ss, ee
    mouth: [MOUTH_EY, MOUTH_SS, MOUTH_EE],
  },
  'dog': {
    // D-AO-G → aa, tdkgn
    mouth: [MOUTH_AA, MOUTH_TDKGN],
  },
  'over': {
    // OW-V-ER → o, fv, r
    mouth: [MOUTH_O, MOUTH_FV, MOUTH_R],
  },
  'jumps': {
    // JH-AH-M-P-S → ch, aa, pbm, ss
    mouth: [MOUTH_CH, MOUTH_AA, MOUTH_PBM, MOUTH_SS],
  },
};

/**
 * Token produced by parsing input text.
 * Captures the word (lowercase, stripped of punctuation) and any
 * trailing punctuation mark for pause calculation.
 */
export interface SpeechToken {
  /** Lowercase word with punctuation stripped. */
  word: string;
  /** Trailing punctuation character(s), or empty string. */
  trailingPunctuation: string;
}

/**
 * Tokenize input text into SpeechTokens.
 *
 * Splits on whitespace, strips punctuation from each token,
 * and preserves trailing punctuation marks for pause logic.
 * Multi-character punctuation like "..." is detected first.
 */
export function tokenizeText(text: string): SpeechToken[] {
  const rawTokens = text.trim().split(/\s+/).filter(t => t.length > 0);
  const tokens: SpeechToken[] = [];

  for (const raw of rawTokens) {
    // Check for multi-char punctuation first (e.g. "...")
    let trailingPunctuation = '';
    let word = raw;

    if (word.endsWith('...')) {
      trailingPunctuation = '...';
      word = word.slice(0, -3);
    } else {
      const lastChar = word.charAt(word.length - 1);
      if (PUNCTUATION_PAUSE_FRAMES[lastChar] !== undefined) {
        trailingPunctuation = lastChar;
        word = word.slice(0, -1);
      }
    }

    // Strip any remaining non-alphanumeric characters and lowercase
    word = word.replace(/[^a-zA-Z0-9']/g, '').toLowerCase();

    if (word.length > 0) {
      tokens.push({ word, trailingPunctuation });
    }
  }

  return tokens;
}

/**
 * Look up the frame sequence for a word.
 * Returns the mapped frames if found, otherwise the default fallback.
 */
export function getWordFrames(word: string): WordFrames {
  return WORD_FRAME_MAP[word] ?? DEFAULT_WORD_FRAMES;
}

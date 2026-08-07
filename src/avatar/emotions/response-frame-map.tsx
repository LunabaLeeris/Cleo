import type {
    PlutchikEmotion,
    ResponseType,
    EmotionFrameConfig,
} from './emotion-types';

import BROWS_IDLE from '../../assets/frames/brows/brows_idle.png';
import BROWS_LU from '../../assets/frames/brows/brows_lu.png';
import BROWS_RU from '../../assets/frames/brows/brows_ru.png';
import BROWS_BU from '../../assets/frames/brows/brows_bu.png';
import BROWS_TG from '../../assets/frames/brows/brows_tg.png';

import EYES_IDLE from '../../assets/frames/eyes/eyes_idle.png';
import EYES_CLOSED from '../../assets/frames/eyes/eyes_closed.png';
import EYES_BHC from '../../assets/frames/eyes/eyes_bhc.png';
import EYES_LHC from '../../assets/frames/eyes/eyes_lhc.png';
import EYES_RHC from '../../assets/frames/eyes/eyes_rhc.png';
import EYES_FIRE from '../../assets/frames/eyes/eyes_fire.png';
import EYES_GOLDEN from '../../assets/frames/eyes/eyes_golden.png';
import EYES_WIDE from '../../assets/frames/eyes/eyes_wide.png';

/**
 * High-level emotion families grouping Plutchik's dyads.
 */
export type EmotionFamily =
    | 'joyful'
    | 'aggressive'
    | 'sad'
    | 'surprised'
    | 'fearful'
    | 'neutral';

/**
 * Maps derived Plutchik overall emotions to their parent emotion family.
 */
export const EMOTION_TO_FAMILY: Record<PlutchikEmotion, EmotionFamily> = {
    // Joyful Family
    Love: 'joyful',
    Optimism: 'joyful',
    Hope: 'joyful',
    Delight: 'joyful',
    Pride: 'joyful',
    Joyful: 'joyful',
    Trusting: 'joyful',
    Expectant: 'joyful',

    // Aggressive Family
    Aggression: 'aggressive',
    Contempt: 'aggressive',
    Outrage: 'aggressive',
    Dominance: 'aggressive',
    Angry: 'aggressive',
    Disgusted: 'aggressive',
    Cynicism: 'aggressive',

    // Sad Family
    Submission: 'sad',
    Disapproval: 'sad',
    Remorse: 'sad',
    Guilt: 'sad',
    Despair: 'sad',
    Disappointment: 'sad',
    Sentimentality: 'sad',
    Shame: 'sad',
    Pessimism: 'sad',
    Sad: 'sad',

    // Surprised Family
    Awe: 'surprised',
    Curiosity: 'surprised',
    Surprised: 'surprised',
    Unbelief: 'surprised',
    Confusion: 'surprised',

    // Fearful Family
    Anxiety: 'fearful',
    Fearful: 'fearful',

    // Neutral / Complex Family
    Bittersweet: 'neutral',
    Ambivalence: 'neutral',
    Conflict: 'neutral',
    Morbidness: 'neutral',
    Neutral: 'neutral',
};

/**
 * Generalized base matrix for EmotionFamily x ResponseType combinations.
 * Note: body is deliberately omitted so the 6-frame idle body animation runs uninterrupted.
 */
export const COMBINED_FAMILY_RESPONSE_MAP: Record<
    EmotionFamily,
    Record<ResponseType, EmotionFrameConfig>
> = {
    joyful: {
        declarative: { eyebrows: BROWS_BU, eyes: EYES_WIDE },
        interrogative: { eyebrows: BROWS_RU, eyes: EYES_GOLDEN },
        imperative: { eyebrows: BROWS_BU, eyes: EYES_GOLDEN },
        exclamatory: { eyebrows: BROWS_BU, eyes: EYES_GOLDEN },
    },
    aggressive: {
        declarative: { eyebrows: BROWS_TG, eyes: EYES_FIRE },
        interrogative: { eyebrows: BROWS_RU, eyes: EYES_FIRE },
        imperative: { eyebrows: BROWS_TG, eyes: EYES_FIRE },
        exclamatory: { eyebrows: BROWS_TG, eyes: EYES_FIRE },
    },
    sad: {
        declarative: { eyebrows: BROWS_TG, eyes: EYES_BHC },
        interrogative: { eyebrows: BROWS_LU, eyes: EYES_BHC },
        imperative: { eyebrows: BROWS_TG, eyes: EYES_CLOSED },
        exclamatory: { eyebrows: BROWS_BU, eyes: EYES_BHC },
    },
    surprised: {
        declarative: { eyebrows: BROWS_BU, eyes: EYES_WIDE },
        interrogative: { eyebrows: BROWS_RU, eyes: EYES_WIDE },
        imperative: { eyebrows: BROWS_LU, eyes: EYES_WIDE },
        exclamatory: { eyebrows: BROWS_BU, eyes: EYES_WIDE },
    },
    fearful: {
        declarative: { eyebrows: BROWS_TG, eyes: EYES_WIDE },
        interrogative: { eyebrows: BROWS_RU, eyes: EYES_WIDE },
        imperative: { eyebrows: BROWS_TG, eyes: EYES_BHC },
        exclamatory: { eyebrows: BROWS_BU, eyes: EYES_WIDE },
    },
    neutral: {
        declarative: { eyebrows: BROWS_IDLE, eyes: EYES_IDLE },
        interrogative: { eyebrows: BROWS_RU, eyes: EYES_RHC },
        imperative: { eyebrows: BROWS_TG, eyes: EYES_IDLE },
        exclamatory: { eyebrows: BROWS_BU, eyes: EYES_WIDE },
    },
};

/**
 * Specific explicit pair overrides for specific (PlutchikEmotion, ResponseType) combinations.
 * Format of key: `${overallEmotion}_${responseType}`.
 */
export const EXPLICIT_PAIR_OVERRIDES: Partial<Record<string, EmotionFrameConfig>> = {
    Joyful_declarative: { eyebrows: BROWS_BU, eyes: EYES_WIDE },
    Joyful_exclamatory: { eyebrows: BROWS_BU, eyes: EYES_GOLDEN },
    Love_declarative: { eyebrows: BROWS_BU, eyes: EYES_WIDE },
    Love_exclamatory: { eyebrows: BROWS_BU, eyes: EYES_GOLDEN },
    Delight_exclamatory: { eyebrows: BROWS_BU, eyes: EYES_GOLDEN },
    Curiosity_interrogative: { eyebrows: BROWS_RU, eyes: EYES_RHC },
    Angry_imperative: { eyebrows: BROWS_TG, eyes: EYES_FIRE },
    Outrage_exclamatory: { eyebrows: BROWS_TG, eyes: EYES_FIRE },
};

/**
 * Combines overall emotion and response type to derive eyebrows and eyes frame choices.
 *
 * Lookup order:
 *  1. Exact explicit pair override matching `${overallEmotion}_${responseType}`.
 *  2. Emotion family base matrix matching `COMBINED_FAMILY_RESPONSE_MAP[family][responseType]`.
 *
 * @param overallEmotion - Derived emotion from Plutchik's Wheel.
 * @param responseType   - Intent category of the response phrase.
 * @returns Combined EmotionFrameConfig for avatar render composition.
 */
export function getAvatarEmotionFrames(
    overallEmotion: PlutchikEmotion,
    responseType: ResponseType
): EmotionFrameConfig {
    const explicitKey = `${overallEmotion}_${responseType}`;
    if (EXPLICIT_PAIR_OVERRIDES[explicitKey]) {
        return EXPLICIT_PAIR_OVERRIDES[explicitKey]!;
    }

    const family = EMOTION_TO_FAMILY[overallEmotion] ?? 'neutral';
    const familyMap = COMBINED_FAMILY_RESPONSE_MAP[family] ?? COMBINED_FAMILY_RESPONSE_MAP.neutral;
    const config = familyMap[responseType] ?? familyMap.declarative;

    return { ...config };
}
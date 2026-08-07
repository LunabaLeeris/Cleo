/**
 * The 8 primary emotions defined in Robert Plutchik's Wheel of Emotions.
 */
export type PrimaryEmotion =
  | 'joy'
  | 'trust'
  | 'fear'
  | 'surprise'
  | 'sadness'
  | 'disgust'
  | 'anger'
  | 'anticipation';

export const PRIMARY_EMOTIONS: PrimaryEmotion[] = [
  'joy',
  'trust',
  'fear',
  'surprise',
  'sadness',
  'disgust',
  'anger',
  'anticipation',
];

/**
 * State representing intensity levels (0.0 to 1.0) for each primary emotion.
 */
export type EmotionalState = Record<PrimaryEmotion, number>;

/**
 * Sentence / utterance response intent type returned by LLM action parsing.
 */
export type ResponseType =
  | 'declarative'
  | 'interrogative'
  | 'imperative'
  | 'exclamatory';

/**
 * Derived overall emotion from Plutchik's Wheel based on primary emotion dyads.
 */
export type PlutchikEmotion =
  // Primary Dyads (Adjacent)
  | 'Love'           // Joy + Trust
  | 'Submission'     // Trust + Fear
  | 'Awe'            // Fear + Surprise
  | 'Disapproval'    // Surprise + Sadness
  | 'Remorse'        // Sadness + Disgust
  | 'Contempt'       // Disgust + Anger
  | 'Aggression'     // Anger + Anticipation
  | 'Optimism'       // Anticipation + Joy

  // Secondary Dyads (One apart)
  | 'Guilt'          // Joy + Fear
  | 'Curiosity'      // Trust + Surprise
  | 'Despair'        // Fear + Sadness
  | 'Unbelief'       // Surprise + Disgust
  | 'Disappointment'           // Sadness + Anger
  | 'Cynicism'       // Disgust + Anticipation
  | 'Pride'          // Anger + Joy
  | 'Hope'           // Anticipation + Trust

  // Tertiary Dyads (Two apart)
  | 'Delight'        // Joy + Surprise
  | 'Sentimentality' // Trust + Sadness
  | 'Shame'          // Fear + Disgust
  | 'Outrage'        // Surprise + Anger
  | 'Pessimism'      // Sadness + Anticipation
  | 'Morbidness'     // Disgust + Joy
  | 'Dominance'      // Anger + Trust
  | 'Anxiety'        // Anticipation + Fear

  // Opposites / Mixed
  | 'Bittersweet'    // Joy + Sadness
  | 'Ambivalence'    // Trust + Disgust
  | 'Conflict'       // Fear + Anger
  | 'Confusion'      // Surprise + Anticipation

  // Single Dominant Primary Fallbacks
  | 'Joyful'
  | 'Trusting'
  | 'Fearful'
  | 'Surprised'
  | 'Sad'
  | 'Disgusted'
  | 'Angry'
  | 'Expectant'
  | 'Neutral';

/**
 * Behavioral output from LLM for emotion state transitions.
 */
export type BehavioralData = Partial<Record<PrimaryEmotion, number>>;

/**
 * Structured LLM output.
 */
export interface LLMEmotionOutput {
  text: string;
  responseType: ResponseType;
  behavioralData: BehavioralData;
}

/**
 * Configured part states (body posture, eyes, eyebrows) for a given emotion + response type.
 */
export interface EmotionFrameConfig {
  body?: string;
  eyes: string;
  eyebrows: string;
}

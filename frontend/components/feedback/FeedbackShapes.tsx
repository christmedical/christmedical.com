import {
  FEEDBACK_CURSOR_PURPLE,
  FEEDBACK_CURSOR_PURPLE_DARK,
  FEEDBACK_PIN_ORANGE,
  FEEDBACK_PIN_ORANGE_DARK,
} from "@/lib/feedbackUiTokens";

type PinBubbleProps = {
  label: number | string;
  className?: string;
  size?: number;
};

/** Clemson-orange comment bubble with left tail (saved pin marker). */
export function CommentPinBubble({ label, className, size = 40 }: PinBubbleProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      aria-hidden
    >
      <path
        d="M10 6h22a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H14l-8 6v-6H10a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z"
        fill={FEEDBACK_PIN_ORANGE}
        stroke={FEEDBACK_PIN_ORANGE_DARK}
        strokeWidth="1.5"
      />
      <path
        d="M10 17 L2 20 L10 23 Z"
        fill={FEEDBACK_PIN_ORANGE}
        stroke={FEEDBACK_PIN_ORANGE_DARK}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <text
        x="21"
        y="21.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="13"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}

type PlaceCursorProps = {
  className?: string;
  size?: number;
};

/** Clemson-purple pointer bubble with + (placement cursor while feedback mode is on). */
export function PlaceCursorBubble({ className, size = 36 }: PlaceCursorProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className={className}
      aria-hidden
    >
      {/* Tail tip at (2,2) — sharp corner like Vercel placement cursor */}
      <path
        d="M2 2 L2 9 Q2 13 6 13 H24 Q30 13 30 19 V27 Q30 33 24 33 H11 L5 36 V33 H6 Q2 33 2 29 V9 Z"
        fill={FEEDBACK_CURSOR_PURPLE}
        stroke={FEEDBACK_CURSOR_PURPLE_DARK}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M18 17v8M14 21h8" stroke="white" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

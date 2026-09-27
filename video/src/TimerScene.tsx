import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fontFamily } from "./theme";

export const TimerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fast-forward the 10:00 countdown to 7:30 over the scene
  const remaining = Math.round(
    interpolate(frame, [0.4 * fps, 3.2 * fps], [600, 450], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = (600 - remaining) / 600;

  const size = 640;
  const stroke = 28;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <AbsoluteFill
      name="Timer"
      style={{
        backgroundColor: colors.bg,
        fontFamily,
        justifyContent: "center",
        alignItems: "center",
        padding: 100,
      }}
    >
      <Interactive.Div
        name="Step label"
        style={{
          fontSize: 44,
          fontWeight: 600,
          color: colors.accent,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Krok 1 z 5 · Pierwszy ruch
      </Interactive.Div>
      <Interactive.Div
        name="First move"
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: colors.txt,
          textAlign: "center",
          lineHeight: 1.15,
          marginTop: 24,
          marginBottom: 80,
        }}
      >
        Otwórz listę zaległych faktur
      </Interactive.Div>
      <Interactive.Div
        name="Timer ring"
        style={{
          position: "relative",
          width: 640,
          height: 640,
          scale: interpolate(frame, [0, 0.6 * fps], [0.8, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 200 }),
            output: "perceptual-scale",
          }),
        }}
      >
        <svg width={size} height={size} style={{ rotate: "-90deg" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.sep} strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={colors.accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * progress}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 180,
            fontWeight: 800,
            color: colors.txt,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {mm}:{ss}
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="Caption"
        style={{
          fontSize: 48,
          fontWeight: 500,
          color: colors.txt2,
          marginTop: 80,
          textAlign: "center",
        }}
      >
        Timer, który zmusza do działania.
      </Interactive.Div>
    </AbsoluteFill>
  );
};

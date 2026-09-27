import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fontFamily } from "./theme";

const task = "Zadzwonić do 10 klientów w sprawie zaległych faktur";

export const InputScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Typewriter: reveal characters between 0.6s and 2.6s
  const chars = Math.round(
    interpolate(frame, [0.6 * fps, 2.6 * fps], [0, task.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const typing = chars < task.length;
  const caretVisible = typing || Math.floor(frame / (0.5 * fps)) % 2 === 0;

  return (
    <AbsoluteFill
      name="Input"
      style={{
        backgroundColor: colors.bg,
        fontFamily,
        justifyContent: "center",
        padding: 100,
      }}
    >
      <Interactive.Div
        name="Title"
        style={{
          fontSize: 96,
          fontWeight: 800,
          color: colors.txt,
          lineHeight: 1.1,
        }}
      >
        Wpisz tylko ją.
      </Interactive.Div>
      <Interactive.Div
        name="Subtitle"
        style={{
          fontSize: 48,
          fontWeight: 500,
          color: colors.txt2,
          marginTop: 20,
        }}
      >
        Nic więcej. Bez gadania.
      </Interactive.Div>
      <Interactive.Div
        name="Text field"
        style={{
          marginTop: 72,
          backgroundColor: colors.card,
          borderRadius: 40,
          padding: 48,
          minHeight: 300,
          fontSize: 56,
          fontWeight: 600,
          lineHeight: 1.35,
          color: colors.txt,
          boxShadow: "0 0 0 5px #2563EB, 0 8px 30px rgba(15,23,42,.08)",
          opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {task.slice(0, chars)}
        <span style={{ color: colors.accent, opacity: caretVisible ? 1 : 0 }}>|</span>
      </Interactive.Div>
      <Interactive.Div
        name="Button"
        style={{
          marginTop: 48,
          backgroundColor: colors.accent,
          color: "#FFFFFF",
          borderRadius: 36,
          padding: 44,
          textAlign: "center",
          fontSize: 52,
          fontWeight: 800,
          opacity: interpolate(frame, [2.7 * fps, 3.1 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [3.4 * fps, 3.6 * fps, 3.9 * fps], [1, 0.94, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          }),
        }}
      >
        Rozbij na mikro-taski
      </Interactive.Div>
    </AbsoluteFill>
  );
};

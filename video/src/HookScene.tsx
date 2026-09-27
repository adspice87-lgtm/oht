import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fontFamily } from "./theme";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      name="Hook"
      style={{
        backgroundColor: colors.bg,
        fontFamily,
        justifyContent: "center",
        padding: 100,
      }}
    >
      <Interactive.Div
        name="Eyebrow"
        style={{
          fontSize: 44,
          fontWeight: 600,
          color: colors.accent,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Dziś
      </Interactive.Div>
      <Interactive.Div
        name="Headline line 1"
        style={{
          fontSize: 120,
          fontWeight: 800,
          color: colors.txt,
          lineHeight: 1.08,
          marginTop: 24,
          opacity: interpolate(frame, [0.3 * fps, 0.9 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [0.3 * fps, 0.9 * fps], ["0px 60px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Masz jedną rzecz,
      </Interactive.Div>
      <Interactive.Div
        name="Headline line 2"
        style={{
          fontSize: 120,
          fontWeight: 800,
          color: colors.accent,
          lineHeight: 1.08,
          opacity: interpolate(frame, [0.9 * fps, 1.5 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [0.9 * fps, 1.5 * fps], ["0px 60px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        którą odkładasz?
      </Interactive.Div>
      <Interactive.Div
        name="Subline"
        style={{
          fontSize: 48,
          fontWeight: 500,
          color: colors.txt2,
          lineHeight: 1.4,
          marginTop: 56,
          opacity: interpolate(frame, [1.8 * fps, 2.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Bo wydaje się za duża.
      </Interactive.Div>
    </AbsoluteFill>
  );
};

import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fontFamily } from "./theme";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      name="Outro"
      style={{
        backgroundColor: colors.accent,
        fontFamily,
        justifyContent: "center",
        alignItems: "center",
        padding: 100,
      }}
    >
      <Interactive.Div
        name="Check badge"
        style={{
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: "#FFFFFF",
          color: colors.green,
          fontSize: 120,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          scale: interpolate(frame, [0, 0.6 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 12 }),
            output: "perceptual-scale",
          }),
        }}
      >
        ✓
      </Interactive.Div>
      <Interactive.Div
        name="Brand"
        style={{
          fontSize: 140,
          fontWeight: 800,
          color: "#FFFFFF",
          marginTop: 64,
          textAlign: "center",
          lineHeight: 1.05,
          opacity: interpolate(frame, [0.4 * fps, 1 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [0.4 * fps, 1 * fps], ["0px 50px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        One hard task
      </Interactive.Div>
      <Interactive.Div
        name="Tagline"
        style={{
          fontSize: 56,
          fontWeight: 600,
          color: "rgba(255,255,255,0.85)",
          marginTop: 32,
          textAlign: "center",
          opacity: interpolate(frame, [1 * fps, 1.6 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Najtrudniejsze najpierw.
        <br />
        Reszta z górki.
      </Interactive.Div>
    </AbsoluteFill>
  );
};

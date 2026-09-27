import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fontFamily } from "./theme";

const steps = [
  { title: "Otwórz listę zaległych faktur", minutes: 5 },
  { title: "Wypisz 10 numerów na kartkę", minutes: 10 },
  { title: "Zadzwoń do pierwszego klienta", minutes: 5 },
  { title: "Pozostałe 9 telefonów", minutes: 30 },
  { title: "Zapisz, kto obiecał wpłatę", minutes: 10 },
];

const Step: React.FC<{ index: number; title: string; minutes: number }> = ({
  index,
  title,
  minutes,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appearAt = (0.6 + index * 0.25) * fps;
  const checkAt = (2.6 + index * 0.35) * fps;

  const enter = interpolate(frame, [appearAt, appearAt + 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const checked = interpolate(frame, [checkAt, checkAt + 0.2 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 32,
        backgroundColor: colors.card,
        borderRadius: 36,
        padding: "36px 40px",
        marginTop: 24,
        boxShadow: "0 4px 20px rgba(15,23,42,.06)",
        opacity: enter * (1 - checked * 0.45),
        translate: `0px ${(1 - enter) * 60}px`,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          minWidth: 64,
          borderRadius: 32,
          border: `4px solid ${checked > 0.5 ? colors.green : colors.sep}`,
          backgroundColor: checked > 0.5 ? colors.green : "transparent",
          color: "#FFFFFF",
          fontSize: 36,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          scale: String(1 + Math.sin(checked * Math.PI) * 0.25),
        }}
      >
        {checked > 0.5 ? "✓" : ""}
      </div>
      <div
        style={{
          fontSize: 44,
          fontWeight: 600,
          color: colors.txt,
          flex: 1,
          lineHeight: 1.25,
          textDecoration: checked > 0.5 ? "line-through" : "none",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 36, fontWeight: 600, color: colors.txt2 }}>
        {minutes} min
      </div>
    </div>
  );
};

export const PlanScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      name="Plan"
      style={{
        backgroundColor: colors.bg,
        fontFamily,
        justifyContent: "center",
        padding: 80,
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
          paddingLeft: 20,
        }}
      >
        AI tnie go na mikro-kroki
      </Interactive.Div>
      <Interactive.Div
        name="Title"
        style={{
          fontSize: 104,
          fontWeight: 800,
          color: colors.txt,
          marginTop: 16,
          marginBottom: 32,
          paddingLeft: 20,
          opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Plan ataku
      </Interactive.Div>
      {steps.map((s, i) => (
        <Step key={s.title} index={i} title={s.title} minutes={s.minutes} />
      ))}
    </AbsoluteFill>
  );
};

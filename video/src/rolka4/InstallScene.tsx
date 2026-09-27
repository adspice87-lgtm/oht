import { AbsoluteFill, Easing, interpolate, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { House } from "./House";
import { c, fontFamily } from "./theme";

const steps = ["Zgłoszenie", "Dokumenty", "Montaż"];

export const InstallScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timelapse: 14 days race by in 6 seconds, sky pulses between day and dusk
  const day = Math.min(14, 1 + Math.floor(interpolate(frame, [0, 5 * fps], [0, 14], { extrapolateRight: "clamp" })));
  const cycle = (frame % (0.45 * fps)) / (0.45 * fps);
  const sky = interpolateColors(Math.sin(cycle * Math.PI), [0, 1], ["#F6B38A", c.skyTop]);

  return (
    <AbsoluteFill name="Install" style={{ background: `linear-gradient(${sky}, ${c.skyBottom})`, fontFamily }}>
      <AbsoluteFill style={{ scale: 1.15, translate: "-80px -40px" }}>
        <House
          tankDrop={interpolate(frame, [0.6 * fps, 1.6 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bounce,
          })}
          pipe={interpolate(frame, [2 * fps, 3.5 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
          tankFill={0}
        />
      </AbsoluteFill>
      {/* timelapse badge */}
      <div
        style={{
          position: "absolute",
          top: 460,
          left: 80,
          backgroundColor: "rgba(11,18,32,.82)",
          color: c.white,
          borderRadius: 24,
          padding: "18px 28px",
          fontSize: 44,
          fontWeight: 800,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 600, opacity: 0.7 }}>⏩ TIMELAPSE</div>
        Dzień {day}/14
      </div>
      {/* checklist */}
      <div style={{ position: "absolute", top: 460, right: 80 }}>
        {steps.map((s, i) => {
          const at = (1 + i * 1.5) * fps;
          const on = frame >= at;
          return (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                marginBottom: 18,
                backgroundColor: "rgba(255,255,255,.92)",
                borderRadius: 22,
                padding: "16px 26px",
                fontSize: 40,
                fontWeight: 800,
                color: "#111827",
                opacity: interpolate(frame, [at - 0.4 * fps, at], [0.35, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              }}
            >
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: on ? c.money : "#D1D5DB",
                  color: c.white,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                }}
              >
                {on ? "✓" : ""}
              </span>
              {s}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Phone } from "./Phone";
import { c, fontFamily } from "./theme";

const address = "ul. Słoneczna 12, Katowice";

const Field: React.FC<{ label: string; value: string; caret?: boolean }> = ({ label, value, caret }) => (
  <div style={{ margin: "0 44px 28px" }}>
    <div style={{ fontSize: 30, fontWeight: 600, color: "#6B7280", marginBottom: 10 }}>{label}</div>
    <div
      style={{
        backgroundColor: "#F3F4F6",
        borderRadius: 22,
        padding: "26px 28px",
        fontSize: 40,
        fontWeight: 600,
        color: "#111827",
        minHeight: 100,
        border: caret ? "4px solid #2563EB" : "4px solid transparent",
      }}
    >
      {value}
      {caret ? <span style={{ color: "#2563EB" }}>|</span> : null}
    </div>
  </div>
);

export const FormScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chars = Math.round(
    interpolate(frame, [0.4 * fps, 2.2 * fps], [0, address.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
  const pulse = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 4);

  return (
    <AbsoluteFill name="Form" style={{ backgroundColor: c.night, fontFamily }}>
      <Phone top={430}>
        <div style={{ backgroundColor: c.white, height: "100%", paddingTop: 110 }}>
          <div
            style={{
              backgroundColor: c.red,
              color: c.white,
              fontSize: 48,
              fontWeight: 800,
              textAlign: "center",
              padding: "22px 0",
              letterSpacing: "0.04em",
              boxShadow: `0 0 ${20 + pulse * 40}px rgba(220,38,38,${0.4 + pulse * 0.5})`,
            }}
          >
            ⚠ PULA OGRANICZONA
          </div>
          <div style={{ fontSize: 50, fontWeight: 800, color: "#111827", margin: "40px 44px 32px", lineHeight: 1.15 }}>
            Sprawdź, czy Twój adres się kwalifikuje
          </div>
          <Field label="Adres domu" value={address.slice(0, chars)} caret={chars < address.length} />
          <Field label="Telefon" value={frame > 2.5 * fps ? "600 123 456" : ""} />
          <div
            style={{
              margin: "10px 44px",
              backgroundColor: c.money,
              color: c.white,
              borderRadius: 26,
              padding: "30px 0",
              fontSize: 44,
              fontWeight: 800,
              textAlign: "center",
              scale: interpolate(frame, [3 * fps, 3.15 * fps, 3.4 * fps], [1, 0.94, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            Sprawdź w 2 minuty →
          </div>
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

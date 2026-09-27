import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { House } from "./House";
import { BankNotification, Phone } from "./Phone";
import { Rain } from "./Rain";
import { c, fontFamily } from "./theme";

export const HouseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      name="House"
      style={{ background: `linear-gradient(${c.skyTop}, ${c.skyBottom})`, fontFamily }}
    >
      <AbsoluteFill
        style={{
          scale: interpolate(frame, [0, 6 * fps], [1.02, 1.1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <House
          tankFill={interpolate(frame, [0.5 * fps, 6 * fps], [0.25, 0.8], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />
        <Rain opacity={0.8} />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 560,
          top: 1110,
          backgroundColor: c.money,
          color: c.white,
          fontSize: 54,
          fontWeight: 800,
          padding: "20px 32px",
          borderRadius: 24,
          boxShadow: "0 16px 40px rgba(0,0,0,.25)",
          rotate: "-4deg",
          scale: interpolate(frame, [2.2 * fps, 2.6 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 12 }),
          }),
        }}
      >
        dotacja 8 500 zł
      </div>
      {/* "hand hides the phone": phone slides out of the bottom at the start of the scene */}
      <AbsoluteFill
        style={{
          translate: interpolate(frame, [0, 0.55 * fps], ["0px 0px", "0px 1700px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.55, 0, 0.9, 0.4),
          }),
          scale: 1.12,
        }}
      >
        <Phone>
          <div style={{ height: 460 }} />
          <BankNotification />
        </Phone>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BankNotification, Phone } from "./Phone";
import { c, fontFamily } from "./theme";

export const NotificationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill name="Notification" style={{ backgroundColor: c.night, fontFamily }}>
      <AbsoluteFill
        style={{
          scale: interpolate(frame, [0, 3 * fps], [1, 1.12], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.33, 1, 0.68, 1),
          }),
        }}
      >
        <Phone>
          <div style={{ textAlign: "center", color: c.white, marginTop: 150 }}>
            <div style={{ fontSize: 34, fontWeight: 600, opacity: 0.8 }}>wtorek, 14 października</div>
            <div style={{ fontSize: 190, fontWeight: 800, lineHeight: 1.05 }}>12:47</div>
          </div>
          <div
            style={{
              marginTop: 50,
              opacity: interpolate(frame, [0.35 * fps, 0.7 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: interpolate(frame, [0.35 * fps, 0.9 * fps], ["0px -140px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.spring({ damping: 14 }),
              }),
            }}
          >
            <BankNotification />
          </div>
        </Phone>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

import { random, useCurrentFrame } from "remotion";

export const Rain: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity }}>
      {new Array(70).fill(true).map((_, i) => {
        const x = random(`x${i}`) * 1180 - 50;
        const speed = 38 + random(`s${i}`) * 20;
        const y = ((random(`y${i}`) * 1920 + frame * speed) % 2000) - 80;
        return <line key={i} x1={x} y1={y} x2={x - 12} y2={y + 60} stroke="rgba(255,255,255,.7)" strokeWidth={5} strokeLinecap="round" />;
      })}
    </svg>
  );
};

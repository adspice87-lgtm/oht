import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { c, fontFamily } from "./theme";

// Voiceover lines as captions, in seconds
const captions: { from: number; to: number; text: string; hl: string }[] = [
  { from: 0, to: 1.5, text: "Takie powiadomienie dostają teraz", hl: "powiadomienie" },
  { from: 1.5, to: 3, text: "właściciele domów na Śląsku.", hl: "Śląsku." },
  { from: 3, to: 5.2, text: "To dotacja z programu mikroretencja.", hl: "mikroretencja." },
  { from: 5.2, to: 7, text: "8500 zł za montaż", hl: "8500 zł" },
  { from: 7, to: 9, text: "zbiornika na deszczówkę.", hl: "deszczówkę." },
  { from: 9, to: 11, text: "Ty tylko wysyłasz zgłoszenie.", hl: "zgłoszenie." },
  { from: 11, to: 13.2, text: "Papiery i montaż w 14 dni", hl: "14 dni" },
  { from: 13.2, to: 15, text: "bierzemy na siebie.", hl: "na siebie." },
  { from: 15, to: 16.3, text: "Pula się kończy.", hl: "kończy." },
  { from: 16.3, to: 18.2, text: "Sprawdź swój adres w 2 minuty.", hl: "2 minuty." },
  { from: 18.2, to: 20, text: "Decyduje kolejność zgłoszeń.", hl: "kolejność" },
];


export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cap = captions.find((x) => t >= x.from && t < x.to);
  if (!cap) return null;
  const local = frame - cap.from * fps;
  const [before, after] = cap.text.split(cap.hl);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1420, fontFamily }}>
      <div
        style={{
          maxWidth: 900,
          textAlign: "center",
          fontSize: 70,
          fontWeight: 800,
          lineHeight: 1.15,
          color: c.white,
          WebkitTextStroke: "16px #000",
          paintOrder: "stroke fill",
          textShadow: "0 6px 18px rgba(0,0,0,.45)",
          scale: interpolate(local, [0, 0.18 * fps], [0.85, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {before}
        <span style={{ color: c.highlight }}>{cap.hl}</span>
        {after}
      </div>
    </AbsoluteFill>
  );
};

// Persistent on-screen hook text
export const Headline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const box: React.CSSProperties = {
    display: "inline-block",
    backgroundColor: "#000",
    padding: "8px 24px",
    borderRadius: 14,
  };

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        paddingTop: 150,
        fontFamily,
        fontWeight: 800,
        fontSize: 76,
        lineHeight: 1.3,
        color: c.white,
        textAlign: "center",
        opacity: interpolate(frame, [0, 0.2 * fps], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <div style={{ ...box, rotate: "-2deg" }}>
        <span style={{ color: c.money }}>+8500 zł</span> NA KONCIE.
      </div>
      <div style={{ ...box, marginTop: 8, backgroundColor: c.highlight, color: "#000" }}>TAK TO WYGLĄDA</div>
    </AbsoluteFill>
  );
};

import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { FormScene } from "./FormScene";
import { HouseScene } from "./HouseScene";
import { InstallScene } from "./InstallScene";
import { NotificationScene } from "./NotificationScene";
import { Captions, Headline } from "./Overlays";

// Hard cuts at 3 s, 9 s and 15 s to match the voiceover script
export const Rolka4: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Sequence name="0-3 s Powiadomienie" durationInFrames={3 * fps}>
        <NotificationScene />
      </Sequence>
      <Sequence name="3-9 s Dom i zbiornik" from={3 * fps} durationInFrames={6 * fps}>
        <HouseScene />
      </Sequence>
      <Sequence name="9-15 s Montaż" from={9 * fps} durationInFrames={6 * fps}>
        <InstallScene />
      </Sequence>
      <Sequence name="15-20 s Formularz" from={15 * fps} durationInFrames={5 * fps}>
        <FormScene />
      </Sequence>
      <Headline />
      <Captions />
    </AbsoluteFill>
  );
};

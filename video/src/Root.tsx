import "./index.css";
import { Composition, Folder } from "remotion";
import { HookScene } from "./HookScene";
import { InputScene } from "./InputScene";
import { PlanScene } from "./PlanScene";
import { TimerScene } from "./TimerScene";
import { OutroScene } from "./OutroScene";
import { OneHardTask } from "./OneHardTask";
import { Rolka4 } from "./rolka4/Rolka4";

const size = { width: 1080, height: 1920, fps: 30 };

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="OneHardTask-Scenes">
        <Composition id="Hook" component={HookScene} durationInFrames={105} {...size} />
        <Composition id="Input" component={InputScene} durationInFrames={135} {...size} />
        <Composition id="Plan" component={PlanScene} durationInFrames={165} {...size} />
        <Composition id="Timer" component={TimerScene} durationInFrames={105} {...size} />
        <Composition id="Outro" component={OutroScene} durationInFrames={105} {...size} />
      </Folder>
      {/* 615 frames of scenes minus 4 transitions × 15 frames */}
      <Composition id="OneHardTask" component={OneHardTask} durationInFrames={555} {...size} />
      <Composition id="Rolka4" component={Rolka4} durationInFrames={600} {...size} />
    </>
  );
};

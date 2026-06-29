import { Composition } from "remotion";
import { PeakTalkBars } from "./PeakTalkBars";
import { PeakTalkLogo } from "./PeakTalkLogo";
import { PeakTalkSimulationMockup } from "./PeakTalkSimulationMockup";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PeakTalkBars"
        component={PeakTalkBars}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PeakTalkLogo"
        component={PeakTalkLogo}
        durationInFrames={300}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="PeakTalkSimulationMockup"
        component={PeakTalkSimulationMockup}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

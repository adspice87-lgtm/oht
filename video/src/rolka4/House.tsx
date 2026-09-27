import { c } from "./theme";

// Illustrated house with a rainwater tank by the wall.
// tankDrop: 0 = tank above frame, 1 = standing on the ground
// pipe: 0..1 how much of the downpipe-to-tank connection is drawn
export const House: React.FC<{ tankDrop?: number; pipe?: number; tankFill?: number }> = ({
  tankDrop = 1,
  pipe = 1,
  tankFill = 0.6,
}) => {
  const tankY = 1330 - (1 - tankDrop) * 1400;
  const pipeLen = 260;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      {/* ground */}
      <rect x={0} y={1560} width={1080} height={360} fill={c.grass} />
      {/* house body */}
      <rect x={110} y={980} width={640} height={580} fill={c.wall} />
      {/* roof */}
      <polygon points="70,1000 430,700 790,1000" fill={c.roof} />
      {/* gutter */}
      <rect x={60} y={992} width={760} height={18} rx={6} fill={c.pipe} />
      {/* downpipe on the right wall */}
      <rect x={770} y={1000} width={26} height={250} fill={c.pipe} />
      {/* windows + door */}
      <rect x={180} y={1080} width={170} height={150} rx={10} fill="#9CCBEA" stroke="#FFFFFF" strokeWidth={12} />
      <rect x={510} y={1080} width={170} height={150} rx={10} fill="#9CCBEA" stroke="#FFFFFF" strokeWidth={12} />
      <rect x={370} y={1320} width={120} height={240} rx={8} fill="#7A4B2A" />
      {/* connection from downpipe into the tank */}
      <path
        d="M 783 1250 L 783 1290 L 900 1290 L 900 1340"
        fill="none"
        stroke={c.pipe}
        strokeWidth={26}
        strokeLinejoin="round"
        strokeDasharray={pipeLen}
        strokeDashoffset={pipeLen * (1 - pipe)}
      />
      {/* tank */}
      <g transform={`translate(0 ${tankY - 1330})`}>
        <rect x={810} y={1330} width={190} height={230} rx={34} fill={c.tank} />
        <clipPath id="tankClip">
          <rect x={826} y={1350} width={158} height={194} rx={24} />
        </clipPath>
        <rect x={826} y={1350} width={158} height={194} rx={24} fill="#244F3B" />
        <rect
          clipPath="url(#tankClip)"
          x={826}
          y={1350 + 194 * (1 - tankFill)}
          width={158}
          height={194}
          fill="#4FA3E0"
          opacity={0.9}
        />
        <rect x={810} y={1400} width={190} height={10} fill="#1E4533" />
        <rect x={810} y={1480} width={190} height={10} fill="#1E4533" />
      </g>
    </svg>
  );
};

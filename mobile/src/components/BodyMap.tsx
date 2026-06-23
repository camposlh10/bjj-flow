import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { BODY_NODES, BodyView, intensityColor } from '../constants/body';
import { palette } from '../theme/theme';

const FILL = palette.surfaceVariant;
const STROKE = palette.outline;
const TORSO = 'M74 60 Q72 54 86 54 L114 54 Q128 54 126 60 L122 152 Q121 172 104 174 L96 174 Q79 172 78 152 Z';

/** A stylized front/back body with tappable pain hotspots colored by intensity (0-10). */
export default function BodyMap({
  view,
  pain,
  onRegionPress,
  width = 240,
}: {
  view: BodyView;
  pain: Record<string, number>;
  onRegionPress: (region: string) => void;
  width?: number;
}) {
  const height = width * 2;
  const nodes = BODY_NODES[view];

  return (
    <Svg width={width} height={height} viewBox="0 0 200 400">
      {/* Limbs (drawn under the torso so the joints tuck in) */}
      <Rect x={56} y={62} width={15} height={112} rx={7.5} fill={FILL} stroke={STROKE} strokeWidth={1} />
      <Rect x={129} y={62} width={15} height={112} rx={7.5} fill={FILL} stroke={STROKE} strokeWidth={1} />
      <Circle cx={63.5} cy={178} r={9} fill={FILL} stroke={STROKE} strokeWidth={1} />
      <Circle cx={136.5} cy={178} r={9} fill={FILL} stroke={STROKE} strokeWidth={1} />
      <Rect x={82} y={166} width={17} height={216} rx={8.5} fill={FILL} stroke={STROKE} strokeWidth={1} />
      <Rect x={101} y={166} width={17} height={216} rx={8.5} fill={FILL} stroke={STROKE} strokeWidth={1} />
      <Ellipse cx={90.5} cy={386} rx={11} ry={7} fill={FILL} stroke={STROKE} strokeWidth={1} />
      <Ellipse cx={109.5} cy={386} rx={11} ry={7} fill={FILL} stroke={STROKE} strokeWidth={1} />

      {/* Torso, neck, head */}
      <Path d={TORSO} fill={FILL} stroke={STROKE} strokeWidth={1} />
      <Rect x={93} y={44} width={14} height={12} rx={4} fill={FILL} stroke={STROKE} strokeWidth={1} />
      <Circle cx={100} cy={30} r={19} fill={FILL} stroke={STROKE} strokeWidth={1} />

      {/* Pain hotspots */}
      {nodes.map((n) => {
        const intensity = pain[n.key] ?? 0;
        const active = intensity > 0;
        const color = intensityColor(intensity);
        return (
          <G key={n.key}>
            {active && <Circle cx={n.x} cy={n.y} r={15} fill={color} opacity={0.22} />}
            <Circle
              cx={n.x}
              cy={n.y}
              r={active ? 8 : 5.5}
              fill={active ? color : 'transparent'}
              stroke={active ? '#FFFFFF' : palette.textSecondary}
              strokeWidth={1.5}
              opacity={active ? 1 : 0.55}
            />
            {/* Larger transparent hit area for easy tapping */}
            <Circle cx={n.x} cy={n.y} r={17} fill="#FFFFFF" opacity={0} onPress={() => onRegionPress(n.key)} />
          </G>
        );
      })}
    </Svg>
  );
}

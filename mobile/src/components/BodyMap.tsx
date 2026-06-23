import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { BODY_NODES, BodyView, intensityColor } from '../constants/body';
import { palette } from '../theme/theme';

// Muscle-figure palette (reddish anatomy tone), readable on the dark theme.
const MUSCLE = '#BD5D5A';
const SHADE = '#9A4744';
const OUTLINE = '#7E3A38';

// Shared limbs (muscular tapered paths), mirrored left/right.
const ARM_L = 'M66,66 C54,67 47,77 46,92 C44,110 45,128 49,146 C50,156 51,164 52,172 L62,172 C63,162 63,150 64,136 C65,118 66,100 67,86 C68,77 70,70 66,66 Z';
const ARM_R = 'M134,66 C146,67 153,77 154,92 C156,110 155,128 151,146 C150,156 149,164 148,172 L138,172 C137,162 137,150 136,136 C135,118 134,100 133,86 C132,77 130,70 134,66 Z';
const LEG_L = 'M84,184 C77,188 74,205 74,230 C74,258 77,290 81,318 C83,338 85,360 88,382 L98,382 C98,360 98,338 98,312 C98,284 97,256 96,230 C96,206 94,190 90,184 Z';
const LEG_R = 'M116,184 C123,188 126,205 126,230 C126,258 123,290 119,318 C117,338 115,360 112,382 L102,382 C102,360 102,338 102,312 C102,284 103,256 104,230 C104,206 106,190 110,184 Z';
const TORSO = 'M70,64 C62,64 57,70 56,82 C57,96 60,112 65,132 C70,154 75,172 84,184 C90,190 95,192 100,192 C105,192 110,190 116,184 C125,172 130,154 135,132 C140,112 143,96 144,82 C143,70 138,64 130,64 C120,68 110,70 100,70 C90,70 80,68 70,64 Z';

// Muscle-definition strokes (fill none) for the front and back views.
const FRONT_LINES = [
  'M100,74 L100,176', // sternum + linea alba
  'M70,80 C82,98 93,101 99,101', // left pec
  'M130,80 C118,98 107,101 101,101', // right pec
  'M86,124 L114,124',
  'M87,140 L113,140',
  'M88,156 L112,156', // ab rows
  'M67,96 C72,120 78,150 84,176', // left oblique
  'M133,96 C128,120 122,150 116,176', // right oblique
];
const BACK_LINES = [
  'M100,66 L100,150', // spine
  'M82,70 L100,64 L118,70 L100,112 Z', // trapezius kite
  'M66,92 C80,120 92,134 100,140', // left lat
  'M134,92 C120,120 108,134 100,140', // right lat
  'M88,150 L112,150',
];

/** A stylized muscular figure (front/back) with tappable pain hotspots colored by intensity (0-10). */
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
  const lines = view === 'front' ? FRONT_LINES : BACK_LINES;

  return (
    <Svg width={width} height={height} viewBox="0 0 200 400">
      {/* Legs + arms (under the torso so joints tuck in) */}
      <Path d={LEG_L} fill={MUSCLE} stroke={OUTLINE} strokeWidth={1.2} />
      <Path d={LEG_R} fill={MUSCLE} stroke={OUTLINE} strokeWidth={1.2} />
      <Path d={ARM_L} fill={MUSCLE} stroke={OUTLINE} strokeWidth={1.2} />
      <Path d={ARM_R} fill={MUSCLE} stroke={OUTLINE} strokeWidth={1.2} />
      {/* Hands + feet */}
      <Ellipse cx={57} cy={178} rx={8} ry={10} fill={MUSCLE} stroke={OUTLINE} strokeWidth={1.2} />
      <Ellipse cx={143} cy={178} rx={8} ry={10} fill={MUSCLE} stroke={OUTLINE} strokeWidth={1.2} />
      <Ellipse cx={92} cy={388} rx={9} ry={6} fill={MUSCLE} stroke={OUTLINE} strokeWidth={1.2} />
      <Ellipse cx={108} cy={388} rx={9} ry={6} fill={MUSCLE} stroke={OUTLINE} strokeWidth={1.2} />

      {/* Torso, deltoids, neck, head */}
      <Path d={TORSO} fill={MUSCLE} stroke={OUTLINE} strokeWidth={1.2} />
      <Ellipse cx={62} cy={78} rx={13} ry={14} fill={MUSCLE} stroke={OUTLINE} strokeWidth={1.2} />
      <Ellipse cx={138} cy={78} rx={13} ry={14} fill={MUSCLE} stroke={OUTLINE} strokeWidth={1.2} />
      <Path d="M93,46 L107,46 L106,60 L94,60 Z" fill={MUSCLE} stroke={OUTLINE} strokeWidth={1.2} />
      <Ellipse cx={100} cy={28} rx={17} ry={20} fill={MUSCLE} stroke={OUTLINE} strokeWidth={1.2} />

      {/* Muscle-definition lines + leg/quad center lines */}
      {lines.map((d, i) => (
        <Path key={`l${i}`} d={d} fill="none" stroke={SHADE} strokeWidth={0.9} opacity={0.85} />
      ))}
      <Path d="M88,196 C88,250 90,320 90,370" fill="none" stroke={SHADE} strokeWidth={0.8} opacity={0.7} />
      <Path d="M112,196 C112,250 110,320 110,370" fill="none" stroke={SHADE} strokeWidth={0.8} opacity={0.7} />
      {view === 'back' && (
        <>
          <Ellipse cx={90} cy={180} rx={15} ry={14} fill={MUSCLE} stroke={SHADE} strokeWidth={0.9} />
          <Ellipse cx={110} cy={180} rx={15} ry={14} fill={MUSCLE} stroke={SHADE} strokeWidth={0.9} />
        </>
      )}

      {/* Pain hotspots */}
      {nodes.map((n) => {
        const intensity = pain[n.key] ?? 0;
        const active = intensity > 0;
        const color = intensityColor(intensity);
        return (
          <G key={n.key}>
            {active && <Circle cx={n.x} cy={n.y} r={15} fill={color} opacity={0.28} />}
            <Circle
              cx={n.x}
              cy={n.y}
              r={active ? 8 : 5.5}
              fill={active ? color : 'rgba(255,255,255,0.12)'}
              stroke={active ? '#FFFFFF' : palette.textSecondary}
              strokeWidth={1.5}
              opacity={active ? 1 : 0.6}
            />
            <Circle cx={n.x} cy={n.y} r={17} fill="#FFFFFF" opacity={0} onPress={() => onRegionPress(n.key)} />
          </G>
        );
      })}
    </Svg>
  );
}

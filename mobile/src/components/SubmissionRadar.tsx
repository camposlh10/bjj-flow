import { Dimensions, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';

import { palette } from '../theme/theme';

export type RadarAxis = { label: string; value: number };

const SCREEN_WIDTH = Dimensions.get('window').width;

/** Spider/radar chart of submission counts across the catalog axes. */
export default function SubmissionRadar({
  axes,
  color = palette.primary,
  size = SCREEN_WIDTH - 40,
}: {
  axes: RadarAxis[];
  color?: string;
  size?: number;
}) {
  const n = axes.length;
  const center = size / 2;
  const r = center - 52; // margin for labels
  const labelR = r + 18;
  const rings = 4;
  const max = Math.max(1, ...axes.map((a) => a.value));

  const pointAt = (i: number, radius: number) => {
    const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
    return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
  };

  const ringPolygon = (radius: number) =>
    axes.map((_, i) => { const p = pointAt(i, radius); return `${p.x},${p.y}`; }).join(' ');

  const dataPolygon = axes
    .map((a, i) => { const p = pointAt(i, (a.value / max) * r); return `${p.x},${p.y}`; })
    .join(' ');

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size}>
        {Array.from({ length: rings }).map((_, k) => (
          <Polygon
            key={k}
            points={ringPolygon((r * (k + 1)) / rings)}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={1}
          />
        ))}
        {axes.map((_, i) => {
          const p = pointAt(i, r);
          return <Line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />;
        })}
        <Polygon points={dataPolygon} fill={`${color}3D`} stroke={color} strokeWidth={2} />
        {axes.map((a, i) => {
          const p = pointAt(i, (a.value / max) * r);
          return <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} stroke="#fff" strokeWidth={1.5} />;
        })}
      </Svg>
      {axes.map((a, i) => {
        const p = pointAt(i, labelR);
        return (
          <Text
            key={i}
            style={[styles.label, { left: p.x - 44, top: p.y - 9 }]}
            numberOfLines={1}>
            {a.label}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    width: 88,
    textAlign: 'center',
    color: palette.textSecondary,
    fontSize: 9.5,
  },
});

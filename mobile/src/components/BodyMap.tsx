import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BODY_NODES, BodyView, FIGURE_BOX, HALF_SIZE, intensityColor } from '../constants/body';
import { makeStyles, palette } from '../theme/theme';

// The anatomy image: front figure on the left half, back on the right half.
// Replace assets/body-anatomy.png with your own (keep that 2:1 layout) and update
// FIGURE_BOX in constants/body.ts if the figures sit differently.
const BODY_IMAGE = require('../../assets/body-anatomy.png');

/** Anatomy body (front/back), each figure centered, with tappable pain hotspots. */
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
  const size = width;
  const scale = size / HALF_SIZE;
  const box = FIGURE_BOX[view];
  const figW = (box.right - box.left) * scale;
  const figH = (box.bottom - box.top) * scale;
  const figLeft = (size - figW) / 2; // center the figure horizontally in the view
  const figTop = box.top * scale;
  const translateX = figLeft - box.left * scale;

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <Image
        source={BODY_IMAGE}
        style={{ width: size * 2, height: size, transform: [{ translateX }] }}
        resizeMode="cover"
      />
      {BODY_NODES[view].map((n) => {
        const intensity = pain[n.key] ?? 0;
        const active = intensity > 0;
        const color = intensityColor(intensity);
        return (
          <Pressable
            key={n.key}
            onPress={() => onRegionPress(n.key)}
            hitSlop={6}
            style={[styles.hotspot, { left: figLeft + n.x * figW - 16, top: figTop + n.y * figH - 16 }]}>
            {active && <View style={[styles.glow, { backgroundColor: color }]} />}
            <View
              style={[
                styles.dot,
                active
                  ? { backgroundColor: color, borderColor: '#FFFFFF' }
                  : { backgroundColor: 'rgba(255,255,255,0.45)', borderColor: 'rgba(0,0,0,0.4)' },
              ]}>
              {active && <Text style={styles.dotText}>{intensity}</Text>}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = makeStyles(() => ({
  frame: { overflow: 'hidden', borderRadius: 14, backgroundColor: palette.surface },
  hotspot: { position: 'absolute', width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 30, height: 30, borderRadius: 15, opacity: 0.35 },
  dot: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  dotText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
}));

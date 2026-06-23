import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BODY_NODES, BodyView, intensityColor } from '../constants/body';
import { palette } from '../theme/theme';

// The anatomy image: front figure on the left half, back on the right half.
// Replace assets/body-anatomy.png with your own image keeping that layout.
const BODY_IMAGE = require('../../assets/body-anatomy.png');

/** Anatomy body (front/back crop) with tappable pain hotspots colored by intensity (0-10). */
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
  const size = width; // each half is ~square
  const nodes = BODY_NODES[view];

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <Image
        source={BODY_IMAGE}
        style={{ width: size * 2, height: size, transform: [{ translateX: view === 'back' ? -size : 0 }] }}
        resizeMode="cover"
      />
      {nodes.map((n) => {
        const intensity = pain[n.key] ?? 0;
        const active = intensity > 0;
        const color = intensityColor(intensity);
        return (
          <Pressable
            key={n.key}
            onPress={() => onRegionPress(n.key)}
            hitSlop={6}
            style={[styles.hotspot, { left: (n.x / 100) * size - 16, top: (n.y / 100) * size - 16 }]}>
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

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', borderRadius: 14, backgroundColor: palette.surface },
  hotspot: { position: 'absolute', width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 30, height: 30, borderRadius: 15, opacity: 0.35 },
  dot: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  dotText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
});

import { getActiveLocale } from '../i18n';

export type BodyView = 'front' | 'back';
export type RegionNode = { key: string; x: number; y: number };

// Hotspot positions as PERCENT (0-100) of the displayed body image (each view is a
// square crop — front = left half, back = right half of assets/body-anatomy.png).
// "left"/"right" follow the image the athlete sees (mirror), which is what they tap.
export const BODY_NODES: Record<BodyView, RegionNode[]> = {
  front: [
    { key: 'neck', x: 50, y: 14 },
    { key: 'shoulder_left', x: 33, y: 20 },
    { key: 'shoulder_right', x: 67, y: 20 },
    { key: 'chest', x: 50, y: 25 },
    { key: 'ribs', x: 50, y: 36 },
    { key: 'elbow_left', x: 24, y: 36 },
    { key: 'elbow_right', x: 76, y: 36 },
    { key: 'wrist_left', x: 17, y: 50 },
    { key: 'wrist_right', x: 83, y: 50 },
    { key: 'hip_left', x: 43, y: 48 },
    { key: 'hip_right', x: 57, y: 48 },
    { key: 'knee_left', x: 44, y: 69 },
    { key: 'knee_right', x: 56, y: 69 },
    { key: 'ankle_left', x: 45, y: 90 },
    { key: 'ankle_right', x: 55, y: 90 },
  ],
  back: [
    { key: 'neck', x: 50, y: 14 },
    { key: 'shoulder_left', x: 33, y: 20 },
    { key: 'shoulder_right', x: 67, y: 20 },
    { key: 'upper_back', x: 50, y: 24 },
    { key: 'lower_back', x: 50, y: 36 },
    { key: 'elbow_left', x: 24, y: 36 },
    { key: 'elbow_right', x: 76, y: 36 },
    { key: 'hamstring_left', x: 44, y: 60 },
    { key: 'hamstring_right', x: 56, y: 60 },
    { key: 'calf_left', x: 44, y: 80 },
    { key: 'calf_right', x: 56, y: 80 },
    { key: 'ankle_left', x: 45, y: 90 },
    { key: 'ankle_right', x: 55, y: 90 },
  ],
};

const LABELS: Record<string, { pt: string; en: string }> = {
  neck: { pt: 'Pescoço', en: 'Neck' },
  shoulder_left: { pt: 'Ombro esq.', en: 'Left shoulder' },
  shoulder_right: { pt: 'Ombro dir.', en: 'Right shoulder' },
  chest: { pt: 'Peito', en: 'Chest' },
  ribs: { pt: 'Costelas', en: 'Ribs' },
  upper_back: { pt: 'Costas (superior)', en: 'Upper back' },
  lower_back: { pt: 'Lombar', en: 'Lower back' },
  elbow_left: { pt: 'Cotovelo esq.', en: 'Left elbow' },
  elbow_right: { pt: 'Cotovelo dir.', en: 'Right elbow' },
  wrist_left: { pt: 'Punho esq.', en: 'Left wrist' },
  wrist_right: { pt: 'Punho dir.', en: 'Right wrist' },
  hip_left: { pt: 'Quadril esq.', en: 'Left hip' },
  hip_right: { pt: 'Quadril dir.', en: 'Right hip' },
  knee_left: { pt: 'Joelho esq.', en: 'Left knee' },
  knee_right: { pt: 'Joelho dir.', en: 'Right knee' },
  ankle_left: { pt: 'Tornozelo esq.', en: 'Left ankle' },
  ankle_right: { pt: 'Tornozelo dir.', en: 'Right ankle' },
  hamstring_left: { pt: 'Posterior esq.', en: 'Left hamstring' },
  hamstring_right: { pt: 'Posterior dir.', en: 'Right hamstring' },
  calf_left: { pt: 'Panturrilha esq.', en: 'Left calf' },
  calf_right: { pt: 'Panturrilha dir.', en: 'Right calf' },
};

export function bodyRegionLabel(key: string): string {
  const l = LABELS[key];
  if (!l) return key;
  return getActiveLocale() === 'en' ? l.en : l.pt;
}

/** Pain heat color: amber → orange → red → deep red as intensity climbs. */
export function intensityColor(intensity: number): string {
  if (intensity >= 9) return '#C2181B';
  if (intensity >= 7) return '#E5484D';
  if (intensity >= 4) return '#F76808';
  if (intensity >= 1) return '#E0A82E';
  return '#52525B';
}

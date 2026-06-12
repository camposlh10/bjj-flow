import { pt, TranslationKey } from './pt';

// pt-BR é o idioma padrão. Quando adicionarmos outros idiomas, este módulo
// passa a escolher o dicionário pelo locale do dispositivo (expo-localization).
export function t(key: TranslationKey): string {
  return pt[key] ?? key;
}

/** t() com placeholders: tf('motivation.milestone.text', { n: 3, m: 50 }) */
export function tf(key: TranslationKey, vars: Record<string, string | number>): string {
  let text: string = pt[key] ?? key;
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

export type { TranslationKey };

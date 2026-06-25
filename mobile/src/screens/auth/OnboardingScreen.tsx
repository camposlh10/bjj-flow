import Slider from '@react-native-community/slider';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, IconButton, Text, TextInput } from 'react-native-paper';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BeltVisual, { formatStripes } from '../../components/BeltVisual';
import { beltBySlug, beltOptionsForAge, rankBarColorFor } from '../../constants/belts';
import { t } from '../../i18n';
import { AuthStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../../store/authStore';
import { makeStyles, palette } from '../../theme/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const STEPS = ['age', 'belt', 'stripes', 'body'] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const setOnboarding = useAuthStore((s) => s.setOnboarding);

  const [step, setStep] = useState<Step>('age');
  const [ageText, setAgeText] = useState('');
  const [beltSlug, setBeltSlug] = useState<string | null>(null);
  const [stripes, setStripes] = useState(0);
  const [weightText, setWeightText] = useState('');
  const [heightText, setHeightText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const progress = useSharedValue(1 / STEPS.length);
  useEffect(() => {
    progress.value = withTiming((STEPS.indexOf(step) + 1) / STEPS.length, { duration: 300 });
  }, [step, progress]);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const age = parseInt(ageText, 10);
  const ageValid = !Number.isNaN(age) && age >= 4 && age <= 100;

  const goBack = () => {
    setError(null);
    if (step === 'age') {
      navigation.goBack();
    } else {
      setStep(STEPS[STEPS.indexOf(step) - 1]);
    }
  };

  const submitAge = () => {
    if (!ageValid) {
      setError(t('onboarding.age.error'));
      return;
    }
    setError(null);
    setOnboarding({ age });
    setStep('belt');
  };

  const selectBelt = (slug: string) => {
    setBeltSlug(slug);
    setStripes(0);
    setOnboarding({ beltSlug: slug, stripes: 0 });
    // pequena pausa para o usuário ver a seleção antes da transição
    setTimeout(() => setStep('stripes'), 250);
  };

  const submitStripes = () => {
    setOnboarding({ stripes });
    setStep('body');
  };

  const changeStripes = (value: number) => {
    if (value !== stripes) {
      // tique tátil a cada grau adicionado ou removido
      Haptics.selectionAsync();
    }
    setStripes(value);
  };

  const submitBody = () => {
    const weight = weightText ? Number(weightText.replace(',', '.')) : undefined;
    const height = heightText ? parseInt(heightText, 10) : undefined;
    const weightValid = weight === undefined || (!Number.isNaN(weight) && weight >= 20 && weight <= 250);
    const heightValid = height === undefined || (!Number.isNaN(height) && height >= 80 && height <= 230);
    if (!weightValid || !heightValid) {
      setError(t('onboarding.body.error'));
      return;
    }
    setError(null);
    setOnboarding({ weightKg: weight, heightCm: height });
    navigation.navigate('SignUp');
  };

  const skipBody = () => {
    setError(null);
    setOnboarding({ weightKg: undefined, heightCm: undefined });
    navigation.navigate('SignUp');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" iconColor={palette.textPrimary} onPress={goBack} />
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
      </View>

      {step === 'age' && (
        <Animated.View
          key="age"
          entering={FadeInRight.duration(300)}
          exiting={FadeOutLeft.duration(200)}
          style={styles.step}>
          <Text variant="headlineMedium" style={styles.title}>
            {t('onboarding.age.title')}
          </Text>
          <TextInput
            mode="outlined"
            value={ageText}
            onChangeText={(v) => setAgeText(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={3}
            placeholder={t('onboarding.age.placeholder')}
            style={styles.bigInput}
            autoFocus
          />
          {error && (
            <Text variant="bodyMedium" style={styles.error}>
              {error}
            </Text>
          )}
          <Button
            mode="contained"
            onPress={submitAge}
            disabled={!ageText}
            contentStyle={styles.buttonContent}
            style={styles.continueButton}>
            {t('common.continue')}
          </Button>
        </Animated.View>
      )}

      {step === 'belt' && (
        <Animated.View
          key="belt"
          entering={FadeInRight.duration(300)}
          exiting={FadeOutLeft.duration(200)}
          style={styles.step}>
          <Text variant="headlineMedium" style={styles.title}>
            {t('onboarding.belt.title')}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {t('onboarding.belt.subtitle')}
          </Text>
          <ScrollView contentContainerStyle={styles.beltList}>
            {beltOptionsForAge(ageValid ? age : 18).map((belt) => (
              <TouchableOpacity
                key={belt.slug}
                onPress={() => selectBelt(belt.slug)}
                style={[styles.beltRow, beltSlug === belt.slug && styles.beltRowSelected]}>
                <View style={[styles.beltSwatch, { backgroundColor: belt.color }]}>
                  <View
                    style={[
                      styles.beltTip,
                      belt.slug === 'adult-black' && { backgroundColor: '#B91C1C' },
                    ]}
                  />
                </View>
                <Text variant="titleMedium" style={styles.beltName}>
                  {belt.namePt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {step === 'stripes' && beltSlug && (
        <Animated.View
          key="stripes"
          entering={FadeInRight.duration(300)}
          exiting={FadeOutLeft.duration(200)}
          style={styles.step}>
          <Text variant="headlineMedium" style={styles.title}>
            {t('onboarding.stripes.title')}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {t('onboarding.stripes.subtitle')}
          </Text>

          <View style={styles.beltPreview}>
            <BeltVisual
              color={beltBySlug(beltSlug)?.color ?? '#FFFFFF'}
              rankBarColor={rankBarColorFor(beltSlug)}
              stripes={stripes}
              height={48}
            />
            <Text variant="titleLarge" style={styles.stripesLabel}>
              {formatStripes(stripes)}
            </Text>
          </View>

          <Slider
            minimumValue={0}
            maximumValue={4}
            step={1}
            value={stripes}
            onValueChange={changeStripes}
            minimumTrackTintColor={palette.primary}
            maximumTrackTintColor={palette.surfaceVariant}
            thumbTintColor={palette.primary}
            style={styles.slider}
          />

          <Button
            mode="contained"
            onPress={submitStripes}
            contentStyle={styles.buttonContent}
            style={styles.continueButton}>
            {t('common.continue')}
          </Button>
        </Animated.View>
      )}

      {step === 'body' && (
        <Animated.View
          key="body"
          entering={FadeInRight.duration(300)}
          exiting={FadeOutLeft.duration(200)}
          style={styles.step}>
          <Text variant="headlineMedium" style={styles.title}>
            {t('onboarding.body.title')}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {t('onboarding.body.subtitle')}
          </Text>
          <TextInput
            mode="outlined"
            label={t('onboarding.body.weight')}
            value={weightText}
            onChangeText={(v) => setWeightText(v.replace(/[^0-9.,]/g, ''))}
            keyboardType="decimal-pad"
            maxLength={6}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label={t('onboarding.body.height')}
            value={heightText}
            onChangeText={(v) => setHeightText(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={3}
            style={styles.input}
          />
          {error && (
            <Text variant="bodyMedium" style={styles.error}>
              {error}
            </Text>
          )}
          <Button
            mode="contained"
            onPress={submitBody}
            contentStyle={styles.buttonContent}
            style={styles.continueButton}>
            {t('common.continue')}
          </Button>
          <Button mode="text" textColor={palette.textSecondary} onPress={skipBody}>
            {t('common.skip')}
          </Button>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = makeStyles(() => ({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 24,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.surfaceVariant,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: palette.primary,
  },
  step: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    color: palette.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: palette.textSecondary,
    marginBottom: 24,
  },
  bigInput: {
    marginTop: 16,
    fontSize: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  beltList: {
    gap: 12,
    paddingBottom: 24,
  },
  beltRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 16,
    gap: 16,
  },
  beltRowSelected: {
    borderColor: palette.primary,
  },
  beltSwatch: {
    width: 72,
    height: 24,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  beltTip: {
    width: 20,
    height: '100%',
    backgroundColor: '#18181B',
  },
  beltName: {
    color: palette.textPrimary,
  },
  beltPreview: {
    marginTop: 24,
    alignItems: 'center',
    gap: 16,
  },
  stripesLabel: {
    color: palette.textPrimary,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  slider: {
    marginTop: 24,
    alignSelf: 'stretch',
    height: 40,
  },
  error: {
    color: palette.primary,
    marginTop: 12,
  },
  continueButton: {
    marginTop: 24,
  },
  buttonContent: {
    paddingVertical: 6,
  },
}));

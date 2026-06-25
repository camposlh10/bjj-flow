import { Component, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { makeStyles, palette } from '../theme/theme';

type Props = { children: ReactNode };
type State = { error: Error | null; stack: string | null };

/** Catches render errors and surfaces the message + component stack (Metro + on-screen). */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, stack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    // eslint-disable-next-line no-console
    console.log('--- ErrorBoundary caught ---\n' + error.message + '\n' + (info.componentStack ?? '(no stack)'));
    this.setState({ stack: info.componentStack ?? null });
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.title}>App error</Text>
          <Text style={styles.msg}>{this.state.error.message}</Text>
          <Text style={styles.stack}>{this.state.stack ?? this.state.error.stack ?? ''}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = makeStyles(() => ({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: 24, paddingTop: 80 },
  title: { color: palette.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  msg: { color: palette.textPrimary, fontSize: 14, marginBottom: 16 },
  stack: { color: palette.textSecondary, fontSize: 11, lineHeight: 16 },
}));

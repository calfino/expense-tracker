import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Animated, StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';

type Mode = 'login' | 'register' | 'join';

// ─── Reusable Input ───────────────────────────────────────────────────────────

const Field: React.FC<{
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  rightEl?: React.ReactNode;
}> = ({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, rightEl }) => (
  <View style={styles.inputWrap}>
    <MaterialIcons name={icon as any} size={20} color={Colors.gray400} style={styles.inputIcon} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={Colors.gray300}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType ?? 'default'}
      autoCapitalize={autoCapitalize ?? 'sentences'}
      autoCorrect={false}
    />
    {rightEl}
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { login, register, registerAndJoin } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please fill in email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else if (mode === 'register') {
        if (!familyName.trim()) {
          Alert.alert('Family Name Required', 'Enter a name for your family group.');
          return;
        }
        await register(email.trim(), password, familyName.trim());
      } else {
        if (!inviteCode.trim()) {
          Alert.alert('Invite Code Required', 'Paste the invite code your family admin shared.');
          return;
        }
        await registerAndJoin(email.trim(), password, inviteCode.trim());
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: Mode; label: string; icon: string }[] = [
    { key: 'login', label: 'Sign In', icon: 'login' },
    { key: 'register', label: 'New Family', icon: 'group-add' },
    { key: 'join', label: 'Join Family', icon: 'person-add' },
  ];

  const btnLabel =
    loading ? 'Please wait…'
    : mode === 'login' ? 'Sign In'
    : mode === 'register' ? 'Create Family Account'
    : 'Join Family';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <ScrollView
        style={styles.bg}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center', marginBottom: 36 }}>
          <View style={styles.logoWrap}>
            <MaterialIcons name="account-balance-wallet" size={48} color={Colors.white} />
          </View>
          <Text style={styles.appName}>Family Budget</Text>
          <Text style={styles.tagline}>Track together · Save together</Text>
        </Animated.View>

        {/* Card */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Tab bar */}
          <View style={styles.tabRow}>
            {tabs.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tab, mode === t.key && styles.tabActive]}
                onPress={() => setMode(t.key)}
              >
                <MaterialIcons
                  name={t.icon as any}
                  size={15}
                  color={mode === t.key ? Colors.primary : Colors.gray400}
                />
                <Text style={[styles.tabText, mode === t.key && styles.tabTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            {mode === 'register' && (
              <Field
                icon="family-restroom"
                placeholder="Family group name (e.g. The Smiths)"
                value={familyName}
                onChangeText={setFamilyName}
              />
            )}
            <Field
              icon="email"
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              icon="lock"
              placeholder="Password (min. 6 characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoCapitalize="none"
              rightEl={
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
                  <MaterialIcons
                    name={showPass ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={Colors.gray400}
                  />
                </TouchableOpacity>
              }
            />
            {mode === 'join' && (
              <Field
                icon="vpn-key"
                placeholder="Family invite code"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="none"
              />
            )}
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{btnLabel}</Text>
          </TouchableOpacity>

          {/* Hints */}
          {mode === 'register' && (
            <Text style={styles.hint}>
              🔑 After signing up, your <Text style={{ fontWeight: '700' }}>Family ID</Text> (found in Settings) is the invite code to share with family members.
            </Text>
          )}
          {mode === 'join' && (
            <Text style={styles.hint}>
              💡 Ask your family admin for the Family ID shown in their Settings screen.
            </Text>
          )}
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bg: { flex: 1, backgroundColor: Colors.primary },
  content: { paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 },
  logoWrap: {
    width: 92, height: 92, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
  },
  appName: { fontSize: 34, fontWeight: '900', color: Colors.white, letterSpacing: 0.3 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 6, fontWeight: '500' },
  card: {
    backgroundColor: Colors.white, borderRadius: 28, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18, shadowRadius: 28, elevation: 12,
  },
  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.gray100,
    borderRadius: 16, padding: 4, marginBottom: 24,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 12, gap: 4,
  },
  tabActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  tabText: { fontSize: 11, fontWeight: '600', color: Colors.gray400 },
  tabTextActive: { color: Colors.primary },
  fields: { gap: 12, marginBottom: 20 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.gray50, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  btn: {
    backgroundColor: Colors.primary, borderRadius: 16, height: 56,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  btnText: { fontSize: 16, fontWeight: '800', color: Colors.white },
  hint: {
    fontSize: 12, color: Colors.textMuted, textAlign: 'center',
    marginTop: 16, lineHeight: 18,
  },
});

export default LoginScreen;

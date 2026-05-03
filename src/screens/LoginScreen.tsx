import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Animated, StatusBar,
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';

type Mode = 'login' | 'register' | 'join';
type SetupMode = 'create' | 'join';

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

// ─── Error message ────────────────────────────────────────────────────────────

const ErrorBox: React.FC<{ msg: string }> = ({ msg }) =>
  msg ? (
    <View style={styles.errorBox}>
      <MaterialIcons name="error-outline" size={15} color="#EF5350" />
      <Text style={styles.errorText}>{msg}</Text>
    </View>
  ) : null;

// ─── Screen ───────────────────────────────────────────────────────────────────

const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    user, familyId,
    login, register, registerAndJoin,
    createFamilyForCurrentUser, joinFamilyForCurrentUser,
    signInWithGoogle, logout,
  } = useAuth();

  // Show family setup if signed in via Google/email but no family linked yet
  const needsFamilySetup = !!user && !familyId;

  const [mode, setMode] = useState<Mode>('login');
  const [setupMode, setSetupMode] = useState<SetupMode>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  // Clear error when mode changes
  useEffect(() => { setErrorMsg(''); }, [mode, setupMode]);

  // ─── Email/password login / register ─────────────────────────────────────────

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Please fill in email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else if (mode === 'register') {
        if (!familyName.trim()) { setErrorMsg('Enter a name for your family group.'); setLoading(false); return; }
        await register(email.trim(), password, familyName.trim());
      } else {
        if (!inviteCode.trim()) { setErrorMsg('Paste the invite code your family admin shared.'); setLoading(false); return; }
        await registerAndJoin(email.trim(), password, inviteCode.trim());
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Family setup (for Google/existing auth users without a family) ───────────

  const handleFamilySetup = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      if (setupMode === 'create') {
        if (!familyName.trim()) { setErrorMsg('Enter a name for your family group.'); setLoading(false); return; }
        await createFamilyForCurrentUser(familyName.trim());
      } else {
        if (!inviteCode.trim()) { setErrorMsg('Paste the invite code your family admin shared.'); setLoading(false); return; }
        await joinFamilyForCurrentUser(inviteCode.trim());
      }
    } catch (err: any) {
      console.error('Family setup error:', err);
      setErrorMsg(err?.message ?? 'Failed to set up family. Check your Firestore rules and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Google Sign-In ───────────────────────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Could not sign in with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const tabs: { key: Mode; label: string; icon: string }[] = [
    { key: 'login', label: 'Sign In', icon: 'login' },
    { key: 'register', label: 'New Family', icon: 'group-add' },
    { key: 'join', label: 'Join Family', icon: 'person-add' },
  ];

  const btnLabel = loading ? 'Please wait…'
    : mode === 'login' ? 'Sign In'
    : mode === 'register' ? 'Create Family Account'
    : 'Join Family';

  // ─── Family Setup UI ─────────────────────────────────────────────────────────

  if (needsFamilySetup) {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
        <ScrollView
          style={styles.bg}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', marginBottom: 32 }}>
            <View style={styles.logoWrap}>
              <MaterialIcons name="family-restroom" size={44} color={Colors.white} />
            </View>
            <Text style={styles.appName}>One more step</Text>
            <Text style={styles.tagline}>
              Welcome{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}!{'\n'}Set up your family group to continue.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            {/* Setup Tabs */}
            <View style={styles.tabRow}>
              {([{ key: 'create' as SetupMode, label: 'New Family', icon: 'group-add' },
                 { key: 'join' as SetupMode, label: 'Join Family', icon: 'person-add' }]).map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.tab, setupMode === t.key && styles.tabActive]}
                  onPress={() => setSetupMode(t.key)}
                >
                  <MaterialIcons name={t.icon as any} size={15} color={setupMode === t.key ? Colors.primary : Colors.gray400} />
                  <Text style={[styles.tabText, setupMode === t.key && styles.tabTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.fields}>
              {setupMode === 'create' ? (
                <Field
                  icon="family-restroom"
                  placeholder="Family group name (e.g. The Smiths)"
                  value={familyName}
                  onChangeText={setFamilyName}
                />
              ) : (
                <Field
                  icon="vpn-key"
                  placeholder="Family invite code"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="none"
                />
              )}
            </View>

            <ErrorBox msg={errorMsg} />

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.7 }]}
              onPress={handleFamilySetup}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>
                {loading ? 'Setting up…' : setupMode === 'create' ? 'Create Family' : 'Join Family'}
              </Text>
            </TouchableOpacity>

            {setupMode === 'join' && (
              <Text style={styles.hint}>💡 Ask your family admin for the Family ID shown in their Settings screen.</Text>
            )}

            {/* Sign out escape hatch */}
            <TouchableOpacity style={styles.signOutBtn} onPress={logout}>
              <MaterialIcons name="logout" size={15} color={Colors.gray400} />
              <Text style={styles.signOutText}>Sign out and use a different account</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── Main Login / Register UI ─────────────────────────────────────────────────

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

          {/* Google Sign-In */}
          <TouchableOpacity
            style={[styles.googleBtn, googleLoading && { opacity: 0.7 }]}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            activeOpacity={0.85}
          >
            <FontAwesome name="google" size={18} color="#DB4437" />
            <Text style={styles.googleBtnText}>{googleLoading ? 'Signing in…' : 'Continue with Google'}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {tabs.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tab, mode === t.key && styles.tabActive]}
                onPress={() => setMode(t.key)}
              >
                <MaterialIcons name={t.icon as any} size={15} color={mode === t.key ? Colors.primary : Colors.gray400} />
                <Text style={[styles.tabText, mode === t.key && styles.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            {mode === 'register' && (
              <Field icon="family-restroom" placeholder="Family group name (e.g. The Smiths)" value={familyName} onChangeText={setFamilyName} />
            )}
            <Field icon="email" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Field
              icon="lock"
              placeholder="Password (min. 6 characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoCapitalize="none"
              rightEl={
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
                  <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={20} color={Colors.gray400} />
                </TouchableOpacity>
              }
            />
            {mode === 'join' && (
              <Field icon="vpn-key" placeholder="Family invite code" value={inviteCode} onChangeText={setInviteCode} autoCapitalize="none" />
            )}
          </View>

          <ErrorBox msg={errorMsg} />

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{btnLabel}</Text>
          </TouchableOpacity>

          {mode === 'register' && (
            <Text style={styles.hint}>🔑 After signing up, your <Text style={{ fontWeight: '700' }}>Family ID</Text> is the invite code to share with family members.</Text>
          )}
          {mode === 'join' && (
            <Text style={styles.hint}>💡 Ask your family admin for the Family ID shown in their Settings screen.</Text>
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
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 6, fontWeight: '500', textAlign: 'center', paddingHorizontal: 20 },
  card: {
    backgroundColor: Colors.white, borderRadius: 28, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18, shadowRadius: 28, elevation: 12,
  },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 14, height: 52,
    borderWidth: 1.5, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, marginBottom: 4,
  },
  googleBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.gray100,
    borderRadius: 16, padding: 4, marginBottom: 20,
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
  fields: { gap: 12, marginBottom: 16 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.gray50, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginBottom: 14,
  },
  errorText: { flex: 1, fontSize: 13, color: '#EF5350', fontWeight: '500' },
  btn: {
    backgroundColor: Colors.primary, borderRadius: 16, height: 56,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  btnText: { fontSize: 16, fontWeight: '800', color: Colors.white },
  hint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 20, paddingVertical: 8,
  },
  signOutText: { fontSize: 12, color: Colors.gray400, fontWeight: '500' },
});

export default LoginScreen;

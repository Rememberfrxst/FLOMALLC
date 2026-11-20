import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { TextInput } from '@/components/TextInput';
import { Text } from '@/components/Text';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SvgIcon from '@/components/SvgIcon';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useDesktopWeb } from '@/hooks/useDesktopWeb';
import DesktopStoreHeader from '@/components/DesktopStoreHeader';
import DesktopStoreFooter from '@/components/DesktopStoreFooter';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const desktop = useDesktopWeb();
  const { login } = useAuth();
  const isWeb = Platform.OS === 'web';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleClose = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleLogin = async () => {
    setErrorMsg('');
    setInfoMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }
    setLoading(true);
    try {
      const success = await login(email.trim().toLowerCase(), password);
      if (success) {
        handleClose();
      } else {
        setErrorMsg('Invalid email or password. Try again or create a new FLOMA account below.');
      }
    } catch {
      setErrorMsg('Unable to sign in right now. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      {desktop ? (
        <DesktopStoreHeader />
      ) : (
        <View style={{ paddingTop: isWeb ? 24 : insets.top + 10, paddingHorizontal: 20 }}>
          <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.muted }]} onPress={handleClose}>
            <SvgIcon name="close" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      )}

      <View
        style={[
          styles.inner,
          desktop && {
            marginVertical: 40,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            padding: 36,
            borderRadius: 2,
          },
        ]}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={[styles.logo, { backgroundColor: colors.navy }]}>
            <Text style={styles.logoText}>F</Text>
          </View>
          <Text style={[styles.brandName, { color: colors.navy }]}>FLOMA</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Curated Fashion & Lifestyle</Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Welcome to FLOMA</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sign in to manage orders, wishlist and offers</Text>

        {!!errorMsg && (
          <View style={[styles.hint, { backgroundColor: colors.destructive + '12', borderColor: colors.destructive }]}>
            <SvgIcon name="alert-circle-outline" size={18} color={colors.destructive} />
            <Text style={[styles.hintText, { color: colors.destructive }]}>{errorMsg}</Text>
          </View>
        )}

        {!!infoMsg && (
          <View style={[styles.hint, { backgroundColor: colors.navy + '0D', borderColor: colors.navy + '40' }]}>
            <SvgIcon name="information-circle-outline" size={18} color={colors.navy} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.hintText, { color: colors.foreground }]}>{infoMsg}</Text>
              <TouchableOpacity onPress={() => router.push({ pathname: '/help', params: { section: 'support' } })}>
                <Text style={{ color: colors.link, fontSize: 12.5, fontFamily: 'GoogleSans_600SemiBold' }}>
                  Contact FLOMA Customer Care ›
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border, borderRadius: desktop ? 2 : 12 }]}>
              <SvgIcon name="mail-outline" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'GoogleSans_400Regular' }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errorMsg) setErrorMsg('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border, borderRadius: desktop ? 2 : 12 }]}>
              <SvgIcon name="lock-closed-outline" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'GoogleSans_400Regular' }]}
                placeholder="Your password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errorMsg) setErrorMsg('');
                }}
                secureTextEntry={!showPw}
                onSubmitEditing={handleLogin}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setShowPw(s => !s)}>
                <SvgIcon name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() =>
              setInfoMsg(
                'Need help accessing your FLOMA account? Reach out to Customer Care to verify your email and reset your credentials.',
              )
            }
          >
            <Text style={[styles.forgotText, { color: colors.link }]}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.loginBtn,
              {
                backgroundColor: loading ? colors.muted : desktop ? colors.gold : colors.primary,
                borderRadius: desktop ? 2 : 14,
              },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={[styles.loginBtnText, { color: '#FFFFFF' }]}>
              {loading ? 'Signing In...' : desktop ? 'SIGN IN' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.mutedForeground }]}>OR</Text>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, { borderColor: colors.navy, borderRadius: desktop ? 2 : 14 }]}
            onPress={() => router.replace('/auth/register')}
          >
            <Text style={[styles.registerBtnText, { color: colors.navy }]}>
              {desktop ? 'CREATE NEW ACCOUNT' : 'Create New Account'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {desktop && <DesktopStoreFooter />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  inner: { width: '100%', maxWidth: 460, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 24, paddingBottom: 40, gap: 8 },
  brand: { alignItems: 'center', gap: 8, marginBottom: 16 },
  logo: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 28, fontFamily: 'GoogleSans_700Bold', color: '#fff' },
  brandName: { fontSize: 22, fontFamily: 'GoogleSans_700Bold', letterSpacing: 3 },
  tagline: { fontSize: 13, fontFamily: 'GoogleSans_400Regular' },
  title: { fontSize: 26, fontFamily: 'GoogleSans_700Bold', marginTop: 8 },
  subtitle: { fontSize: 15, fontFamily: 'GoogleSans_400Regular', marginBottom: 8 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  hintText: { fontSize: 13, fontFamily: 'GoogleSans_500Medium', flex: 1 },
  form: { gap: 14, marginTop: 8 },
  field: { gap: 6 },
  label: { fontSize: 14, fontFamily: 'GoogleSans_500Medium' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 14, height: 50, borderWidth: 1 },
  input: { flex: 1, fontSize: 15, height: '100%' },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 14, fontFamily: 'GoogleSans_600SemiBold' },
  loginBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  loginBtnText: { fontSize: 15, letterSpacing: 0.8, fontFamily: 'GoogleSans_700Bold' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 13, fontFamily: 'GoogleSans_500Medium' },
  registerBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1.5 },
  registerBtnText: { fontSize: 14, letterSpacing: 0.8, fontFamily: 'GoogleSans_700Bold' },
});

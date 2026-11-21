import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
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

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const desktop = useDesktopWeb();
  const { register, loginWithGoogle } = useAuth();
  const isWeb = Platform.OS === 'web';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleClose = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleGoogleSignUp = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      const success = await loginWithGoogle();
      if (success) {
        handleClose();
      } else {
        setErrorMsg('Google sign-up could not be completed. Please try again.');
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('popup-closed-by-user') || msg.includes('cancelled')) {
        setErrorMsg('Google sign-up was cancelled.');
      } else {
        setErrorMsg(msg || 'Could not connect to Google right now.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async () => {
    setErrorMsg('');
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const success = await register(name.trim(), email.trim().toLowerCase(), phone.trim(), password);
      if (success) {
        handleClose();
      } else {
        setErrorMsg('An account with this email already exists. Try signing in instead.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not create your account right now. Please try again.');
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
        <View style={styles.brand}>
          <Image
            source={require('@/assets/images/logo-transparent.png')}
            style={styles.logoImg}
            contentFit="contain"
          />
          <Text style={[styles.brandName, { color: colors.navy }]}>FLOMA</Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Join FLOMA</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Create your account for curated fashion & offers</Text>

        {!!errorMsg && (
          <View style={[styles.errorBanner, { backgroundColor: colors.destructive + '12', borderColor: colors.destructive }]}>
            <SvgIcon name="alert-circle-outline" size={18} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMsg}</Text>
          </View>
        )}

        <View style={styles.form}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Sign up with Google"
            style={[
              styles.googleBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: desktop ? 2 : 14,
              },
            ]}
            onPress={handleGoogleSignUp}
            disabled={loading || googleLoading}
          >
            <SvgIcon name="google" size={20} />
            <Text style={[styles.googleBtnText, { color: colors.foreground }]}>
              {googleLoading ? 'Connecting to Google...' : desktop ? 'SIGN UP WITH GOOGLE' : 'Sign up with Google'}
            </Text>
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.mutedForeground }]}>OR SIGN UP WITH EMAIL</Text>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
          </View>

          {[
            { label: 'Full Name', value: name, setter: setName, placeholder: 'Your full name', icon: 'person-outline', type: 'default', cap: 'words' as const },
            { label: 'Email', value: email, setter: setEmail, placeholder: 'you@example.com', icon: 'mail-outline', type: 'email-address', cap: 'none' as const },
            { label: 'Phone', value: phone, setter: setPhone, placeholder: '+91 99999 99999', icon: 'call-outline', type: 'phone-pad', cap: 'none' as const },
          ].map(field => (
            <View key={field.label} style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>{field.label}</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border, borderRadius: desktop ? 2 : 12 }]}>
                <SvgIcon name={field.icon as any} size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground, fontFamily: 'GoogleSans_400Regular' }]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={field.value}
                  onChangeText={(t) => {
                    field.setter(t);
                    if (errorMsg) setErrorMsg('');
                  }}
                  keyboardType={field.type as any}
                  autoCapitalize={field.cap}
                  autoCorrect={false}
                />
              </View>
            </View>
          ))}

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border, borderRadius: desktop ? 2 : 12 }]}>
              <SvgIcon name="lock-closed-outline" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'GoogleSans_400Regular' }]}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errorMsg) setErrorMsg('');
                }}
                secureTextEntry={!showPw}
                onSubmitEditing={handleRegister}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setShowPw(s => !s)}>
                <SvgIcon name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.registerBtn,
              {
                backgroundColor: loading ? colors.muted : desktop ? colors.gold : colors.primary,
                borderRadius: desktop ? 2 : 14,
              },
            ]}
            onPress={handleRegister}
            disabled={loading || googleLoading}
          >
            <Text style={[styles.registerBtnText, { color: '#FFFFFF' }]}>
              {loading ? 'Creating Account...' : desktop ? 'CREATE ACCOUNT' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.mutedForeground }]}>Already have an account?</Text>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity style={[styles.loginBtn, { borderColor: colors.navy, borderRadius: desktop ? 2 : 14 }]} onPress={() => router.replace('/auth/login')}>
            <Text style={[styles.loginBtnText, { color: colors.navy }]}>{desktop ? 'SIGN IN INSTEAD' : 'Sign In Instead'}</Text>
          </TouchableOpacity>

          <Text style={[styles.terms, { color: colors.mutedForeground }]}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
      {desktop && <DesktopStoreFooter />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  inner: { width: '100%', maxWidth: 460, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 20, paddingBottom: 40, gap: 8 },
  brand: { alignItems: 'center', gap: 8, marginBottom: 8 },
  logoImg: { width: 64, height: 64, backgroundColor: 'transparent' },
  brandName: { fontSize: 18, fontFamily: 'GoogleSans_700Bold', letterSpacing: 3 },
  title: { fontSize: 26, fontFamily: 'GoogleSans_700Bold' },
  subtitle: { fontSize: 15, fontFamily: 'GoogleSans_400Regular', marginBottom: 4 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 4 },
  errorText: { fontSize: 13, fontFamily: 'GoogleSans_500Medium', flex: 1 },
  form: { gap: 14, marginTop: 8 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderWidth: 1.5,
  },
  googleBtnText: { fontSize: 14.5, fontFamily: 'GoogleSans_600SemiBold', letterSpacing: 0.3 },
  field: { gap: 6 },
  label: { fontSize: 14, fontFamily: 'GoogleSans_500Medium' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 14, height: 50, borderWidth: 1 },
  input: { flex: 1, fontSize: 15, height: '100%' },
  registerBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  registerBtnText: { fontSize: 15, letterSpacing: 0.8, fontFamily: 'GoogleSans_700Bold' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 11.5, fontFamily: 'GoogleSans_400Regular' },
  loginBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1.5 },
  loginBtnText: { fontSize: 14, letterSpacing: 0.8, fontFamily: 'GoogleSans_700Bold' },
  terms: { fontSize: 11, fontFamily: 'GoogleSans_400Regular', textAlign: 'center', lineHeight: 16 },
});

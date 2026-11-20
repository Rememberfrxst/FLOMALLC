import React, { useEffect, useRef } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Text';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SvgIcon from '@/components/SvgIcon';
import { useColors } from '@/hooks/useColors';
import { useCart } from '@/context/CartContext';
import { useDesktopWeb } from '@/hooks/useDesktopWeb';
import DesktopStoreHeader from '@/components/DesktopStoreHeader';
import DesktopStoreFooter from '@/components/DesktopStoreFooter';

export default function CheckoutSuccessScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const desktop = useDesktopWeb();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders } = useCart();
  const isWeb = Platform.OS === 'web';

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true, delay: 100 }),
    ]).start();
  }, [scale, opacity]);

  const order = orders.find(o => o.id === orderId);

  const mainContent = (
    <View style={[styles.container, desktop && styles.desktopInner, { backgroundColor: colors.background, paddingBottom: isWeb ? 34 : insets.bottom + 20, paddingTop: desktop ? 48 : isWeb ? 80 : insets.top + 40 }]}>
      <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
        <View style={[styles.iconBg, { backgroundColor: colors.success + '20' }]}>
          <View style={[styles.iconInner, { backgroundColor: colors.success }]}>
            <SvgIcon name="checkmark" size={52} color="#fff" />
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.content, { opacity }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Order Placed!</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Your FLOMA order has been confirmed. We'll send you a notification once it ships.
        </Text>

        {order && (
          <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.orderRow}>
              <Text style={[styles.orderLabel, { color: colors.mutedForeground }]}>Order ID</Text>
              <Text style={[styles.orderVal, { color: colors.foreground }]}>#{order.id}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.orderRow}>
              <Text style={[styles.orderLabel, { color: colors.mutedForeground }]}>Payment</Text>
              <Text style={[styles.orderVal, { color: colors.foreground }]}>
                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'upi' ? 'UPI' : 'Online Payment'}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.orderRow}>
              <Text style={[styles.orderLabel, { color: colors.mutedForeground }]}>Items</Text>
              <Text style={[styles.orderVal, { color: colors.foreground }]}>{order.items.length} item{order.items.length > 1 ? 's' : ''}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.orderRow}>
              <Text style={[styles.orderLabel, { color: colors.mutedForeground }]}>Est. Delivery</Text>
              <Text style={[styles.orderVal, { color: colors.success }]}>{order.estimatedDelivery}</Text>
            </View>
          </View>
        )}

        <View style={[styles.deliveryBanner, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
          <SvgIcon name="bicycle" size={20} color={colors.success} />
          <Text style={[styles.deliveryText, { color: colors.success }]}>Your order is on its way soon!</Text>
        </View>

        <TouchableOpacity
          style={[styles.trackBtn, { backgroundColor: desktop ? colors.gold : colors.primary, borderRadius: desktop ? 2 : 14 }]}
          onPress={() => order ? router.replace(`/order/${order.id}`) : router.replace('/')}
        >
          <SvgIcon name="navigate" size={18} color="#FFFFFF" />
          <Text style={[styles.trackBtnText, { color: "#FFFFFF" }]}>{desktop ? 'TRACK ORDER' : 'Track Order'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.continueBtn, { borderColor: colors.border, borderRadius: desktop ? 2 : 14 }]}
          onPress={() => router.replace('/')}
        >
          <Text style={[styles.continueBtnText, { color: colors.foreground }]}>{desktop ? 'CONTINUE SHOPPING' : 'Continue Shopping'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  if (desktop) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
        <DesktopStoreHeader />
        {mainContent}
        <DesktopStoreFooter />
      </ScrollView>
    );
  }

  return mainContent;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },
  desktopInner: { width: '100%', maxWidth: 580, alignSelf: 'center', minHeight: 540 },
  iconWrap: { marginBottom: 32 },
  iconBg: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center' },
  iconInner: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  content: { width: '100%', alignItems: 'center', gap: 16 },
  title: { fontSize: 28, fontFamily: 'GoogleSans_700Bold' },
  subtitle: { fontSize: 15, fontFamily: 'GoogleSans_400Regular', textAlign: 'center', lineHeight: 22 },
  orderCard: { width: '100%', borderRadius: 4, padding: 16, borderWidth: 1, gap: 12 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderLabel: { fontSize: 13, fontFamily: 'GoogleSans_400Regular' },
  orderVal: { fontSize: 14, fontFamily: 'GoogleSans_600SemiBold' },
  divider: { height: 1 },
  deliveryBanner: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 4, borderWidth: 1 },
  deliveryText: { fontSize: 14, fontFamily: 'GoogleSans_600SemiBold' },
  trackBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  trackBtnText: { fontSize: 15, letterSpacing: 0.7, fontFamily: 'GoogleSans_700Bold' },
  continueBtn: { width: '100%', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  continueBtnText: { fontSize: 14, letterSpacing: 0.7, fontFamily: 'GoogleSans_600SemiBold' },
});

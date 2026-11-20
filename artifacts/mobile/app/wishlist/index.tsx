import React from 'react';
import { FlatList, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Text';
import { router } from 'expo-router';
import SvgIcon from '@/components/SvgIcon';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import { useDesktopWeb } from '@/hooks/useDesktopWeb';
import DesktopStoreHeader from '@/components/DesktopStoreHeader';
import DesktopStoreFooter from '@/components/DesktopStoreFooter';

export default function WishlistScreen() {
  const colors = useColors();
  const desktop = useDesktopWeb();
  const { items, toggle } = useWishlist();
  const { addItem } = useCart();
  const isWeb = Platform.OS === 'web';

  if (desktop) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <DesktopStoreHeader />
          <View style={styles.desktopWrap}>
            <View style={[styles.desktopTopBar, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.desktopKicker, { color: colors.goldMuted }]}>FLOMA SAVED</Text>
                <Text style={[styles.desktopTitle, { color: colors.navy }]}>
                  MY WISHLIST ({items.length})
                </Text>
              </View>
              {items.length > 0 && (
                <TouchableOpacity
                  style={[styles.desktopGoldBtn, { backgroundColor: colors.gold }]}
                  onPress={() => {
                    items.forEach(p => addItem(p));
                    router.push('/cart');
                  }}
                >
                  <SvgIcon name="bag-add" size={16} color="#FFFFFF" />
                  <Text style={styles.desktopGoldBtnText}>MOVE ALL TO BAG</Text>
                </TouchableOpacity>
              )}
            </View>

            {items.length === 0 ? (
              <View style={[styles.desktopEmpty, { borderColor: colors.border }]}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                  <SvgIcon name="heart-outline" size={44} color={colors.navy} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  Your Wishlist is Empty
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                  Save styles you love by clicking the heart icon on any product.
                </Text>
                <TouchableOpacity
                  style={[styles.desktopGoldBtn, { backgroundColor: colors.gold, marginTop: 8 }]}
                  onPress={() => router.push('/')}
                >
                  <Text style={styles.desktopGoldBtnText}>EXPLORE STYLES</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.desktopGrid}>
                {items.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    desktop
                    onPress={() => router.push(`/product/${item.id}`)}
                    isWishlisted={true}
                    onWishlistToggle={() => toggle(item)}
                    style={{ width: '23.5%' as any }}
                  />
                ))}
              </View>
            )}
          </View>
          <DesktopStoreFooter />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={p => p.id}
        numColumns={2}
        contentContainerStyle={[styles.grid, { paddingBottom: isWeb ? 100 : 120 }]}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <Text style={[styles.count, { color: colors.mutedForeground }]}>
            {items.length} saved {items.length === 1 ? 'item' : 'items'}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <SvgIcon name="heart-outline" size={48} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your wishlist is empty</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Save items you love by tapping the heart icon</Text>
            <TouchableOpacity style={[styles.shopBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/')}>
              <Text style={[styles.shopBtnText, { color: colors.primaryForeground }]}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => router.push(`/product/${item.id}`)}
            isWishlisted={true}
            onWishlistToggle={() => {
              toggle(item);
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
            }}
            style={{ flex: 1 }}
          />
        )}
      />
      {items.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1 }]}>
          <TouchableOpacity
            style={[styles.addAllBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              items.forEach(p => addItem(p));
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              router.push('/cart');
            }}
          >
            <SvgIcon name="bag-add" size={18} color={colors.primaryForeground} />
            <Text style={[styles.addAllText, { color: colors.primaryForeground }]}>Add All to Bag</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  desktopWrap: { width: '100%', maxWidth: 1240, alignSelf: 'center', paddingHorizontal: 28, paddingVertical: 28, minHeight: 520 },
  desktopTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottomWidth: 1, marginBottom: 24 },
  desktopKicker: { fontSize: 10.5, letterSpacing: 1.5, fontFamily: 'GoogleSans_700Bold', marginBottom: 3 },
  desktopTitle: { fontSize: 22, letterSpacing: 1.1, fontFamily: 'GoogleSans_700Bold' },
  desktopGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  desktopEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 70, borderWidth: 1, borderRadius: 2, gap: 12 },
  desktopGoldBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 2 },
  desktopGoldBtnText: { color: '#FFFFFF', fontSize: 12, letterSpacing: 1, fontFamily: 'GoogleSans_700Bold' },
  grid: { padding: 12, gap: 10 },
  row: { gap: 10 },
  count: { fontSize: 13, fontFamily: 'GoogleSans_400Regular', marginBottom: 10 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontFamily: 'GoogleSans_600SemiBold' },
  emptySubtitle: { fontSize: 14, fontFamily: 'GoogleSans_400Regular', textAlign: 'center' },
  shopBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  shopBtnText: { fontSize: 16, fontFamily: 'GoogleSans_600SemiBold' },
  footer: { padding: 16, paddingBottom: 32 },
  addAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  addAllText: { fontSize: 16, fontFamily: 'GoogleSans_600SemiBold' },
});

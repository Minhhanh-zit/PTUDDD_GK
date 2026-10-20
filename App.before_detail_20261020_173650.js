import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, FlatList, ScrollView,
  Pressable, StyleSheet, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase, getDishes } from './src/database/database';

const BLUE = '#8295E5';

const SORTS = [
  { id: 'priceAsc', label: 'Price ↑', icon: 'trending-up-outline' },
  { id: 'priceDesc', label: 'Price ↓', icon: 'trending-down-outline' },
  { id: 'timeAsc', label: 'Time ↑', icon: 'time-outline' },
];

function getDishIcon(category) {
  const name = String(category).toLowerCase();
  if (name.includes('drink')) return 'cafe-outline';
  if (name.includes('dessert')) return 'ice-cream-outline';
  if (name === 'all') return 'grid-outline';
  return 'restaurant-outline';
}

function Chip({ label, icon, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      {icon && <Ionicons name={icon} size={15}
        color={active ? '#FFFFFF' : '#967CDA'} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function App() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('priceAsc');

  async function loadDishes() {
    const data = await getDishes();
    setDishes(data);
  }

  useEffect(() => {
    let active = true;
    async function setup() {
      try {
        await initDatabase();
        const data = await getDishes();
        if (active) setDishes(data);
      } catch (err) {
        if (active) setError(String(err.message || err));
      } finally {
        if (active) setLoading(false);
      }
    }
    setup();
    return () => { active = false; };
  }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      await loadDishes();
      setError('');
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setRefreshing(false);
    }
  }

  const categories = useMemo(
    () => ['All', ...new Set(dishes.map(d => d.categoryName))],
    [dishes]
  );

  const invalidRange =
    minPrice !== '' &&
    maxPrice !== '' &&
    Number(minPrice) > Number(maxPrice);

  const filteredDishes = useMemo(() => {
    if (invalidRange) return [];

    const result = dishes.filter(dish => {
      if (!dish.name.toLowerCase().includes(search.trim().toLowerCase())) {
        return false;
      }

      if (category !== 'All' && dish.categoryName !== category) {
        return false;
      }

      if (availableOnly && !dish.isAvailable) {
        return false;
      }

      if (minPrice !== '' && dish.price < Number(minPrice)) {
        return false;
      }

      if (maxPrice !== '' && dish.price > Number(maxPrice)) {
        return false;
      }

      return true;
    });

    return result.sort((a, b) => {
      if (sort === 'priceAsc') return a.price - b.price;
      if (sort === 'priceDesc') return b.price - a.price;
      return a.preparationTime - b.preparationTime;
    });
  }, [
    dishes, search, category, availableOnly,
    minPrice, maxPrice, sort, invalidRange
  ]);

  function resetFilters() {
    setSearch('');
    setCategory('All');
    setAvailableOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setSort('priceAsc');
  }

  function renderDish({ item }) {
    const quick = item.preparationTime <= 15;

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.foodImage}>
            <Ionicons
              name={getDishIcon(item.categoryName)}
              size={40}
              color="#967CDA"
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.dishName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.categoryName}>
              {item.categoryName}
            </Text>
            <Text style={styles.price}>
              {item.price.toLocaleString('vi-VN')} VND
            </Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.timeGroup}>
            <Ionicons name="time-outline" size={15} color="#8585A5" />
            <Text style={styles.timeText}>
              {item.preparationTime} min
            </Text>
            <Text style={styles.quickText}>
              {quick ? 'Quick' : 'Regular'}
            </Text>
          </View>

          <View style={[
            styles.statusBadge,
            !item.isAvailable && styles.unavailableBadge,
          ]}>
            <View style={[
              styles.statusDot,
              !item.isAvailable && styles.unavailableDot,
            ]} />
            <Text style={[
              styles.statusText,
              !item.isAvailable && styles.unavailableText,
            ]}>
              {item.isAvailable ? 'Available' : 'Unavailable'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />

        <FlatList
          data={filteredDishes}
          keyExtractor={item => String(item.id)}
          renderItem={renderDish}
          refreshing={refreshing}
          onRefresh={refresh}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <View style={styles.header}>
                <View style={styles.logo}>
                  <Ionicons name="restaurant" size={25} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.appName}>Food Manager</Text>
                  <Text style={styles.student}>BIT246755</Text>
                </View>
              </View>

              <View style={styles.hero}>
                <Text style={styles.heroLabel}>MENU MANAGEMENT</Text>
                <Text style={styles.heroTitle}>Manage your dishes</Text>
                <Text style={styles.heroSub}>
                  Organize and explore your food menu.
                </Text>
                <Text style={styles.total}>
                  {dishes.length} dishes in your menu
                </Text>
              </View>

              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={21} color="#9A9AB6" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search dishes..."
                  placeholderTextColor="#9A9AB6"
                  value={search}
                  onChangeText={setSearch}
                />
                {search !== '' && (
                  <Pressable onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={19} color="#9A9AB6" />
                  </Pressable>
                )}
              </View>

              <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>Categories</Text>
                <Pressable onPress={resetFilters}>
                  <Text style={styles.reset}>Reset filters</Text>
                </Pressable>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map(c => (
                  <Chip
                    key={c}
                    label={c}
                    icon={getDishIcon(c)}
                    active={category === c}
                    onPress={() => setCategory(c)}
                  />
                ))}
              </ScrollView>

              <View style={styles.filterBox}>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>Price range (VND)</Text>
                </View>

                <View style={styles.priceInputs}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min price"
                    keyboardType="number-pad"
                    value={minPrice}
                    onChangeText={t => setMinPrice(t.replace(/\D/g, ''))}
                  />
                  <Text style={styles.dash}>—</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max price"
                    keyboardType="number-pad"
                    value={maxPrice}
                    onChangeText={t => setMaxPrice(t.replace(/\D/g, ''))}
                  />
                </View>

                {invalidRange && (
                  <Text style={styles.error}>
                    Minimum price cannot exceed maximum price.
                  </Text>
                )}

                <Pressable
                  style={styles.availableRow}
                  onPress={() => setAvailableOnly(!availableOnly)}
                >
                  <Ionicons
                    name={availableOnly ? 'checkbox' : 'square-outline'}
                    size={23}
                    color={BLUE}
                  />
                  <Text style={styles.availableLabel}>
                    Available dishes only
                  </Text>
                </Pressable>
              </View>

              <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>Sort by</Text>
              </View>

              <View style={styles.sortRow}>
                {SORTS.map(option => (
                  <Chip
                    key={option.id}
                    label={option.label}
                    icon={option.icon}
                    active={sort === option.id}
                    onPress={() => setSort(option.id)}
                  />
                ))}
              </View>

              <View style={styles.resultsRow}>
                <Text style={styles.resultsTitle}>All Dishes</Text>
                <Text style={styles.resultCount}>
                  {filteredDishes.length} results
                </Text>
              </View>

              {loading && <ActivityIndicator color={BLUE} size="large" />}
              {!!error && <Text style={styles.error}>{error}</Text>}
            </>
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={38} color="#9A9AB6" />
                <Text style={styles.emptyTitle}>No dishes found</Text>
                <Text style={styles.emptySub}>
                  Try changing your filters.
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            <Text style={styles.footer}>BIT246755 · Food Manager</Text>
          }
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7FF' },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 16, paddingBottom: 22, gap: 12,
  },
  logo: {
    width: 49, height: 49, borderRadius: 16,
    backgroundColor: BLUE, alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { fontSize: 23, fontWeight: '800', color: '#393657' },
  student: { fontSize: 13, color: '#8585A5', marginTop: 3 },
  hero: {
    backgroundColor: '#E9E7FF', padding: 22,
    borderRadius: 23, marginBottom: 22,
  },
  heroLabel: {
    color: '#8295E5', fontSize: 11, fontWeight: '800',
    letterSpacing: 1.1,
  },
  heroTitle: {
    color: '#393657', fontSize: 25,
    fontWeight: '800', marginTop: 9,
  },
  heroSub: { color: '#77749B', fontSize: 13, marginTop: 5 },
  total: {
    marginTop: 18, fontWeight: '700',
    color: '#8295E5', fontSize: 13,
  },
  searchBox: {
    backgroundColor: 'white', borderRadius: 15,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 15, height: 52, marginBottom: 19,
    borderWidth: 1, borderColor: '#E7E6F5',
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#393657' },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionLabel: { fontSize: 15, fontWeight: '800', color: '#393657' },
  reset: { color: BLUE, fontSize: 12, fontWeight: '700' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'white', paddingHorizontal: 16,
    paddingVertical: 10, borderRadius: 25,
    borderWidth: 1, borderColor: '#E7E6F5',
    marginRight: 8, marginBottom: 8,
  },
  chipActive: { backgroundColor: BLUE, borderColor: BLUE },
  chipText: { color: '#767397', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: 'white' },
  filterBox: {
    backgroundColor: 'white', padding: 16,
    borderRadius: 18, marginTop: 13, marginBottom: 19,
    borderWidth: 1, borderColor: '#E7E6F5',
  },
  priceInputs: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceInput: {
    flex: 1, minWidth: 0, backgroundColor: '#F6F7FF',
    borderRadius: 11, padding: 12, fontSize: 13,
    color: '#393657', borderWidth: 1, borderColor: '#E7E6F5',
  },
  dash: { color: '#9A9AB6' },
  availableRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 9, marginTop: 18,
  },
  availableLabel: { color: '#393657', fontSize: 14 },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  resultsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14, marginTop: 5,
  },
  resultsTitle: { fontSize: 20, fontWeight: '800', color: '#393657' },
  resultCount: { fontSize: 12, color: '#8585A5' },
  card: {
    backgroundColor: 'white', borderRadius: 19,
    padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#E7E6F5',
  },
  cardRow: { flexDirection: 'row', gap: 13 },
  foodImage: {
    width: 90, height: 92, backgroundColor: '#EEE9FF',
    borderRadius: 14, alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 40 },
  cardContent: { flex: 1, justifyContent: 'center', gap: 6 },
  dishName: { fontSize: 17, fontWeight: '800', color: '#393657' },
  categoryName: { fontSize: 12, color: '#8585A5' },
  price: { fontSize: 16, fontWeight: '800', color: BLUE },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderTopWidth: 1,
    borderTopColor: '#EEEAF8', marginTop: 13, paddingTop: 12,
  },
  timeGroup: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timeText: { color: '#8585A5', fontSize: 12 },
  quickText: {
    color: BLUE, fontSize: 11, fontWeight: '700',
    marginLeft: 7,
  },
  statusBadge: {
    backgroundColor: '#E7F6F0', borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  unavailableBadge: { backgroundColor: '#FFF0F4' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#55A98F' },
  unavailableDot: { backgroundColor: '#CC7894' },
  statusText: { color: '#55A98F', fontSize: 10, fontWeight: '700' },
  unavailableText: { color: '#CC7894' },
  empty: { alignItems: 'center', padding: 30, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#393657' },
  emptySub: { color: '#8585A5', fontSize: 13 },
  error: { color: '#CC7894', marginTop: 9, fontSize: 12 },
  footer: {
    textAlign: 'center', fontSize: 11,
    color: '#9A9AB6', marginTop: 20,
  },
});

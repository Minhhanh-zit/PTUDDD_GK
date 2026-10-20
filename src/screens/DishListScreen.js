import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategories, getDishes } from '../database/database';
import { C } from '../constants/theme';
import DishCard from '../components/DishCard';
import { filterAndSortDishes, getPriceRangeFlags } from '../utils/dishFilters';
import { Button, Chip, DishPhoto, EmptyState } from '../components/Widgets';

export default function DishListScreen({ t, language, onToggleLanguage, filters, setFilters,
  syncStatus, syncRevision, onDetail, onAdd, onCategories }) {
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const [d, c] = await Promise.all([getDishes(), getCategories()]);
    setDishes(d); setCategories(c);
    setError('');
  }
  useEffect(() => {
    let live = true;
    Promise.all([getDishes(), getCategories()])
      .then(([d, c]) => { if (live) { setDishes(d); setCategories(c); } })
      .catch(e => { if (live) setError(e.message || 'dbError'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (syncRevision) {
      load().catch(e => setError(e.message || 'dbError'));
    }
  }, [syncRevision]);

  async function refresh() {
    setRefreshing(true);
    try { await load(); } catch (e) { setError(e.message || 'dbError'); }
    finally { setRefreshing(false); }
  }
  const update = (changes) => setFilters(old => ({ ...old, ...changes }));
  const { rangeInvalid, negativePrice } = getPriceRangeFlags(filters);
  const shown = useMemo(() => filterAndSortDishes(dishes, filters), [dishes, filters]);

  return <FlatList keyboardShouldPersistTaps="handled" data={shown} renderItem={({ item }) => <DishCard item={item} t={t} onDetail={onDetail}/>}
    keyExtractor={item => String(item.id)} refreshing={refreshing} onRefresh={refresh}
    showsVerticalScrollIndicator={false} contentContainerStyle={s.content}
    ListHeaderComponent={<>
      <View style={s.top}>
        <View style={s.brandIcon}><Ionicons name="restaurant-outline" size={26} color={C.white}/></View>
        <View style={{ flex: 1 }}><Text style={s.title}>{t('app')}</Text><Text style={s.mssv}>BIT246755</Text></View>
        <Pressable onPress={onToggleLanguage} style={s.language}>
          <Ionicons name="language-outline" size={19} color={C.blueDark}/><Text style={s.languageText}>{language.toUpperCase()}</Text>
        </Pressable>
      </View>
      <View style={s.hero}>
        <Text style={s.heroTag}>{t('homeTag')}</Text>
        <Text style={s.heroTitle}>{t('heroTitle')}</Text>
        <Text style={s.heroSub}>{t('heroSub')}</Text>
        <View style={s.inline}><Ionicons name="albums-outline" size={16} color={C.blueDark}/>
          <Text style={s.heroTotal}>{dishes.length} {t('countMenu')}</Text>
        </View>
      </View>
      <View style={s.actions}>
        <View style={{ flex: 1 }}><Button title={t('addDish')} icon="add-circle-outline" onPress={onAdd}/></View>
        <View style={[s.categoryButton, { backgroundColor: C.blueSoft }]}
          accessibilityLabel="Automatic cloud synchronization status">
          {syncStatus?.phase === 'syncing'
            ? <ActivityIndicator color={C.blueDark}/>
            : <Ionicons
                name={syncStatus?.phase === 'online' ? 'cloud-done-outline' : 'cloud-offline-outline'}
                size={22} color={syncStatus?.phase === 'online' ? C.success : C.blueDark}/>}
        </View>
        <Pressable onPress={onCategories} style={s.categoryButton} accessibilityLabel={t('manageCategories')}>
          <Ionicons name="grid-outline" size={20} color={C.purpleDark}/>
        </Pressable>
      </View>
      <Text style={s.syncText}>
        {syncStatus?.phase === 'online' ? (language === 'vi' ? 'Đã kết nối MockAPI' : 'MockAPI connected')
          : syncStatus?.phase === 'syncing' ? (language === 'vi' ? 'Đang đồng bộ tự động...' : 'Syncing automatically...')
          : syncStatus?.phase === 'offline' ? (language === 'vi' ? 'Offline: dữ liệu vẫn lưu trên máy' : 'Offline: changes saved locally')
          : syncStatus?.phase === 'error' ? (language === 'vi' ? 'Lỗi đồng bộ, sẽ thử lại' : 'Sync error, retrying')
          : (language === 'vi' ? 'Đang kiểm tra mạng...' : 'Checking connection...')}
        {syncStatus?.pending > 0 ? ` · ${syncStatus.pending} ${language === 'vi' ? 'thay đổi chờ gửi' : 'pending changes'}` : ''}
      </Text>
      <View style={s.search}><Ionicons name="search-outline" size={21} color={C.blueDark}/>
        <TextInput style={s.searchInput} value={filters.search} onChangeText={search => update({ search })}
          placeholder={t('search')} placeholderTextColor={C.muted}/>
        {!!filters.search && <Pressable onPress={() => update({ search: '' })}><Ionicons name="close-circle" size={19} color={C.muted}/></Pressable>}
      </View>
      <View style={s.sectionLine}>
        <Text style={s.label}>{t('categories')}</Text>
        <Pressable onPress={() => setFilters({ search: '', categoryId: 'all', availableOnly: false, min: '', max: '', sort: 'asc' })}>
          <Text style={s.reset}>{t('reset')}</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        <Chip label={t('all')} icon="grid-outline" selected={filters.categoryId === 'all'} onPress={() => update({ categoryId: 'all' })}/>
        {categories.map(c => <Chip key={c.id} label={c.name} icon="pricetag-outline"
          selected={filters.categoryId === String(c.id)} onPress={() => update({ categoryId: String(c.id) })}/>)}
      </ScrollView>
      <View style={s.filterCard}>
        <Text style={s.label}>{t('priceRange')}</Text>
        <View style={s.priceInputs}>
          <TextInput style={s.numberInput} value={filters.min} keyboardType="number-pad" placeholder={t('min')}
            placeholderTextColor={C.muted} onChangeText={min => update({ min: min.replace(/[^0-9]/g, '') })}/>
          <Text style={s.dash}>–</Text>
          <TextInput style={s.numberInput} value={filters.max} keyboardType="number-pad" placeholder={t('max')}
            placeholderTextColor={C.muted} onChangeText={max => update({ max: max.replace(/[^0-9]/g, '') })}/>
        </View>
        {(rangeInvalid || negativePrice) && <Text style={s.error}>{t('invalidRange')}</Text>}
        <View style={s.availableLine}>
          <Ionicons name="checkmark-circle-outline" color={C.purpleDark} size={20}/>
          <Text style={{ color: C.text, fontSize: 13, flex: 1 }}>{t('availableOnly')}</Text>
          <Switch value={filters.availableOnly} onValueChange={availableOnly => update({ availableOnly })}
            trackColor={{ false: C.border, true: C.purple }} thumbColor={C.white}/>
        </View>
      </View>
      <Text style={s.label}>{t('sort')}</Text>
      <View style={s.sorts}>
        <Chip label={t('asc')} icon="trending-up-outline" selected={filters.sort === 'asc'} onPress={() => update({ sort: 'asc' })}/>
        <Chip label={t('desc')} icon="trending-down-outline" selected={filters.sort === 'desc'} onPress={() => update({ sort: 'desc' })}/>
        <Chip label={t('timeAsc')} icon="time-outline" selected={filters.sort === 'time'} onPress={() => update({ sort: 'time' })}/>
      </View>
      <View style={s.sectionLine}><Text style={s.resultsTitle}>{t('dishes')}</Text><Text style={s.resultCount}>{shown.length} {t('results')}</Text></View>
      {loading && <ActivityIndicator color={C.purpleDark} size="large"/>}
      {!!error && <Text style={s.error}>{t(error) === error ? `${t('dbError')} (${error})` : t(error)}</Text>}
    </>}
    ListEmptyComponent={!loading && <EmptyState title={t('empty')} hint={t('emptyHint')}/>}
    ListFooterComponent={<Text style={s.footer}>BIT246755 · Food Manager</Text>}
  />;
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 35 },
  top: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, gap: 12 },
  brandIcon: { backgroundColor: C.blue, width: 51, height: 51, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 23, fontWeight: '900', color: C.text }, mssv: { fontSize: 13, color: C.muted, marginTop: 3 },
  language: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: 40, gap: 4,
    backgroundColor: C.blueSoft, borderRadius: 13 }, languageText: { color: C.blueDark, fontWeight: '800', fontSize: 12 },
  hero: { backgroundColor: '#E9E7FF', borderRadius: 25, padding: 21, marginBottom: 17, gap: 10 },
  heroTag: { color: C.blue, fontWeight: '900', fontSize: 11, letterSpacing: 1.1 },
  heroTitle: { color: C.text, fontWeight: '900', fontSize: 26 },
  heroSub: { color: '#77749B', fontSize: 13 }, heroTotal: { color: C.blueDark, fontWeight: '800', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 17 },
  categoryButton: { width: 50, borderRadius: 15, backgroundColor: C.purpleSoft,
    alignItems: 'center', justifyContent: 'center' },
  syncText: { color: C.blueDark, fontSize: 11, marginTop: -7, marginBottom: 12, marginLeft: 4 },
  search: { backgroundColor: C.white, borderRadius: 18, height: 53, borderWidth: 1,
    borderColor: C.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10, marginBottom: 20 },
  searchInput: { flex: 1, color: C.text, fontSize: 14 },
  sectionLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10 },
  label: { color: C.text, fontSize: 15, fontWeight: '800', marginBottom: 10 }, reset: { color: C.blueDark, fontWeight: '800', fontSize: 12 },
  filterCard: { backgroundColor: C.white, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 18 },
  priceInputs: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numberInput: { minWidth: 0, flex: 1, backgroundColor: C.bg, borderRadius: 12, borderWidth: 1,
    borderColor: C.border, color: C.text, paddingHorizontal: 12, height: 46, fontSize: 13 },
  dash: { color: C.muted, fontSize: 20 },
  availableLine: { flexDirection: 'row', alignItems: 'center', paddingTop: 13, marginTop: 13,
    borderTopWidth: 1, borderColor: C.border, gap: 9 },
  sorts: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 17 },
  resultsTitle: { color: C.text, fontSize: 20, fontWeight: '900' },
  resultCount: { fontSize: 12, color: C.blueDark, backgroundColor: C.blueSoft,
    padding: 8, borderRadius: 12, overflow: 'hidden' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  error: { color: C.danger, marginTop: 8, marginBottom: 9, fontSize: 12 },
  footer: { color: C.muted, textAlign: 'center', fontSize: 11, marginTop: 22 },
});

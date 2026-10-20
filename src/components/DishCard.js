import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, money } from '../constants/theme';
import { DishPhoto } from './Widgets';

// Hien thi thong tin mot mon an; man hinh cha xu ly dieu huong.
export default function DishCard({ item, t, onDetail }) {
  const quick = item.preparationTime <= 15;
  return (
    <Pressable style={s.card} onPress={() => onDetail(item.id)}>
      <View style={s.cardTop}>
        <DishPhoto uri={item.imageUrl} categoryName={item.categoryName} size={90}/>
        <View style={{ flex: 1, gap: 7 }}>
          <Text style={s.dishName} numberOfLines={2}>{item.name}</Text>
          <Text style={s.categoryName}>{item.categoryName}</Text>
          <Text style={s.price}>{money(item.price)}</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={19} color={C.purpleDark}/>
      </View>
      <View style={s.cardBottom}>
        <View style={s.inline}>
          <Ionicons name="time-outline" size={15} color={C.purpleDark}/>
          <Text style={s.small}>{item.preparationTime} min</Text>
          <Text style={s.quick}>{t(quick ? 'quick' : 'regular')}</Text>
        </View>
        <View style={[s.status, !item.isAvailable && s.notAvailable]}>
          <Ionicons name={item.isAvailable ? 'checkmark-circle-outline' : 'close-circle-outline'}
            size={13} color={item.isAvailable ? C.success : C.danger}/>
          <Text style={[s.statusText, !item.isAvailable && { color: C.danger }]}>
            {t(item.isAvailable ? 'available' : 'unavailable')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.white, borderRadius: 20, borderWidth: 1, borderColor: C.border,
    padding: 13, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dishName: { color: C.text, fontWeight: '900', fontSize: 16 },
  categoryName: { color: C.muted, fontSize: 12 },
  price: { color: C.blueDark, fontSize: 16, fontWeight: '900' },
  cardBottom: { borderTopColor: C.border, borderTopWidth: 1, paddingTop: 11, marginTop: 12,
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  small: { fontSize: 11, color: C.muted },
  quick: { color: C.purpleDark, backgroundColor: C.purpleSoft, borderRadius: 8,
    overflow: 'hidden', fontSize: 10, fontWeight: '800', padding: 5 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9,
    paddingVertical: 6, borderRadius: 12, backgroundColor: C.successBg },
  notAvailable: { backgroundColor: C.dangerBg },
  statusText: { fontSize: 10, color: C.success, fontWeight: '800' },
});

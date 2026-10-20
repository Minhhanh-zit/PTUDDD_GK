import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteDish, getDishDetail } from '../database/database';
import { C, money } from '../constants/theme';
import { Button, DishPhoto, EmptyState, ScreenBar } from '../components/Widgets';

export default function DishDetailScreen({ id, t, language, onToggleLanguage, onBack, onEdit, onDeleted }) {
  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getDishDetail(id).then(data => { if (active) setDish(data); })
      .catch(e => { if (active) setError(e.message || 'dbError'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  function confirmDelete() {
    Alert.alert(t('confirmDelete'), t('deleteHint'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: async () => {
        setBusy(true);
        try { await deleteDish(id); onDeleted(); }
        catch (e) { Alert.alert(t('error'), t(e.message) === e.message ? t('dbError') : t(e.message)); }
        finally { setBusy(false); }
      } },
    ]);
  }

  const images = dish?.images || [];
  const cover = images.find(i => Boolean(i.isThumbnail)) || images[0];
  return <View style={{ flex: 1 }}>
    <ScreenBar title={t('detail')} onBack={onBack} language={language} onToggleLanguage={onToggleLanguage}/>
    {loading ? <ActivityIndicator style={{ marginTop: 70 }} color={C.purpleDark} size="large"/> :
      !dish || error ? <EmptyState icon="alert-circle-outline" title={error ? t('dbError') : t('missingDish')}/> :
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <DishPhoto uri={cover?.imageUrl} categoryName={dish.categoryName} size="100%" style={s.mainPhoto}/>
        {images.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.gallery}>
          {images.map(image => <View key={image.id} style={s.thumbWrap}>
            <DishPhoto uri={image.imageUrl} size={80} categoryName={dish.categoryName}/>
            {!!image.isThumbnail && <View style={s.star}><Ionicons name="star" color={C.white} size={11}/></View>}
          </View>)}
        </ScrollView>}
        <View style={s.details}>
          <Text style={s.dishName}>{dish.name}</Text>
          <Text style={s.price}>{money(dish.price)}</Text>
          <View style={s.infoRow}><Ionicons name="pricetag-outline" color={C.purpleDark} size={18}/>
            <Text style={s.label}>{t('category')}</Text><Text style={s.value}>{dish.categoryName}</Text></View>
          <View style={s.infoRow}><Ionicons name="time-outline" color={C.purpleDark} size={18}/>
            <Text style={s.label}>{t('preparation')}</Text>
            <Text style={s.value}>{dish.preparationTime} min · {t(dish.preparationTime <= 15 ? 'quick' : 'regular')}</Text></View>
          <View style={s.infoRow}><Ionicons name="checkmark-circle-outline" color={C.purpleDark} size={18}/>
            <Text style={s.label}>{t('status')}</Text>
            <Text style={[s.value, { color: dish.isAvailable ? C.success : C.danger }]}>{t(dish.isAvailable ? 'available' : 'unavailable')}</Text></View>
          <Text style={s.descriptionTitle}>{t('description')}</Text>
          <Text style={s.description}>{dish.description || t('noDescription')}</Text>
        </View>
        <View style={s.buttons}>
          <View style={{ flex: 1 }}><Button icon="create-outline" title={t('edit')} onPress={() => onEdit(id)}/></View>
          <View style={{ flex: 1 }}><Button icon="trash-outline" title={t('delete')} danger outline onPress={confirmDelete} disabled={busy}/></View>
        </View>
      </ScrollView>}
  </View>;
}

const s = StyleSheet.create({
  body: { paddingHorizontal: 19, paddingBottom: 35, gap: 15 },
  mainPhoto: { height: 240, borderRadius: 25 }, gallery: { maxHeight: 92 },
  thumbWrap: { marginRight: 9, position: 'relative' }, star: { position: 'absolute', top: 5, right: 5,
    width: 21, height: 21, borderRadius: 11, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  details: { backgroundColor: C.white, borderRadius: 21, padding: 18, borderWidth: 1, borderColor: C.border },
  dishName: { color: C.text, fontSize: 24, fontWeight: '900' },
  price: { color: C.blueDark, fontSize: 21, fontWeight: '900', marginTop: 8, marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderTopWidth: 1,
    borderColor: C.border, gap: 9 },
  label: { color: C.muted, fontSize: 12, flex: 1 }, value: { color: C.text, fontSize: 12, fontWeight: '800', textAlign: 'right', flexShrink: 1, maxWidth: '60%' },
  descriptionTitle: { fontSize: 15, fontWeight: '900', color: C.text, marginTop: 15 },
  description: { color: C.muted, fontSize: 14, marginTop: 8, lineHeight: 21 },
  buttons: { flexDirection: 'row', gap: 10 },
});

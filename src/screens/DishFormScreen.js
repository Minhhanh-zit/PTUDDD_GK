import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategories, getDishDetail, saveDish } from '../database/database';
import { C } from '../theme';
import { Button, Chip, DishPhoto, EmptyState, ScreenBar } from '../components/Widgets';

const isImageUrl = (url) => /^https?:\/\/\S+$/i.test(url);

export default function DishFormScreen({ editingId, t, language, onToggleLanguage, onBack, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [time, setTime] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [description, setDescription] = useState('');
  const [available, setAvailable] = useState(true);
  const [images, setImages] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const c = await getCategories();
        const d = editingId == null ? null : await getDishDetail(editingId);
        if (!active) return;
        setCategories(c);
        if (editingId != null && !d) { setMissing(true); return; }
        if (d) {
          setName(d.name); setPrice(String(d.price)); setTime(String(d.preparationTime));
          setCategoryId(d.categoryId); setDescription(d.description || '');
          setAvailable(Boolean(d.isAvailable)); setImages(d.images || []);
          const thumb = (d.images || []).findIndex(i => Boolean(i.isThumbnail));
          setThumbnailIndex(Math.max(0, thumb));
        } else if (c.length) setCategoryId(c[0].id);
      } catch (e) { if (active) setError(e.message || 'dbError'); }
      finally { if (active) setLoaded(true); }
    })();
    return () => { active = false; };
  }, [editingId]);

  function addImage() {
    const url = imageUrl.trim();
    if (!isImageUrl(url)) { setError('badImage'); return; }
    if (images.some(i => i.imageUrl === url)) { setError('duplicateImage'); return; }
    setImages(old => [...old, { imageUrl: url }]);
    setImageUrl(''); setError('');
  }

  function removeImage(index) {
    setImages(old => old.filter((_, i) => i !== index));
    setThumbnailIndex(old => index < old ? old - 1 : index === old ? 0 : old);
  }

  async function submit() {
    const cleanName = name.trim();
    const numericPrice = Number(price);
    const numericTime = Number(time);
    if (!cleanName) { setError('nameRequired'); return; }
    if (!price.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0) { setError('priceRequired'); return; }
    if (!time.trim() || !Number.isInteger(numericTime) || numericTime <= 0) { setError('timeRequired'); return; }
    if (!categoryId) { setError('categoryRequired'); return; }
    if (images.some(i => !isImageUrl(i.imageUrl))) { setError('badImage'); return; }
    setBusy(true); setError('');
    try {
      const id = await saveDish({ name: cleanName, price: numericPrice, preparationTime: numericTime,
        categoryId, description: description.trim(), isAvailable: available, images,
        thumbnailIndex: images.length ? Math.min(thumbnailIndex, images.length - 1) : -1 }, editingId);
      onSaved(id);
    } catch (e) {
      setError(e.message || 'dbError');
    } finally { setBusy(false); }
  }

  const errorMessage = error ? (t(error) === error ? t('dbError') : t(error)) : '';
  return <View style={{ flex: 1 }}>
    <ScreenBar title={t(editingId == null ? 'addDish' : 'editDish')} onBack={onBack}
      language={language} onToggleLanguage={onToggleLanguage}/>
    {!loaded ? <ActivityIndicator size="large" color={C.purpleDark} style={{ marginTop: 60 }}/> :
      missing ? <EmptyState title={t('missingDish')} icon="alert-circle-outline"/> :
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.panel}>
            <Field label={t('name')} value={name} onChangeText={setName} placeholder={t('name')}/>
            <Field label={t('price')} value={price} onChangeText={v => setPrice(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad" placeholder="65000"/>
            <Field label={t('preparation')} value={time} onChangeText={v => setTime(v.replace(/\D/g, ''))}
              keyboardType="number-pad" placeholder="15"/>
            <Text style={s.label}>{t('category')}</Text>
            <View style={s.chips}>{categories.map(c => <Chip key={c.id} label={c.name}
              selected={categoryId === c.id} onPress={() => setCategoryId(c.id)}/>)}</View>
            <Text style={s.label}>{t('description')}</Text>
            <TextInput style={[s.input, s.multiline]} multiline value={description} onChangeText={setDescription}
              placeholder={t('description')} placeholderTextColor={C.muted} textAlignVertical="top"/>
            <View style={s.switchLine}><Ionicons name="checkmark-circle-outline" size={20} color={C.purpleDark}/>
              <Text style={{ flex: 1, color: C.text, fontWeight: '700' }}>{t('available')}</Text>
              <Switch value={available} onValueChange={setAvailable} trackColor={{ false: C.border, true: C.purple }} thumbColor={C.white}/>
            </View>
          </View>
          <View style={s.panel}>
            <Text style={s.sectionTitle}>{t('images')}</Text>
            <Text style={s.hint}>{t('imagesHint')}</Text>
            <View style={s.imageEntry}>
              <TextInput style={[s.input, { flex: 1 }]} value={imageUrl} onChangeText={setImageUrl}
                placeholder={t('imageUrl')} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholderTextColor={C.muted}/>
              <Pressable style={s.addImage} onPress={addImage}><Ionicons name="add" size={25} color={C.white}/></Pressable>
            </View>
            {images.length === 0 && <View style={s.emptyPhoto}>
              <Ionicons name="images-outline" size={30} color={C.purpleDark}/>
              <Text style={s.hint}>{t('noImage')}</Text>
            </View>}
            {images.map((image, index) => <View key={index} style={s.imageRow}>
              <Pressable onPress={() => setThumbnailIndex(index)}>
                <DishPhoto uri={image.imageUrl} size={77}/>
              </Pressable>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.url} numberOfLines={2}>{image.imageUrl}</Text>
                <Pressable onPress={() => setThumbnailIndex(index)} style={s.thumbOption}>
                  <Ionicons name={thumbnailIndex === index ? 'radio-button-on' : 'radio-button-off'}
                    size={18} color={C.purpleDark}/>
                  <Text style={{ fontSize: 12, color: C.purpleDark }}>{t('thumbnail')}</Text>
                </Pressable>
              </View>
              <Pressable onPress={() => removeImage(index)} accessibilityLabel={t('removeImage')}>
                <Ionicons name="trash-outline" size={23} color={C.danger}/>
              </Pressable>
            </View>)}
          </View>
          {!!errorMessage && <View style={s.errorLine}><Ionicons name="alert-circle-outline" size={19} color={C.danger}/>
            <Text style={s.errorText}>{errorMessage}</Text></View>}
          <Button title={busy ? t('saving') : t('save')} icon="save-outline" onPress={submit} disabled={busy}/>
          <Button title={t('cancel')} icon="close-outline" onPress={onBack} outline disabled={busy}/>
        </ScrollView>
      </KeyboardAvoidingView>}
  </View>;
}

function Field({ label, ...props }) {
  return <View style={{ marginBottom: 16 }}><Text style={s.label}>{label}</Text>
    <TextInput style={s.input} placeholderTextColor={C.muted} {...props}/>
  </View>;
}
const s = StyleSheet.create({
  body: { padding: 18, paddingBottom: 45, gap: 13 },
  panel: { backgroundColor: C.white, borderRadius: 21, padding: 17, borderColor: C.border, borderWidth: 1 },
  label: { color: C.text, fontSize: 13, fontWeight: '800', marginBottom: 9 },
  input: { height: 48, borderRadius: 13, paddingHorizontal: 12, backgroundColor: C.bg,
    borderColor: C.border, borderWidth: 1, color: C.text, fontSize: 14 },
  multiline: { minHeight: 90, height: 90, paddingTop: 12, marginBottom: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  switchLine: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1,
    borderColor: C.border, paddingTop: 12 },
  sectionTitle: { fontSize: 17, color: C.text, fontWeight: '900' },
  hint: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  imageEntry: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 13, marginBottom: 12 },
  addImage: { backgroundColor: C.blue, width: 47, height: 47, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  emptyPhoto: { padding: 18, alignItems: 'center', gap: 6 },
  imageRow: { flexDirection: 'row', alignItems: 'center', gap: 10,
    borderTopWidth: 1, borderColor: C.border, paddingTop: 12, paddingBottom: 7 },
  url: { color: C.muted, fontSize: 11 },
  thumbOption: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorLine: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.dangerBg,
    padding: 12, borderRadius: 13 },
  errorText: { flex: 1, color: C.danger, fontSize: 13 },
});

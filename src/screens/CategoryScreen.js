import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteCategory, getCategories, saveCategory } from '../database/database';
import { C } from '../theme';
import { Button, ScreenBar } from '../components/Widgets';

export default function CategoryScreen({ t, language, onToggleLanguage, onBack }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() { setCategories(await getCategories()); }
  useEffect(() => { load().catch(e => setError(e.message || 'dbError')).finally(() => setLoading(false)); }, []);
  function reset() { setEditingId(null); setName(''); setDescription(''); setError(''); }
  function edit(c) { setEditingId(c.id); setName(c.name); setDescription(c.description); setError(''); }
  async function submit() {
    if (!name.trim()) { setError('categoryNameRequired'); return; }
    setBusy(true); setError('');
    try { await saveCategory(name.trim(), description.trim(), editingId); await load(); reset(); }
    catch (e) { setError(e.message || 'dbError'); }
    finally { setBusy(false); }
  }
  function confirmDelete(category) {
    Alert.alert(t('confirmCategoryDelete'), category.name, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: async () => {
        try { await deleteCategory(category.id); await load(); if (editingId === category.id) reset(); }
        catch (e) { Alert.alert(t('error'), t(e.message) === e.message ? t('dbError') : t(e.message)); }
      } },
    ]);
  }
  const errorText = error && (t(error) === error ? t('dbError') : t(error));
  return <View style={{ flex: 1 }}>
    <ScreenBar title={t('manageCategories')} onBack={onBack} language={language} onToggleLanguage={onToggleLanguage}/>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
        <View style={s.panel}>
          <Text style={s.title}>{t(editingId === null ? 'newCategory' : 'edit')}</Text>
          <Text style={s.label}>{t('categoryName')}</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder={t('categoryName')} placeholderTextColor={C.muted}/>
          <Text style={s.label}>{t('categoryDescription')}</Text>
          <TextInput style={[s.input, { height: 80, paddingTop: 11 }]} multiline value={description}
            onChangeText={setDescription} placeholder={t('categoryDescription')} placeholderTextColor={C.muted}/>
          {!!errorText && <Text style={s.error}>{errorText}</Text>}
          <Button title={busy ? t('saving') : t('saveCategory')} icon="save-outline" onPress={submit} disabled={busy}/>
          {editingId !== null && <View style={{ marginTop: 9 }}><Button title={t('cancel')} onPress={reset} outline/></View>}
        </View>
        {loading && <ActivityIndicator color={C.purpleDark}/>}
        <Text style={s.title}>{t('categories')} ({categories.length})</Text>
        {categories.map(c => <View key={c.id} style={s.row}>
          <View style={s.catIcon}><Ionicons name="pricetag-outline" size={22} color={C.purpleDark}/></View>
          <View style={{ flex: 1 }}><Text style={s.catName}>{c.name}</Text><Text style={s.catDescription}>{c.description}</Text></View>
          <Pressable onPress={() => edit(c)} accessibilityLabel={t('edit')} style={s.action}>
            <Ionicons name="create-outline" size={21} color={C.blueDark}/>
          </Pressable>
          <Pressable onPress={() => confirmDelete(c)} accessibilityLabel={t('deleteCategory')} style={s.action}>
            <Ionicons name="trash-outline" size={21} color={C.danger}/>
          </Pressable>
        </View>)}
      </ScrollView>
    </KeyboardAvoidingView>
  </View>;
}
const s = StyleSheet.create({
  body: { padding: 18, paddingBottom: 40, gap: 13 },
  panel: { backgroundColor: C.white, padding: 17, borderWidth: 1, borderColor: C.border, borderRadius: 20 },
  title: { color: C.text, fontSize: 17, fontWeight: '900', marginBottom: 9 },
  label: { color: C.text, fontWeight: '800', fontSize: 13, marginTop: 12, marginBottom: 8 },
  input: { color: C.text, fontSize: 14, height: 47, backgroundColor: C.bg, borderWidth: 1,
    borderColor: C.border, borderRadius: 12, paddingHorizontal: 13, marginBottom: 7 },
  error: { color: C.danger, marginBottom: 11 },
  row: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 13,
    flexDirection: 'row', alignItems: 'center', gap: 8 },
  catIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: C.purpleSoft, alignItems: 'center', justifyContent: 'center' },
  catName: { color: C.text, fontSize: 15, fontWeight: '800' },
  catDescription: { color: C.muted, fontSize: 12, marginTop: 4 },
  action: { padding: 7 },
});

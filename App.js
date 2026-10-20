import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { initDatabase } from './src/database/database';
import { C } from './src/constants/theme';
import { translations } from './src/locales/translations';
import DishListScreen from './src/screens/DishListScreen';
import DishDetailScreen from './src/screens/DishDetailScreen';
import DishFormScreen from './src/screens/DishFormScreen';
import CategoryScreen from './src/screens/CategoryScreen';

// Dieu huong don gian bang state, de giai thich trong Video 2.
export default function App() {
  const [ready, setReady] = useState(false);
  const [startupError, setStartupError] = useState('');
  const [language, setLanguage] = useState('en');
  const [screen, setScreen] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formFrom, setFormFrom] = useState('list');
  const [filters, setFilters] = useState({
    search: '', categoryId: 'all', availableOnly: false, min: '', max: '', sort: 'asc',
  });

  useEffect(() => {
    let live = true;
    initDatabase().catch(e => { if (live) setStartupError(e.message || 'dbError'); })
      .finally(() => { if (live) setReady(true); });
    return () => { live = false; };
  }, []);

  const t = (key) => translations[language][key] || key;
  const toggleLanguage = () => setLanguage(old => old === 'en' ? 'vi' : 'en');
  function openDetail(id) { setSelectedId(id); setScreen('detail'); }
  function openAdd() { setEditingId(null); setFormFrom('list'); setScreen('form'); }
  function openEdit(id) { setEditingId(id); setFormFrom('detail'); setScreen('form'); }
  function backFromForm() { setScreen(formFrom); }

  return <SafeAreaProvider>
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content"/>
      {!ready ? <ActivityIndicator size="large" color={C.purpleDark} style={s.spinner}/> :
        startupError ? <View style={s.errorScreen}>
          <Text style={s.errorText}>{t('dbError')}</Text><Text style={s.errorText}>{startupError}</Text>
        </View> : <>
          {screen === 'list' && <DishListScreen t={t} language={language} onToggleLanguage={toggleLanguage}
            filters={filters} setFilters={setFilters} onDetail={openDetail}
            onAdd={openAdd} onCategories={() => setScreen('categories')}/>}
          {screen === 'detail' && <DishDetailScreen id={selectedId} t={t} language={language}
            onToggleLanguage={toggleLanguage} onBack={() => setScreen('list')}
            onEdit={openEdit} onDeleted={() => setScreen('list')}/>}
          {screen === 'form' && <DishFormScreen editingId={editingId} t={t} language={language}
            onToggleLanguage={toggleLanguage} onBack={backFromForm}
            onSaved={id => openDetail(id)}/>}
          {screen === 'categories' && <CategoryScreen t={t} language={language}
            onToggleLanguage={toggleLanguage} onBack={() => setScreen('list')}/>}
        </>}
    </SafeAreaView>
  </SafeAreaProvider>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  spinner: { marginTop: 100 }, errorScreen: { padding: 25 },
  errorText: { color: C.danger, textAlign: 'center', fontSize: 15, marginBottom: 10 },
});

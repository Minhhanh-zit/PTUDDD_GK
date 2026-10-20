import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, categoryIcon } from '../theme';

export function IconButton({ icon, onPress, color = C.purpleDark, background = C.purpleSoft, size = 22, label }) {
  return (
    <Pressable accessibilityLabel={label || icon} onPress={onPress} style={[s.iconButton, { backgroundColor: background }]}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function Button({ icon, title, onPress, outline = false, danger = false, disabled = false, compact = false }) {
  const ink = danger ? C.danger : C.blueDark;
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[
      s.button, compact && s.compact, outline ? { backgroundColor: C.white, borderColor: ink } : { backgroundColor: danger ? C.danger : C.blue },
      disabled && { opacity: 0.45 },
    ]}>
      {!!icon && <Ionicons name={icon} size={18} color={outline ? ink : C.white} />}
      <Text style={[s.buttonText, outline && { color: ink }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, icon, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, selected && s.chipActive]}>
      {!!icon && <Ionicons name={icon} size={16} color={selected ? C.white : C.purpleDark} />}
      <Text style={[s.chipText, selected && { color: C.white }]}>{label}</Text>
    </Pressable>
  );
}

export function ScreenBar({ title, onBack, language, onToggleLanguage, actionIcon, onAction }) {
  return (
    <View style={s.nav}>
      <IconButton icon="arrow-back-outline" onPress={onBack} label="Back" />
      <Text style={s.navTitle} numberOfLines={1}>{title}</Text>
      {!!actionIcon && <IconButton icon={actionIcon} onPress={onAction} />}
      <Pressable onPress={onToggleLanguage} style={s.lang}><Ionicons name="language-outline" size={17} color={C.blueDark}/>
        <Text style={s.langText}>{language.toUpperCase()}</Text>
      </Pressable>
    </View>
  );
}

export function DishPhoto({ uri, categoryName = '', size = 90, style }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [uri]);
  return (
    <View style={[s.photo, { width: size, height: size }, style]}>
      {uri && !failed ? (
        <Image source={{ uri }} resizeMode="cover" style={StyleSheet.absoluteFillObject} onError={() => setFailed(true)}/>
      ) : (
        <Ionicons name={categoryIcon(categoryName)} size={Math.max(28, (typeof size === 'number' ? size : 160) * 0.37)} color={C.purpleDark}/>
      )}
    </View>
  );
}

export function EmptyState({ icon = 'search-outline', title, hint }) {
  return <View style={s.empty}>
    <Ionicons name={icon} size={37} color={C.purpleDark}/>
    <Text style={s.emptyTitle}>{title}</Text>
    {!!hint && <Text style={s.emptyHint}>{hint}</Text>}
  </View>;
}

const s = StyleSheet.create({
  iconButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  button: { minHeight: 48, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 14, gap: 7, borderWidth: 1, borderColor: 'transparent' },
  compact: { minHeight: 40 },
  buttonText: { color: C.white, fontWeight: '800', fontSize: 14 },
  chip: { minHeight: 40, backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 13, marginRight: 7, marginBottom: 7, borderRadius: 23,
    flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipActive: { backgroundColor: C.blue, borderColor: C.blue },
  chipText: { color: C.text, fontWeight: '700', fontSize: 12 },
  nav: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 9 },
  navTitle: { flex: 1, fontWeight: '800', fontSize: 17, color: C.text },
  lang: { paddingHorizontal: 10, height: 40, backgroundColor: C.blueSoft, borderRadius: 13,
    flexDirection: 'row', gap: 4, alignItems: 'center' },
  langText: { color: C.blueDark, fontSize: 12, fontWeight: '800' },
  photo: { backgroundColor: C.purpleSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 16 },
  empty: { paddingVertical: 45, alignItems: 'center', gap: 10 },
  emptyTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  emptyHint: { color: C.muted, fontSize: 13, textAlign: 'center' },
});

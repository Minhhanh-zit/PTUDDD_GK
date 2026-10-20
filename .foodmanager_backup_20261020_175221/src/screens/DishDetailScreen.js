import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDishDetail } from '../database/database';

const C = {
  bg: '#F8F7FF', white: '#FFFFFF', blue: '#8295E5',
  lavender: '#EEE9FF', purple: '#967CDA',
  text: '#393657', muted: '#8585A5', border: '#E7E6F5',
  green: '#55A98F', red: '#CC7894',
};

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={19} color={C.purple} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function DishDetailScreen({ dishId, onBack }) {
  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getDishDetail(dishId);
        if (active) setDish(result);
      } catch (err) {
        if (active) setError(String(err.message || err));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [dishId]);

  const images = dish?.images || [];
  const thumbnail = images.find(img => Boolean(img.isThumbnail)) || images[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={23} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Dish Details</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={C.purple} style={{ marginTop: 60 }} />
      ) : error || !dish ? (
        <View style={styles.message}>
          <Ionicons name="alert-circle-outline" size={36} color={C.red} />
          <Text style={styles.infoValue}>{error || 'Dish not found.'}</Text>
          <Pressable onPress={onBack}><Text style={styles.goBack}>Go back</Text></Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.photoContainer}>
            {thumbnail ? (
              <Image
                source={{ uri: thumbnail.imageUrl }}
                style={styles.cover}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.noPhoto}>
                <Ionicons name="restaurant-outline" size={65} color={C.purple} />
                <Text style={styles.noPhotoText}>No photos added yet</Text>
              </View>
            )}
          </View>

          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
              {images.map(img => (
                <Image
                  key={String(img.id)}
                  source={{ uri: img.imageUrl }}
                  style={styles.smallImage}
                />
              ))}
            </ScrollView>
          )}

          <Text style={styles.title}>{dish.name}</Text>
          <Text style={styles.price}>
            {dish.price.toLocaleString('vi-VN')} VND
          </Text>

          <View style={styles.card}>
            <InfoRow icon="pricetag-outline" label="Category" value={dish.categoryName} />
            <View style={styles.divider} />
            <InfoRow
              icon="time-outline"
              label="Preparation time"
              value={`${dish.preparationTime} min · ${dish.preparationTime <= 15 ? 'Quick' : 'Regular'}`}
            />
            <View style={styles.divider} />
            <InfoRow
              icon={dish.isAvailable ? 'checkmark-circle-outline' : 'close-circle-outline'}
              label="Status"
              value={dish.isAvailable ? 'Available' : 'Unavailable'}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {dish.description || 'No description yet.'}
            </Text>
          </View>

          <Text style={styles.footer}>BIT246755 · Food Manager</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backButton: {
    width: 44, height: 44, borderRadius: 15, backgroundColor: C.lavender,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 19, fontWeight: '800', color: C.text },
  scroll: { paddingHorizontal: 20, paddingBottom: 35 },
  photoContainer: { borderRadius: 22, overflow: 'hidden', marginBottom: 18 },
  cover: { width: '100%', height: 220, backgroundColor: C.lavender },
  noPhoto: {
    backgroundColor: C.lavender, height: 205,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  noPhotoText: { color: C.purple, fontWeight: '600', fontSize: 13 },
  gallery: { marginBottom: 18 },
  smallImage: { height: 65, width: 65, borderRadius: 10, marginRight: 10 },
  title: { fontSize: 26, fontWeight: '800', color: C.text },
  price: { fontSize: 21, fontWeight: '800', color: C.blue, marginTop: 6, marginBottom: 20 },
  card: {
    backgroundColor: C.white, borderColor: C.border, borderWidth: 1,
    borderRadius: 18, paddingHorizontal: 17, paddingVertical: 8, marginBottom: 14,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 13 },
  infoLabel: { fontSize: 12, color: C.muted, marginBottom: 4 },
  infoValue: { fontSize: 15, color: C.text, fontWeight: '600' },
  divider: { height: 1, backgroundColor: C.border },
  descriptionTitle: { fontSize: 16, color: C.text, fontWeight: '800', marginTop: 13 },
  descriptionText: { color: C.muted, lineHeight: 23, fontSize: 14, marginTop: 7, marginBottom: 13 },
  footer: { textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 12 },
  message: { padding: 30, alignItems: 'center', gap: 16 },
  goBack: { color: C.blue, fontWeight: '800' },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  initDatabase,
  getDishes,
} from './src/database/database';

export default function App() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        await initDatabase();
        const data = await getDishes();

        if (active) {
          setDishes(data);
          console.log('SQLite loaded:', data.length, 'dishes');
        }
      } catch (err) {
        console.error('SQLite error:', err);
        if (active) setError(String(err.message || err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Food Manager</Text>
        <Text style={styles.subtitle}>
          BIT246755 | SQLite Database
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#16A34A" />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            <Text style={styles.count}>
              Total dishes: {dishes.length}
            </Text>

            <FlatList
              data={dishes}
              keyExtractor={(item) => String(item.id)}
              ListEmptyComponent={
                <Text>No dishes found</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.name}>{item.name}</Text>

                  <Text style={styles.category}>
                    {item.categoryName}
                  </Text>

                  <Text style={styles.price}>
                    {item.price.toLocaleString('vi-VN')} VND
                  </Text>

                  <Text>
                    Preparation: {item.preparationTime} min
                  </Text>

                  <Text>
                    {item.preparationTime <= 15
                      ? 'Quick'
                      : 'Regular'}
                  </Text>

                  <Text
                    style={{
                      color: item.isAvailable
                        ? '#16A34A'
                        : '#DC2626',
                    }}
                  >
                    {item.isAvailable
                      ? 'Available'
                      : 'Unavailable'}
                  </Text>
                </View>
              )}
            />
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#14532D',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5,
    marginBottom: 24,
  },
  count: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  name: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  category: {
    fontSize: 14,
    color: '#64748B',
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: '#16A34A',
  },
  error: {
    color: '#DC2626',
    fontSize: 15,
  },
});

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '';

type DropoffLocation = {
  placeId: string;
  name: string;
  address: string;
  phone: string | null;
  hours: string | null;
  distance: number;
  lat: number;
  lng: number;
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocode(zip: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${zip}&key=${GOOGLE_KEY}`,
    );
    const data = await res.json();
    if (data.status === 'OK') return data.results[0].geometry.location;
    console.warn('Geocode status:', data.status, data.error_message);
    return null;
  } catch {
    return null;
  }
}

async function textSearch(query: string): Promise<any[]> {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json` +
      `?query=${encodeURIComponent(query)}` +
      `&key=${GOOGLE_KEY}`,
  );
  const data = await res.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google API error: ${data.status}${data.error_message ? ` — ${data.error_message}` : ''}`);
  }
  return data.results ?? [];
}

async function getDetails(placeId: string): Promise<{ phone: string | null; hours: string | null }> {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${placeId}` +
      `&fields=formatted_phone_number,opening_hours` +
      `&key=${GOOGLE_KEY}`,
  );
  const data = await res.json();
  const result = data.result ?? {};
  const phone: string | null = result.formatted_phone_number ?? null;
  const weekdayText: string[] | undefined = result.opening_hours?.weekday_text;
  let hours: string | null = null;
  if (weekdayText?.length) {
    const dayIndex = new Date().getDay();
    const adjusted = dayIndex === 0 ? 6 : dayIndex - 1;
    const raw = weekdayText[adjusted] ?? weekdayText[0];
    // "Monday: 9:00 AM – 6:00 PM" → "Mon: 9:00 AM – 6:00 PM"
    hours = raw.replace(/^(\w{3})\w+:/, '$1:');
  }
  return { phone, hours };
}

async function fetchLocations(zip: string): Promise<DropoffLocation[]> {
  // Geocoding is optional — used for distance calc only
  const origin = await geocode(zip);

  // ZIP baked into each query so results work even without geocoding
  const queries = [
    `balikbayan box shipping ${zip}`,
    `LBC padala near ${zip}`,
    `Filipino cargo freight forwarder ${zip}`,
  ];

  const allResults = await Promise.all(queries.map((q) => textSearch(q)));

  const seen = new Set<string>();
  const unique: any[] = [];
  for (const results of allResults) {
    for (const r of results) {
      if (!seen.has(r.place_id)) {
        seen.add(r.place_id);
        unique.push(r);
      }
    }
  }

  const withDistance = unique
    .map((r) => ({
      ...r,
      _distance: origin
        ? haversine(origin.lat, origin.lng, r.geometry.location.lat, r.geometry.location.lng)
        : -1,
    }))
    .sort((a, b) => (a._distance < 0 || b._distance < 0 ? 0 : a._distance - b._distance))
    .slice(0, 10);

  const details = await Promise.all(withDistance.map((r) => getDetails(r.place_id)));

  return withDistance.map((r, i) => ({
    placeId: r.place_id,
    name: r.name,
    address: r.formatted_address,
    phone: details[i].phone,
    hours: details[i].hours,
    distance: r._distance,
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
  }));
}

function LocationCard({ item }: { item: DropoffLocation }) {
  const onDirections = () => {
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(item.address)}`);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.distance >= 0 ? `${item.distance.toFixed(1)} mi` : 'Nearby'}
          </Text>
        </View>
      </View>

      <Text style={styles.address}>{item.address}</Text>

      {item.hours ? (
        <View style={styles.infoRow}>
          <MaterialIcons name="access-time" size={14} color="#8A7A6E" />
          <Text style={styles.infoText}>{item.hours}</Text>
        </View>
      ) : null}

      {item.phone ? (
        <View style={styles.infoRow}>
          <MaterialIcons name="phone" size={14} color="#8A7A6E" />
          <Text style={styles.infoText}>{item.phone}</Text>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.directionsBtn, pressed && { opacity: 0.85 }]}
        onPress={onDirections}
        accessibilityRole="button">
        <MaterialIcons name="navigation" size={16} color="#FEFDF9" />
        <Text style={styles.directionsBtnText}>Get Directions</Text>
      </Pressable>
    </View>
  );
}

export default function DropoffResultsScreen() {
  const insets = useSafeAreaInsets();
  const { zip } = useLocalSearchParams<{ zip: string }>();
  const [locations, setLocations] = useState<DropoffLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!zip) return;
    fetchLocations(zip)
      .then(setLocations)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [zip]);

  return (
    <LinearGradient
      colors={['#E8C97A', '#F5EDE0']}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}>
      <FlatList
        data={loading ? [] : locations}
        keyExtractor={(item) => item.placeId}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable style={styles.backLink} onPress={() => router.back()} accessibilityRole="button">
              <MaterialIcons name="arrow-back" size={15} color="#5C4E3A" />
              <Text style={styles.backLinkText}>Change ZIP Code</Text>
            </Pressable>
            <Text style={styles.pageTitle}>Dropoff Locations</Text>
            <Text style={styles.pageSubtitle}>
              {loading
                ? `Searching near ${zip}…`
                : error
                  ? error
                  : `Near ${zip} • ${locations.length} location${locations.length !== 1 ? 's' : ''} found`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#D4A843" style={{ marginTop: 32 }} />
          ) : error ? null : (
            <Text style={styles.emptyText}>No balikbayan drop-off locations found near {zip}.</Text>
          )
        }
        renderItem={({ item }) => <LocationCard item={item} />}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  backLinkText: {
    fontSize: 14,
    color: '#5C4E3A',
    fontWeight: '500',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2E2A26',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B5E52',
  },
  card: {
    backgroundColor: '#FEFDF9',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  cardName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#2E2A26',
  },
  badge: {
    backgroundColor: '#E8C97A',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5C4E3A',
  },
  address: {
    fontSize: 13,
    color: '#7A6F66',
    lineHeight: 18,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 13,
    color: '#5C4E3A',
    flex: 1,
  },
  directionsBtn: {
    marginTop: 14,
    backgroundColor: '#D4A843',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  directionsBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FEFDF9',
  },
  emptyText: {
    marginTop: 40,
    textAlign: 'center',
    color: '#7A6F66',
    fontSize: 14,
    lineHeight: 20,
  },
});

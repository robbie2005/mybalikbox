import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChecklistDesign } from '@/constants/checklist-design';
import type { DiscoverCategory } from '@/services/discover-feed';

export type DiscoverCategoryFilter = 'all' | DiscoverCategory;

const OPTIONS: { key: DiscoverCategoryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'gratitude', label: 'Gratitude' },
  { key: 'family', label: 'Family' },
  { key: 'culture', label: 'Culture' },
];

type Props = {
  value: DiscoverCategoryFilter;
  onChange: (value: DiscoverCategoryFilter) => void;
};

export function DiscoverCategoryPills({ value, onChange }: Props) {
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {OPTIONS.map((option) => {
          const active = option.key === value;
          return (
            <Pressable
              key={option.key}
              onPress={() => onChange(option.key)}
              style={[styles.pill, active && styles.pillActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingHorizontal: 2,
  },
  pill: {
    minWidth: 70,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#FFF8EE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8A632A',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  pillActive: {
    backgroundColor: '#F6CB73',
  },
  pillText: {
    color: ChecklistDesign.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#6F4A12',
  },
});

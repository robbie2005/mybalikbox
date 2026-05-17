import { StyleSheet, Text, View } from 'react-native';

import { ChecklistDesign } from '@/constants/checklist-design';
import type { ChecklistActivity } from '@/services/checklist-activity';
import { formatRelativeTime } from '@/utils/relative-time';

type RecentActivityRowProps = {
  activity: ChecklistActivity;
};

export function RecentActivityRow({ activity }: RecentActivityRowProps) {
  const when = formatRelativeTime(activity.at);
  const isAdded = activity.type === 'item_added';

  return (
    <View style={styles.row}>
      <View style={[styles.dot, isAdded ? styles.dotPending : styles.dotAccepted]} />
      <View style={styles.textCol}>
        <Text style={styles.line} numberOfLines={2}>
          {isAdded ? (
            <>
              <Text style={styles.bold}>{activity.actorName}</Text>
              <Text style={styles.regular}> requested </Text>
              <Text style={styles.bold}>{activity.itemLabel}</Text>
            </>
          ) : (
            <>
              <Text style={styles.bold}>{activity.itemLabel}</Text>
              <Text style={styles.regular}> was accepted</Text>
            </>
          )}
        </Text>
        {when ? <Text style={styles.timeAgo}>{when}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F7F0E4',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8DFD0',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  dotPending: {
    backgroundColor: '#E8C56B',
  },
  dotAccepted: {
    backgroundColor: ChecklistDesign.statsIncluded,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  line: {
    fontSize: 15,
    lineHeight: 20,
    color: ChecklistDesign.textPrimary,
  },
  bold: {
    fontWeight: '700',
  },
  regular: {
    fontWeight: '400',
  },
  timeAgo: {
    marginTop: 4,
    fontSize: 13,
    color: ChecklistDesign.textMuted,
  },
});

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChecklistDesign } from '@/constants/checklist-design';
import { formatRelativeTime } from '@/utils/relative-time';

export type PendingRequestCardProps = {
  contributorName: string;
  itemName: string;
  quantity: number;
  createdAt: string | null;
  busy?: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

function requestItemLabel(quantity: number, itemName: string): string {
  const q = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
  const name = itemName.trim();
  return q > 1 ? `${q} ${name}` : name;
}

export function PendingRequestCard({
  contributorName,
  itemName,
  quantity,
  createdAt,
  busy,
  onAccept,
  onDecline,
}: PendingRequestCardProps) {
  const name = contributorName.trim() || 'Someone';
  const itemLabel = requestItemLabel(quantity, itemName);
  const when = formatRelativeTime(createdAt);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatarDot} />
        <View style={styles.textCol}>
          <Text style={styles.requestLine} numberOfLines={1} ellipsizeMode="tail">
            <Text style={styles.bold}>{name}</Text>
            <Text style={styles.regular}> requested </Text>
            <Text style={styles.bold}>{itemLabel}</Text>
          </Text>
          {when ? <Text style={styles.timeAgo}>{when}</Text> : null}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onAccept}
          disabled={busy}
          style={({ pressed }) => [styles.acceptBtn, pressed && styles.btnPressed, busy && styles.btnDisabled]}
          accessibilityRole="button"
          accessibilityLabel={`Accept ${itemLabel}`}>
          {busy ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.acceptText}>Accept</Text>
          )}
        </Pressable>
        <Pressable
          onPress={onDecline}
          disabled={busy}
          style={({ pressed }) => [styles.declineBtn, pressed && styles.btnPressed, busy && styles.btnDisabled]}
          accessibilityRole="button"
          accessibilityLabel={`Decline ${itemLabel}`}>
          <Text style={styles.declineText}>Decline</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F7F0E4',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8DFD0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatarDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ChecklistDesign.tanButton,
    marginTop: 2,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  requestLine: {
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
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: ChecklistDesign.tanButton,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  acceptText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  declineBtn: {
    flex: 1,
    backgroundColor: ChecklistDesign.card,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: ChecklistDesign.tanButton,
  },
  declineText: {
    fontSize: 15,
    fontWeight: '700',
    color: ChecklistDesign.tanButton,
  },
  btnPressed: {
    opacity: 0.9,
  },
  btnDisabled: {
    opacity: 0.55,
  },
});

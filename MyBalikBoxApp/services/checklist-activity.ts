import { supabase } from '@/services/supabase';

export type ChecklistActivityType = 'item_added' | 'item_accepted';

export type ChecklistActivity = {
  id: string;
  type: ChecklistActivityType;
  at: string;
  actorName: string;
  itemLabel: string;
};

type ActivityItemRow = {
  id: string;
  name: string;
  quantity: number | null;
  status: string;
  added_by: string | null;
  created_at: string;
  updated_at: string;
};

const ACCEPTED_STATUSES = new Set(['purchased', 'packed']);
const ACCEPTED_MS_AFTER_CREATE = 2000;

function formatItemLabel(quantity: number | null, name: string): string {
  const q = Number.isFinite(Number(quantity)) && Number(quantity) > 0 ? Math.floor(Number(quantity)) : 1;
  const trimmed = name.trim();
  return q > 1 ? `${q} ${trimmed}` : trimmed;
}

function resolveDisplayName(
  userId: string | null,
  currentUserId: string | null,
  namesById: Record<string, string>,
): string {
  if (!userId) return 'Someone';
  if (currentUserId && userId === currentUserId) return 'You';
  return namesById[userId] ?? 'Member';
}

export async function fetchRecentChecklistActivity(
  boxId: string,
  currentUserId: string | null,
  limit = 5,
): Promise<ChecklistActivity[]> {
  const { data, error } = await supabase
    .from('box_checklist_items')
    .select('id, name, quantity, status, added_by, created_at, updated_at')
    .eq('box_id', boxId)
    .neq('status', 'removed')
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) throw error;

  const rows = (data ?? []) as ActivityItemRow[];
  const userIds = [...new Set(rows.map((row) => row.added_by).filter((id): id is string => !!id))];

  const namesById: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, username')
      .in('id', userIds);

    for (const profile of profiles ?? []) {
      const id = String((profile as { id: string }).id);
      const display = (profile as { display_name: string | null }).display_name?.trim();
      const username = (profile as { username: string | null }).username?.trim();
      namesById[id] = display || username || 'Member';
    }
  }

  const events: ChecklistActivity[] = [];

  for (const row of rows) {
    const itemLabel = formatItemLabel(row.quantity, row.name);
    const actorName = resolveDisplayName(row.added_by, currentUserId, namesById);

    events.push({
      id: `added:${row.id}`,
      type: 'item_added',
      at: row.created_at,
      actorName,
      itemLabel,
    });

    if (ACCEPTED_STATUSES.has(row.status)) {
      const createdMs = new Date(row.created_at).getTime();
      const updatedMs = new Date(row.updated_at).getTime();
      if (Number.isFinite(createdMs) && Number.isFinite(updatedMs) && updatedMs - createdMs > ACCEPTED_MS_AFTER_CREATE) {
        events.push({
          id: `accepted:${row.id}`,
          type: 'item_accepted',
          at: row.updated_at,
          actorName,
          itemLabel,
        });
      }
    }
  }

  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return events.slice(0, limit);
}

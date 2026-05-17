import { supabase } from '@/services/supabase';

/** Contributor rows without embedding profiles on box_members (more resilient across RLS/embed quirks). */
export async function fetchBoxMemberDisplayRows(
  boxId: string,
  authUserId: string | null,
): Promise<Array<{ userId: string; displayName: string }>> {
  const { data: members, error: membersErr } = await supabase
    .from('box_members')
    .select('user_id')
    .eq('box_id', boxId);

  if (membersErr) throw membersErr;

  const orderedIds: string[] = [];
  const seen = new Set<string>();
  for (const row of members ?? []) {
    const uid = row.user_id as string;
    if (!seen.has(uid)) {
      seen.add(uid);
      orderedIds.push(uid);
    }
  }
  if (!orderedIds.length) return [];

  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', orderedIds);

  if (profilesErr) throw profilesErr;

  const nameById = new Map<string, string>();
  for (const p of profiles ?? []) {
    const id = String((p as { id: string }).id);
    const dn = (p as { display_name: string | null }).display_name?.trim();
    nameById.set(id, dn ?? '');
  }

  return orderedIds.map((uid) => {
    const resolved = nameById.get(uid)?.trim();
    const label =
      resolved && resolved.length > 0 ? resolved : uid === authUserId ? 'You' : 'Member';
    return { userId: uid, displayName: label };
  });
}

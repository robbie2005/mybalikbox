import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PostgrestError } from '@supabase/supabase-js';

import { HAS_USER_BOX_KEY } from '@/constants/first-launch';
import { generateRandomJoinCode } from '@/services/join-box';
import { supabase } from '@/services/supabase';

function isJoinCodeConflict(error: PostgrestError): boolean {
  return error.code === '23505';
}

function isMissingColumnError(error: PostgrestError): boolean {
  const msg = (error.message ?? '').toLowerCase();
  return (
    error.code === 'PGRST204' ||
    msg.includes('schema cache') ||
    msg.includes('could not find')
  );
}

export async function hasUserCompletedBoxSetup(): Promise<boolean> {
  return (await AsyncStorage.getItem(HAS_USER_BOX_KEY)) === 'true';
}

export async function markUserBoxSetupComplete(): Promise<void> {
  await AsyncStorage.setItem(HAS_USER_BOX_KEY, 'true');
}

type BoxWriteParams = {
  title: string;
  joinCode: string;
  budgetCapUsd?: number | null;
  weightCapKg?: number | null;
};

/** Patches from richest to minimal so older DB schemas still work. */
function boxPatchVariants(params: BoxWriteParams): Record<string, unknown>[] {
  const title = params.title.trim();
  const status = 'active' as const;
  const joinCode = params.joinCode.trim();
  const caps = {
    budget_cap_usd: params.budgetCapUsd ?? null,
    weight_cap_kg: params.weightCapKg ?? null,
  };

  return [
    { title, status, join_code: joinCode, ...caps },
    { title, status, join_code: joinCode },
    { title, status, ...caps },
    { title, status },
  ];
}

/** Create a new box or update an existing one (legacy auto-bootstrap). */
export async function finalizeUserBoxSetup(params: {
  userId: string;
  title: string;
  joinCode: string;
  budgetCapUsd?: number | null;
  weightCapKg?: number | null;
}): Promise<{ boxId: string; joinCode: string }> {
  const { userId, title, budgetCapUsd, weightCapKg } = params;
  let joinCode = params.joinCode.trim();

  const { data: existingMember } = await supabase
    .from('box_members')
    .select('box_id')
    .eq('user_id', userId)
    .in('role', ['builder', 'contributor'])
    .limit(1)
    .maybeSingle();

  const writeParams = (): BoxWriteParams => ({ title, joinCode, budgetCapUsd, weightCapKg });

  if (existingMember?.box_id) {
    const boxId = existingMember.box_id;

    for (let attempt = 0; attempt < 8; attempt++) {
      let joinCodeRetried = false;

      for (const patch of boxPatchVariants(writeParams())) {
        const { error } = await supabase.from('boxes').update(patch).eq('id', boxId);
        if (!error) return { boxId, joinCode };

        if (isJoinCodeConflict(error) && 'join_code' in patch) {
          joinCode = generateRandomJoinCode();
          joinCodeRetried = true;
          break;
        }
        if (isMissingColumnError(error)) continue;
        throw error;
      }

      if (!joinCodeRetried) {
        throw new Error('Could not save box. Try again.');
      }
    }

    throw new Error('Could not assign a unique box code. Try again.');
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    let joinCodeRetried = false;

    for (const patch of boxPatchVariants(writeParams())) {
      const { data: box, error } = await supabase
        .from('boxes')
        .insert({ owner_id: userId, ...patch })
        .select('id')
        .single();

      if (!error && box?.id) {
        const { error: memberError } = await supabase
          .from('box_members')
          .insert({ box_id: box.id, user_id: userId, role: 'builder' });
        if (memberError) throw memberError;
        return { boxId: box.id, joinCode };
      }

      if (error && isJoinCodeConflict(error) && 'join_code' in patch) {
        joinCode = generateRandomJoinCode();
        joinCodeRetried = true;
        break;
      }
      if (error && isMissingColumnError(error)) continue;
      if (error) throw error;
    }

    if (!joinCodeRetried) {
      throw new Error('Could not save box. Try again.');
    }
  }

  throw new Error('Could not assign a unique box code. Try again.');
}

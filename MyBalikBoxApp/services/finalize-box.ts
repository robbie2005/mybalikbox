import type { PostgrestError } from '@supabase/supabase-js';

import { clearActiveBoxStorage } from '@/services/active-box';
import { notifyChecklistChanged } from '@/services/checklist-events';
import { supabase } from '@/services/supabase';

function mapPg(error: PostgrestError): Error {
  return new Error([error.message, error.details, error.hint].filter(Boolean).join('\n'));
}

/** Mark box archived and clear local active-box selection. */
export async function finalizeBox(boxId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Sign in to finalize your box.');
  }

  const { data: box, error: boxErr } = await supabase
    .from('boxes')
    .select('owner_id, status')
    .eq('id', boxId)
    .maybeSingle();

  if (boxErr) throw mapPg(boxErr);
  if (!box) throw new Error('Box not found.');

  const isOwner = box.owner_id === user.id;
  if (!isOwner) {
    const { data: member, error: memberErr } = await supabase
      .from('box_members')
      .select('role')
      .eq('box_id', boxId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (memberErr) throw mapPg(memberErr);
    if (member?.role !== 'builder') {
      throw new Error('Only the box owner can finalize this box.');
    }
  }

  const { error: updateErr } = await supabase
    .from('boxes')
    .update({ status: 'archived' })
    .eq('id', boxId);

  if (updateErr) throw mapPg(updateErr);

  await clearActiveBoxStorage();
  notifyChecklistChanged();
}

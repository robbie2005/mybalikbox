import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase';

export const JOIN_CODE_LENGTH = 6;

const JOIN_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Random 6-character code for new boxes (matches join input format). */
export function generateRandomJoinCode(): string {
  let code = '';
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    code += JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)];
  }
  return code;
}

export function normalizeJoinCodeInput(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, JOIN_CODE_LENGTH);
}

export function isJoinCodeComplete(code: string): boolean {
  return normalizeJoinCodeInput(code).length === JOIN_CODE_LENGTH;
}

function mapPg(error: PostgrestError): Error {
  return new Error([error.message, error.details, error.hint].filter(Boolean).join('\n'));
}

export type JoinBoxResult = {
  boxId: string;
  title: string;
  joinCode: string;
};

export async function joinBoxByCode(rawCode: string): Promise<JoinBoxResult> {
  const code = normalizeJoinCodeInput(rawCode);
  if (!isJoinCodeComplete(code)) {
    throw new Error('Enter the full 6-character box code.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Sign in to join a box.');
  }

  const { data, error } = await supabase.rpc('join_box_with_code', { p_code: code });

  if (error) {
    const msg = (error.message ?? '').toLowerCase();
    if (msg.includes('join_box_with_code') || error.code === 'PGRST202') {
      throw new Error(
        'Join is not available on this server yet. Ask the box owner to update the app database (join_box_with_code migration).',
      );
    }
    throw mapPg(error);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') {
    throw new Error('Could not join that box. Try again.');
  }

  const boxId = String((row as { box_id: string }).box_id);
  const title = String((row as { title: string }).title ?? 'Balikbayan Box');
  const joinCode = String((row as { join_code: string }).join_code ?? code);

  return { boxId, title, joinCode };
}

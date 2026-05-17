/**
 * Creates demo auth users + profiles and populates the public feed from local images.
 *
 * Required env (e.g. MyBalikBoxApp/.env.seed — do not commit):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SEED_DEMO_PASSWORD
 *
 * Usage:
 *   node --env-file=.env.seed scripts/seed-feed-demo.mjs
 *   node --env-file=.env.seed scripts/seed-feed-demo.mjs --wipe
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_ROOT = join(__dirname, 'data', 'feed-seed');
const MANIFEST_PATH = join(SEED_ROOT, 'manifest.json');
const IMAGES_DIR = join(SEED_ROOT, 'images');
const AVATARS_DIR = join(SEED_ROOT, 'avatars');

const VALID_CATEGORIES = new Set(['Family', 'Culture', 'Gratitude']);
const WIPE = process.argv.includes('--wipe');

function contentTypeForPath(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  return 'image/jpeg';
}

function readImage(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }
  return readFileSync(filePath);
}

async function findUserByEmail(supabase, email) {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function wipeDemoUsers(supabase, manifest) {
  const domain = manifest.demoEmailDomain ?? 'balikbox.demo';
  const emails = manifest.users.map((u) => `${u.key}@${domain}`);

  for (const email of emails) {
    const user = await findUserByEmail(supabase, email);
    if (!user) continue;

    const { data: posts } = await supabase.from('feed_posts').select('id, image_url').eq('author_id', user.id);
    for (const post of posts ?? []) {
      const path = post.image_url;
      if (path && !path.includes('://')) {
        await supabase.storage.from('post-media').remove([path]);
      }
    }

    await supabase.from('feed_posts').delete().eq('author_id', user.id);
    await supabase.auth.admin.deleteUser(user.id);
    console.log(`Removed demo user ${email}`);
  }
}

async function uploadAvatarBytes(supabase, userId, bytes, contentType) {
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const storagePath = `${userId}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage.from('avatars').upload(storagePath, bytes, {
    contentType,
    upsert: true,
  });
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(storagePath);
  return urlData.publicUrl ? `${urlData.publicUrl}?t=${Date.now()}` : null;
}

async function ensureDemoUser(
  supabase,
  { email, password, displayName, username, bio, location, avatarPath, avatarUrl: remoteAvatarUrl },
) {
  let user = await findUserByEmail(supabase, email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName, seed_demo: true },
    });
    if (error) throw new Error(`createUser ${email}: ${error.message}`);
    user = data.user;
    console.log(`Created user ${email}`);
  } else {
    console.log(`Reusing user ${email}`);
  }

  let avatarUrl = null;
  if (avatarPath && existsSync(avatarPath)) {
    const bytes = readImage(avatarPath);
    avatarUrl = await uploadAvatarBytes(supabase, user.id, bytes, contentTypeForPath(avatarPath));
  } else if (remoteAvatarUrl) {
    const res = await fetch(remoteAvatarUrl);
    if (!res.ok) throw new Error(`avatar fetch ${email}: HTTP ${res.status}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    avatarUrl = await uploadAvatarBytes(supabase, user.id, bytes, contentType);
    console.log(`Avatar uploaded for ${email}`);
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      display_name: displayName,
      username,
      bio: bio ?? null,
      location: location ?? null,
      avatar_url: avatarUrl,
    },
    { onConflict: 'id' },
  );
  if (profileError) throw new Error(`profile ${email}: ${profileError.message}`);

  return user.id;
}

async function createPost(supabase, { authorId, imagePath, caption, category, hoursAgo }) {
  if (!VALID_CATEGORIES.has(category)) {
    throw new Error(`Invalid category "${category}" (use Family, Culture, or Gratitude)`);
  }

  const postId = randomUUID();
  const ext = imagePath.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
  const storagePath = `${authorId}/${postId}.${ext}`;
  const bytes = readImage(imagePath);

  const { error: uploadError } = await supabase.storage.from('post-media').upload(storagePath, bytes, {
    contentType: contentTypeForPath(imagePath),
    upsert: true,
  });
  if (uploadError) throw new Error(`post media: ${uploadError.message}`);

  const createdAt = new Date(Date.now() - (hoursAgo ?? 0) * 60 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase.from('feed_posts').insert({
    id: postId,
    author_id: authorId,
    image_url: storagePath,
    caption,
    category,
    media_type: 'photo',
    created_at: createdAt,
  });
  if (insertError) throw new Error(`feed_posts insert: ${insertError.message}`);

  return postId;
}

async function main() {
  const supabaseUrl =
    process.env.SUPABASE_URL?.trim() || process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const password = process.env.SEED_DEMO_PASSWORD?.trim();

  if (!supabaseUrl || !serviceKey || !password) {
    console.error(
      'Missing env. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SEED_DEMO_PASSWORD in .env.seed',
    );
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const domain = manifest.demoEmailDomain ?? 'balikbox.demo';
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (WIPE) {
    console.log('Wiping existing demo users and posts…');
    await wipeDemoUsers(supabase, manifest);
  }

  const userIdByKey = new Map();

  for (const u of manifest.users) {
    const email = `${u.key}@${domain}`;
    const avatarFile = u.avatar ? join(AVATARS_DIR, u.avatar) : null;
    const id = await ensureDemoUser(supabase, {
      email,
      password,
      displayName: u.displayName,
      username: u.username,
      bio: u.bio,
      location: u.location,
      avatarPath: avatarFile && existsSync(avatarFile) ? avatarFile : null,
      avatarUrl: u.avatarUrl ?? null,
    });
    userIdByKey.set(u.key, id);
  }

  let created = 0;
  for (const p of manifest.posts) {
    const authorId = userIdByKey.get(p.authorKey);
    if (!authorId) {
      throw new Error(`Unknown authorKey "${p.authorKey}"`);
    }
    const imagePath = join(IMAGES_DIR, p.image);
    await createPost(supabase, {
      authorId,
      imagePath,
      caption: p.caption,
      category: p.category,
      hoursAgo: p.hoursAgo ?? 0,
    });
    created += 1;
    console.log(`Post: ${p.image} → @${p.authorKey}`);
  }

  console.log(`\nDone. ${manifest.users.length} demo users, ${created} feed posts.`);
  console.log(`Sign in as e.g. maria@${domain} with SEED_DEMO_PASSWORD.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

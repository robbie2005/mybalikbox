# Feed demo seed data

Drop your images here, then run the seed script from `MyBalikBoxApp/`.

## Folders

| Folder | Purpose |
|--------|---------|
| `images/` | Feed post photos (required filenames match `manifest.json` → `posts[].image`) |
| `avatars/` | Profile photos (optional; match `users[].avatar`) |

## Default post images expected

- `labeled-box.jpg`
- `snacks-aisle.jpg`
- `weighing-scale.jpg`
- `packing-tape.jpg`
- `thank-you-note.jpg`
- `sneakers-kids.jpg`
- `dried-fish.jpg`
- `video-call.jpg`

Avatars can be local files in `avatars/` **or** `avatarUrl` in `manifest.json` (the script downloads and uploads them to Supabase).

Rename your files to match, **or** edit `manifest.json` so `image` / `avatar` fields match your filenames.

## Env (`.env.seed`, never commit)

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SEED_DEMO_PASSWORD=choose-a-strong-demo-password
```

## Commands

```bash
cd MyBalikBoxApp
node --env-file=.env.seed scripts/seed-feed-demo.mjs
```

Remove previous demo users/posts and re-seed:

```bash
node --env-file=.env.seed scripts/seed-feed-demo.mjs --wipe
```

Demo accounts use emails like `maria@balikbox.demo` (see `demoEmailDomain` in the manifest).

---

# MyBalikBox

A collaborative Balikbayan box planning platform

MyBalikBox is a mobile app that helps Filipino and Filipino American families plan meaningful Balikbayan boxes together. Instead of scattered messages and forgotten items, families can collaborate on shared checklists, explore cultural recommendations, and share the stories behind what they send.

## Highlights

- Shared checklists for family collaboration
- Item suggestions with cultural meaning
- Discover commonly sent items and traditions
- Community stories and discussion forum
- Built specifically around the Balikbayan box experience

## Installation

**Prerequisites**
- Node.js (v18+ recommended)
- npm or yarn
- Expo CLI
- Android Emulator or Xcode (for emulator)
- Expo Go 

**Setup**

```
git clone https://github.com/robbie2005/mybalikbox.git
cd MyBalikBoxApp
npm install 
npx expo start 
```

**Environment Variables**

Create a `.env` file in the MyBalikBoxApp directory:
API Keys found in Supabase 

```
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Tech Stack

- **Frontend:** React + Expo
- **Backend:** Supabase, Node.js (as needed)
- **Database:** PostgreSQL
- **Design:** Figma

## Contributing

**Basic rules:**
- Branch from `dev`
- Use branch names like:
  - `feature/name-checklist`
  - `feature/name-discoverPage`
  - `bugfix/name-loginError`
- Open a pull request to `dev`
- At least one review required

**Commit:**

```
git branch                                Ensure working on correct branch
git checkout -b feature/<branch-name>     Create feature branch (if not done already)
git add .                                 Stage changes
git commit -m 'commit-message'            Commit
git push origin feature/<branch-message>  Push branch to github
```
- Open PR (pull request) to dev with desc of changes, must be reviewed by one teammate
- Merge to dev after approval

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
- npm

**Setup**

```
git clone https://github.com/robbie2005/mybalikbox.git
cd frontend
npm install
npm run dev
```

**Environment Variables**

Create a `.env` file in the frontend directory:

```
REACT_APP_SUPABASE_URL=your_project_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

## Tech Stack

- **Frontend:** React Native + SWC
- **Backend:** Supabase, Node.js (as needed)
- **Database:** PostgreSQL
- **Design:** Figma

## Project Structure

```
/frontend      React app
/backend       Node services
/supabase      Database config
/docs          Planning documents
```

## Contributing

**Basic rules:**
- Branch from `dev`
- Use branch names like:
  - `feature-name-checklist`
  - `feature-name-discoverPage`
  - `bugfix-name-error`
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

---

# MyBalikBox

A collaborative Balikbayan box planning platform

MyBalikBox is a web app that helps Filipino and Filipino American families plan meaningful Balikbayan boxes together. Instead of scattered messages and forgotten items, families can collaborate on shared checklists, explore cultural recommendations, and share the stories behind what they send.

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

- **Frontend:** React + Vite + SWC
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

We welcome feedback, issues, and feature requests.

**Basic rules:**
- Branch from `dev`
- Use branch names like:
  - `feature/checklist`
  - `feature/discover-page`
  - `bugfix/login-error`
- Open a pull request to `dev`
- At least one review required

**Commit style:**

```
feat: add item suggestion form
fix: resolve checklist status bug
docs: update README
```

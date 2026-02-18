---

# BalikBoxify

A collaborative Balikbayan box planning platform

BalikBoxify is a web app that helps Filipino and Filipino American families plan meaningful Balikbayan boxes together. Instead of scattered messages and forgotten items, families can collaborate on shared checklists, explore cultural recommendations, and share the stories behind what they send.

## Highlights

- Shared checklists for family collaboration
- Item suggestions with cultural meaning
- Discover commonly sent items and traditions
- Community stories and discussion forum
- Built specifically around the Balikbayan box experience

## Overview

Balikbayan boxes are a long-standing tradition used by Filipino families to stay connected across distance. However, deciding what to send often happens through scattered chats, making it hard to stay organized or include meaningful items.

BalikBoxify solves this by providing a centralized, collaborative planning space where senders and recipients can work together on a shared checklist, track item status, and explore culturally relevant suggestions.

This project is being developed by a student team to support more intentional, organized, and culturally meaningful box planning.

## Who This Is For

**Box Builders (Senders)**
- Create and manage box plans
- Invite family members
- Review and approve item suggestions
- Track included items

**Recipients (Contributors)**
- Suggest items with notes
- See item status updates
- Collaborate with senders

## Example Usage

1. Create a box

```
Create new box -> Invite family members
```

2. Family suggests items

```
Add item: Shampoo
Quantity: 3
Note: Hard to find this brand locally
```

3. Sender reviews and confirms

```
Status: Included
```

## Installation

**Prerequisites**
- Node.js (v18+ recommended)
- npm

**Setup**

```
git clone https://github.com/your-org/balikboxify.git
cd frontend
npm install
npm start
```

**Environment Variables**

Create a `.env` file in the frontend directory:

```
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
```

## Tech Stack

- **Frontend:** React
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

## Feedback & Discussions

Have an idea or found a bug?
- Open an issue
- Start a discussion
- Suggest a feature

We'd love to hear your feedback and improve the platform together.

## Team

Student development team working on a cultural planning platform for Balikbayan boxes.

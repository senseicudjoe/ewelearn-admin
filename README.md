# EweLearn Admin

Admin/teacher web console for managing **modules**, **lessons**, **vocabulary**, and **quizzes** for the EweLearn platform.

Built with **React + TypeScript + Vite**, styled with **Tailwind (v4)** + **shadcn/ui**, and backed by **Firebase** (Auth + Firestore + Storage).

---

## Features

- **Auth & roles**
  - Login via Firebase Auth
  - Role-based UI using `users/{uid}.role` (`admin` or `teacher`)
- **Modules (admin)**
  - Create/edit modules
  - Publish/unpublish modules
- **Lessons**
  - Teachers: create and manage their lessons
  - Admins: manage lessons (including module-scoped views)
  - Approval workflow: **pending → approved / rejected**
  - Admin-only delete (also removes related vocab + quiz data)
- **Lesson content add-ons**
  - Vocabulary per lesson
  - Quiz per lesson (question types, options, correct answers)

---

## Tech stack

- **Frontend**: React 19, TypeScript, Vite
- **UI**: Tailwind CSS (v4), shadcn/ui, Radix, Sonner (toasts), lucide-react (icons)
- **Backend**: Firebase Auth + Firestore + Storage
- **Routing**: react-router-dom

---

## Project structure (high level)

- `src/pages/**`: route-level pages (Lessons, Modules, Pending Review, Login)
- `src/components/**`: layout + shared UI components
- `src/contexts/**`: app-wide state (auth + role)
- `src/services/**`: Firestore/Firebase access + business workflows
- `src/types/index.ts`: shared domain types
- `firebase.config.ts`: Firebase client initialization (Auth/Firestore/Storage)

---

## Getting started

### Prerequisites

- Node.js (recommended: current LTS)
- A Firebase project with:
  - **Authentication** enabled (Email/Password)
  - **Firestore** enabled
  - **Storage** enabled (optional, used for future media uploads)

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open the URL printed by Vite (usually `http://localhost:5173`).

---

## Scripts

```bash
npm run dev      # start Vite dev server
npm run build    # typecheck + production build
npm run preview  # preview production build
npm run lint     # eslint
```

---

## Firebase configuration

Firebase is initialized in `firebase.config.ts` and exports:

- `auth` (Firebase Auth)
- `db` (Firestore)
- `storage` (Firebase Storage)

> Note: Firebase keys are currently checked into `firebase.config.ts`. That works for web apps, but for cleaner configuration across environments you may want to move these into Vite env vars (e.g. `VITE_FIREBASE_API_KEY`, etc.).

---

## Roles & access model

This app reads the signed-in user’s profile from Firestore:

- `users/{uid}`
  - `displayName: string`
  - `role: 'admin' | 'teacher'`

The role is used throughout the UI via `src/contexts/AuthContext.tsx` (`isAdmin`, `isTeacher`).

---

## Firestore collections (expected)

### `modules`

Module documents include:

- `title`, `description`, `order`
- `requiredXP`, `estimatedDuration`
- `iconUrl`
- `isPublished`

### `lessons`

Lesson documents include:

- Content: `moduleId`, `title`, `order`, `content`, `culturalNote`, `xpReward`, `isPublished`
- Workflow: `createdBy`, `status`, `feedback`, `submittedAt`, `reviewedAt`, `reviewedBy`
- **`lessonId`**: a field mirroring the Firestore document id (used by mobile clients)

### `vocabulary`

Vocabulary documents include:

- `lessonId` (foreign key)
- `eweWord`, `englishTranslation`, `pronunciation`, example sentences
- `difficulty`, `partOfSpeech`
- `audioUrl`, `exampleAudioUrl` (optional)

### `quizzes`

Quiz documents include:

- `lessonId` (foreign key)
- `title`
- `questions[]`
- `passingScore`

---

## Workflows

### Teacher lesson submission

- Teacher creates or edits a lesson → status is (re)submitted as **`pending`** for admin review.

### Admin review

- Admin reviews pending lessons at `/pending`
  - Approve → `status: approved` (also publishes)
  - Reject → `status: rejected` with `feedback`

### Admin delete lesson

From the lessons list, admins can delete a lesson. The app deletes:

1. The lesson’s quiz (if present)
2. All vocabulary items linked to the lesson
3. The lesson document

---

## Notes / gotchas

- **Module deletion does not currently cascade in Firestore**. The UI warns that it “deletes associated lessons”, but `moduleService.delete()` only deletes the module doc itself. If you want cascading deletes, implement it explicitly (or via Cloud Functions).
- **Firestore rules** must allow the operations you expect (admins approving/rejecting/deleting, teachers editing their own lessons, etc.).

---

## License

Private / internal project (update as needed).

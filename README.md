# Junior Scientist Event Website

This repository contains the full-stack application for the "Junior Scientist" event, designed to manage sub-events, participants, and organizers efficiently. The platform provides a seamless experience for students to register, and for organizers to manage events, tasks, and participant data with advanced tools.

## Project Description

**Junior Scientist Event Website — Full-Stack Application**
*June 2024 – August 2024*

– Developed a scalable event management platform with robust Role-Based Access Control (RBAC) to support a multi-level organizing hierarchy.
– Integrated real-time task tracking, live dashboards for dynamic student analytics, and an OCR component for automated input processing.
– Engineered a responsive UI/UX for seamless data management on both mobile and desktop, featuring a modern, multi-hued design system with distinct light and dark modes.

– **Tools & Technologies:** Firebase Firestore, Node.js, React/Next.js, Tailwind CSS.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* Node.js (LTS version recommended)

* npm or Yarn

* A Firebase project

* Git

### Installation

1. **Clone the repository:**

   ```
   git clone [https://github.com/your-github-username/junior-scientist-website.git](https://github.com/your-github-username/junior-scientist-website.git)
   cd junior-scientist-website
   ```

2. **Install dependencies:**

   ```
   npm install
   # or
   yarn install
   ```

### Firebase Setup

1. **Create a Firebase Project:** If you don't have one, go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.

2. **Configure Firestore:** Enable Firestore in your Firebase project.

3. **Firebase Project Configuration:**

   * In your Firebase project settings, add a new web app and copy its configuration object.

   * Create a `.env.local` file in the root of your project (or `.env` if not using Next.js conventions) and add your Firebase configuration details:

     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
     ```

4. **Firestore Security Rules:** Implement the provided Firestore security rules (from your development process) to define access control for different user roles. You can find these in `firestore.rules` within the `src` directory or a separate `firestore` folder.

   ```bash
   # Example command to deploy rules (requires Firebase CLI)
   firebase deploy --only firestore:rules
   ```

5. **Firebase Indexes:** Deploy any necessary Firestore indexes if you have composite queries.

## Usage

### Participant Portal

* Browse all active sub-events on the homepage.

* Click on an event to view detailed information.

* Register for events (requires user authentication).

* View a dashboard of registered events and personal notifications.

### Organizer Portal

* **Overall Head:** Create new sub-events, manage other organizers/reps, view global analytics.

* **Event Head/Representative/Organizer:** Manage specific sub-events, oversee registrations, track tasks, and monitor sub-event specific analytics.

* Login with appropriate credentials to access your role-specific dashboard.

* Utilize the OCR feature to quickly process registration forms.

* Track task completion and team credibility scores.

## Project Structure

```
.
├── src/
│   ├── app/                    # Next.js app directory for pages, layouts
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── components/             # Reusable React components
│   ├── contexts/               # React Context for global state management
│   ├── data/                   # Data utilities or mock data
│   ├── hooks/                  # Custom React hooks
│   ├── lib/
│   │   ├── firebase.ts         # Firebase initialization and service access
│   │   └── utils.ts            # General utility functions
│   ├── types/                  # TypeScript type definitions
│   └── user/                   # User-related components/logic
├── .env.local                  # Environment variables (private)
├── .gitignore
├── .modified
├── apphosting.yaml
├── components.json
├── firestore.rules             # Firestore Security Rules
├── next-env.d.ts
├── next.config.js
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md                   # This file
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration

```

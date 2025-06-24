# Junior Scientist Event Website

This repository contains the full-stack application for the "Junior Scientist" event, designed to manage sub-events, participants, and organizers efficiently. The platform provides a seamless experience for students to register, and for organizers to manage events, tasks, and participant data with advanced tools.

## Table of Contents

* [Features](#features)

* [Technologies Used](#technologies-used)

* [Getting Started](#getting-started)

  * [Prerequisites](#prerequisites)

  * [Installation](#installation)

  * [Firebase Setup](#firebase-setup)

* [Usage](#usage)

  * [Participant Portal](#participant-portal)

  * [Organizer Portal](#organizer-portal)

* [Project Structure](#project-structure)

## Features

The Junior Scientist Event Website is equipped with a suite of features to streamline event management:

* **Event Browsing & Registration:** Students can easily browse a list of available sub-events and register.

* **Role-Based Access Control (RBAC):** Robust, multi-tiered access control system differentiating between Overalls, Event Heads, Event Representatives, Organizers, and Participants.

* **Organizer & Task Management:** Dedicated tools for Overall Heads and Event Heads to create, assign, and track tasks for organizers and representatives.

* **Gamification:** Awards points for task completion and calculates a credibility score for organizers, enhancing engagement and accountability.

* **Real-time Checklists & Notifications:** Real-time checklists for student data-related tasks to ensure consistency, facilitate follow-ups, and display real-time announcements.

* **Student Data Analytics:** Dashboards provide statistics on participants, including school distribution, common students across multiple events, and sorting/filtering options for data management.

* **OCR Component:** An integrated OCR tool for efficient processing and automatic population of user data from uploaded registration forms.

## Technologies Used

The project leverages a modern and scalable technology stack:

* **Frontend:**

  * React/Next.js: For building a dynamic and responsive user interface.

  * Tailwind CSS: For rapid and efficient styling.

* **Backend & Database:**

  * Node.js: For server-side logic and Firebase interactions.

  * Firebase (Firestore): A NoSQL cloud database for flexible and real-time data storage and synchronization.

  * Firebase Authentication: For secure user authentication.

  * Firebase Cloud Functions (optional, for advanced server-side logic): For trigger-based backend operations.

* **Other:**

  * OCR Component (specific library/API details can be added here if known)

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

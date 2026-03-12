# 🚀 Mini AI LinkedIn

A full-stack professional networking platform with AI-powered features, inspired by LinkedIn. Built with Node.js, Express, MongoDB, Firebase Auth, Cloudinary, and Groq AI.

![Mini LinkedIn](https://img.shields.io/badge/Mini_LinkedIn-Professional_Networking-0a66c2?style=for-the-badge&logo=linkedin)

---

## ✨ Features

### Core Features
- 🔐 **Firebase Authentication** - Email/password signup & login
- 👤 **Rich User Profiles** - Photo, headline, bio, skills, experience, education
- 📝 **Post Creation & Feed** - Share posts with optional image uploads
- ❤️ **Post Interactions** - Like/unlike & comment system
- 🤝 **Smart Skill Matching** - Automatic notifications when users share similar skills

### AI-Powered Features (Groq API)
- ✨ **AI Bio Enhancer** - Transform rough bios into polished, professional summaries
- ✨ **AI Caption Enhancer** - Improve post captions with better grammar and impact

### Additional Features
- 📱 Responsive design (mobile-first)
- 🔔 Notification system
- ☁️ Cloud image storage (Cloudinary)
- 🔍 User search
- 🎨 Modern UI with Tailwind CSS & custom animations

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, Tailwind CSS, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Authentication | Firebase Auth |
| Image Storage | Cloudinary |
| AI Integration | Groq API (Llama 3.1) |

---

## 📦 Project Structure

```
MINI_LINKEDIN/
├── server/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   ├── cloudinary.js      # Cloudinary + Multer setup
│   │   └── firebase.js        # Firebase Admin SDK
│   ├── controllers/
│   │   ├── userController.js  # User CRUD, search, notifications
│   │   ├── postController.js  # Post CRUD, likes, comments, skill matching
│   │   └── aiController.js    # Groq AI bio & caption enhancement
│   ├── middleware/
│   │   └── auth.js            # Firebase token verification
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Post.js            # Post schema
│   ├── routes/
│   │   ├── userRoutes.js      # User API routes
│   │   ├── postRoutes.js      # Post API routes
│   │   └── aiRoutes.js        # AI API routes
│   └── server.js              # Express app entry point
├── public/
│   ├── css/styles.css         # Custom CSS + design system
│   ├── js/
│   │   ├── firebase-config.js # Firebase client config (EDIT THIS)
│   │   ├── utils.js           # Shared utilities
│   │   └── feed.js            # Feed page logic
│   ├── index.html             # Landing page
│   ├── login.html             # Login page
│   ├── signup.html            # Signup page
│   ├── feed.html              # Home feed
│   ├── profile.html           # View profile
│   ├── edit-profile.html      # Edit profile
│   └── notifications.html     # Notifications
├── .env.example               # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (free tier)
- [Firebase](https://firebase.google.com/) project
- [Cloudinary](https://cloudinary.com/) account (free tier)
- [Groq](https://console.groq.com/) API key (free tier)

### Step 1: Clone & Install Dependencies

```bash
cd MINI_LINKEDIN
npm install
```

### Step 2: Set Up MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user
4. Get your connection string
5. Replace `<password>` in the connection string

### Step 3: Set Up Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Email/Password** authentication
4. Go to **Project Settings > General > Your apps**
5. Register a **Web app** and copy the config
6. Paste the config into `public/js/firebase-config.js`
7. Go to **Project Settings > Service Accounts**
8. Click **Generate New Private Key**
9. Copy `project_id`, `client_email`, and `private_key` to `.env`

### Step 4: Set Up Cloudinary
1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Copy your **Cloud Name**, **API Key**, and **API Secret**

### Step 5: Set Up Groq AI
1. Go to [Groq Console](https://console.groq.com/)
2. Create an API key

### Step 6: Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your actual credentials
```

Fill in all values in the `.env` file.

### Step 7: Update Firebase Client Config

Edit `public/js/firebase-config.js` with your Firebase web app config:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

### Step 8: Run the Application

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Visit **http://localhost:3000** in your browser! 🎉

---

## 📡 API Documentation

### Authentication
All API routes (except health check) require a Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase_id_token>
```

### User Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/profile` | Create user profile |
| GET | `/api/users/me` | Get current user's profile |
| PUT | `/api/users/profile` | Update profile (supports file upload) |
| GET | `/api/users` | Get all users (paginated) |
| GET | `/api/users/search?q=keyword` | Search users |
| GET | `/api/users/:id` | Get user by ID |
| GET | `/api/users/notifications` | Get notifications |
| PUT | `/api/users/notifications/read` | Mark notifications as read |

### Post Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create post (supports image upload) |
| GET | `/api/posts` | Get feed posts (paginated) |
| GET | `/api/posts/user/:userId` | Get posts by user |
| PUT | `/api/posts/:id/like` | Toggle like |
| POST | `/api/posts/:id/comment` | Add comment |
| DELETE | `/api/posts/:id` | Delete post (author only) |

### AI Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/enhance-bio` | Enhance bio with AI |
| POST | `/api/ai/enhance-caption` | Enhance post caption with AI |

---

## 🎨 Pages Overview

1. **Landing Page** (`/`) - Hero section with feature showcase
2. **Login** (`/login.html`) - Firebase email/password login
3. **Signup** (`/signup.html`) - Create account with Firebase
4. **Feed** (`/feed.html`) - Global post feed with create, like, comment
5. **Profile** (`/profile.html`) - View own or others' profiles
6. **Edit Profile** (`/edit-profile.html`) - Edit profile with AI bio enhancer
7. **Notifications** (`/notifications.html`) - Skill match & interaction alerts

---

## 🤖 How Skill Matching Works

1. User creates a post (e.g., "I learned JavaScript today")
2. System scans for known skill keywords in the post content
3. Database is searched for users with matching skills in their profile
4. Both users receive a notification:
   > "You and Alex both mentioned JavaScript. Consider connecting since you share similar skills."

---

## 📄 License

This project is open source and available under the [ISC License](LICENSE).

---

**Built with ❤️ using Node.js, MongoDB, Firebase & Groq AI**

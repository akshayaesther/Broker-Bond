# 💍 Broker-Bond

A full-stack matrimony CRM for marriage brokers, built with React, Node.js, and MongoDB — featuring a faith-aware compatibility engine for Christian matches and a privacy-first portal for families.

## 🌟 Overview

Most matrimony platforms are built for individuals searching on their own. Broker-Bond is built for the broker who manages many candidates, finds matches, and tracks each match through to marriage. Brokers manage candidates, scored matches, deals and referrals from one dashboard. Families get a separate, limited view where they can follow progress and browse profiles without seeing private details too early. The interface is available in both English and Tamil.

## ✨ Features

### 👔 Broker Dashboard
- Broker signup and login with JWT authentication
- Add, edit, delete and search candidates, with filters for age, city, education, income and denomination
- Pagination and a "recently updated" filter
- Activity feed and interest request summary on the dashboard

### 💞 Christian Compatibility Engine
- Denomination matching with preferred-denomination settings (Catholic, CSI, CNI, Pentecostal, Baptist, Orthodox, Mar Thoma and more)
- Faith questionnaire: importance of faith, church attendance, prayer, Bible study, wedding type, raising children in the faith
- Weighted match score with a category breakdown (faith, denomination, marriage expectations, family values, location, education, career)
- Plain-language "Why this match?" explanation for every score
- Pastor-verified and broker-verified badges on candidate profiles

### 📊 Deal Pipeline
- Track every match through Interested → Meeting Arranged → Family Approved → Married
- Commission field on completed matches
- Remove a deal with a confirmation step, and dismiss an interest request before it becomes a deal

### 🤝 Broker Referral Network
- Mark a candidate as open to referral
- Request a connection with another broker's candidate and propose a commission split
- Track incoming and outgoing referral requests

### 👨‍👩‍👧 Family Portal
- Email OTP login tied to a specific candidate ID
- Live view of the candidate's pipeline stage
- Browse other profiles with a compatibility score on each card
- Photo, phone, email and exact location stay hidden until the broker approves
- "Express Interest" goes to the family's own broker, never directly to the other candidate

### 🌐 Language Support
- Full English and Tamil interface with a language switcher
- The chosen language is remembered between visits

## 🛠️ Tech Stack

**Frontend**

```
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS v4 | Styling |
| React Router v7 | Client-side routing |
| Axios | HTTP requests to the backend API |
| react-i18next | English and Tamil translations |
| react-hot-toast | Notifications |
| Lucide React | Icon library |
```

**Backend**

```
| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express.js | REST API framework |
| MongoDB | NoSQL database |
| Mongoose | MongoDB object modelling |
| JSON Web Token (JWT) | Broker authentication |
| bcrypt | Password hashing |
| Nodemailer | Email OTP for the family portal |
| dotenv | Environment variable management |
| cors | Cross-origin resource sharing |
```

## 📁 Project Structure

```
Broker-Bond/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── activityController.js
│   │   │   ├── authController.js
│   │   │   ├── candidateController.js
│   │   │   ├── interestController.js
│   │   │   ├── pipelineController.js
│   │   │   └── referralController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   ├── Activity.js
│   │   │   ├── Broker.js
│   │   │   ├── Candidate.js
│   │   │   ├── FamilyPortalSession.js
│   │   │   ├── InterestRequest.js
│   │   │   ├── Match.js
│   │   │   └── ReferralRequest.js
│   │   ├── routes/
│   │   │   ├── activityRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── candidateRoutes.js
│   │   │   ├── interestRoutes.js
│   │   │   ├── pipelineRoutes.js
│   │   │   └── referralRoutes.js
│   │   └── services/
│   │       ├── activityService.js
│   │       ├── compatibilityEngine.js
│   │       └── matchService.js
│   ├── .gitignore
│   ├── package.json
│   ├── seed.js
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── CandidateTrust.jsx
│   │   │   ├── GenderAvatar.jsx
│   │   │   ├── LanguageSwitcher.jsx
│   │   │   ├── Layout.jsx
│   │   │   └── PageLoader.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── locales/
│   │   │   ├── en.json
│   │   │   └── ta.json
│   │   ├── pages/
│   │   │   ├── CandidateList.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── FamilyPortal.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Network.jsx
│   │   │   ├── Pipeline.jsx
│   │   │   └── Signup.jsx
│   │   ├── utils/
│   │   │   └── candidateFreshness.js
│   │   ├── App.jsx
│   │   ├── i18n.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

- Node.js v18 or higher
- MongoDB (local) or a MongoDB Atlas account
- npm

### 1. Setup Backend

```
cd backend
npm install
```

Seed the database:

```
node seed.js
```

Start the backend server:

```
node server.js
```

### 2. Setup Frontend

```
cd frontend
npm install
npm run dev
```

## 👩‍💻 Developer

A. Akshaya Esther
🎓 B.Tech Information Technology — Anna University (BIT Campus, Trichy) — 2026

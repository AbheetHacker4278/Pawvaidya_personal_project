# 🐾 PawVaidya - #1 Veterinary Platform in India

[![MERN Stack](https://img.shields.io/badge/MERN-Stack-green.svg)](https://www.mongodb.com/mern-stack)
[![Vite](https://img.shields.io/badge/Frontend-Vite-blue.svg)](https://vitejs.dev/)
[![Socket.io](https://img.shields.io/badge/Real--time-Socket.io-black.svg)](https://socket.io/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini-purple.svg)](https://deepmind.google/technologies/gemini/)

PawVaidya is a state-of-the-art, comprehensive veterinary consultancy platform designed to bridge the gap between pet owners and expert veterinarians. Built with the **MERN Stack**, it features real-time consultation, AI-driven diagnostics, and a robust admin management system.

---

## 🔥 Key Features

### 🐶 For Pet Owners (User Portal)
- **AI-Powered Diagnostics**: Integrated **Gemini AI** chatbot (PawBot) for instant pet health guidance and symptom checking.
- **Smart Appointment Booking**: Easy scheduling with specialized vets (Small Animal, Avian, Exotic, etc.) featuring real-time slot availability.
- **Video Consultations**: Crystal-clear video calls powered by **ZegoCloud** for remote diagnosis.
- **Multilingual Support**: Seamless transition between English, Hindi, Tamil, and Telugu using **i18next** and AI-powered translations.
- **Pet ID Cards**: Generate digital, verifiable premium IDs for your pets.
- **Community Hub**: Share experiences and learn from expert blogs.

### 🏥 For Veterinarians
- **Dynamic Scheduling**: Manage consultation hours and availability slots.
- **Quick Chats**: Real-time messaging with pet owners for follow-ups.
- **Profile Management**: Showcase expertise, experience, and consultancy fees.

### ⚙️ For Administrators (Admin Panel)
- **Advanced Analytics**: Real-time dashboard using **Chart.js** and **Recharts** to track status codes, activity trends, and system health.
- **Supabase Integration**: Activity logging and analytics offloaded to Supabase for enhanced performance.
- **Fraud Detection**: AI-monitored system to identify and alert about suspicious activities.
- **Stream Management**: Control live veterinary sessions and Q&A.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, Framer Motion, Lucide Icons, MUI |
| **Backend** | Node.js, Express, MongoDB (Mongoose), Redis |
| **Real-time** | Socket.io, ZegoCloud (Video SDK) |
| **AI/ML** | Google Gemini AI API, OpenAI API, face-api.js |
| **Infrastructure** | Supabase (Logging), Cloudinary (Images), Razorpay (Payments) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20.x recommended)
- MongoDB Atlas Account
- Gemini AI API Key
- Cloudinary Credentials

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/AbheetHacker4278/Pawvaidya_personal_project.git
   cd Pawvaidya_personal_project/PawVaidya
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env # Configure your MongoDB and API keys
   npm run server
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

4. **Admin Setup**
   ```bash
   cd ../admin
   npm install
   cp .env.example .env
   npm run dev
   ```

---

## 🔐 Environment Configuration

Each sub-directory requires its own `.env` file. Key variables include:

- `MONGODB_URI`: Your MongoDB connection string.
- `VITE_GEMINI_API_KEY`: Your Google Cloud Gemini API key.
- `VITE_ZEGO_APP_ID` & `VITE_ZEGO_SERVER_SECRET`: For video calling.
- `CLOUDINARY_CLOUD_NAME`: For media storage.

---

## 📦 Project Structure

```text
PawVaidya/
├── admin/                  # React Admin Dashboard
│   ├── public/             # Static assets
│   └── src/
│       ├── components/     # UI Components (Sidebar, Navbar, etc.)
│       ├── context/        # Admin Global State
│       ├── pages/          # Admin Views (Dashboard, Doctor Chat, etc.)
│       └── utils/          # Admin Helpers
├── frontend/               # React User Portal
│   ├── public/             # Static assets
│   └── src/
│       ├── components/     # Reusable UI Components
│       ├── context/        # App Global State
│       ├── pages/          # User Views (Home, Profile, Appointments)
│       └── i18n/           # Multilingual Translations
└── backend/                # Node.js/Express API Server
    ├── config/             # DB & Cloudinary Configuration
    ├── controllers/        # Business Logic (User, Doctor, Admin)
    ├── middleware/         # Auth & Validation Middleware
    ├── models/             # Mongoose Schemas (User, Doctor, Appt)
    ├── routes/             # API Endpoints
    └── socketServer.js     # Real-time WebSocket Logic
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License & Support

© 2026 PawVaidya. All Rights Reserved.
For support or deployment issues, refer to the [DEPLOYMENT.md](./PawVaidya/DEPLOYMENT.md) or contact the project maintainers.

---
*Created with ❤️ for Pet Care Professionals and Owners.*
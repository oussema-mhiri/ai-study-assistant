🎓 AI Study Assistant
Assistant intelligent pour l'apprentissage universitaire

AI Study Assistant est une application web SaaS conçue pour accompagner les étudiants universitaires dans leur parcours académique. Elle intègre des fonctionnalités avancées d'intelligence artificielle pour analyser les cours, générer des résumés, des quiz, des exercices interactifs, des flashcards et un planning de révision intelligent, tout en offrant un chatbot pédagogique contextuel.

Ce projet a été réalisé dans le cadre d'un stage d'été de 2ème année au sein de l'entreprise Mobelite, sous la supervision de Mme Rania Wannes.

Année universitaire : 2025 / 2026


## ✨ Fonctionnalités principales

| Module | Fonctionnalités |
|--------|-----------------|
| **Authentification** | JWT, Google OAuth, réinitialisation OTP (6 chiffres) |
| **Matières** | CRUD, organisation des cours, couleur personnalisable, date d'examen |
| **Documents** | Upload PDF/DOCX/PPTX/images, extraction texte, analyse IA |
| **IA (Gemini)** | Résumés, points clés, définitions, analyse d'images, génération planning |
| **Quiz** | QCM, Vrai/Faux, correction interactive (vert/rouge), score |
| **Exercices** | QCM, Vrai/Faux, questions ouvertes, questions à trous, correction IA |
| **Flashcards** | Génération IA, répétition espacée (SM-2), catégories |
| **Chatbot** | Assistant contextuel, streaming SSE, suggestions intelligentes |
| **Planning** | Calendrier hebdomadaire, génération IA, sessions planifiées |
| **Ressources** | Recommandations IA (YouTube, Coursera, articles) |
| **Progression** | Tableau de bord avec graphiques, statistiques, niveau adaptatif |
| **Notifications** | Push + email, rappels examens (J-3, J-1), sessions du lendemain |
| **Paramètres** | Profil, préférences IA, thème clair/sombre |


## 🛠️ Stack

| Catégorie | Technologies |
|-----------|--------------|
| **Frontend** | React 19, Next.js 16, Tailwind CSS v4, Axios, Recharts |
| **Backend** | Node.js, Express, JWT, Bcrypt, Nodemailer, Multer |
| **Base de données** | PostgreSQL, pgAdmin |
| **IA** | Gemini API (@google/generative-ai ^0.24.1) |
| **Outils** | Git, GitHub, Postman, Docker |


## 📁 Structure rapide
backend/ → API REST (Node/Express)
frontend/ → App Next.js (App Router)
uploads/ → Fichiers importés

text


## ⚙️ Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/oussema-mhiri/ai-study-assistant.git
cd ai-study-assistant

cd backend && npm install
# Créer .env : PORT, DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, GOOGLE_CLIENT_ID, EMAIL_USER, EMAIL_APP_PASSWORD

cd ../frontend && npm install

npm run dev  # backend:5000 / frontend:3000
🧪 API principales
Module	Endpoints
Auth	POST /register, /login, /google, /request-reset-code, /verify-reset-code, /reset-password, GET /me
Matières	GET, POST /, PUT, DELETE /:id
Documents	POST /, GET /:matiereId, DELETE /:id
IA	POST /analyze, GET /analysis/:documentId
Quiz	POST /generate, /generate-true-false
Exercices	POST /generate, /check
Flashcards	POST /generate, GET /subject/:matiereId, GET /subject/:matiereId/due, POST /:id/review
Chatbot	POST /conversations/:id/chat, GET /subjects/:matiereId/suggestions
Planning	GET /sessions, POST /sessions, POST /generate, GET /notifications
Progression	GET /:matiereId, GET /adaptive-difficulty/:matiereId, POST /quiz-result
Dashboard	GET /overview
Ressources	GET /recommendations/:matiereId
👨‍💻 Auteur
Oussema Mhiri — stage d'été 2ème année — Encadré par Mme Rania Wannes (Mobelite)

📧 oussemamhiri963@gmail.com
🔗 GitHub


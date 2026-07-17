# 🎓 AI Study Assistant

## Assistant intelligent pour l'apprentissage universitaire

AI Study Assistant est une application web SaaS conçue pour accompagner les étudiants universitaires dans leur parcours académique. Elle intègre des fonctionnalités avancées d'intelligence artificielle pour analyser les cours, générer des résumés, des quiz, des exercices interactifs et des fiches de révision, tout en offrant un chatbot pédagogique et un planning intelligent.

Ce projet a été réalisé dans le cadre d'un stage d'été de 2ème année au sein de l'entreprise Mobelite, sous la supervision de Mme Rania Wannes.

Année universitaire : 2025 / 2026

---

## ✨ Fonctionnalités principales

- Auth : JWT, Google OAuth, réinitialisation OTP (6 chiffres)
- Matières : CRUD, organisation des cours
- Documents : upload PDF/DOCX/PPTX/images, extraction texte
- IA (Gemini) : résumés, points clés, définitions
- Quiz : QCM générés + correction interactive (vert/rouge)
- Exercices : QCM/ouvert, correction IA, feedback personnalisé
- Chatbot : assistant contextuel basé sur les documents
- Planning : calendrier hebdomadaire, suivi de progression
- Notifications : push + email, rappels examens
- Paramètres : profil, préférences IA, thème clair/sombre

---

## 🛠️ Stack

Frontend : React 18, Next.js 14, Tailwind CSS, Axios
Backend : Node.js, Express, JWT, Bcrypt, Nodemailer, Multer
Base de données : PostgreSQL, pgAdmin
IA : Gemini API
---

## 📁 Structure rapide

backend/ → API REST (Node/Express)
frontend/ → App Next.js (App Router)
uploads/ → Fichiers importés

---

## ⚙️ Installation

git clone https://github.com/oussema-mhiri/ai-study-assistant.git
cd ai-study-assistant

Backend :
cd backend && npm install
Créer un fichier .env avec : PORT, DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, EMAIL_*

Frontend :
cd ../frontend && npm install

Lancer :
npm run dev  # backend sur port 5000 / frontend sur port 3000

---

## 🧪 API principales

POST /api/auth/register → Inscription
POST /api/auth/login → Connexion
POST /api/auth/request-reset-code → Demande OTP
GET /api/subjects → Liste matières
POST /api/documents → Upload fichier
POST /api/ai/analyze → Analyse IA (résumé, points clés)
POST /api/quizzes/generate → Génération quiz
POST /api/exercises/generate → Génération exercices
POST /api/exercises/check → Correction exercice
POST /api/chatbot/message → Message chatbot

---

## 👨‍💻 Auteur

Oussema Mhiri — stage d'été 2ème année, encadré par Mme Rania Wannes

📧 oussemamhiri963@gmail.com
🔗 GitHub : https://github.com/oussema-mhiri/ai-study-assistant

---

🚀 Projet complet, fonctionnel et prêt pour la démonstration.

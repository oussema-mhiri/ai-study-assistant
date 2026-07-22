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
2. Backend
bash
cd backend
npm install
Créer un fichier .env :

env
PORT=5000
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/ai_study_assistant
JWT_SECRET=super_secret_jwt_key
GEMINI_API_KEY=votre_cle_api
GOOGLE_CLIENT_ID=votre_client_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=votre_client_id
EMAIL_USER=votre_email@gmail.com
EMAIL_APP_PASSWORD=votre_mot_de_passe
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
3. Frontend
bash
cd ../frontend
npm install
4. Lancer l'application
bash
# Backend (port 5000)
npm run dev

# Frontend (port 3000)
npm run dev
🧪 API principales
Authentification (/api/auth)
Méthode	Endpoint	Description
POST	/register	Inscription
POST	/login	Connexion
POST	/google	Google OAuth
POST	/request-reset-code	Demande OTP
POST	/verify-reset-code	Vérification OTP
POST	/reset-password	Réinitialisation
GET	/me	Profil utilisateur
Matières (/api/subjects)
Méthode	Endpoint	Description
GET	/	Liste des matières
POST	/	Créer une matière
PUT	/:id	Modifier une matière
DELETE	/:id	Supprimer une matière
Documents (/api/documents)
Méthode	Endpoint	Description
POST	/	Upload fichier
GET	/:matiereId	Liste par matière
DELETE	/:id	Supprimer
IA (/api/ai)
Méthode	Endpoint	Description
POST	/analyze	Analyse complète
GET	/analysis/:documentId	Récupérer analyse
Quiz (/api/quizzes)
Méthode	Endpoint	Description
POST	/generate	Générer QCM + Vrai/Faux
POST	/generate-true-false	Générer Vrai/Faux
Exercices (/api/exercises)
Méthode	Endpoint	Description
POST	/generate	Générer exercices
POST	/check	Correction IA
Flashcards (/api/flashcards)
Méthode	Endpoint	Description
POST	/generate	Générer flashcards
GET	/subject/:matiereId	Liste par matière
GET	/subject/:matiereId/due	Flashcards à réviser
POST	/:id/review	Enregistrer révision
Chatbot (/api/chatbot)
Méthode	Endpoint	Description
POST	/conversations/:id/chat	Envoyer message
GET	/subjects/:matiereId/suggestions	Suggestions IA
Planning (/api/planning)
Méthode	Endpoint	Description
GET	/sessions	Liste sessions
POST	/sessions	Créer session
POST	/generate	Génération IA
GET	/notifications	Notifications
Progression (/api/progress)
Méthode	Endpoint	Description
GET	/:matiereId	Progression par matière
GET	/adaptive-difficulty/:matiereId	Niveau adaptatif
POST	/quiz-result	Sauvegarder résultat
Dashboard (/api/dashboard)
Méthode	Endpoint	Description
GET	/overview	Vue d'ensemble
Ressources (/api/resources)
Méthode	Endpoint	Description
GET	/recommendations/:matiereId	Recommandations IA
👨‍💻 Auteur
Oussema Mhiri — stage d'été 2ème année
Encadré par Mme Rania Wannes — Mobelite

📧 oussemamhiri963@gmail.com
🔗 GitHub


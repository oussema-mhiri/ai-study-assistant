🎓 AI Study Assistant
Assistant intelligent pour l'apprentissage universitaire

AI Study Assistant est une application web SaaS conçue pour accompagner les étudiants universitaires dans leur parcours académique. Elle intègre des fonctionnalités avancées d'intelligence artificielle pour analyser les cours, générer des résumés, des quiz, des exercices interactifs, des flashcards et un planning de révision intelligent, tout en offrant un chatbot pédagogique contextuel.

Ce projet a été réalisé dans le cadre d'un stage d'été de 2ème année au sein de l'entreprise Mobelite, sous la supervision de Mme Rania Wannes.

Année universitaire : 2025 / 2026


✨ Fonctionnalités principales

Authentification : JWT, Google OAuth, réinitialisation OTP (6 chiffres)
Matières : CRUD, organisation des cours, couleur personnalisable, date d'examen
Documents : Upload PDF/DOCX/PPTX/images, extraction texte, analyse IA
IA (Gemini) : Résumés, points clés, définitions, analyse d'images, génération planning
Quiz : QCM, Vrai/Faux, correction interactive (vert/rouge), score
Exercices : QCM, Vrai/Faux, questions ouvertes, questions à trous, correction IA
Flashcards : Génération IA, répétition espacée (SM-2), catégories
Chatbot : Assistant contextuel, streaming SSE, suggestions intelligentes
Planning : Calendrier hebdomadaire, génération IA, sessions planifiées
Ressources : Recommandations IA (YouTube, Coursera, articles)
Progression : Tableau de bord avec graphiques, statistiques, niveau adaptatif
Notifications : Push + email, rappels examens (J-3, J-1), sessions du lendemain
Paramètres : Profil, préférences IA, thème clair/sombre


🛠️ Stack

Frontend : React 19, Next.js 16, Tailwind CSS v4, Axios, Recharts
Backend : Node.js, Express, JWT, Bcrypt, Nodemailer, Multer
Base de données : PostgreSQL, pgAdmin
IA : Gemini API (@google/generative-ai ^0.24.1)
Outils : Git, GitHub, Postman, Docker


📁 Structure rapide

backend/ → API REST (Node/Express)
frontend/ → App Next.js (App Router)
uploads/ → Fichiers importés


⚙️ Installation

git clone https://github.com/oussema-mhiri/ai-study-assistant.git
cd ai-study-assistant

Backend :
cd backend && npm install

Créer un fichier .env :

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

Frontend :
cd ../frontend && npm install

Lancer :
npm run dev  # backend sur port 5000 / frontend sur port 3000


🧪 API principales

Auth (/api/auth) : POST /register | POST /login | POST /google | POST /request-reset-code | POST /verify-reset-code | POST /reset-password | GET /me

Matières (/api/subjects) : GET / | POST / | PUT /:id | DELETE /:id

Documents (/api/documents) : POST / | GET /:matiereId | DELETE /:id

IA (/api/ai) : POST /analyze | GET /analysis/:documentId

Quiz (/api/quizzes) : POST /generate | POST /generate-true-false

Exercices (/api/exercises) : POST /generate | POST /check

Flashcards (/api/flashcards) : POST /generate | GET /subject/:matiereId | GET /subject/:matiereId/due | POST /:id/review

Chatbot (/api/chatbot) : POST /conversations/:id/chat | GET /subjects/:matiereId/suggestions

Planning (/api/planning) : GET /sessions | POST /sessions | POST /generate | GET /notifications

Progression (/api/progress) : GET /:matiereId | GET /adaptive-difficulty/:matiereId | POST /quiz-result

Dashboard (/api/dashboard) : GET /overview

Ressources (/api/resources) : GET /recommendations/:matiereId


👨‍💻 Auteur

Oussema Mhiri — stage d'été 2ème année, encadré par Mme Rania Wannes

📧 oussemamhiri963@gmail.com
🔗 GitHub : https://github.com/oussema-mhiri/ai-study-assistant

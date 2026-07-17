# 🎓 AI Study Assistant

Assistant intelligent pour l'apprentissage universitaire — stage d'été 2ème année chez Mobelite (2026).

---

## ✨ Fonctionnalités principales

- **Auth** : JWT, Google OAuth, réinitialisation OTP (6 chiffres)
- **Matières** : CRUD, organisation des cours
- **Documents** : upload PDF/DOCX/PPTX/images, extraction texte
- **IA (Gemini)** : résumés, points clés, définitions
- **Quiz** : QCM générés + correction interactive (vert/rouge)
- **Exercices** : QCM/ouvert, correction IA, feedback personnalisé
- **Chatbot** : assistant contextuel basé sur les documents
- **Planning** : calendrier hebdomadaire, suivi de progression
- **Notifications** : push + email, rappels examens
- **Paramètres** : profil, préférences IA, thème clair/sombre

---

## 🛠️ Stack

| Frontend | Backend | Base de données | IA |
|----------|---------|-----------------|-----|
| Next.js 14 | Node.js / Express | PostgreSQL | Gemini API |
| Tailwind CSS | JWT / Bcrypt | pgAdmin | - |
| Axios | Nodemailer / Multer | - | - |

---

## 📁 Structure rapide
backend/ → API REST (Node/Express)
frontend/ → App Next.js (App Router)
uploads/ → Fichiers importés


---

## ⚙️ Installation

```bash
git clone https://github.com/oussema-mhiri/ai-study-assistant.git
cd ai-study-assistant

# Backend
cd backend && npm install
# .env : PORT, DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, EMAIL_*

# Frontend
cd ../frontend && npm install

# Lancer
npm run dev  # backend:5000 / frontend:3000
🧪 API principales
Endpoint	Description
POST /api/auth/register	Inscription
POST /api/auth/login	Connexion
POST /api/auth/request-reset-code	Demande OTP
GET /api/subjects	Liste matières
POST /api/documents	Upload fichier
POST /api/ai/analyze	Analyse IA (résumé, points clés)
POST /api/quizzes/generate	Génération quiz
POST /api/exercises/generate	Génération exercices
POST /api/exercises/check	Correction exercice
POST /api/chatbot/message	Message chatbot
👨‍💻 Auteur
Oussema Mhiri — stage d'été 2ème année, encadré par Mme Rania Wannes

📧 oussemamhiri963@gmail.com
🔗 GitHub

🚀 Projet complet, fonctionnel et prêt pour la démonstration.


## ✅ Ce qui a été supprimé

| Section | Action |
|---------|--------|
| Objectifs détaillés | ✅ Résumés en une ligne |
| Tableau des technologies | ✅ Fusionné en une liste compacte |
| Architecture détaillée | ✅ Remplacée par une structure rapide |
| Diagramme de classes | ✅ Supprimé |
| Design System | ✅ Supprimé |
| Workflow Git | ✅ Supprimé |
| Calendrier de développement | ✅ Supprimé |
| Licence | ✅ Supprimée |

---

**Ce README tient sur une page et contient l'essentiel pour comprendre le projet, l'installer et l'utiliser.** 🚀

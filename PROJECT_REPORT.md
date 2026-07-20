# Rapport du projet : AI Study Assistant

---

## 1. Introduction

- **Nom du projet** : AI Study Assistant
- **Objectif** : Application web SaaS conçue pour accompagner les étudiants universitaires dans leur parcours académique. Elle intègre des fonctionnalités avancées d'intelligence artificielle pour analyser les cours, générer des résumés, des quiz, des exercices interactifs et des fiches de révision, tout en offrant un chatbot pédagogique et un planning intelligent.
- **Contexte** : Projet réalisé dans le cadre d'un stage d'été de 2ème année au sein de l'entreprise **Mobelite**, sous la supervision de **Mme Rania Wannes**.
- **Auteur** : Oussema Mhiri (`oussemamhiri963@gmail.com`)
- **Année universitaire** : 2025 / 2026

---

## 2. Technologies utilisées

### Frontend
| Technologie | Version | Rôle |
|---|---|---|
| React | 19.2.4 | Bibliothèque UI |
| Next.js | 16.2.10 | Framework React (App Router) |
| Tailwind CSS | v4 | Framework CSS utility-first |
| Axios | 1.18.1 | Client HTTP |
| Lucide React | 1.24.0 | Icônes |
| react-hot-toast | 2.6.0 | Notifications toast |
| @react-oauth/google | 0.13.5 | Authentification Google OAuth |

### Backend
| Technologie | Version | Rôle |
|---|---|---|
| Node.js | — | Runtime JavaScript |
| Express | 5.2.1 | Framework web |
| PostgreSQL (pg) | 8.22.0 | Client PostgreSQL |
| jsonwebtoken | 9.0.3 | Authentification JWT |
| bcryptjs | 3.0.3 | Hachage des mots de passe |
| Multer | 2.2.0 | Upload de fichiers |
| Nodemailer | 9.0.3 | Envoi d'e-mails |
| express-rate-limit | 8.6.0 | Rate limiting |

### Intelligence Artificielle
| Technologie | Rôle |
|---|---|
| Google Gemini API (`@google/generative-ai` 0.24.1) | Génération de résumés, quiz, exercices, chatbot, suggestions, analyse d'images |

### Extraction de texte
| Technologie | Format supporté |
|---|---|
| `pdf-parse` | PDF |
| `mammoth` | DOCX |
| `adm-zip` + `xml2js` | PPTX |
| Gemini Vision | Images (JPG, PNG) |

### Outils & DevOps
| Outil | Rôle |
|---|---|
| Nodemon | Hot reload en développement |
| pgAdmin | Administration PostgreSQL |
| Postman | Tests d'API |
| Ethereal (Nodemailer) | Tests d'e-mails en dev |

---

## 3. Architecture générale

Le projet suit une architecture **client-serveur classique** en couches :

```
+----------------------------------------------------------+
|                     FRONTEND (Client)                     |
|   Next.js 16 (App Router) -- Port 3000                  |
|   +--------------+  +-------------+  +---------------+   |
|   |  Pages App   |  | Context API |  |  lib/api.js   |   |
|   |  (React 19)  |  | (Auth/Chat) |  |  (Axios)      |   |
|   +-------+------+  +-------------+  +-------+-------+   |
+----------+-------------------------------+--------------+
           |  HTTP (REST + SSE)             |
           v                                v
+----------------------------------------------------------+
|                     BACKEND (Serveur)                      |
|   Node.js + Express 5 -- Port 5000                        |
|   +-----------+  +---------------+  +------------------+  |
|   |  Routes   |-> | Controllers  |-> |    Services      |  |
|   |  (API)    |  |               |  | (Gemini, Email,  |  |
|   +-----------+  +---------------+  |  Extract, Cron)  |  |
|                                      +------------------+  |
|   +-----------+  +---------------+                        |
|   |Middleware |  |   Models      |                        |
|   |  (JWT)    |  |  (PostgreSQL) |                        |
|   +-----------+  +-------+-------+                        |
+--------------------------+-------------------------------+
                           |
                           v
+----------------------------------------------------------+
|                  BASE DE DONNEES                           |
|   PostgreSQL -- 11 tables                                |
|   (users, matieres, documents, resumes, quizs,           |
|    questions, quiz_results, conversations, messages,      |
|    sessions_planning, notifications)                      |
+----------------------------------------------------------+
                           |
                           v
+----------------------------------------------------------+
|              SERVICES EXTERNES                             |
|   Google Gemini API (IA) -- Nodemailer (Email SMTP)      |
+----------------------------------------------------------+
```

---

## 4. Structure des dossiers

### Backend (`backend/`)

```
backend/
+-- package.json                    # Dependances backend
+-- src/
|   +-- app.js                      # Point d'entree Express (middleware, routes, demarrage)
|   +-- config/
|   |   +-- db.js                   # Pool PostgreSQL (connexion via DATABASE_URL)
|   |   +-- initDb.js               # Creation automatique des tables + migrations
|   +-- middleware/
|   |   +-- auth.js                 # Middleware JWT (verifie le token Bearer)
|   +-- models/                     # Modeles de donnees (12 fichiers)
|   |   +-- User.js                 # Utilisateurs (CRUD, Google OAuth, reset OTP, profil)
|   |   +-- Matiere.js              # Matieres (CRUD, documents_count)
|   |   +-- Document.js             # Documents uploades (CRUD, lien matiere)
|   |   +-- Resume.js               # Resumes IA (court, detaille, points cles, definitions)
|   |   +-- Quiz.js                 # Quiz (CRUD, questions聚合)
|   |   +-- Question.js             # Questions de quiz (CRUD, batch insert)
|   |   +-- QuizResult.js           # Resultats de quiz (stats par matiere/quiz)
|   |   +-- Conversation.js         # Conversations chatbot (CRUD)
|   |   +-- Message.js              # Messages de chat (create, findByConversation)
|   |   +-- Notification.js         # Notifications in-app (CRUD, unread count)
|   |   +-- SessionPlanning.js      # Sessions de revision (CRUD, findTomorrow)
|   +-- controllers/                # Logique metier (9 fichiers)
|   |   +-- authController.js       # Inscription, connexion, Google OAuth, reset OTP, profil
|   |   +-- subjectController.js    # CRUD matieres
|   |   +-- documentController.js   # Upload Multer, CRUD documents
|   |   +-- aiController.js         # Analyse IA de documents (resumes, points cles)
|   |   +-- quizController.js       # Generation de quiz via Gemini
|   |   +-- exerciseController.js   # Generation + correction d'exercices via Gemini
|   |   +-- chatbotController.js    # Chatbot SSE streaming avec contexte documents
|   |   +-- progressController.js   # Dashboard de progression + analyse IA
|   |   +-- planningController.js   # Sessions calendrier + generation planning IA + notifications
|   +-- routes/                     # Routes API REST (9 fichiers)
|   |   +-- authRoutes.js
|   |   +-- subjectRoutes.js
|   |   +-- documentRoutes.js
|   |   +-- aiRoutes.js
|   |   +-- quizRoutes.js
|   |   +-- exerciseRoutes.js
|   |   +-- chatbotRoutes.js
|   |   +-- progressRoutes.js
|   |   +-- planningRoutes.js
|   +-- services/                   # Services metier (5 fichiers)
|       +-- geminiService.js        # Wrapper Gemini API (resumes, quiz, exercices, chatbot streaming)
|       +-- analysisService.js      # Pipeline d'analyse : extraction -> Gemini -> stockage
|       +-- extractService.js       # Extraction de texte (PDF, DOCX, PPTX, images)
|       +-- emailService.js         # Envoi d'e-mails (Gmail prod / Ethereal dev)
|       +-- cronService.js          # Rappels automatiques (toutes les heures)
+-- uploads/                        # Fichiers uploades (PDF, DOCX, images)
```

### Frontend (`frontend/`)

```
frontend/
+-- package.json                    # Dependances frontend
+-- app/
|   +-- layout.tsx                  # Layout racine (AuthProvider, ChatProvider, GoogleOAuth, Theme)
|   +-- page.tsx                    # Page d'accueil Next.js (template par defaut)
|   +-- globals.css                 # Styles globaux Tailwind
|   +-- (auth)/                     # Pages d'authentification (route group)
|   |   +-- login/page.js           # Connexion (email/mot de passe + Google OAuth)
|   |   +-- register/page.js        # Inscription (nom, email, mdp, universite, faculte)
|   |   +-- forgot-password/page.js # Demande de code OTP (email)
|   |   +-- verify-code/page.js     # Verification du code OTP (6 chiffres)
|   |   +-- reset-password/page.js  # Nouveau mot de passe (token temporaire)
|   +-- dashboard/page.js           # Tableau de bord (stats, raccourcis, apercu matieres)
|   +-- matieres/page.js            # Gestion des matieres + upload docs + IA + quiz + exercices
|   +-- chatbot/page.js             # Chatbot IA (SSE streaming, historique, suggestions)
|   +-- planning/page.js            # Progression + Calendrier + Planning IA (3 onglets)
|   +-- notifications/page.js       # Centre de notifications (parametres + historique)
|   +-- parametres/page.js          # Parametres (profil, preferences IA, theme)
+-- context/
|   +-- AuthContext.js               # Contexte d'authentification (login, register, Google, logout)
|   +-- ChatContext.js               # Contexte chatbot (conversations, messages, streaming SSE)
+-- lib/
|   +-- api.js                       # Instance Axios configuree (baseURL + interceptor JWT)
+-- components/
|   +-- Sidebar.js                   # Composant de navigation laterale
+-- public/
    +-- image/                       # Images (Login.png, register.png)
```

---

## 5. Fonctionnalites detaillees

### 5.1 Authentification

**Backend :** `authController.js`, `auth.js` (middleware), `authRoutes.js`

- **Inscription** classique (nom, email, mot de passe, universite, faculte, niveau, filiere)
- **Connexion** par email/mot de passe avec validation bcrypt
- **Google OAuth 2.0** : verification du token Google, creation automatique de compte ou liaison avec un compte existant (même email)
- **Reinitialisation de mot de passe** en 3 etapes :
  1. Demande de code OTP (6 chiffres) envoye par e-mail
  2. Verification du code OTP (valide 5 minutes)
  3. Reinitialisation via token JWT temporaire
- **JWT** : token signe avec `JWT_SECRET`, expiration 7 jours, stocke dans `localStorage`
- **Rate limiting** : 10 requetes/15 min pour l'auth, 100 requetes/15 min globalement
- **Middleware d'authentification** : verifie le header `Authorization: Bearer <token>` sur les route protegees

**Frontend :** `AuthContext.js`, pages `(auth)/*`

- Gestion de l'etat utilisateur via React Context
- Persistance de la session au rechargement (appel `GET /auth/me`)
- Interface responsive avec illustrations
- Redirection automatique vers `/dashboard` apres connexion
- Toast de notification pour succes/erreurs

### 5.2 Gestion des matieres

**Backend :** `subjectController.js`, `Matiere.js` model

- **CRUD complet** : creation, lecture, mise a jour, suppression
- Chaque matiere possede : nom, description, date d'examen, couleur personnalisable
- Comptage automatique du nombre de documents par matiere (`LEFT JOIN documents`)
- Isolation par utilisateur (chaque utilisateur ne voit que ses propres matieres)

**Frontend :** `matieres/page.js`

- Selection visuelle par tags colores
- Formulaire d'ajout rapide
- Interface de gestion integree avec upload de documents

### 5.3 Import et analyse de documents

**Backend :** `documentController.js`, `aiController.js`, `analysisService.js`, `extractService.js`

- **Upload** via Multer (max 50 Mo) : PDF, DOCX, PPTX, JPG, PNG
- **Extraction de texte** :
  - PDF -> `pdf-parse`
  - DOCX -> `mammoth`
  - PPTX -> `adm-zip` + `xml2js` (parsage XML des slides)
  - Images -> Analyse via Gemini Vision
- **Analyse IA** (pipeline `analysisService.js`) :
  1. Extraction du texte du fichier
  2. Generation de 4 types d'analyses via Gemini en parallele :
     - Resume court (2-3 phrases)
     - Resume detaille (5-6 phrases)
     - Points cles (liste de 5 elements)
     - Definitions (JSON [{terme, definition}])
  3. Stockage des resultats en base (table `resumes`)
- **Recuperation de l'analyse** : `GET /ai/analysis/:documentId`

**Frontend :** `matieres/page.js`

- Zone de drag-and-drop pour l'upload
- Affichage des resultats IA en 4 cartes (resume court/detaille, points cles, definitions)
- Possibilite de revoir l'analyse d'un document deja analyse

### 5.4 Chatbot IA

**Backend :** `chatbotController.js`, `geminiService.js`

- **Conversations** : creation, historique, suppression par matiere
- **Contexte** : le chatbot utilise le texte extrait des documents de la matiere (ou d'un document specifique) comme contexte pour Gemini
- **Streaming SSE** (Server-Sent Events) : les reponses de l'IA sont envoyees en temps reel via un flux HTTP
- **Historique** : les 10 derniers messages sont inclus dans le prompt pour maintenir la coherence
- **Support image** : envoi d'images en base64 pour analyse visuelle
- **Suggestions intelligentes** : generation de 3 questions pertinentes basees sur les documents via Gemini
- **Limite de contexte** : 40 000 caracteres max pour eviter la saturation du prompt
- **Modele utilise** : `gemini-3.1-flash-lite`

**Frontend :** `ChatContext.js`, `chatbot/page.js`

- Interface de chat type messagerie avec bulles utilisateur/IA
- Barre laterale d'historique des conversations
- Selecteur de matiere et de document pour le contexte
- Affichage du statut "Redaction en direct" pendant le streaming
- Support de l'envoi d'images (apercu, suppression)
- Rendu markdown simplifie (gras, code, listes)
- Suggestions de questions au demarrage d'une conversation vide

### 5.5 Quiz et exercices

**Backend :** `quizController.js`, `exerciseController.js`, `geminiService.js`

**Quiz :**
- Generation de QCM via Gemini a partir d'un document
- Parametres : nombre de questions (1-50), difficulte (Facile/Moyen/Difficile)
- Stockage en base : quiz + questions avec options JSONB
- Format de sortie : questions avec 4 propositions (A, B, C, D) et reponse correcte

**Exercices :**
- Generation d'exercices QCM ou questions ouvertes via Gemini
- Parametres : nombre d'exercices (1-20), difficulte
- **Correction IA** : soumission des reponses a Gemini pour evaluation avec feedback personnalise
- Fallback : comparaison directe pour les QCM si parsing JSON echoue

**Frontend :** `matieres/page.js`

- Interface de quiz interactive avec selection de reponses par radio buttons
- Correction visuelle vert/rouge apres soumission
- Affichage du score (nombre correct / total, pourcentage)
- Possibilite de revoir les erreurs
- Interface d'exercices avec support QCM et questions ouvertes
- Feedback de correction affiche pour chaque exercice

### 5.6 Planning de revision

**Backend :** `planningController.js`, `SessionPlanning.js` model

- **CRUD des sessions** : creation, lecture (par mois/annee), mise a jour, suppression
- Types de session : QCM, Lecture, Chatbot, Revision
- Attributs : date, heure de debut, duree (minutes), statut (planifie/complete)
- **Generation IA du planning** : envoi du contexte (matiere, date examen, jours restants, disponibilite) a Gemini qui retourne un planning optimise en JSON
- **Notifications automatiques** : a la creation d'une session, une notification in-app est generee

**Frontend :** `planning/page.js`

- **3 onglets** :
  1. **Progression** : score de maitrise (pondere : documents 30pts + quiz 50pts + chatbot 20pts), statistiques par categorie, analyse IA personnalisee
  2. **Calendrier** : vue mensuelle interactive, detail des sessions par jour, creation/suppression de sessions
  3. **Planning IA** : formulaire de generation (matiere, date examen, disponibilite quotidienne), affichage du planning genere avec possibilite d'ajout au calendrier

### 5.7 Progression

**Backend :** `progressController.js`, `QuizResult.js` model

- **Dashboard de progression** par matiere incluant :
  - Nombre de documents, quiz, questions
  - Statistiques QCM (taux de reussite, reponses correctes)
  - Statistiques chatbot (conversations, messages)
  - Score de maitrise global (0-100%)
  - Estimation du temps restant
  - Analyse IA personnalisee (Gemini genere un conseil)
- **Enregistrement des resultats** de quiz : sauvegarde des reponses individuelles avec statut correct/incorrect
- **Statistiques** : taux de reussite par matiere et par quiz

**Frontend :** `planning/page.js` (onglet Progression)

- Graphique circulaire (donut) du score de maitrise
- Cartes statistiques avec icones colorees
- Barres de progression par categorie
- Bloc d'analyse IA avec conseils personnalises

### 5.8 Notifications

**Backend :** `planningController.js` (route `getNotifications`, `markNotifRead`), `Notification.js` model, `cronService.js`

- **Notifications in-app** : creation automatique (rappels, sessions planifiees)
- Marquage lu/non-lu (individuel ou toutes)
- **Cron service** : verification toutes les heures des sessions du lendemain
  - Envoi de notification in-app
  - Envoi d'e-mail de rappel (format HTML)
- Types de notifications : rappel, planning, systeme

**Frontend :** `notifications/page.js`

- Parametres de notifications (push, email, frequence)
- Liste des notifications recentes avec statut lu/non-lu
- Interface de configuration des rappels

### 5.9 Parametres utilisateur

**Backend :** `authController.js` (updateProfile, updatePreferences)

- **Profil** : nom, email (lecture), universite, faculte, niveau d'etudes, filiere (edition)
- **Preferences IA** : niveau d'explication (Simple/Moyen/Avance), mode de reponse (Court/Detaille/Personnalise)
- **Theme** : mode clair/sombre (persiste dans localStorage + classe `dark` sur `<html>`)

**Frontend :** `parametres/page.js`

- Section profil avec champs editables
- Section preferences IA avec boutons radio
- Toggles pour theme sombre, notifications push, emails de resume
- Sauvegarde via `PUT /auth/profile` et `PUT /auth/preferences`

---

## 6. Base de donnees

### Tables principales (PostgreSQL)

| Table | Description | Colonnes principales |
|---|---|---|
| `users` | Utilisateurs | id, full_name, email, password_hash, google_id, university, faculty, study_level, major, ia_level, response_mode, reset_token, reset_token_expires, created_at, updated_at |
| `matieres` | Matieres de l'etudiant | id, nom, description, user_id (FK->users), date_examen, couleur, created_at, updated_at |
| `documents` | Fichiers uploades | id, nom_fichier, type, url, matiere_id (FK->matieres), user_id (FK->users), uploaded_at |
| `resumes` | Analyses IA des documents | id, type (court/detaillé/points_cles/definitions), contenu, document_id (FK->documents), created_at |
| `quizs` | Quiz generes | id, titre, niveau, matiere_id (FK->matieres), user_id (FK->users), created_at |
| `questions` | Questions de quiz | id, contenu, type (qcm/ouverte), bonne_reponse, options (JSONB), quiz_id (FK->quizs), created_at |
| `quiz_results` | Reponses aux quiz | id, user_id (FK->users), quiz_id (FK->quizs), question_id (FK->questions), reponse_donnee, est_correct, answered_at |
| `conversations` | Sessions chatbot | id, user_id (FK->users), matiere_id (FK->matieres), document_id (FK->documents), titre, created_at, updated_at |
| `messages` | Messages de chat | id, conversation_id (FK->conversations), sender (user/ia), content, created_at |
| `sessions_planning` | Sessions de revision | id, user_id (FK->users), matiere_id (FK->matieres), date_session, heure_debut, duree_minutes, type, titre, statut, created_at |
| `notifications` | Notifications in-app | id, user_id (FK->users), titre, message, type, lue, created_at |

### Relations entre les tables

```
users ---+--- matieres ---+--- documents ------- resumes
         |                |--- quizs ------- questions
         |                |--- conversations --- messages
         |                |--- sessions_planning
         |--- quiz_results (-> quizs, questions)
         |--- notifications
         |--- (google_id pour OAuth)
```

- **`users`** : table centrale, toutes les autres tables sont liees via `user_id` avec `ON DELETE CASCADE`
- **`matieres`** : organisent les documents, quiz, conversations et sessions
- **`documents`** : lies a une matiere, analyses pour produire des `resumes`
- **`quizs`** -> **`questions`** : relation un a plusieurs
- **`conversations`** -> **`messages`** : relation un a plusieurs
- **`quiz_results`** : table de jointure entre users, quizs et questions pour le suivi

---

## 7. APIs principales

### Authentification
| Methode | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Inscription | Non |
| POST | `/api/auth/login` | Connexion | Non |
| POST | `/api/auth/google` | Connexion Google OAuth | Non |
| POST | `/api/auth/request-reset-code` | Demande de code OTP | Non |
| POST | `/api/auth/verify-reset-code` | Verification du code OTP | Non |
| POST | `/api/auth/reset-password` | Reinitialisation du mot de passe | Non |
| GET | `/api/auth/me` | Profil utilisateur connecte | Oui |
| PUT | `/api/auth/profile` | Mise a jour du profil | Oui |
| PUT | `/api/auth/preferences` | Mise a jour des preferences IA | Oui |

### Matieres
| Methode | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/subjects` | Liste des matieres | Oui |
| POST | `/api/subjects` | Creer une matiere | Oui |
| PUT | `/api/subjects/:id` | Modifier une matiere | Oui |
| DELETE | `/api/subjects/:id` | Supprimer une matiere | Oui |

### Documents
| Methode | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/documents` | Upload d'un document | Oui |
| GET | `/api/documents/:matiereId` | Documents d'une matiere | Oui |
| DELETE | `/api/documents/:id` | Supprimer un document | Oui |

### Intelligence Artificielle
| Methode | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/ai/analyze` | Analyser un document (resumes, points cles, definitions) | Oui |
| GET | `/api/ai/analysis/:documentId` | Recuperer l'analyse d'un document | Oui |

### Quiz
| Methode | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/quizzes/generate` | Generer un quiz a partir d'un document | Oui |

### Exercices
| Methode | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/exercises/generate` | Generer des exercices | Oui |
| POST | `/api/exercises/check` | Corriger des exercices via IA | Oui |

### Chatbot
| Methode | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/chatbot/subjects/:matiereId/conversations` | Conversations d'une matiere | Oui |
| POST | `/api/chatbot/conversations` | Creer une conversation | Oui |
| GET | `/api/chatbot/conversations/:id/messages` | Messages d'une conversation | Oui |
| DELETE | `/api/chatbot/conversations/:id` | Supprimer une conversation | Oui |
| POST | `/api/chatbot/conversations/:id/chat` | Envoyer un message (SSE streaming) | Oui |
| GET | `/api/chatbot/subjects/:matiereId/suggestions` | Suggestions intelligentes | Oui |

### Progression
| Methode | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/progress/:matiereId` | Dashboard de progression complet | Oui |
| POST | `/api/progress/quiz-result` | Enregistrer les resultats d'un quiz | Oui |

### Planning & Notifications
| Methode | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/planning/sessions` | Sessions du mois (query: month, year) | Oui |
| POST | `/api/planning/sessions` | Creer une session | Oui |
| PATCH | `/api/planning/sessions/:id` | Modifier une session | Oui |
| DELETE | `/api/planning/sessions/:id` | Supprimer une session | Oui |
| POST | `/api/planning/generate` | Generer un planning IA | Oui |
| GET | `/api/planning/notifications` | Notifications + count non lues | Oui |
| PATCH | `/api/planning/notifications/:id/read` | Marquer comme lu (`id=all` pour tout) | Oui |

### Routes de test
| Methode | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/test` | Test de l'API | Non |
| GET | `/api/test-gemini` | Test de connexion Gemini | Non |
| POST | `/api/test-summary` | Test de resume IA | Non |

---

## 8. Conclusion

### Bilan du projet

**AI Study Assistant** est une application web complete et fonctionnelle qui integre de maniere coherente l'intelligence artificielle (Google Gemini) dans un workflow d'apprentissage universitaire. Le projet couvre l'ensemble du parcours etudiant :

- **Organisation** : matieres, documents, planning
- **Apprentissage actif** : quiz, exercices, chatbot contextuel
- **Suivi** : progression chiffree, analyse IA, notifications
- **Experience utilisateur** : interface moderne (Tailwind), theme sombre, streaming en temps reel

Le stack technique est moderne et coherent (React 19, Next.js 16, Express 5, PostgreSQL, Gemini API). L'architecture en couches (routes -> controllers -> services -> models) assure une bonne separation des responsabilites. Le pipeline d'analyse IA (extraction -> Gemini -> stockage) est bien structure et supporte multiples formats de fichiers.

### Pistes d'amelioration

1. **Tests unitaires et d'integration** : ajouter des tests pour les controllers, services et modeles (Jest, Supertest)
2. **Validation des entrees** : renforcer la validation cote serveur avec une library comme Joi ou Zod
3. **Securite** : ajouter du HTTPS, sanitizer le contenu HTML, renforcer la gestion des erreurs
4. **Performance** : mise en cache des analyses IA, pagination des resultats, optimisation des requetes
5. **Deploiement** : Dockeriser l'application, configurer CI/CD, deployer sur un cloud (Vercel + Railway/Render)
6. **Notifications push** : implementer les vraies notifications push (Service Workers) au-dela des notifications in-app
7. **Collaboration** : partage de documents et de quiz entre etudiants
8. **Application mobile** : React Native ou PWA pour un acces mobile
9. **Mode hors-ligne** : cache des cours et quiz pour une utilisation sans connexion
10. **Analytics** : tableau de bord d'utilisation pour suivre les habitudes d'etude

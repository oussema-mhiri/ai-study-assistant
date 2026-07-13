# 🎓 AI Study Assistant

## Assistant Intelligent pour l'Apprentissage Universitaire

---

## 📌 Présentation du projet

**AI Study Assistant** est une application web SaaS conçue pour accompagner les étudiants universitaires dans leur parcours académique. Elle intègre des fonctionnalités avancées d'intelligence artificielle pour analyser les cours, générer des résumés, des quiz et des fiches de révision, tout en offrant un chatbot pédagogique et un planning intelligent.

Ce projet a été réalisé dans le cadre d'un **stage de fin d'études** au sein de l'entreprise **Mobelite**, sous la supervision de **Mme Rania Wannes**.

**Année universitaire** : 2025 / 2026

---

## 🎯 Objectifs du projet

- **Faciliter la compréhension** des cours grâce à l'IA
- **Générer automatiquement** des résumés, fiches de révision et quiz
- **Offrir un chatbot pédagogique** pour répondre aux questions des étudiants
- **Organiser les révisions** avec un planning intelligent personnalisé
- **Suivre la progression** de l'étudiant dans chaque matière
- **Envoyer des rappels** avant les examens
- **Recommander** des ressources pédagogiques adaptées

---

## 🚀 Fonctionnalités principales

### 🔐 Authentification et gestion des comptes
- Inscription et connexion sécurisées (JWT)
- Connexion via Google OAuth 2.0
- Réinitialisation du mot de passe par code OTP à 6 chiffres (sécurisé, valable 5 minutes)
- Protection des routes côté backend et frontend

### 📚 Gestion des matières
- Création et sélection de matières
- Organisation des cours par matière
- Liaison entre documents et matières

### 📄 Importation et analyse de documents
- Upload de fichiers (PDF, DOCX, PPTX, images)
- Extraction automatique du texte
- Génération de résumés (court et détaillé)
- Détection des concepts clés et définitions importantes

### 🤖 Chatbot pédagogique
- Assistance IA basée sur les documents importés
- Explications, résumés, exemples et reformulations
- Réponses contextuelles et personnalisées

### ❓ Quiz intelligents
- Génération automatique de QCM, Vrai/Faux, questions ouvertes
- Adaptation du niveau de difficulté selon les performances
- Correction et analyse des résultats

### 📅 Planning de révision
- Planification automatique basée sur les examens
- Sessions de révision optimisées (durée, type d'activité)
- Calendrier hebdomadaire interactif

### 📊 Suivi de progression
- Graphiques de progression par matière
- Statistiques détaillées (quiz réussis, temps passé, etc.)
- Recommandations IA personnalisées

### 🔔 Notifications et rappels
- Notifications push dans l'application
- Rappels par email avant les examens
- Alertes de retard et suggestions de révision

### ⚙️ Paramètres utilisateur
- Gestion du profil (université, faculté, filière, etc.)
- Préférences IA (niveau d'explication, mode de réponse)
- Thème clair/sombre et langue de l'application

---

## 🛠️ Technologies utilisées

### Frontend
| Technologie | Utilisation |
|-------------|-------------|
| **Next.js 14** | Framework React avec App Router |
| **Tailwind CSS** | Design system moderne et responsive |
| **Lucide React** | Icônes personnalisées |
| **Axios** | Client HTTP pour les appels API |
| **React Hook Form** | Gestion et validation des formulaires |
| **React Hot Toast** | Notifications utilisateur |

### Backend
| Technologie | Utilisation |
|-------------|-------------|
| **Node.js** | Environnement d'exécution |
| **Express.js** | Framework API REST |
| **PostgreSQL** | Base de données relationnelle |
| **JWT** | Authentification sécurisée |
| **Bcryptjs** | Hachage des mots de passe |
| **Nodemailer** | Envoi d'emails (Gmail / Ethereal) |
| **Multer** | Upload de fichiers |

### Outils de développement
| Technologie | Utilisation |
|-------------|-------------|
| **Git & GitHub** | Versionnement et collaboration |
| **Postman** | Tests des endpoints API |
| **pgAdmin** | Administration de la base de données |


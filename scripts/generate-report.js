import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle,
  ShadingType, PageNumber, Header, Footer, TabStopPosition, TabStopType,
  ImageRun, convertInchesToTwip, TableOfContents, LevelFormat,
  UnderlineType, StyleLevel
} from "docx";
import fs from "fs";

const BLUE = "1E3A5F";
const LIGHT_BLUE = "E8F0FE";
const DARK = "2D2D2D";
const GRAY = "6B7280";
const ACCENT = "3B82F6";
const WHITE = "FFFFFF";

const styles = {
  default: {
    document: {
      run: { font: "Calibri", size: 24, color: DARK },
      paragraph: { spacing: { after: 120, line: 276 } },
    },
  },
};

const headingStyle = (level, color = BLUE) => ({
  run: { font: "Calibri", size: level === 1 ? 36 : level === 2 ? 30 : 26, bold: true, color },
  paragraph: {
    spacing: { before: level === 1 ? 400 : 280, after: 160 },
    border: level === 1 ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT } } : undefined,
  },
});

function title(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 52, color: BLUE, font: "Calibri" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
  });
}

function subtitle(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 24, color: GRAY, font: "Calibri", italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
  });
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, ...headingStyle(1), children: [new TextRun({ text, bold: true, size: 36, color: BLUE, font: "Calibri" })] });
}

function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, ...headingStyle(2), children: [new TextRun({ text, bold: true, size: 30, color: BLUE, font: "Calibri" })] });
}

function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, ...headingStyle(3, ACCENT), children: [new TextRun({ text, bold: true, size: 26, color: ACCENT, font: "Calibri" })] });
}

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: opts.size || 24, color: opts.color || DARK, font: "Calibri", bold: opts.bold, italics: opts.italics })],
    spacing: { after: opts.after || 120 },
    indent: opts.indent ? { left: convertInchesToTwip(0.3) } : undefined,
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 24, color: DARK, font: "Calibri" })],
    bullet: { level },
    spacing: { after: 60 },
  });
}

function bulletBold(label, value, level = 0) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, size: 24, color: DARK, font: "Calibri", bold: true }),
      new TextRun({ text: value, size: 24, color: DARK, font: "Calibri" }),
    ],
    bullet: { level },
    spacing: { after: 60 },
  });
}

function separator() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT, space: 1 } },
    spacing: { after: 200 },
  });
}

function spacer() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

function table(headers, rows, colWidths) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 22, color: WHITE, font: "Calibri" })], alignment: AlignmentType.CENTER })],
        shading: { type: ShadingType.SOLID, color: BLUE },
        width: { size: colWidths ? colWidths[i] : 3000, type: WidthType.DXA },
      })
    ),
  });

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, ci) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: cell, size: 22, color: DARK, font: "Calibri" })] })],
          shading: ri % 2 === 0 ? { type: ShadingType.SOLID, color: LIGHT_BLUE } : undefined,
          width: { size: colWidths ? colWidths[ci] : 3000, type: WidthType.DXA },
        })
      ),
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function apiTable(rows) {
  return table(["Méthode", "Endpoint", "Description", "Auth"], rows, [1200, 3600, 3800, 800]);
}

// ─── CONTENU DU RAPPORT ───────────────────────────────────────────────────────

const children = [
  // PAGE DE GARDE
  spacer(), spacer(), spacer(), spacer(), spacer(),
  title("AI Study Assistant"),
  subtitle("Rapport Technique & Fonctionnel"),
  spacer(),
  new Paragraph({
    children: [new TextRun({ text: "Application Web SaaS d'Aide à l'Étude par Intelligence Artificielle", size: 26, color: ACCENT, font: "Calibri", italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
  }),
  separator(),
  p("Auteur : Oussema Mhiri", { size: 24, color: GRAY, after: 40 }),
  p("Email : oussemamhiri963@gmail.com", { size: 24, color: GRAY, after: 40 }),
  p("Stage d'été de 2ème année — Université", { size: 24, color: GRAY, after: 40 }),
  p("Entreprise : Mobelite", { size: 24, color: GRAY, after: 40 }),
  p("Superviseur : Mme Rania Wannes", { size: 24, color: GRAY, after: 40 }),
  p("Année universitaire : 2025 / 2026", { size: 24, color: GRAY, after: 40 }),
  spacer(), spacer(), spacer(),
  p("Ce document présente l'architecture, les technologies, les fonctionnalités et les APIs du projet AI Study Assistant.", { size: 22, color: GRAY, italics: true }),

  // SAUT DE PAGE
  new Paragraph({ children: [], pageBreakBefore: true }),

  // ── 1. INTRODUCTION ──────────────────────────────────────────────────────────
  h1("1. Introduction"),
  spacer(),
  h2("1.1 Présentation du projet"),
  p("AI Study Assistant est une application web SaaS conçue pour accompagner les étudiants universitaires dans leur parcours académique. Le projet结合e l'intelligence artificielle (Google Gemini) avec des fonctionnalités pédagogiques avancées pour offrir une expérience d'apprentissage personnalisée et interactive."),
  spacer(),
  h2("1.2 Objectifs"),
  bullet("Automatiser l'analyse de cours et la génération de résumés"),
  bullet("Créer des quiz et exercices interactifs à partir de documents"),
  bullet("Offrir un chatbot pédagogique contextuel avec streaming en temps réel"),
  bullet("Planifier intelligemment les sessions de révision"),
  bullet("Suivre la progression de l'étudiant avec des métriques détaillées"),
  spacer(),
  h2("1.3 Contexte"),
  p("Projet réalisé dans le cadre d'un stage d'été de 2ème année au sein de l'entreprise Mobelite, sous la supervision de Mme Rania Wannes."),
  separator(),

  // ── 2. TECHNOLOGIES ──────────────────────────────────────────────────────────
  new Paragraph({ children: [], pageBreakBefore: true }),
  h1("2. Technologies Utilisées"),
  spacer(),

  h2("2.1 Frontend"),
  table(
    ["Technologie", "Version", "Rôle"],
    [
      ["React", "19.2.4", "Bibliothèque UI composable"],
      ["Next.js", "16.2.10", "Framework React (App Router)"],
      ["Tailwind CSS", "v4", "Framework CSS utility-first"],
      ["Axios", "1.18.1", "Client HTTP avec intercepteur JWT"],
      ["Lucide React", "1.24.0", "Bibliothèque d'icônes"],
      ["react-hot-toast", "2.6.0", "Notifications toast"],
      ["@react-oauth/google", "0.13.5", "Authentification Google OAuth 2.0"],
    ],
    [2500, 1500, 5500]
  ),
  spacer(),

  h2("2.2 Backend"),
  table(
    ["Technologie", "Version", "Rôle"],
    [
      ["Node.js", "—", "Runtime JavaScript côté serveur"],
      ["Express", "5.2.1", "Framework web minimaliste"],
      ["PostgreSQL (pg)", "8.22.0", "Client PostgreSQL natif"],
      ["jsonwebtoken", "9.0.3", "Authentification JWT (7j expiration)"],
      ["bcryptjs", "3.0.3", "Hachage sécurisé des mots de passe"],
      ["Multer", "2.2.0", "Upload de fichiers (max 50 Mo)"],
      ["Nodemailer", "9.0.3", "Envoi d'e-mails (Gmail / Ethereal)"],
      ["express-rate-limit", "8.6.0", "Protection contre le brute-force"],
    ],
    [2500, 1500, 5500]
  ),
  spacer(),

  h2("2.3 Intelligence Artificielle"),
  table(
    ["Technologie", "Modèle", "Utilisation"],
    [
      ["Google Gemini API", "gemini-3.1-flash-lite", "Génération de résumés, quiz, exercices, chatbot, suggestions, analyse d'images"],
    ],
    [2500, 2500, 4500]
  ),
  spacer(),

  h2("2.4 Extraction de texte"),
  table(
    ["Bibliothèque", "Format supporté", "Méthode"],
    [
      ["pdf-parse", "PDF", "Extraction texte natif"],
      ["mammoth", "DOCX", "Conversion HTML → texte"],
      ["adm-zip + xml2js", "PPTX", "Parsage XML des diapositives"],
      ["Gemini Vision", "JPG, PNG", "Analyse d'images via IA"],
    ],
    [2500, 2500, 4500]
  ),
  separator(),

  // ── 3. ARCHITECTURE ──────────────────────────────────────────────────────────
  new Paragraph({ children: [], pageBreakBefore: true }),
  h1("3. Architecture Générale"),
  spacer(),
  p("Le projet suit une architecture client-serveur en couches séparées, garantissant une bonne séparation des responsabilités :"),
  spacer(),
  p("┌─────────────────────────────────────────────────────────────────┐", { size: 20, color: GRAY }),
  p("│                  FRONTEND (Client — Port 3000)                  │", { size: 20, color: GRAY }),
  p("│    Next.js 16 (App Router) + React 19 + Tailwind CSS v4       │", { size: 20, color: GRAY }),
  p("│    Context API (Auth, Chat) — Axios (HTTP client)              │", { size: 20, color: GRAY }),
  p("└──────────────────────────┬──────────────────────────────────────┘", { size: 20, color: GRAY }),
  p("                           │  HTTP REST + SSE (Server-Sent Events)│", { size: 20, color: GRAY }),
  p("                           v                                      │", { size: 20, color: GRAY }),
  p("┌─────────────────────────────────────────────────────────────────┐", { size: 20, color: GRAY }),
  p("│                  BACKEND (Serveur — Port 5000)                  │", { size: 20, color: GRAY }),
  p("│    Node.js + Express 5 — Middleware JWT — Rate Limiting         │", { size: 20, color: GRAY }),
  p("│    Routes → Controllers → Services → Models                     │", { size: 20, color: GRAY }),
  p("└──────────────────────────┬──────────────────────────────────────┘", { size: 20, color: GRAY }),
  p("                           │                                       │", { size: 20, color: GRAY }),
  p("                           v                                       │", { size: 20, color: GRAY }),
  p("┌─────────────────────────────────────────────────────────────────┐", { size: 20, color: GRAY }),
  p("│              BASE DE DONNÉES PostgreSQL (11 tables)             │", { size: 20, color: GRAY }),
  p("│    users, matieres, documents, resumes, quizs, questions,      │", { size: 20, color: GRAY }),
  p("│    quiz_results, conversations, messages, sessions_planning,    │", { size: 20, color: GRAY }),
  p("│    notifications                                                │", { size: 20, color: GRAY }),
  p("└──────────────────────────┬──────────────────────────────────────┘", { size: 20, color: GRAY }),
  p("                           │                                       │", { size: 20, color: GRAY }),
  p("                           v                                       │", { size: 20, color: GRAY }),
  p("┌─────────────────────────────────────────────────────────────────┐", { size: 20, color: GRAY }),
  p("│              SERVICES EXTERNES                                  │", { size: 20, color: GRAY }),
  p("│    Google Gemini API (IA)  —  Nodemailer (Email SMTP)          │", { size: 20, color: GRAY }),
  p("└─────────────────────────────────────────────────────────────────┘", { size: 20, color: GRAY }),
  spacer(),
  h2("3.1 Principes architecturaux"),
  bulletBold("Séparation frontend/backend : ", "Communication exclusivement via API REST"),
  bulletBold("Middleware d'authentification : ", "Vérification JWT sur toutes les routes protégées"),
  bulletBold("Modularité : ", "Chaque domaine (auth, matières, documents, IA, chat) a sa propre route, controller, model"),
  bulletBold("Rate limiting : ", "Protection contre les abus (10 req/15min pour l'auth, 100 req/15min globalement)"),
  bulletBold("Pipeline d'analyse IA : ", "Extraction → Gemini → Stockage en base, exécuté en parallèle"),
  separator(),

  // ── 4. STRUCTURE DES DOSSIERS ───────────────────────────────────────────────
  new Paragraph({ children: [], pageBreakBefore: true }),
  h1("4. Structure des Dossiers"),
  spacer(),

  h2("4.1 Backend (`backend/src/`)"),
  bulletBold("app.js — ", "Point d'entrée Express : middleware, montage des routes, démarrage du serveur"),
  bulletBold("config/db.js — ", "Pool PostgreSQL (connexion via DATABASE_URL)"),
  bulletBold("config/initDb.js — ", "Création automatique des tables + migrations (11 tables)"),
  bulletBold("middleware/auth.js — ", "Middleware JWT : vérifie le token Bearer dans le header Authorization"),
  bulletBold("models/ (12 fichiers) — ", "Modeles de données : User, Matiere, Document, Resume, Quiz, Question, QuizResult, Conversation, Message, Notification, SessionPlanning"),
  bulletBold("controllers/ (9 fichiers) — ", "Logique métier : auth, subject, document, ai, quiz, exercise, chatbot, progress, planning"),
  bulletBold("routes/ (9 fichiers) — ", "Routes API REST montées sur /api/*"),
  bulletBold("services/ (5 fichiers) — ", "Services métier : geminiService, analysisService, extractService, emailService, cronService"),
  spacer(),

  h2("4.2 Frontend (`frontend/`)"),
  bulletBold("app/ — ", "Pages Next.js (App Router) : dashboard, matières, chatbot, planning, notifications, paramètres, auth"),
  bulletBold("context/ — ", "React Context : AuthContext (session utilisateur), ChatContext (conversations & streaming SSE)"),
  bulletBold("lib/api.js — ", "Instance Axios configurée avec intercepteur JWT automatique"),
  bulletBold("components/ — ", "Composants réutilisables : Sidebar de navigation"),
  bulletBold("public/image/ — ", "Images statiques (Login.png, register.png)"),
  separator(),

  // ── 5. FONCTIONNALITÉS ──────────────────────────────────────────────────────
  new Paragraph({ children: [], pageBreakBefore: true }),
  h1("5. Fonctionnalités Détaillées"),
  spacer(),

  // 5.1 Auth
  h2("5.1 Authentification & Gestion de session"),
  p("Système d'authentification complet avec plusieurs méthodes de connexion et sécurisation par JWT."),
  spacer(),
  h3("Backend — `authController.js`, `middleware/auth.js`"),
  bullet("Inscription : nom, email, mot de passe (bcrypt), université, faculté, niveau d'études, filière"),
  bullet("Connexion : email + mot de passe avec validation bcrypt"),
  bullet("Google OAuth 2.0 : vérification du token Google, création automatique ou liaison de compte"),
  bullet("Réinitialisation de mot de passe en 3 étapes : demande OTP → vérification OTP (6 chiffres, valide 5 min) → réinitialisation via token JWT temporaire"),
  bullet("JWT : token signé avec JWT_SECRET, expiration 7 jours, stocké dans localStorage"),
  bullet("Rate limiting : 10 requêtes/15 min pour l'auth, 100 requêtes/15 min globalement"),
  spacer(),
  h3("Frontend — `AuthContext.js`, pages `(auth)/*`"),
  bullet("Gestion de l'état utilisateur via React Context (persistance au rechargement via GET /auth/me)"),
  bullet("Interface responsive avec illustrations (Login.png, register.png)"),
  bullet("Redirection automatique vers /dashboard après connexion"),
  bullet("Notifications toast pour succès/erreurs"),
  spacer(),

  // 5.2 Matières
  h2("5.2 Gestion des Matières"),
  p("CRUD complet pour l'organisation des cours par matière, avec isolation par utilisateur."),
  spacer(),
  h3("Backend — `subjectController.js`, `Matiere.js`"),
  bullet("CRUD : création, lecture, mise à jour, suppression"),
  bullet("Attributs : nom, description, date d'examen, couleur personnalisable (hex)"),
  bullet("Comptage automatique du nombre de documents par matière (LEFT JOIN documents)"),
  bullet("Isolation : chaque utilisateur ne voit que ses propres matières"),
  spacer(),

  // 5.3 Documents
  h2("5.3 Import & Analyse de Documents"),
  p("Pipeline d'analyse IA complet : upload → extraction de texte → analyse Gemini → stockage en base."),
  spacer(),
  h3("Upload & Extraction"),
  bullet("Upload via Multer : PDF, DOCX, PPTX, JPG, PNG (max 50 Mo)"),
  bullet("Extraction automatique : PDF (pdf-parse), DOCX (mammoth), PPTX (adm-zip + xml2js), Images (Gemini Vision)"),
  spacer(),
  h3("Pipeline d'analyse IA (`analysisService.js`)"),
  bullet("Étape 1 : Extraction du texte brut du fichier uploadé"),
  bullet("Étape 2 : Génération de 4 types d'analyses via Gemini (exécutées en parallèle) :"),
  bullet("Résumé court (2-3 phrases) — vue rapide du contenu", 1),
  bullet("Résumé détaillé (5-6 phrases) — compréhension approfondie", 1),
  bullet("Points clés (liste de 5 éléments) — informations essentielles", 1),
  bullet("Définitions (JSON [{terme, definition}]) — vocabulaire clé", 1),
  bullet("Étape 3 : Stockage de chaque analyse en base (table resumes)"),
  bullet("Récupération : GET /ai/analysis/:documentId"),
  spacer(),

  // 5.4 Chatbot
  h2("5.4 Chatbot IA Pédagogique"),
  p("Chatbot intelligent avec streaming en temps réel, contexte de documents et historique de conversation."),
  spacer(),
  h3("Backend — `chatbotController.js`, `geminiService.js`"),
  bullet("Conversations : création, historique, suppression par matière"),
  bullet("Contexte : le chatbot utilise le texte extrait des documents de la matière (ou d'un document spécifique)"),
  bullet("Streaming SSE (Server-Sent Events) : les réponses sont envoyées caractère par caractère en temps réel"),
  bullet("Historique : les 10 derniers messages sont inclus dans le prompt pour maintenir la cohérence"),
  bullet("Support d'images : envoi d'images en base64 pour analyse visuelle via Gemini Vision"),
  bullet("Suggestions intelligentes : génération de 3 questions pertinentes basées sur les documents"),
  bullet("Limite de contexte : 40 000 caractères max pour éviter la saturation du prompt"),
  spacer(),
  h3("Frontend — `ChatContext.js`, `chatbot/page.js`"),
  bullet("Interface type messagerie avec bulles utilisateur/IA"),
  bullet("Barre latérale d'historique des conversations"),
  bullet("Sélecteur de matière et de document pour le contexte"),
  bullet("Affichage du statut « Rédaction en direct » pendant le streaming"),
  bullet("Support de l'envoi d'images (aperçu, suppression)"),
  bullet("Rendu markdown simplifié (gras, code, listes)"),
  bullet("Suggestions de questions au démarrage d'une conversation vide"),
  spacer(),

  // 5.5 Quiz & Exercices
  h2("5.5 Quiz & Exercices Interactifs"),
  p("Génération automatique de quiz QCM et d'exercices via Gemini, avec correction IA pour les exercices."),
  spacer(),
  h3("Quiz — `quizController.js`"),
  bullet("Génération de QCM via Gemini à partir d'un document"),
  bullet("Paramètres : nombre de questions (1-50), difficulté (Facile / Moyen / Difficile)"),
  bullet("Stockage en base : quiz + questions avec options au format JSONB"),
  bullet("Format : questions à 4 propositions (A, B, C, D) avec réponse correcte"),
  spacer(),
  h3("Exercices — `exerciseController.js`"),
  bullet("Génération d'exercices QCM ou questions ouvertes via Gemini"),
  bullet("Paramètres : nombre d'exercices (1-20), difficulté"),
  bullet("Correction IA : soumission des réponses à Gemini pour évaluation avec feedback personnalisé"),
  bullet("Fallback : comparaison directe pour les QCM si parsing JSON échoue"),
  spacer(),
  h3("Interface — `matieres/page.js`"),
  bullet("Quiz interactif avec sélection par radio buttons, correction visuelle vert/rouge"),
  bullet("Affichage du score (nombre correct / total, pourcentage)"),
  bullet("Possibilité de revoir les erreurs détaillées"),
  bullet("Exercices avec support QCM et questions ouvertes, feedback de correction IA"),
  spacer(),

  // 5.6 Planning
  h2("5.6 Planning de Révision Intelligent"),
  p("Gestion des sessions de révision avec génération automatique de planning par l'IA."),
  spacer(),
  h3("Backend — `planningController.js`, `SessionPlanning.js`"),
  bullet("CRUD des sessions : création, lecture (par mois/année), mise à jour, suppression"),
  bullet("Types de session : QCM, Lecture, Chatbot, Révision"),
  bullet("Attributs : date, heure de début, durée (minutes), statut (planifié/complet)"),
  bullet("Génération IA du planning : envoi du contexte (matière, date examen, jours restants, disponibilité) à Gemini qui retourne un planning optimisé en JSON"),
  bullet("Notifications : à la création d'une session, une notification in-app est générée automatiquement"),
  spacer(),

  // 5.7 Progression
  h2("5.7 Suivi de Progression"),
  p("Dashboard de progression avec score de maîtrise pondéré et analyse IA personnalisée."),
  spacer(),
  h3("Backend — `progressController.js`, `QuizResult.js`"),
  bullet("Score de maîtrise global (0-100%) pondéré : documents (30 pts) + quiz (50 pts) + chatbot (20 pts)"),
  bullet("Statistiques détaillées : documents, quiz, questions, conversations, messages"),
  bullet("Taux de réussite par matière et par quiz"),
  bullet("Estimation du temps restant avant l'examen"),
  bullet("Analyse IA personnalisée : Gemini génère des conseils basés sur les statistiques"),
  bullet("Enregistrement des résultats de quiz : réponses individuelles avec statut correct/incorrect"),
  spacer(),

  // 5.8 Notifications
  h2("5.8 Notifications & Rappels"),
  p("Système de notifications in-app avec rappels automatiques par cron et e-mail."),
  spacer(),
  h3("Backend"),
  bullet("Notifications in-app : création automatique (rappels, sessions planifiées)"),
  bullet("Marquage lu/non-lu (individuel ou toutes d'un coup)"),
  bullet("Cron service : vérification toutes les heures des sessions du lendemain"),
  bullet("Envoi de notification in-app + e-mail de rappel (format HTML)"),
  bullet("Types : rappel, planning, système"),
  spacer(),
  h3("Frontend — `notifications/page.js`"),
  bullet("Paramètres de notifications (push, email, fréquence)"),
  bullet("Liste des notifications récentes avec statut lu/non-lu"),
  bullet("Interface de configuration des rappels"),
  spacer(),

  // 5.9 Paramètres
  h2("5.9 Paramètres Utilisateur"),
  p("Personnalisation du profil, des préférences IA et du thème de l'application."),
  spacer(),
  h3("Backend — `authController.js`"),
  bullet("Profil : nom, email (lecture), université, faculté, niveau d'études, filière (édition)"),
  bullet("Préférences IA : niveau d'explication (Simple/Moyen/Avancé), mode de réponse (Court/Détaillé/Personnalisé)"),
  bullet("Theme : mode clair/sombre (persisté dans localStorage + classe dark sur <html>)"),
  spacer(),
  h3("Frontend — `parametres/page.js`"),
  bullet("Section profil avec champs éditables"),
  bullet("Section préférences IA avec boutons radio"),
  bullet("Toggles pour thème sombre, notifications push, emails de résumé"),
  bullet("Sauvegarde via PUT /auth/profile et PUT /auth/preferences"),
  separator(),

  // ── 6. BASE DE DONNÉES ──────────────────────────────────────────────────────
  new Paragraph({ children: [], pageBreakBefore: true }),
  h1("6. Base de Données"),
  spacer(),
  p("La base de données PostgreSQL contient 11 tables relationnelles, créées automatiquement au démarrage via initDb.js avec gestion des migrations."),
  spacer(),

  h2("6.1 Tables principales"),
  table(
    ["Table", "Description", "Colonnes clés"],
    [
      ["users", "Utilisateurs du système", "id, full_name, email, password_hash, google_id, university, faculty, study_level, major, ia_level, response_mode, reset_token"],
      ["matières", "Matières de l'étudiant", "id, nom, description, user_id (FK), date_examen, couleur, created_at"],
      ["documents", "Fichiers uploadés", "id, nom_fichier, type, url, matiere_id (FK), user_id (FK), uploaded_at"],
      ["resumes", "Analyses IA des documents", "id, type (court/détaillé/points_cles/définitions), contenu, document_id (FK), created_at"],
      ["quizs", "Quiz générés", "id, titre, niveau, matiere_id (FK), user_id (FK), created_at"],
      ["questions", "Questions de quiz", "id, contenu, type (qcm/ouverte), bonne_reponse, options (JSONB), quiz_id (FK)"],
      ["quiz_results", "Réponses aux quiz", "id, user_id (FK), quiz_id (FK), question_id (FK), reponse_donnee, est_correct, answered_at"],
      ["conversations", "Sessions chatbot", "id, user_id (FK), matiere_id (FK), document_id (FK), titre, created_at"],
      ["messages", "Messages de chat", "id, conversation_id (FK), sender (user/ia), content, created_at"],
      ["sessions_planning", "Sessions de révision", "id, user_id (FK), matiere_id (FK), date_session, heure_debut, duree_minutes, type, titre, statut"],
      ["notifications", "Notifications in-app", "id, user_id (FK), titre, message, type, lue, created_at"],
    ],
    [2000, 3000, 5000]
  ),
  spacer(),

  h2("6.2 Relations entre les tables"),
  p("Diagramme de dépendances :"),
  spacer(),
  p("users ──┬── matières ──┬── documents ──── resumes", { size: 20, color: GRAY }),
  p("        │              ├── quizs ──── questions", { size: 20, color: GRAY }),
  p("        │              ├── conversations ──── messages", { size: 20, color: GRAY }),
  p("        │              └── sessions_planning", { size: 20, color: GRAY }),
  p("        ├── quiz_results (→ quizs, questions)", { size: 20, color: GRAY }),
  p("        └── notifications", { size: 20, color: GRAY }),
  spacer(),
  bulletBold("users : ", "Table centrale — toutes les autres tables sont liées via user_id avec ON DELETE CASCADE"),
  bulletBold("matières : ", "Organisent les documents, quiz, conversations et sessions"),
  bulletBold("documents : ", "Liés à une matière, analysés pour produire des resumes"),
  bulletBold("quizs → questions : ", "Relation un à plusieurs, options stockées en JSONB"),
  bulletBold("conversations → messages : ", "Relation un à plusieurs"),
  bulletBold("quiz_results : ", "Table de jointure pour le suivi des réponses"),
  separator(),

  // ── 7. APIs ──────────────────────────────────────────────────────────────────
  new Paragraph({ children: [], pageBreakBefore: true }),
  h1("7. APIs Principales"),
  spacer(),
  p("L'API suit une architecture RESTful. Toutes les routes sont préfixées par /api/. L'authentification est requise sur les routes marquées « Oui » (header Authorization: Bearer <token>)."),
  spacer(),

  h2("7.1 Authentification"),
  apiTable([
    ["POST", "/api/auth/register", "Inscription d'un nouvel utilisateur", "Non"],
    ["POST", "/api/auth/login", "Connexion (email + mot de passe)", "Non"],
    ["POST", "/api/auth/google", "Connexion / inscription via Google OAuth", "Non"],
    ["POST", "/api/auth/request-reset-code", "Demander un code OTP de réinitialisation", "Non"],
    ["POST", "/api/auth/verify-reset-code", "Vérifier le code OTP (6 chiffres)", "Non"],
    ["POST", "/api/auth/reset-password", "Réinitialiser le mot de passe (token temporaire)", "Non"],
    ["GET", "/api/auth/me", "Récupérer le profil de l'utilisateur connecté", "Oui"],
    ["PUT", "/api/auth/profile", "Mettre à jour le profil", "Oui"],
    ["PUT", "/api/auth/preferences", "Mettre à jour les préférences IA", "Oui"],
  ]),
  spacer(),

  h2("7.2 Matières"),
  apiTable([
    ["GET", "/api/subjects", "Lister les matières de l'utilisateur", "Oui"],
    ["POST", "/api/subjects", "Créer une nouvelle matière", "Oui"],
    ["PUT", "/api/subjects/:id", "Modifier une matière", "Oui"],
    ["DELETE", "/api/subjects/:id", "Supprimer une matière", "Oui"],
  ]),
  spacer(),

  h2("7.3 Documents"),
  apiTable([
    ["POST", "/api/documents", "Upload d'un document (multipart/form-data)", "Oui"],
    ["GET", "/api/documents/:matiereId", "Lister les documents d'une matière", "Oui"],
    ["DELETE", "/api/documents/:id", "Supprimer un document", "Oui"],
  ]),
  spacer(),

  h2("7.4 Intelligence Artificielle"),
  apiTable([
    ["POST", "/api/ai/analyze", "Lancer l'analyse IA d'un document (4 analyses en parallèle)", "Oui"],
    ["GET", "/api/ai/analysis/:documentId", "Récupérer les analyses d'un document", "Oui"],
  ]),
  spacer(),

  h2("7.5 Quiz"),
  apiTable([
    ["POST", "/api/quizzes/generate", "Générer un quiz QCM à partir d'un document", "Oui"],
  ]),
  spacer(),

  h2("7.6 Exercices"),
  apiTable([
    ["POST", "/api/exercises/generate", "Générer des exercices (QCM ou questions ouvertes)", "Oui"],
    ["POST", "/api/exercises/check", "Corriger des exercices via IA (feedback personnalisé)", "Oui"],
  ]),
  spacer(),

  h2("7.7 Chatbot"),
  apiTable([
    ["GET", "/api/chatbot/subjects/:matiereId/conversations", "Lister les conversations d'une matière", "Oui"],
    ["POST", "/api/chatbot/conversations", "Créer une nouvelle conversation", "Oui"],
    ["GET", "/api/chatbot/conversations/:id/messages", "Récupérer les messages d'une conversation", "Oui"],
    ["DELETE", "/api/chatbot/conversations/:id", "Supprimer une conversation", "Oui"],
    ["POST", "/api/chatbot/conversations/:id/chat", "Envoyer un message (réponse SSE streaming)", "Oui"],
    ["GET", "/api/chatbot/subjects/:matiereId/suggestions", "Obtenir des suggestions de questions", "Oui"],
  ]),
  spacer(),

  h2("7.8 Progression"),
  apiTable([
    ["GET", "/api/progress/:matiereId", "Dashboard de progression complet", "Oui"],
    ["POST", "/api/progress/quiz-result", "Enregistrer les résultats d'un quiz", "Oui"],
  ]),
  spacer(),

  h2("7.9 Planning & Notifications"),
  apiTable([
    ["GET", "/api/planning/sessions", "Récupérer les sessions du mois (query: month, year)", "Oui"],
    ["POST", "/api/planning/sessions", "Créer une session de révision", "Oui"],
    ["PATCH", "/api/planning/sessions/:id", "Modifier une session", "Oui"],
    ["DELETE", "/api/planning/sessions/:id", "Supprimer une session", "Oui"],
    ["POST", "/api/planning/generate", "Générer un planning IA optimisé", "Oui"],
    ["GET", "/api/planning/notifications", "Notifications + count non lues", "Oui"],
    ["PATCH", "/api/planning/notifications/:id/read", "Marquer comme lu (id=all pour toutes)", "Oui"],
  ]),
  spacer(),

  h2("7.10 Routes de test"),
  apiTable([
    ["GET", "/api/test", "Test de l'API (health check)", "Non"],
    ["GET", "/api/test-gemini", "Test de connexion à Gemini API", "Non"],
    ["POST", "/api/test-summary", "Test de génération de résumé IA", "Non"],
  ]),
  separator(),

  // ── 8. CONCLUSION ────────────────────────────────────────────────────────────
  new Paragraph({ children: [], pageBreakBefore: true }),
  h1("8. Conclusion"),
  spacer(),

  h2("8.1 Bilan du projet"),
  p("AI Study Assistant est une application web complète et fonctionnelle qui intègre de manière cohérente l'intelligence artificielle (Google Gemini) dans un workflow d'apprentissage universitaire. Le projet couvre l'ensemble du parcours étudiant :"),
  spacer(),
  bulletBold("Organisation : ", "Matières, documents, planning de révision"),
  bulletBold("Apprentissage actif : ", "Quiz, exercices interactifs, chatbot pédagogique contextuel"),
  bulletBold("Suivi : ", "Progression chiffrée, score de maîtrise, analyse IA personnalisée"),
  bulletBold("Expérience utilisateur : ", "Interface moderne (Tailwind CSS), thème sombre, streaming SSE en temps réel"),
  spacer(),
  p("Le stack technique est moderne et cohérent (React 19, Next.js 16, Express 5, PostgreSQL, Gemini API). L'architecture en couches assure une bonne séparation des responsabilités. Le pipeline d'analyse IA (extraction → Gemini → stockage) est bien structuré et supporte plusieurs formats de fichiers (PDF, DOCX, PPTX, images)."),
  spacer(),

  h2("8.2 Pistes d'amélioration"),
  p("Améliorations envisageables pour une version future :"),
  spacer(),
  bulletBold("1. Tests unitaires et d'intégration : ", "Ajouter Jest + Supertest pour les controllers, services et models"),
  bulletBold("2. Validation des entrées : ", "Renforcer la validation côté serveur avec Joi ou Zod"),
  bulletBold("3. Sécurité : ", "HTTPS, sanitisation du contenu HTML, gestion avancée des erreurs"),
  bulletBold("4. Performance : ", "Mise en cache des analyses IA, pagination, optimisation des requêtes SQL"),
  bulletBold("5. Déploiement : ", "Dockeriser l'application, CI/CD, déploiement cloud (Vercel + Railway/Render)"),
  bulletBold("6. Notifications push : ", "Service Workers pour les vraies notifications navigateur"),
  bulletBold("7. Collaboration : ", "Partage de documents et de quiz entre étudiants"),
  bulletBold("8. Application mobile : ", "React Native ou PWA pour un accès mobile"),
  bulletBold("9. Mode hors-ligne : ", "Cache des cours et quiz pour utilisation sans connexion"),
  bulletBold("10. Analytics : ", "Tableau de bord d'utilisation pour suivre les habitudes d'étude"),
  spacer(), spacer(),
  separator(),
  spacer(),
  p("— Fin du rapport —", { size: 24, color: GRAY, italics: true, after: 0 }),
];

const doc = new Document({
  creator: "Oussema Mhiri",
  title: "AI Study Assistant — Rapport Technique & Fonctionnel",
  description: "Rapport complet du projet AI Study Assistant",
  styles,
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.2),
            right: convertInchesToTwip(1.2),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "AI Study Assistant — Rapport Technique", size: 18, color: GRAY, font: "Calibri", italics: true }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Oussema Mhiri — ", size: 18, color: GRAY, font: "Calibri" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GRAY, font: "Calibri" }),
                new TextRun({ text: " / ", size: 18, color: GRAY, font: "Calibri" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: GRAY, font: "Calibri" }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      },
      children,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync("AI_Study_Assistant_Rapport.docx", buffer);
console.log("✅ Rapport Word généré avec succès : AI_Study_Assistant_Rapport.docx");
console.log(`   Taille : ${(buffer.length / 1024).toFixed(1)} Ko`);

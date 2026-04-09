# 🩻 Chemloul Radiologie — Gestion cabinet Intégrée

Plateforme moderne de gestion radiologique pour le **Cabinet Chemloul Radiologie**. Conçue pour offrir une expérience premium aux patients, radiologues, et assistants, avec un support complet du Français et de l'Arabe (RTL).

## 🚀 Fonctionnalités Clés

- **Patient Wizard**: Parcours de réservation multi-étapes avec téléversement d'ordonnances.
- **Tableau de Bord Radiologue**: Éditeur de comptes-rendus TipTap avec modèles et gestion d'images.
- **Gestion Assistant**: Calendrier interactif, gestion des patients et des rendez-vous en temps réel.
- **Sécurité Médicale RLS**: Protection des données au niveau de la base de données (Zero Trust).
- **Multi-langue & RTL**: Support natif de l'Arabe avec mise en page inversée automatique.
- **Temps Réel**: Notifications et mises à jour cliniques instantanées via Supabase Realtime.

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion.
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **Localisation**: Système i18n customisé avec support RTL/LTR fluide.
- **Icons**: Lucide React.
- **Éditeur**: TipTap (Rich Text Editor).

## 📦 Installation Locale

1.  **Cloner le dépôt**
    ```bash
    git clone [repository-url]
    cd [repository-name]
    ```

2.  **Installer les dépendances**
    ```bash
    npm install
    ```

3.  **Variables d'Environnement**
    Créez un fichier `.env` à la racine :
    ```env
    VITE_SUPABASE_URL=votre_url_supabase
    VITE_SUPABASE_ANON_KEY=votre_cle_anonyme
    ```

4.  **Lancer le serveur de développement**
    ```bash
    npm run dev
    ```

## 🔒 Sécurité & RLS (Row Level Security)

Le projet utilise **Supabase RLS** pour garantir la confidentialité médicale :
- **Patients**: Accès uniquement à leurs propres rendez-vous et comptes-rendus validés.
- **Radiologues**: Accès complet aux examens et édition des rapports.
- **Assistants**: Gestion opérationnelle des rendez-vous et dossiers patients.
- **Administrateurs**: Accès total aux logs d'audit et statistiques système.

> [!IMPORTANT]
> Les politiques RLS sont définies dans `01_security_rls.sql`. Assurez-vous de les exécuter dans votre éditeur SQL Supabase après avoir créé les tables.

## 👥 Rôles Utilisateurs

| Rôle | Description |
| :--- | :--- |
| **Patient** | Réserve des RDV, consulte ses résultats et gère son profil. |
| **Assistant** | (Réceptionniste) Gère le calendrier, accueille les patients et valide les documents. |
| **Radiologue** | Réalise les examens, interprète les images et rédige les comptes-rendus. |
| **Administrateur** | Gère les comptes utilisateurs, les services cliniques et surveille le système. |

## 📊 Schéma de la Base de Données (Aperçu)

- `utilisateurs`: Profils authentifiés (Admin, Radiologue, Assistant, Patient).
- `patients`: Informations médicales et démographiques détaillées.
- `rendez_vous`: Plannings liés aux services diagnostiques.
- `examens`: Détails techniques et statut de réalisation.
- `comptes_rendus`: Rapports médicaux validés par les radiologues.
- `ordonnances`: Prescriptions cliniques liées aux examens.
- `notifications`: Alertes temps réel pour les changements de statut.

---
*Ce projet a été finalisé avec une attention particulière à l'esthétique premium et à la robustesse clinique.*

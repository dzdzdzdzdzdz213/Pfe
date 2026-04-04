# 🏥 Chemloul Radiologie Management

> **A full-stack radiology clinic management platform built with React, Supabase, and TailwindCSS.**
> Developed as a Bachelor's degree final project, deployed in a real clinical setting in Algeria.

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Live Demo](https://img.shields.io/badge/Live-pfe--phi--five.vercel.app-blueviolet)](https://pfe-phi-five.vercel.app)

---

## 📋 Project Purpose

Chemloul Radiologie Management digitalizes the workflow of a radiology private clinic by:

- **Scheduling & tracking** patient appointments across all clinic staff roles
- **Managing medical examinations** and routing them to radiologists
- **Generating and validating** PDF radiology reports with clinic branding
- **Storing and viewing** radiological images via Supabase Storage
- **Protecting patient data** with Row Level Security (RLS) and Supabase Auth
- **Providing bilingual support** (French 🇫🇷 / Arabic 🇩🇿) across all UI

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, TanStack Query v5 |
| **Styling** | TailwindCSS 3, Framer Motion, Lucide Icons |
| **Backend / DB** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | Recharts |
| **Rich Text** | ReactQuill |
| **Print / PDF** | `window.print()` + custom `@media print` CSS |
| **Build Tool** | Create React App + CRACO |
| **Deployment** | Vercel |

---

## 🚀 Running Locally

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- A Supabase project (or use Demo Mode — no account needed)

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd Pfe

# 2. Install dependencies
npm install

# 3. Configure environment variables (see below)
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Start the development server
npm start
# Opens at http://localhost:3000
```

### Demo Mode (no Supabase required)

Use the **Accès Démo Instantané** panel at `/login` with password `demo`.
Demo data is stored in `localStorage` and resets on page refresh.

---

## ⚙️ Environment Variables

Create a `.env` file at the project root. **Never commit this file.**

```env
# Supabase project URL (found in Project Settings → API)
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# Supabase anonymous (public) API key
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Note:** The anon key is safe to expose in the browser — Row Level Security
> policies (in `01_security_rls.sql`) ensure users only access their own data.

---

## 🗄️ Database Schema Overview

```
utilisateurs          Core identity table (synced with auth.users)
├── id                UUID — matches auth.users.id
├── nom / prenom      Name fields
├── email             Unique, matches auth email
├── telephone
├── role              'administrateur' | 'radiologue' | 'receptionniste' | 'patient'
└── date_creation_compte

patients              Extended patient profile
├── id
├── utilisateur_id    FK → utilisateurs.id
├── sexe
├── date_naissance
├── groupe_sanguin
├── allergies
└── antecedents_medicaux

radiologues           Radiologue professional profile
├── id
├── utilisateur_id    FK → utilisateurs.id
├── matricule_sante
└── specialite_principale

receptionnistes       Receptionist profile
administrateurs       Admin profile

rendez_vous           Appointment / scheduling
├── id
├── date_heure_debut  TIMESTAMPTZ
├── date_heure_fin    TIMESTAMPTZ
├── statut            'planifie'|'confirme'|'en_cours'|'realise'|'annule'
├── motif
├── patient_id        FK → patients.id
├── receptionniste_id FK → receptionnistes.id
└── examen_id         FK → examens.id (set after exam creation)

examens               Medical examination record
├── id
├── date_realisation  TIMESTAMPTZ
├── observations_cliniques
├── statut
├── service_id        FK → services.id
└── radiologue_id     FK → radiologues.id
                      ⚠️ NO patient_id — patient linked via rendez_vous.examen_id

comptes_rendus        Radiology report
├── id
├── description_detaillee  (HTML from rich text editor)
├── est_valide        BOOLEAN — patient can see when true
├── radiologue_id     FK → radiologues.id (author)
└── document_medical_id    FK → documents_medicaux.id

consentements         Invasive procedure consent forms
├── id
├── examen_id         FK → examens.id
├── patient_id        FK → patients.id
├── type_acte_invasif TEXT
├── signature_requise BOOLEAN
├── est_signe         BOOLEAN
├── date_signature    TIMESTAMPTZ
└── radiologue_confirmateur_id FK → radiologues.id

images_radiologiques  Metadata for files in Supabase Storage
notifications         In-app alerts (real-time via Postgres Changes)
dossiers_medicaux     Medical summary dossier per patient
documents_medicaux    Generic document metadata
ordonnances           Prescription records
lettres_orientation   Referral letters
services              Clinic service types (Scanner, IRM, Écho...)
audit_logs            Admin activity trail
```

---

## 👥 Role Descriptions

| Role | Path Prefix | Capabilities |
|---|---|---|
| **Administrateur** | `/admin` | Full user management, system stats, audit logs, settings |
| **Radiologue** | `/radiologue` | Exam queue, report editing & validation, patient history, image viewer |
| **Réceptionniste** | `/assistant` | Appointment scheduling, patient registration, consent forms |
| **Patient** | `/patient` | View own appointments (with status stepper), download validated reports, view images |

---

## 🔐 Security

- **Supabase Auth** handles all password hashing and session management
- **Row Level Security (RLS)** is enforced at the database level — see `01_security_rls.sql`
- **Signed URLs** (1h expiry) are used for all private radiological images from Storage
- **ProtectedRoute** component enforces client-side role checks before rendering dashboards

### Running RLS Migrations

Open the **Supabase SQL Editor** and run the contents of `01_security_rls.sql` once after initial setup.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── common/            # Reusable: ErrorBoundary, ImageViewerModal, StatCard...
│   ├── assistant/         # AppointmentModal, PatientForm
│   └── layouts/           # DashboardLayout, AuthLayout, PublicLayout
├── contexts/
│   ├── AuthContext.jsx    # useAuth hook — session, role, login/logout
│   └── LanguageContext.jsx # useLanguage hook — FR/AR toggle + t() translation fn
├── hooks/
│   └── useAuth.js
├── lib/
│   ├── supabase.js        # Supabase client + demo mode guard
│   ├── translations.js    # All UI strings in FR and AR
│   └── utils.js           # formatDate, formatTime, cn, getStatusColor...
├── pages/
│   ├── admin/             # Dashboard, Users, AuditLogs, Stats, Settings
│   ├── assistant/         # Dashboard, Calendar, Patients
│   ├── radiologue/        # Dashboard, Exams, ReportEditor, PatientSearch, PatientHistory
│   ├── patient/           # Dashboard, Appointments, Records, Profile
│   ├── auth/              # Login (with forgot-password modal)
│   └── public/            # Landing, Booking wizard
└── services/              # All Supabase API calls, fully JSDoc-annotated
    ├── appointments.js
    ├── consentements.js
    ├── exams.js
    ├── notifications.js
    ├── patients.js
    ├── reports.js
    └── users.js
```

---

## 🌐 Internationalization (i18n)

The app supports **French** and **Arabic** (RTL) via a lightweight custom system:

```jsx
const { t, lang, toggleLang } = useLanguage();
// t('dashboard') → "Tableau de Bord" (FR) or "لوحة القيادة" (AR)
```

All strings live in `src/lib/translations.js`. The FR/AR toggle button is in the
DashboardLayout header and applies `dir="rtl"` to the layout root automatically.

---

## 🖨️ PDF Reports

Reports are printed using `window.print()` with a hidden `PrintableReport` component
styled via `@media print` CSS. The printout includes:

- Clinic logo and address header
- Patient name, exam date, radiologue name
- Full HTML report content (from ReactQuill)
- **Official Validated** stamp if `est_valide = true`

---

## 📈 Admin Statistics (`/admin/stats`)

- **Line chart** — monthly RDV trends (3 / 6 / 12 months)
- **Donut pie** — exams by service type
- **Progress bar** — report validation rate
- **Horizontal bar** — most active radiologues by validated report count

Powered by [Recharts](https://recharts.org).

---

## 🔄 CI / Deployment

Deployed via **Vercel** with automatic preview deployments on every push.

```bash
# Production build
npm run build
```

Environment variables are configured in the Vercel project dashboard under
**Settings → Environment Variables** (not in `.env`).

---

## 🤝 Contributing

This is a final-year academic project. Issues and pull requests are welcome for
bug reports or suggestions. Please open an issue before submitting a PR.

---

## 📄 License

MIT © 2025 — Chemloul Radiologie Management

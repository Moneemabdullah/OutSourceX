# 🧩 OutSourceX — Outsourcing Marketplace Platform

> A production-style full-stack outsourcing marketplace inspired by Upwork & Fiverr. Clients post jobs, freelancers bid and collaborate, and payments are secured through an escrow system.

<br />

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe&logoColor=white)](https://stripe.com)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Live URLs](#-live-urls)
- [Features](#-features)
- [User Roles](#-user-roles)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [System Workflows](#-system-workflows)
- [Development Plan](#-development-plan)
- [Future Scope](#-future-scope)
- [License](#-license)

---

## 📌 Overview

**OutSourceX** is a scalable outsourcing marketplace where:

- 🏢 **Clients** post jobs, review proposals, hire freelancers, manage milestones, and release payments
- 💻 **Freelancers** browse jobs, submit proposals, accept contracts, deliver work, and receive payments
- 🛡️ **Admins** moderate the platform, verify profiles, and handle reports
- 👑 **Super Admins** have full control over users, transactions, disputes, and system configuration

---

## 🌐 Live URLs

| Resource      | URL                                                 |
| ------------- | --------------------------------------------------- |
| Frontend Live | `https://outsourcex.vercel.app`                     |
| Backend Live  | `https://outsourcex-backend.onrender.com`           |
| Frontend Repo | `https://github.com/<username>/outsourcex-frontend` |
| Backend Repo  | `https://github.com/Moneemabdullah/OutSourceX`      |
| Demo Video    | `https://drive.google.com/file/d/<video-id>/view`   |

> **Admin Credentials**
>
> - Email: `admin@outsourcex.com`
> - Password: `admin123`

---

## ✨ Features

### 🔐 Authentication & Security

- Email + Password registration with OTP email verification
- Google OAuth via **Better Auth**
- Session-based authentication with HttpOnly cookies
- Role-Based Access Control (RBAC) — 4 roles
- Password hashing (bcrypt), forgot/reset password flow
- Protected routes via Express middleware

### 💼 Job Management

- Clients create, edit, and delete jobs (title, description, budget, deadline, category)
- File attachments via Cloudinary
- Freelancers browse, search, and filter jobs by category and budget

### 📄 Proposal System

- Freelancers submit proposals with cover letter, bid amount, and delivery time
- Clients accept or reject proposals

### 📑 Contract System

- Contract auto-generated when a proposal is accepted
- Includes terms, milestones, and payment details

### 💬 Real-Time Chat

- One-to-one messaging powered by **Socket.io**
- File sharing via Cloudinary
- Typing indicators and seen/delivered status

### 💳 Escrow Payment System (Stripe)

- Client deposits funds → held in escrow
- Funds released to freelancer after milestone completion
- Full transaction history and payment records

### ⭐ Review & Rating System

- Mutual reviews: Client ↔ Freelancer after job completion

### 🔔 Notification System

- Real-time alerts for job updates, proposals, messages, and payments

---

## 👥 User Roles

| Role               | Permissions                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| 🔴 **Super Admin** | Manage all users & admins, view all transactions, handle disputes, promote/demote admins                     |
| 🟠 **Admin**       | Manage clients & freelancers, monitor jobs & proposals, handle reports, verify profiles                      |
| 🔵 **Client**      | Post/edit/delete jobs, review proposals, hire freelancers, manage milestones, release payments, chat, review |
| 🟢 **Freelancer**  | Browse & apply for jobs, submit proposals, manage contracts, chat, receive payments, review                  |

---

## ⚙️ Tech Stack

| Layer              | Technology                             |
| ------------------ | -------------------------------------- |
| **Runtime**        | Node.js >= 22.x                        |
| **Language**       | TypeScript 5.7                         |
| **Framework**      | Express.js 5.x                         |
| **Database**       | PostgreSQL 16                          |
| **ORM**            | Prisma 7.x                             |
| **Authentication** | Better Auth (Email OTP + Google OAuth) |
| **Real-time**      | Socket.io                              |
| **Payments**       | Stripe (Escrow)                        |
| **File Storage**   | Cloudinary + Multer                    |
| **Email**          | Nodemailer (SMTP)                      |
| **Validation**     | Zod                                    |
| **Logging**        | Pino + Pino Pretty                     |
| **Templating**     | EJS (email templates)                  |
| **Linting**        | ESLint + Prettier + Husky              |
| **Frontend**       | Next.js (App Router) + Tailwind CSS    |

---

## 🗂️ Project Structure

```
OutSourceX/
├── prisma/
│   └── schema/
│       ├── schema.prisma          # Generator + datasource config
│       ├── models/                # Prisma model files (per entity)
│       │   ├── auth.prisma        # User, Session, Account, Verification
│       │   ├── client.prisma
│       │   ├── freelencer.prisma
│       │   ├── job.prisma
│       │   ├── jobCatagory.prisma
│       │   ├── proposal.prisma
│       │   ├── contract.prisma
│       │   ├── milestone.prisma
│       │   ├── payment.prisma
│       │   ├── review.prisma
│       │   ├── notification.prisma
│       │   └── expertise.prisma
│       └── enums/                 # Enum definitions
│           ├── user.prisma        # UserRole, UserStatus
│           ├── proposal.prisma    # ProposalStatus
│           ├── contract.prisma    # ContractStatus
│           ├── milestone.prisma   # MilestoneStatus
│           └── paymentStatus.prisma
├── src/
│   ├── server.ts                  # HTTP server entry point
│   ├── index.ts                   # Express app setup
│   └── app/
│       ├── config/
│       │   ├── env.utils.ts       # Zod-validated env variables
│       │   ├── cloudinary.config.ts
│       │   ├── multer.config.ts
│       │   └── stripe.config.ts
│       ├── lib/
│       │   ├── auth.ts            # Better Auth configuration
│       │   ├── prisma.ts          # Prisma client singleton
│       │   └── logger.ts          # Pino logger
│       ├── middlewares/
│       │   ├── checkAuth.middlewares.ts  # RBAC middleware
│       │   ├── GlobalErrorHandeler.ts
│       │   ├── validateRequest.ts
│       │   ├── requestLogger.ts
│       │   └── notFound.ts
│       ├── modules/               # Feature modules (route/controller/service/validation)
│       │   ├── auth/
│       │   ├── user/
│       │   ├── profile/
│       │   ├── category/
│       │   ├── job/
│       │   ├── proposal/
│       │   ├── contract/
│       │   ├── milestone/
│       │   ├── payment/
│       │   ├── review/
│       │   └── notification/
│       ├── routes/
│       │   └── index.ts           # Central router
│       ├── utils/
│       │   ├── QueryBuilder.ts    # Reusable filter/sort/pagination builder
│       │   ├── emailService.ts
│       │   ├── jwt.ts
│       │   ├── token.ts
│       │   ├── cookie.ts
│       │   └── notification.ts
│       ├── errorHelpers/
│       │   ├── AppError.ts
│       │   ├── handlePrismaErrors.ts
│       │   └── handleZodError.ts
│       ├── shared/
│       │   ├── catchAsync.ts
│       │   └── sendResponse.ts
│       ├── interfaces/
│       └── templates/             # EJS email templates
│           ├── otp.ejs
│           ├── welcome.ejs
│           ├── resetPassword.ejs
│           ├── proposalAccepted.ejs
│           └── paymentReleased.ejs
├── bruno/                         # API collection (Bruno client)
├── package.json
├── tsconfig.json
├── eslint.config.js
└── prisma.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js **>= 22.0.0**
- PostgreSQL database (local or cloud — [Neon](https://neon.tech) / [Supabase](https://supabase.com))
- A Cloudinary account
- A Stripe account (test mode is fine)
- A Google Cloud project with OAuth 2.0 credentials
- An SMTP email provider (Gmail App Password / Brevo / Resend)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Moneemabdullah/OutSourceX.git
cd OutSourceX
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

```bash
cp .env.example .env
# Fill in all values — see Environment Variables section below
```

**4. Generate Prisma client**

```bash
npm run db:generate
```

**5. Push schema to database**

```bash
npm run db:push
```

**6. (Optional) Seed admin user**

```bash
npm run db:seed
```

**7. Start development server**

```bash
npm run dev
```

The server will start at `http://localhost:5000`

---

### Available Scripts

| Script                | Description                                  |
| --------------------- | -------------------------------------------- |
| `npm run dev`         | Start dev server with hot reload (tsx watch) |
| `npm run build`       | Compile TypeScript to `dist/`                |
| `npm start`           | Run compiled production build                |
| `npm run lint`        | Run ESLint                                   |
| `npm run lint:fix`    | Auto-fix lint errors                         |
| `npm run format`      | Format with Prettier                         |
| `npm run db:generate` | Generate Prisma client                       |
| `npm run db:push`     | Push schema to DB (no migration history)     |
| `npm run db:migrate`  | Create and run a migration                   |
| `npm run db:studio`   | Open Prisma Studio GUI                       |

---

## 🔑 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# ─── Server ────────────────────────────────────────────
NODE_ENV=development
PORT=5000

# ─── Database ──────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/outsourcex

# ─── Better Auth ───────────────────────────────────────
BETTER_AUTH_SECRET=your_better_auth_secret_min_32_chars
BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN=86400000
BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE=86400000

# ─── JWT ───────────────────────────────────────────────
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# ─── Email (SMTP) ───────────────────────────────────────
EMAIL_SENDER_SMTP_HOST=smtp.gmail.com
EMAIL_SENDER_SMTP_PORT=587
EMAIL_SENDER_SMTP_USER=your_email@gmail.com
EMAIL_SENDER_SMTP_PASS=your_app_password
EMAIL_SENDER_FROM=noreply@outsourcex.com

# ─── Google OAuth ──────────────────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

# ─── Frontend ──────────────────────────────────────────
FRONTEND_URL=http://localhost:3000

# ─── Cloudinary ────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ─── Stripe ────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1`

### 🔐 Auth — `/auth`

| Method | Endpoint                | Description                 | Auth         |
| ------ | ----------------------- | --------------------------- | ------------ |
| `POST` | `/auth/register`        | Register new user           | Public       |
| `POST` | `/auth/login`           | Login with email & password | Public       |
| `GET`  | `/auth/google`          | Initiate Google OAuth       | Public       |
| `GET`  | `/auth/me`              | Get current user            | ✅ All roles |
| `POST` | `/auth/forgot-password` | Send OTP to email           | Public       |
| `POST` | `/auth/reset-password`  | Reset password with OTP     | Public       |
| `POST` | `/auth/change-password` | Change password             | ✅ All roles |

### 👤 Users — `/users`

| Method  | Endpoint                       | Description                | Auth                  |
| ------- | ------------------------------ | -------------------------- | --------------------- |
| `GET`   | `/users/me`                    | Get my account             | ✅ All roles          |
| `PATCH` | `/users/me`                    | Update my account          | ✅ All roles          |
| `GET`   | `/users/dashboard`             | Role-based dashboard stats | ✅ All roles          |
| `GET`   | `/users`                       | Get all users              | ✅ Admin, Super Admin |
| `GET`   | `/users/transactions`          | All transactions           | ✅ Admin, Super Admin |
| `GET`   | `/users/disputes`              | All disputes               | ✅ Super Admin        |
| `POST`  | `/users/admins/promote`        | Promote user to Admin      | ✅ Super Admin        |
| `PATCH` | `/users/admins/:userId/demote` | Demote Admin to user       | ✅ Super Admin        |

### 💼 Jobs — `/jobs`

| Method   | Endpoint       | Description                    | Auth      |
| -------- | -------------- | ------------------------------ | --------- |
| `GET`    | `/jobs`        | Browse all jobs (with filters) | Public    |
| `POST`   | `/jobs`        | Create a job                   | ✅ Client |
| `PATCH`  | `/jobs/:jobId` | Update a job                   | ✅ Client |
| `DELETE` | `/jobs/:jobId` | Delete a job                   | ✅ Client |

### 📄 Proposals — `/proposals`

| Method  | Endpoint                        | Description                  | Auth             |
| ------- | ------------------------------- | ---------------------------- | ---------------- |
| `GET`   | `/proposals`                    | Get proposals                | ✅ All roles     |
| `POST`  | `/proposals`                    | Submit a proposal            | ✅ Freelancer    |
| `PATCH` | `/proposals/:proposalId/accept` | Accept a proposal            | ✅ Client        |
| `GET`   | `/proposals/job/:jobId`         | Proposals for a specific job | ✅ Client, Admin |

### 📑 Contracts — `/contracts`

| Method | Endpoint     | Description                   | Auth                  |
| ------ | ------------ | ----------------------------- | --------------------- |
| `GET`  | `/contracts` | Get my contracts              | ✅ Client, Freelancer |
| `POST` | `/contracts` | Create contract from proposal | ✅ Client             |

### 🎯 Milestones — `/milestones`

| Method  | Endpoint                   | Description                                 | Auth         |
| ------- | -------------------------- | ------------------------------------------- | ------------ |
| `GET`   | `/milestones`              | Get milestones (filter by jobId/contractId) | ✅ All roles |
| `POST`  | `/milestones`              | Create milestone                            | ✅ Client    |
| `PATCH` | `/milestones/:milestoneId` | Update milestone status                     | ✅ Client    |

### 💳 Payments — `/payments`

| Method  | Endpoint                       | Description                    | Auth      |
| ------- | ------------------------------ | ------------------------------ | --------- |
| `POST`  | `/payments`                    | Create escrow payment (Stripe) | ✅ Client |
| `PATCH` | `/payments/:paymentId/release` | Release payment to freelancer  | ✅ Client |

### ⭐ Reviews — `/reviews`

| Method | Endpoint   | Description              | Auth                  |
| ------ | ---------- | ------------------------ | --------------------- |
| `POST` | `/reviews` | Submit a review & rating | ✅ Client, Freelancer |

### 🔔 Notifications — `/notifications`

| Method  | Endpoint                  | Description          | Auth         |
| ------- | ------------------------- | -------------------- | ------------ |
| `GET`   | `/notifications`          | Get my notifications | ✅ All roles |
| `PATCH` | `/notifications/:id/read` | Mark as read         | ✅ All roles |

### 🗂️ Categories — `/categories`

| Method | Endpoint      | Description            | Auth                  |
| ------ | ------------- | ---------------------- | --------------------- |
| `GET`  | `/categories` | Get all job categories | Public                |
| `POST` | `/categories` | Create a category      | ✅ Admin, Super Admin |

### 👤 Profiles — `/profiles`

| Method  | Endpoint    | Description                | Auth         |
| ------- | ----------- | -------------------------- | ------------ |
| `GET`   | `/profiles` | Get a profile (`?userId=`) | ✅ All roles |
| `PATCH` | `/profiles` | Update my profile          | ✅ All roles |

---

## 🗄️ Database Schema

### Core Models

```
User ──────────────── Session, Account, Verification (Better Auth)
  │
  ├── Client ────────── Job ──── Proposal ─── Contract ─── Payment
  │                      │                        │
  │                      └── Milestone            └── Review
  │
  └── Freelancer ─────── Proposal, Contract, Review
                          │
                          └── Expertise
```

### Enums

| Enum              | Values                                                |
| ----------------- | ----------------------------------------------------- |
| `UserRole`        | `SUPER_ADMIN`, `ADMIN`, `CLIENT`, `FREELANCER`        |
| `UserStatus`      | `ACTIVE`, `INACTIVE`, `SUSPENDED`                     |
| `ProposalStatus`  | `PENDING`, `ACCEPTED`, `REJECTED`                     |
| `ContractStatus`  | `ACTIVE`, `COMPLETED`, `CANCELLED`, `DISPUTED`        |
| `MilestoneStatus` | `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`  |
| `PaymentStatus`   | `PENDING`, `ESCROW`, `RELEASED`, `FAILED`, `REFUNDED` |

---

## 🔄 System Workflows

```
REGISTRATION
User selects role → Registers → OTP sent → Email verified → Profile created

JOB POSTING
Client creates job → Job visible to all freelancers

BIDDING
Freelancer submits proposal (cover letter + bid) → Client reviews

HIRING
Client accepts proposal → Contract auto-created → Chat enabled

PAYMENT (ESCROW)
Client deposits → Funds held in escrow → Freelancer completes work
→ Client releases → Freelancer receives payment

COMPLETION
Job marked complete → Both parties submit reviews
```

---

## 🛠️ Development Plan

### ✅ Phase 1 — MVP

- [x] Authentication (Email + Google OAuth, OTP verification)
- [x] Role system (RBAC with 4 roles)
- [x] Job posting and management
- [x] Proposal submission and acceptance
- [x] Hiring flow (contract creation)

### ✅ Phase 2 — Communication & Contracts

- [x] Real-time chat system (Socket.io)
- [x] Contract and milestone management

### ✅ Phase 3 — Payments & Reviews

- [x] Stripe escrow payment system
- [x] Review & rating system
- [x] Notification system

---

## 🚀 Future Scope

- 🤖 AI-based job matching and recommendations
- 📹 Video call system for client-freelancer meetings
- 🏆 Freelancer ranking algorithm
- 📱 Mobile application (React Native)
- 💰 Commission and fee configuration system

---

## 📄 License

This project is developed for **educational purposes** as part of an academic assignment.

---

<div align="center">

Made with ❤️ by [Moneem Abdullah](https://github.com/Moneemabdullah)

</div>

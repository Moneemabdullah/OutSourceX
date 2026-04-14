# 🧩 OutsourceX – Outsourcing Marketplace Platform

A full-stack outsourcing marketplace platform inspired by Upwork & Fiverr.

---

## 📌 Project Overview

**OutsourceX** is a platform where clients can post jobs and freelancers can apply, collaborate, and get paid securely. It includes job management, bidding, contracts, payments, and real-time communication.

---

## 🎯 Objective

Build a scalable platform where:

- Clients can post jobs
- Freelancers can apply and bid
- Work is managed via contracts
- Payments are handled securely (escrow)
- Real-time communication is enabled

---

## 👥 User Roles

### 🔴 Super Admin

- Manage all users (Admin, Client, Freelancer)
- Approve/reject admins
- View all transactions
- Handle disputes
- Configure system settings (fees, commissions)

---

### 🟠 Admin

- Manage users (Client & Freelancer)
- Monitor jobs & proposals
- Handle reports/complaints
- Verify freelancer profiles
- Moderate content

---

### 🔵 Client

- Register/Login (Email + Google OAuth)
- Create profile
- Post/Edit/Delete jobs
- View proposals
- Hire freelancers
- Create milestones
- Release payments
- Chat with freelancers
- Give reviews

---

### 🟢 Freelancer

- Register/Login (Email + Google OAuth)
- Create profile (skills, portfolio)
- Browse jobs
- Apply with proposals
- Bid price
- Accept contracts
- Submit work
- Chat with clients
- Receive payment
- Give reviews

---

## 🔐 Authentication & Security

- Email + Password
- Google OAuth (Better Auth)
- JWT / Session-based authentication
- Role-Based Access Control (RBAC)
- Password hashing (bcrypt)
- Protected routes with middleware

---

## 🧱 Core Features

### 📌 Job Management

**Client:**

- Create job (title, description, budget, deadline, skills)
- Upload attachments (Cloudinary)

**Freelancer:**

- Browse jobs
- Filter/search jobs
- Apply with proposals

---

### 📌 Proposal System

**Freelancer submits:**

- Cover letter
- Bid amount
- Delivery time

**Client:**

- Accept / Reject proposals

---

### 📌 Contract System

- Auto-created after hiring
- Includes:
    - Terms
    - Milestones
    - Payment details

---

### 📌 Real-Time Chat System

- One-to-one messaging (Socket.io)
- File sharing (Cloudinary)
- Typing indicator
- Seen/delivered status

---

### 📌 Payment System (Escrow)

**Flow:**

1. Client deposits money
2. Stored in escrow
3. Freelancer completes milestone
4. Client releases payment

**Features:**

- Transaction history
- Payment records
- Commission system

---

### 📌 Review & Rating System

- Client → Freelancer rating
- Freelancer → Client rating

---

### 📌 Notification System

- New job alerts
- Proposal updates
- Messages
- Payment notifications

---

### 📌 File & Media Handling

Uploads:

- Profile images
- Job attachments
- Chat files

Storage:

- Cloudinary

---

## 🗄️ Database (Prisma + PostgreSQL)

### Core Models:

- User
- Profile
- Job
- Proposal
- Contract
- Milestone
- Message
- Payment
- Review
- Notification

---

## ⚙️ Tech Stack

### Frontend

- Next.js (App Router)
- Tailwind CSS

### Backend

- Node.js
- Express.js

### Database

- PostgreSQL
- Prisma ORM

### Realtime

- Socket.io

### Authentication

- Better Auth (Google OAuth + Email)

### Storage

- Cloudinary

---

## 🔄 System Workflows

### ✅ User Registration

User selects role → registers → profile created

### ✅ Job Posting

Client posts job → visible to freelancers

### ✅ Bidding

Freelancer submits proposal → client reviews

### ✅ Hiring

Client accepts proposal → contract created

### ✅ Communication

Real-time chat starts

### ✅ Payment

Escrow system → release after completion

### ✅ Completion

Job marked complete → review submitted

---

## 🚫 Non-Functional Requirements

- ⚡ Fast API performance
- 🔒 Secure data & authentication
- 📱 Responsive UI
- 📈 Scalable architecture
- 🧪 Proper validation & error handling

---

## 🧠 Constraints

- Payment system may be simulated
- WebSocket must handle multiple users
- File uploads should be optimized

---

## 🚀 Future Scope

- AI-based job matching
- Video call system
- Freelancer ranking algorithm
- Mobile application

---

## 🛠️ Development Plan (Recommended)

### Phase 1 (MVP)

- Authentication
- Role system
- Job posting
- Proposal system
- Hiring flow

### Phase 2

- Chat system (Socket.io)
- Contract & milestone

### Phase 3

- Payment system
- Reviews & ratings
- Notifications

---

## 📄 License

This project is for educational purposes.

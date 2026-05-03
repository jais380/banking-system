# JAI BANK – Fintech Backend API

A secure and scalable **Banking System API** built with **Node.js, Express, and MongoDB**, focused on handling real-world financial operations like authentication, account management, and money transfers with strong data integrity.

---

# Features

* User Authentication (JWT-based)
* OTP Email Verification Flow
* Account Creation & Profile Retrieval
* Secure Money Transfers (NIBSS Integration)
* Transaction History Tracking
* Atomic Operations & Concurrency Handling
* Smart Reconciliation Logic
* Double-entry Transaction Logging

---

# 🛠️ Tech Stack

* **Node.js**
* **Express.js**
* **MongoDB (Mongoose)**
* **JWT Authentication**
* **Nodemailer (Email सेवा)**
* **External API (NIBSS Integration)**

---

# Project Structure

```bash
.
├── config/
│   └── db.js
├── controllers/
│   ├── auth-controller.js
│   ├── account-controller.js
│   └── transaction-controller.js
├── middleware/
│   └── auth.js
├── routes/
│   ├── auth-routes.js
│   ├── account-routes.js
│   └── transaction-routes.js
├── models/
├── utils/
├── services/
├── .env
├── server.js
└── package.json
```

---

# Setup & Installation

### Clone the Repository

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

---

### Install Dependencies

```bash
npm install
```

---

### Setup Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5050
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

---

### Run the Server

```bash
npm run start:dev
```

Server runs on:

```bash
http://localhost:5050
```

---

# API Documentation

👉 Full Postman Documentation:
https://documenter.getpostman.com/view/42947527/2sBXqKpKy6

---

# API Endpoints

## Authentication

| Method | Endpoint            | Description     |
| ------ | ------------------- | --------------- |
| POST   | `/api/register`     | Create new user |
| POST   | `/api/resend-otp`   | Resend OTP      |
| POST   | `/api/verify-email` | Verify email    |
| POST   | `/api/login`        | Login user      |

---

## Account

| Method | Endpoint               | Description              |
| ------ | ---------------------- | ------------------------ |
| GET    | `/api/account/profile` | Get user account profile |

---

## Transactions

| Method | Endpoint                           | Description       |
| ------ | ---------------------------------- | ----------------- |
| GET    | `/api/name-enquiry/:accountNumber` | Validate account  |
| POST   | `/api/transfer`                    | Transfer money    |
| GET    | `/api/transaction-history`         | View transactions |

---

# Security & Architecture Highlights

### Atomic Balance Updates

Uses MongoDB `$inc` and `$gte` to prevent **race conditions and double spending**.

---

### Transaction Safety (ACID)

All critical operations are wrapped in **Mongoose sessions**:

* ✔ Commit on success
* ❌ Rollback on failure

---

### Double Entry System

Every transfer is logged as:

* **DEBIT (Sender)**
* **CREDIT (Receiver)**

Ensures **auditability and traceability**.

---

### Data Integrity First

* No partial writes
* No inconsistent balances
* External API failures handled safely

---

# Testing

All endpoints were tested using **Postman**.

👉 Import the collection or use the hosted docs above.

---

# Health Check

```bash
GET /test
```

Response:

```bash
Server is alive!
```

---

# Acknowledgement

Built as part of a **Fintech Backend Assignment** under guidance from **TS Academy**.

---

# Author

**Ani Simon**
Backend Developer (Node.js | Express | MongoDB)

---

# Final Note

This project focuses on **real-world backend challenges**:

* concurrency
* consistency
* external system integration

More improvements and features coming soon 🚀

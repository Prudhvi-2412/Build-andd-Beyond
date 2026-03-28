# Build and Beyond

Build and Beyond is a full-stack construction marketplace platform connecting customers, companies, and specialist workers (architects and interior designers). The current codebase includes role-based portals, milestone-driven execution, escrow-style payments, real-time chat, complaint workflows, admin analytics, and platform manager operations.

## Current Feature Set

### Authentication and Account Security
- Role-based signup and login for customer, company, and worker.
- Google login support.
- Email OTP flows for signup verification and password reset.
- Optional login two-factor authentication (2FA) with verify and resend flows.
- Cookie-based session handling and role-aware redirects.

### User Roles and Portals
- Customer portal: discovery, hiring requests, bid space, ongoing projects, chat, and payment history.
- Company portal: dashboard, project requests, bids, proposals, hiring, employees, ongoing work, revenue, and settings.
- Worker portal: jobs, join company, ongoing projects, milestone submissions, revenue, and profile/settings.
- Admin and superadmin portal: analytics, moderation, revenue intelligence, settings, and platform manager management.
- Platform manager portal: verification tasks, assigned complaints, company payment fee collection queue, and profile/password management.

### Project and Collaboration Workflows
- Architect hiring requests and interior design requests.
- Construction project requests, company bidding, and proposal acceptance/rejection.
- Worker-company request and offer flows (accept/decline).
- Milestone lifecycle including approve, reject, request revision, and project completion updates.

### Payments and Finance
- Razorpay-backed payment flows for worker projects and construction milestone phases.
- Escrow-like hold/release handling for milestone payouts.
- Company platform fee flow, including platform manager collection queue.
- Worker earnings, transaction history, and withdrawal requests.
- Admin revenue analytics and platform revenue intelligence endpoints.

### Communication and Trust
- Real-time Socket.IO chat with access control per room and online status updates.
- Complaint submission and threaded reply handling.
- Auto-assignment of verification and complaint tasks to platform managers.
- Bidirectional review and rating flows with review-status checks.

### Platform Tooling and Operations
- Auto-generated OpenAPI/Swagger docs from mounted routes.
- Redis client and cache utility integration with cache stats/reset endpoints.
- Security middleware: helmet, request logging, rate limiting, and centralized error middleware.
- Multipart uploads with Multer and Cloudinary storage.
- MongoDB index management script for create/sync/diff workflows.

## Tech Stack

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- Socket.IO
- Redis (optional cache layer)
- Razorpay
- Cloudinary + Multer
- Swagger UI / OpenAPI

### Frontend
- React 19
- Vite
- React Router 7
- Redux Toolkit
- Axios
- Recharts
- Socket.IO Client

## Local Development Setup

### Prerequisites
- Node.js (v18+ recommended)
- npm
- MongoDB (local or Atlas)
- Optional but recommended for full feature coverage: Redis, Cloudinary account, Razorpay keys, Google OAuth client

### 1) Install dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

### 2) Configure environment variables

Backend uses environment variables consumed in [backend/config/constants.js](backend/config/constants.js) and relevant controllers.

Common backend variables:
- PORT (default: 3000)
- MONGO_URI
- JWT_SECRET
- FRONTEND_URL and/or FRONTEND_URLS (comma-separated)
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- REDIS_URL
- REDIS_ENABLED (set false to disable Redis cache)
- REDIS_DEFAULT_TTL_SECONDS
- ADMIN_EMAIL
- ADMIN_PASSWORD
- ADMIN_PASSKEY
- PLATFORM_MANAGER_EMAIL
- PLATFORM_MANAGER_PASSWORD
- PLATFORM_MANAGER_PASSKEY
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- GOOGLE_CLIENT_ID

Frontend variables referenced in source:
- VITE_API_URL
- VITE_GOOGLE_CLIENT_ID
- VITE_RAZORPAY_KEY_ID
- VITE_ENABLE_TEST_PAYMENT_SKIP (development/testing only)

### 3) Run the apps

Backend:

```bash
cd backend
node app.js
```

Frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger UI: http://localhost:3000/api-docs

## API Surface (High Level)

All API routes are mounted in [backend/app.js](backend/app.js), primarily under /api.

### Auth
- /api/signup
- /api/login
- /api/login/google
- /api/login/2fa/verify
- /api/login/2fa/resend
- /api/email-otp/send
- /api/email-otp/verify
- /api/reset-password
- /api/2fa/status
- /api/session
- /api/logout

### Customer
- /api/customer/profile
- /api/job_status
- /api/ongoing_projects
- /api/customer/payment-history
- /api/api/customer/favorites (legacy path naming retained in code)

### Company
- /api/companydashboard
- /api/companybids
- /api/project_requests
- /api/companyongoing_projects
- /api/companyhiring
- /api/companyrevenue
- /api/company/submit-proposal
- /api/company/platform-fee-invoice

### Worker
- /api/worker/dashboard
- /api/worker/jobs
- /api/worker/ongoing-projects
- /api/worker/my-company
- /api/worker/submit-milestone

### Payments
- /api/payment/worker/*
- /api/payment/company/create-order
- /api/payment/company/verify-payment
- /api/payment/company/release-milestone
- /api/payment/company/platform-fee/*
- /api/payment/company/summary/:projectId

### Admin and Platform Manager
- /api/admin/login
- /api/admin/verify-session
- /api/admindashboard
- /api/admin/analytics
- /api/admin/revenue
- /api/admin/revenue/platform-intelligence
- /api/admin/settings
- /api/admin/platform-managers/* (superadmin-managed)
- /api/platform-manager/login
- /api/platform-manager/dashboard
- /api/platform-manager/verification/:taskId/process
- /api/platform-manager/complaint/:complaintId/reply
- /api/platform-manager/company-payments

### Chat and Complaints
- /api/chat/:roomId
- /api/complaints

## Database and Maintenance Scripts

Run from [backend](backend):

```bash
node migrations/addMilestoneFields.js
node migrations/fixExistingProjectPayments.js
node scripts/sync-indexes.js
```

## MongoDB Indexing

MongoDB indexing is already implemented in model schemas (single-field and compound indexes) across major collections such as projects, bids, transactions, complaints, verification tasks, and worker/company assignment flows.

Special index types present in code:
- Unique index: OTP email+purpose uniqueness.
- TTL index: OTP expiration cleanup via expiresAt.

Index operations are managed with [backend/scripts/sync-indexes.js](backend/scripts/sync-indexes.js):

```bash
cd backend

# Safe mode (default): create only missing indexes
node scripts/sync-indexes.js

# Dry run: show index differences without applying changes
node scripts/sync-indexes.js --dry-run

# Full sync: align indexes exactly with schema definitions (can drop unmanaged indexes)
node scripts/sync-indexes.js --full-sync
```

Recommended production workflow:
1. Run dry-run first.
2. Run safe create mode during normal deployments.
3. Use full-sync only in controlled maintenance windows.

## Project Structure

```text
.
├── backend/
│   ├── app.js
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── migrations/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   └── utils/
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── Pages/
    │   ├── store/
    │   └── utils/
    ├── index.html
    └── vite.config.js
```

## Notes

- API naming is partly legacy and includes a mix of old and new path conventions. Check Swagger for the exact current route contract.
- Redis is optional. If unavailable, the app continues without cache.
- For chat and payments, run backend and frontend together and verify environment keys are set.

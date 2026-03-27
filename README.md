# Build and Beyond

Build and Beyond is a full‑stack platform that connects customers with construction companies and specialized workers (Architects and Interior Designers). It supports project posting, bidding, hiring, milestone tracking, real‑time chat, reviews, and admin moderation.

## Features (from the codebase)

- **Role‑based dashboards** for Customer, Company, Worker, and Admin
- **Project posting & bidding** for construction and design requests
- **Worker hiring** with offers/accept/decline flows
- **Milestones** with approvals, revisions, and completion updates
- **Reviews & ratings** for completed projects
- **Complaints & admin replies**
- **Admin verification** for companies/workers and moderation controls
- **File uploads** (documents, images, resumes, project updates)

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT auth + cookies
- Multer + Cloudinary (uploads)
- EJS (server view engine)

### Frontend
- React 19 + Vite
- React Router 7
- Redux Toolkit
- Axios

## Requirements

- Node.js (v16+ recommended)
- npm
- MongoDB (local or Atlas)

## Installation

### Backend
From [backend/](backend/):

- Install dependencies: `npm install`
- Start server: `node app.js`

The API runs on http://localhost:3000

### Frontend
From [frontend/](frontend/):

- Install dependencies: `npm install`
- Start dev server: `npm run dev`

The UI runs on http://localhost:5173

## Configuration

Backend configuration is currently stored in [backend/config/constants.js](backend/config/constants.js). Update these values before running in production:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PASSKEY`

> Recommendation: move secrets to environment variables and keep them out of version control.

## Key Routes (high‑level)

### Auth
- `/api/signup` (multipart form with documents)
- `/api/login`
- `/api/logout`
- `/api/session`

### Customer
- `/api/customer/profile`
- `/api/customer/favorites` (GET/POST/DELETE)
- `/api/customer/review`
- `/api/customer/review-status/:projectType/:projectId`

### Company
- `/api/companydashboard`
- `/api/companybids`
- `/api/companyrevenue`
- `/api/submit-bid`
- `/api/company/submit-proposal`

### Worker
- `/api/worker/dashboard`
- `/api/worker/jobs`
- `/api/worker/ongoing-projects`
- `/api/worker/submit-milestone`
- `/api/worker/review`

### Projects
- `/api/projects`
- `/api/projects/:id`
- `/api/customer/submit-bid`
- `/api/customer/accept-bid`
- `/api/customer/decline-bid`

### Admin
- `/api/admin/login`
- `/api/admin/verify-session`
- `/api/admindashboard`
- `/api/admin/revenue`
- `/api/admin/verify-company/:id`
- `/api/admin/verify-worker/:id`

### Chat & Complaints
- `/api/chat/:roomId` (protected)
- `/api/complaints/*`



## File Uploads

- Uploads are handled via Multer and stored via Cloudinary.
- Static access is exposed at `/uploads` for locally stored files.

## Project Structure

```
FDFED-React-App/
├── backend/
│   ├── app.js
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── migrations/
│   ├── models/
│   ├── routes/
│   └── utils/
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── Pages/
    │   └── store/
    ├── index.html
    └── vite.config.js
```

## Migration

For existing data, run the milestone migration:

- `node migrations/addMilestoneFields.js`

## Notes

- Make sure MongoDB is running before starting the backend.
- Run both backend and frontend for a fully working app.
- CORS are configured for the Vite dev server (5173).

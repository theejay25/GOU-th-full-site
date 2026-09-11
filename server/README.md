# Backend — JWT Auth + MongoDB + Nodemailer + Program Applications + Contact + Image-only Blog (ES Modules)

Node.js/Express REST API, now written in **ES Modules** (`import`/`export`,
`"type": "module"` in `package.json`) instead of CommonJS. Everything from
before is preserved — JWT auth with email verification & password reset,
MongoDB via Mongoose, image-only blog posts via Multer — plus two new pieces:
program applications (internship / residency / caregiver) and a "get in
touch" contact form that emails the hospital.

## Folder structure

```
backend-mongo-esm/
├── server.js
├── .env.example
├── src/
│   ├── app.js
│   ├── config/
│   │   ├── db.js
│   │   └── mailer.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── upload.middleware.js
│   │   ├── validate.middleware.js
│   │   └── error.middleware.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── blog.controller.js
│   │   ├── application.controller.js   # new
│   │   └── contact.controller.js       # new
│   ├── models/
│   │   ├── user.model.js
│   │   ├── blog.model.js
│   │   ├── application.model.js        # new
│   │   └── contactMessage.model.js     # new
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── blog.routes.js
│   │   ├── application.routes.js       # new
│   │   └── contact.routes.js           # new
│   └── utils/
│       ├── jwt.util.js
│       ├── email.util.js
│       ├── response.util.js
│       └── asyncHandler.util.js
└── uploads/
```

## What changed from the CommonJS version

- Every file uses `import`/`export` instead of `require`/`module.exports`.
- `package.json` has `"type": "module"`.
- `__dirname`/`__filename` (used in `upload.middleware.js` and `app.js`) are
  rebuilt manually via `fileURLToPath(import.meta.url)`, since ESM doesn't
  provide them automatically.
- `server.js` loads env vars via `import "dotenv/config"` instead of
  `require("dotenv").config()`.
- Logic is otherwise unchanged — same auth flow, same blog rules, same error
  handling.

## Setup

```bash
npm install
cp .env.example .env   # fill in MONGO_URI, JWT secrets, SMTP creds, HOSPITAL_CONTACT_EMAIL
npm run dev
```

## New: Program applications (`/api/applications`)

Three required endpoints, served by one route pattern that restricts the
`:program` value to exactly these three:

| Method | Route                              | Auth | Body                                    |
|--------|-------------------------------------|------|-------------------------------------------|
| POST   | `/api/applications/internship`      | No   | `fullName, email, phone?, message?`       |
| POST   | `/api/applications/residency`       | No   | `fullName, email, phone?, message?`       |
| POST   | `/api/applications/caregiver`       | No   | `fullName, email, phone?, message?`       |
| GET    | `/api/applications`                 | Yes  | — (query: `?program=&status=&page=&limit=`) |
| GET    | `/api/applications/:id`             | Yes  | —                                          |

Each submission is saved to MongoDB (`Application` collection, with
`programType` set automatically from the URL) and triggers two emails: one
to `HOSPITAL_CONTACT_EMAIL` notifying staff, one to the applicant confirming
receipt. **The application is saved even if the emails fail to send** — a
flaky SMTP connection never loses someone's submission.

Rate-limited to 10 submissions/hour per IP to prevent spam.

> The `GET` (admin) routes are currently protected by the same JWT `protect`
> middleware as everything else — any logged-in user can view applications.
> There's no admin/staff role yet. If you need to restrict this to hospital
> staff specifically, say so and I'll add a role field to the user model and
> an `isAdmin`/`requireRole` middleware — didn't want to build that
> speculatively without you confirming it's needed.

**Example:**
```bash
curl -X POST http://localhost:5000/api/applications/residency \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Jane Doe","email":"jane@example.com","phone":"08012345678","message":"Interested in the pediatrics track"}'
```

## New: Contact form (`/api/contact`)

| Method | Route           | Auth | Body                                          |
|--------|-----------------|------|--------------------------------------------------|
| POST   | `/api/contact`  | No   | `name, email, phone?, subject, message`          |

Saves the message to MongoDB (`ContactMessage` collection) and sends two
emails: one to `HOSPITAL_CONTACT_EMAIL` (with `replyTo` set to the visitor's
address, so hitting "Reply" in the hospital inbox goes straight back to
them), one auto-reply to the visitor confirming receipt. Rate-limited to
10/hour per IP.

**Example:**
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","subject":"Visiting hours","message":"What are your visiting hours on weekends?"}'
```

## Everything else (unchanged behavior)

### Auth (`/api/auth`)

| Method | Route                        | Auth | Body                          |
|--------|------------------------------|------|--------------------------------|
| POST   | `/register`                  | No   | `name, email, password`        |
| GET    | `/verify-email/:token`       | No   | —                               |
| POST   | `/resend-verification`       | No   | `email`                         |
| POST   | `/login`                     | No   | `email, password`               |
| POST   | `/refresh`                   | No   | `refreshToken`                  |
| POST   | `/logout`                    | Yes  | —                               |
| GET    | `/profile`                   | Yes  | —                               |
| POST   | `/forgot-password`           | No   | `email`                         |
| POST   | `/reset-password/:token`     | No   | `password`                      |

### Blogs (`/api/blogs`) — image-only, Multer

| Method | Route          | Auth  | Body (multipart/form-data)   |
|--------|----------------|-------|--------------------------------|
| GET    | `/`            | No    | —                               |
| GET    | `/:id`         | No    | —                               |
| GET    | `/user/mine`   | Yes   | —                               |
| POST   | `/`            | Yes   | `title, content, image`         |
| PUT    | `/:id`         | Yes*  | `title, content, image?`        |
| DELETE | `/:id`         | Yes*  | —                               |

\* Only the post's author can update/delete it.

## Notes

- All previously-noted good practices remain: bcrypt hashing, refresh token
  rotation, hashed one-time tokens for verification/reset, ownership checks,
  centralized error handling (Multer + Mongoose + generic), rate limiting on
  every public-write endpoint, `helmet` + `cors`.
- Contact/application emails are sent with `try/catch` around them
  specifically so a submission is never lost just because email delivery
  fails — you'll see a `console.error` logged, but the person still gets a
  201 response and their data is in MongoDB.

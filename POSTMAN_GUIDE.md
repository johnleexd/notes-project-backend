# 📬 Postman Testing Guide — Portfolio Backend API (Notes)

This guide walks you through testing **every feature** of the API step-by-step using Postman. Follow the sections in order — each step builds on the previous one.

---

## 📋 Table of Contents

1. [Setup](#-1-setup)
2. [Signup (Create Account)](#-2-signup---create-account)
3. [Verify Email](#-3-verify-email)
4. [Login](#-4-login)
5. [Create Note](#-5-create-note-c-in-crud)
6. [Get All Notes](#-6-get-all-notes-r-in-crud)
7. [Get Single Note](#-7-get-single-note-r-in-crud)
8. [Update Note](#-8-update-note-u-in-crud)
9. [Delete Note](#-9-delete-note-d-in-crud)
10. [Refresh Token](#-10-refresh-token)
11. [Logout](#-11-logout)
12. [Error Testing](#-12-error-testing--edge-cases)
13. [Admin Features (Bonus)](#-13-admin-features-bonus)
14. [Access Control Testing](#-14-access-control-testing-user-isolation)
15. [Quick Reference](#-15-quick-reference-table)

---

## 🔧 1. Setup

### Start the Server

```bash
npm run dev
```

The server starts at: **`http://localhost:8000`**

You should see output like:
```
--------------------------------------------------
🚀 Portfolio API started successfully!
📡 URL: http://localhost:8000
🌍 MODE: development
--------------------------------------------------
```

### Check Server Health

- **Method:** `GET`
- **URL:** `http://localhost:8000/`

✅ **Expected (200):**
```json
{
  "status": "success",
  "message": "Portfolio API instance is healthy",
  "timestamp": "2026-05-07T02:00:00.000Z",
  "environment": "development"
}
```

### Postman Settings

1. Open Postman
2. Create a new **Collection** called `Portfolio API`
3. Set the collection variable `BASE_URL` to `http://localhost:8000/api`
4. **Important:** Go to **Settings → General → Automatically follow redirects** → Turn **ON**
5. **Important:** Go to **Settings → General → Send cookies** → Turn **ON** (needed for refresh token)

---

## 📝 2. Signup — Create Account

This tests the registration flow with schema validation and email verification sending.

### Request

- **Method:** `POST`
- **URL:** `http://localhost:8000/api/auth/signup`
- **Headers:**
  | Key | Value |
  |-----|-------|
  | Content-Type | application/json |
- **Body (raw JSON):**
```json
{
  "name": "John Doe",
  "email": "your-real-email@gmail.com",
  "password": "SecurePassword123"
}
```

> ⚠️ **Use a REAL email address** you can access — you'll need to get the verification token from the email.

### ✅ Expected Response (201 Created):
```json
{
  "status": "success",
  "message": "Account created successfully. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "some-uuid-here",
      "name": "John Doe",
      "email": "your-real-email@gmail.com"
    }
  }
}
```

### 📌 What to Save:
- Copy the `id` value — you'll need it later

### Test Validation Errors:

Try sending with an **empty body** `{}`:
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "name": ["Name is required"],
    "email": ["Email is required"],
    "password": ["Password is required"]
  }
}
```

Try with a **short password** (`"password": "123"`):
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "password": ["Password must be at least 8 characters"]
  }
}
```

Try **signing up again** with the same email:
```json
{
  "status": "error",
  "message": "An account with this email already exists"
}
```
Status code: **409 Conflict**

---

## ✉️ 3. Verify Email

After signup, check your email inbox. You should receive a verification email with a **"Verify Email Address"** button.

### Option A: Get Token from Email

1. Open the email from your app
2. Right-click the **"Verify Email Address"** button → Copy link
3. The link looks like: `http://localhost:8000/api/auth/verify-email?token=abc123def456...`
4. Copy just the **token value** after `?token=`

### Option B: Get Token from Database (if email not working)

Run this SQL query in your database tool (e.g., pgAdmin, Neon console):
```sql
SELECT token FROM "Token" WHERE type = 'EMAIL_VERIFY' ORDER BY "createdAt" DESC LIMIT 1;
```

### Request

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/auth/verify-email?token=PASTE_YOUR_TOKEN_HERE`
- **Headers:** None needed

### ✅ Expected Response (200 OK):
```json
{
  "status": "success",
  "message": "Email verified successfully! You can now log in.",
  "data": {
    "user": {
      "id": "some-uuid-here",
      "name": "John Doe",
      "email": "your-real-email@gmail.com",
      "emailVerified": "2026-05-07T02:05:30.000Z"
    }
  }
}
```

### Test Error Cases:

Try with a **fake token**:
- **URL:** `http://localhost:8000/api/auth/verify-email?token=invalid-token-12345`
- **Expected (400):** `"message": "Invalid verification token"`

Try **using the same token again**:
- **Expected (400):** `"message": "Token has already been used"`

Try with **no token**:
- **URL:** `http://localhost:8000/api/auth/verify-email`
- **Expected (400):** `"message": "Verification token is required"`

---

## 🔐 4. Login

Now login with your verified account to get your JWT tokens.

### Request

- **Method:** `POST`
- **URL:** `http://localhost:8000/api/auth/login`
- **Headers:**
  | Key | Value |
  |-----|-------|
  | Content-Type | application/json |
- **Body (raw JSON):**
```json
{
  "email": "your-real-email@gmail.com",
  "password": "SecurePassword123"
}
```

### ✅ Expected Response (200 OK):
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "some-uuid-here",
      "name": "John Doe",
      "email": "your-real-email@gmail.com",
      "role": "USER"
    }
  }
}
```

### 📌 What to Save:
- **Copy the `accessToken` value** — you'll need this for ALL subsequent requests
- The `refreshToken` is automatically saved as a **cookie** by Postman (check the Cookies tab)

### How to Use the Token in Subsequent Requests:

For every request below, go to the **Authorization** tab and:
1. Select **Type:** `Bearer Token`
2. Paste your access token in the **Token** field

Or manually add a header:
| Key | Value |
|-----|-------|
| Authorization | Bearer eyJhbGciOiJ... (paste your full token) |

### Test Error Cases:

Try with **wrong password**:
```json
{
  "email": "your-real-email@gmail.com",
  "password": "WrongPassword123"
}
```
- **Expected (401):** `"message": "Invalid email or password"`

Try with **unverified email** (create a NEW account and try to login without verifying):
- **Expected (403):** `"message": "Please verify your email before logging in"`

---

## ➕ 5. Create Note (C in CRUD)

### Request

- **Method:** `POST`
- **URL:** `http://localhost:8000/api/notes`
- **Headers:**
  | Key | Value |
  |-----|-------|
  | Authorization | Bearer YOUR_ACCESS_TOKEN |
  | Content-Type | application/json |
- **Body (raw JSON):**
```json
{
  "title": "My First Note",
  "content": "This is the content of my first note. It can be as long as I want!",
  "category": "Personal",
  "tags": ["important", "todo"]
}
```

### ✅ Expected Response (201 Created):
```json
{
  "status": "success",
  "message": "Note created successfully",
  "data": {
    "note": {
      "id": "note-uuid-here",
      "title": "My First Note",
      "content": "This is the content of my first note. It can be as long as I want!",
      "category": "Personal",
      "tags": ["important", "todo"],
      "isArchived": false,
      "createdAt": "2026-05-07T02:10:00.000Z",
      "updatedAt": "2026-05-07T02:10:00.000Z",
      "userId": "your-user-uuid"
    }
  }
}
```

### 📌 What to Save:
- Copy the `note.id` — you'll need this for Get, Update, and Delete

### Create More Notes for Testing:

**Note 2** (different category):
```json
{
  "title": "Work Meeting Agenda",
  "content": "Discuss project timeline and budget allocation",
  "category": "Work",
  "tags": ["meeting", "urgent"]
}
```

**Note 3** (minimal — no optional fields):
```json
{
  "title": "Quick Reminder",
  "content": "Buy groceries after work"
}
```

### Test Validation Errors:

Try with **missing title**:
```json
{
  "content": "Some content without a title"
}
```
- **Expected (400):** Validation error for missing title

Try **without the Authorization header**:
- Remove the `Authorization` header
- **Expected (401):** `"message": "Access denied. No token provided."`

---

## 📋 6. Get All Notes (R in CRUD)

### Request — Get All

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/notes`
- **Headers:**
  | Key | Value |
  |-----|-------|
  | Authorization | Bearer YOUR_ACCESS_TOKEN |

### ✅ Expected Response (200 OK):
```json
{
  "status": "success",
  "message": "Notes retrieved successfully",
  "data": {
    "count": 3,
    "notes": [
      {
        "id": "...",
        "title": "Quick Reminder",
        "content": "Buy groceries after work",
        "category": null,
        "tags": [],
        "isArchived": false,
        "userId": "your-user-uuid",
        "createdAt": "...",
        "updatedAt": "..."
      },
      {
        "id": "...",
        "title": "Work Meeting Agenda",
        "content": "Discuss project timeline and budget allocation",
        "category": "Work",
        "tags": ["meeting", "urgent"],
        "isArchived": false,
        "userId": "your-user-uuid",
        "createdAt": "...",
        "updatedAt": "..."
      },
      {
        "id": "...",
        "title": "My First Note",
        "content": "This is the content of my first note...",
        "category": "Personal",
        "tags": ["important", "todo"],
        "isArchived": false,
        "userId": "your-user-uuid",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

> Notes are returned newest first (sorted by `createdAt` descending).

### Request — Filter by Category

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/notes?category=Work`

### ✅ Expected: Only notes with `category: "Work"` are returned.

### Request — Search by Keyword

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/notes?search=groceries`

### ✅ Expected: Only notes containing "groceries" in title or content are returned.

### Request — Filter by Archived Status

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/notes?archived=false`

### ✅ Expected: Only non-archived notes are returned.

### Request — Combine Filters

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/notes?category=Personal&search=first&archived=false`

### ✅ Expected: Notes matching ALL filter criteria.

---

## 🔍 7. Get Single Note (R in CRUD)

### Request

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/notes/PASTE_NOTE_ID_HERE`
- **Headers:**
  | Key | Value |
  |-----|-------|
  | Authorization | Bearer YOUR_ACCESS_TOKEN |

### ✅ Expected Response (200 OK):
```json
{
  "status": "success",
  "message": "Note retrieved successfully",
  "data": {
    "note": {
      "id": "note-uuid-here",
      "title": "My First Note",
      "content": "This is the content of my first note...",
      "category": "Personal",
      "tags": ["important", "todo"],
      "isArchived": false,
      "userId": "your-user-uuid",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

### Test Error Cases:

Try with a **fake ID**:
- **URL:** `http://localhost:8000/api/notes/fake-id-12345`
- **Expected (404):** `"message": "Note not found"`

---

## ✏️ 8. Update Note (U in CRUD)

### Request — Update Multiple Fields

- **Method:** `PUT`
- **URL:** `http://localhost:8000/api/notes/PASTE_NOTE_ID_HERE`
- **Headers:**
  | Key | Value |
  |-----|-------|
  | Authorization | Bearer YOUR_ACCESS_TOKEN |
  | Content-Type | application/json |
- **Body (raw JSON):**
```json
{
  "title": "Updated Note Title",
  "content": "This content has been updated with new information",
  "category": "Work",
  "tags": ["updated", "reviewed"]
}
```

### ✅ Expected Response (200 OK):
```json
{
  "status": "success",
  "message": "Note updated successfully",
  "data": {
    "note": {
      "id": "note-uuid-here",
      "title": "Updated Note Title",
      "content": "This content has been updated with new information",
      "category": "Work",
      "tags": ["updated", "reviewed"],
      "isArchived": false,
      "userId": "your-user-uuid",
      "createdAt": "...",
      "updatedAt": "2026-05-07T02:15:00.000Z"
    }
  }
}
```

> Notice `updatedAt` changed but `createdAt` stayed the same.

### Request — Partial Update (Only Title)

```json
{
  "title": "Only the title changed"
}
```

### ✅ Expected: Only the title changes, everything else stays the same.

### Request — Archive a Note

```json
{
  "isArchived": true
}
```

### ✅ Expected: `isArchived` becomes `true`.

### Test Error Cases:

Try updating a **note you don't own** (use another user's note ID):
- **Expected (404):** `"message": "Note not found"`

---

## 🗑️ 9. Delete Note (D in CRUD)

### Request

- **Method:** `DELETE`
- **URL:** `http://localhost:8000/api/notes/PASTE_NOTE_ID_HERE`
- **Headers:**
  | Key | Value |
  |-----|-------|
  | Authorization | Bearer YOUR_ACCESS_TOKEN |

### ✅ Expected Response (200 OK):
```json
{
  "status": "success",
  "message": "Note deleted successfully"
}
```

### Verify Deletion:

Try `GET http://localhost:8000/api/notes/SAME_NOTE_ID`:
- **Expected (404):** `"message": "Note not found"`

Also check `GET http://localhost:8000/api/notes`:
- The deleted note should no longer appear in the list

---

## 🔄 10. Refresh Token

The access token expires after **15 minutes**. Use this endpoint to get a new one without re-logging in.

### Request

- **Method:** `POST`
- **URL:** `http://localhost:8000/api/auth/refresh`
- **Headers:**
  | Key | Value |
  |-----|-------|
  | Content-Type | application/json |
- **Body:** `{}` (empty JSON)

> 🍪 **Important:** The refresh token is sent automatically via the cookie that was set during login. Make sure Postman's cookie handling is enabled.

### ✅ Expected Response (200 OK):
```json
{
  "status": "success",
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-jwt-token-here..."
  }
}
```

### 📌 What to Do:
- Replace your old access token with this new one for subsequent requests
- A new refresh token cookie is also set automatically (token rotation)

### Test Error Cases:

Try **without the cookie** (clear cookies in Postman):
1. Go to **Cookies** tab (below Send button)
2. Delete the `refreshToken` cookie for `localhost`
3. Send the request
- **Expected (401):** `"message": "Refresh token not found. Please log in again."`

---

## 🚪 11. Logout

### Request

- **Method:** `POST`
- **URL:** `http://localhost:8000/api/auth/logout`
- **Headers:**
  | Key | Value |
  |-----|-------|
  | Content-Type | application/json |
- **Body:** `{}` (empty JSON)

### ✅ Expected Response (200 OK):
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

### Verify Logout:

After logout, try using the **refresh endpoint**:
- **Expected (401):** `"message": "Refresh token not found. Please log in again."`
  (because the cookie was cleared)

---

## 🚨 12. Error Testing / Edge Cases

Test these scenarios to verify the system handles errors properly:

### No Token Provided
- Send any `GET /api/notes` request **without** the Authorization header
- **Expected (401):** `"message": "Access denied. No token provided."`

### Invalid Token
- Set Authorization to `Bearer this-is-not-a-valid-token`
- **Expected (401):** `"message": "Invalid access token."`

### Expired Token
- Wait 15+ minutes without refreshing, or use an old token
- **Expected (401):** `"message": "Access token has expired. Please refresh your token."`

### Invalid Route
- `GET http://localhost:8000/api/nonexistent`
- **Expected (404):** `"message": "Cannot GET /api/nonexistent"`

---

## 👑 13. Admin Features (Bonus)

Your system includes admin endpoints. To test them, you need to manually set a user's role to `ADMIN` in the database:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@gmail.com';
```

Then **login again** to get a new access token with the `ADMIN` role.

### 13.1 Get All Users

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/admin/users`
- **Headers:**
  | Key | Value |
  |-----|-------|
  | Authorization | Bearer YOUR_ADMIN_ACCESS_TOKEN |

### ✅ Expected (200):
```json
{
  "status": "success",
  "message": "Users retrieved successfully",
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2,
      "pages": 1
    }
  }
}
```

### 13.2 Get User Details

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/admin/users/USER_ID_HERE`

### 13.3 Update User Role

- **Method:** `PUT`
- **URL:** `http://localhost:8000/api/admin/users/USER_ID_HERE/role`
- **Body:**
```json
{
  "role": "ADMIN"
}
```

### 13.4 Get System Stats

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/admin/stats`

### ✅ Expected (200):
```json
{
  "status": "success",
  "message": "System statistics retrieved",
  "data": {
    "stats": {
      "totalUsers": 2,
      "totalNotes": 5,
      "adminCount": 1,
      "unverifiedUsers": 0,
      "averageNotesPerUser": "2.50"
    }
  }
}
```

### 13.5 Get All Notes (Admin View)

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/admin/notes`

### 13.6 Get User's Notes

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/admin/users/USER_ID_HERE/notes`

### 13.7 Delete Any Note

- **Method:** `DELETE`
- **URL:** `http://localhost:8000/api/admin/notes/NOTE_ID_HERE`

### 13.8 Delete Any User

- **Method:** `DELETE`
- **URL:** `http://localhost:8000/api/admin/users/USER_ID_HERE`

### Admin Error Cases:

Try admin endpoints with a **regular USER token**:
- **Expected (403):** `"message": "Forbidden. Admin access required."`

---

## 🔒 14. Access Control Testing (User Isolation)

This is critical — it proves that CRUD is properly linked to the User ID.

### Step 1: Create a Second User

```
POST http://localhost:8000/api/auth/signup
```
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "JanePassword123"
}
```

### Step 2: Verify & Login as Jane

Follow steps 3 and 4 above for Jane. Save her access token separately.

### Step 3: Create a Note as Jane

```
POST http://localhost:8000/api/notes
Authorization: Bearer JANE_ACCESS_TOKEN
```
```json
{
  "title": "Jane's Private Note",
  "content": "This note belongs to Jane only"
}
```

Save Jane's note ID.

### Step 4: Try to Access Jane's Note as John

```
GET http://localhost:8000/api/notes/JANE_NOTE_ID
Authorization: Bearer JOHN_ACCESS_TOKEN
```

### ✅ Expected (404): `"message": "Note not found"`

John cannot see, update, or delete Jane's notes — they are isolated per user.

### Step 5: Verify John's List Doesn't Include Jane's Notes

```
GET http://localhost:8000/api/notes
Authorization: Bearer JOHN_ACCESS_TOKEN
```

### ✅ Expected: Only John's notes appear. Jane's notes are NOT in the list.

---

## 📊 15. Quick Reference Table

| # | Action | Method | URL | Auth? | Body? |
|---|--------|--------|-----|-------|-------|
| 1 | Health Check | `GET` | `/` | ❌ | ❌ |
| 2 | Signup | `POST` | `/api/auth/signup` | ❌ | ✅ name, email, password |
| 3 | Verify Email | `GET` | `/api/auth/verify-email?token=xxx` | ❌ | ❌ |
| 4 | Login | `POST` | `/api/auth/login` | ❌ | ✅ email, password |
| 5 | Create Note | `POST` | `/api/notes` | ✅ | ✅ title, content, category?, tags? |
| 6 | Get All Notes | `GET` | `/api/notes` | ✅ | ❌ |
| 7 | Get Single Note | `GET` | `/api/notes/:id` | ✅ | ❌ |
| 8 | Update Note | `PUT` | `/api/notes/:id` | ✅ | ✅ any field |
| 9 | Delete Note | `DELETE` | `/api/notes/:id` | ✅ | ❌ |
| 10 | Refresh Token | `POST` | `/api/auth/refresh` | 🍪 Cookie | ❌ |
| 11 | Logout | `POST` | `/api/auth/logout` | ❌ | ❌ |

---

## ✅ Complete Test Checklist

Use this to make sure you've tested everything:

**Authentication Flow:**
- [ ] Signup creates user and sends verification email
- [ ] Signup validation rejects bad input (empty, short password, invalid email)
- [ ] Signup rejects duplicate email (409)
- [ ] Email verification works with valid token
- [ ] Email verification rejects invalid/used/expired token
- [ ] Login returns access token and sets refresh cookie
- [ ] Login rejects wrong password (401)
- [ ] Login rejects unverified email (403)
- [ ] Token refresh returns new access token
- [ ] Logout clears refresh cookie

**CRUD Operations:**
- [ ] Create note with all fields (title, content, category, tags)
- [ ] Create note with only required fields (title, content)
- [ ] Create note rejects missing required fields
- [ ] Get all notes returns only YOUR notes
- [ ] Get all notes filters by category
- [ ] Get all notes filters by search keyword
- [ ] Get all notes filters by archived status
- [ ] Get single note returns correct note
- [ ] Get single note returns 404 for wrong ID
- [ ] Update note changes specified fields
- [ ] Update note with partial data (only title)
- [ ] Update note can archive/unarchive
- [ ] Delete note removes it
- [ ] Deleted note returns 404 on subsequent GET

**Authorization:**
- [ ] Requests without token return 401
- [ ] Requests with invalid token return 401
- [ ] User A CANNOT see User B's notes (404)
- [ ] User A CANNOT update User B's notes (404)
- [ ] User A CANNOT delete User B's notes (404)

---

## 💡 Pro Tips

1. **Save tokens to Postman variables** — After login, copy the accessToken and save it as a collection variable `{{accessToken}}`. Then use `Bearer {{accessToken}}` in your Authorization header for all requests.

2. **Check Cookies** — Click the "Cookies" link below the Send button to verify the `refreshToken` cookie is being set after login.

3. **Use Postman Collections** — Organize your requests into folders: `Auth`, `Notes`, `Admin`.

4. **Test Order Matters** — Always follow: Signup → Verify → Login → CRUD → Refresh → Logout.

5. **Create 2 Users** — Test access control by switching between two user tokens to prove isolation.

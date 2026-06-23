# 🌟 SocialSpark — Mini Social Post Application

A full-stack social media application where users can sign up, create posts (text + image), like, comment, and browse a public feed.

> **Stack:** React.js · Node.js + Express · MongoDB Atlas · Material UI · Cloudinary

---

## 📸 Features

| Feature | Description |
|---|---|
| 🔐 Auth | Signup / Login with JWT — passwords hashed with bcrypt |
| 📝 Create Post | Post text, image, or both (neither field mandatory on its own) |
| 📰 Public Feed | All posts visible to all users, newest first, infinite scroll |
| ❤️ Like | Toggle like/unlike — instant optimistic UI update |
| 💬 Comment | Add comments, view all comments in a modal |
| 🗑️ Delete | Authors can delete their own posts (image removed from Cloudinary too) |
| 📱 Responsive | Works on mobile, tablet, and desktop |
| 🔒 Protected Routes | Only logged-in users can post, like, comment |

---

## 🗂️ Project Structure

```
social-app/
├── backend/                  # Node.js + Express API
│   ├── middleware/
│   │   └── auth.js           # JWT verification middleware
│   ├── models/
│   │   ├── User.js           # User schema (username, email, password)
│   │   └── Post.js           # Post schema (content, image, likes, comments)
│   ├── routes/
│   │   ├── auth.js           # POST /signup, POST /login, GET /me
│   │   └── posts.js          # CRUD posts, like, comment
│   ├── .env.example          # Environment variable template
│   ├── .gitignore
│   ├── package.json
│   └── server.js             # Express entry point
│
└── frontend/                 # React.js SPA
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── api/
    │   │   └── axios.js      # Axios instance with JWT interceptors
    │   ├── components/
    │   │   ├── CommentModal.js
    │   │   ├── CreatePost.js
    │   │   ├── Navbar.js
    │   │   └── PostCard.js
    │   ├── context/
    │   │   └── AuthContext.js # Global auth state + helper functions
    │   ├── pages/
    │   │   ├── Feed.js        # Main feed (infinite scroll)
    │   │   ├── Login.js
    │   │   └── Signup.js
    │   ├── App.js             # Theme + routing
    │   └── index.js
    ├── .env.example
    ├── .gitignore
    └── package.json
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)

---

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/social-app.git
cd social-app
```

---

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

**`.env` variables to fill:**

```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/social-app
JWT_SECRET=your_long_random_secret_string
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
PORT=5000
CLIENT_URL=http://localhost:3000
```

> **Get MongoDB URI:** Atlas → Clusters → Connect → Drivers → copy the URI
> **Get Cloudinary keys:** cloudinary.com → Dashboard → API Keys

---

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env   # already points to localhost:5000
npm start
```

Open **http://localhost:3000** — the app will be running!

---

## 🚀 Deployment

### Database — MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Whitelist IP `0.0.0.0/0` (allow all) for Render
4. Copy the connection string

### Backend — Render
1. Push code to GitHub (make sure `backend/` folder is present)
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set **Root Directory** to `backend`
5. **Build command:** `npm install`
6. **Start command:** `npm start`
7. Add all **Environment Variables** from your `.env`
8. Deploy — note the URL (e.g. `https://social-app-api.onrender.com`)

### Image Hosting — Cloudinary
1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier: 25 GB)
2. Dashboard → API Keys → copy Cloud Name, API Key, API Secret
3. Add to Render environment variables

### Frontend — Vercel
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-render-backend-url.onrender.com/api
   ```
4. Deploy

---

## 🛠️ API Reference

### Auth Routes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | Login, receive JWT | No |
| GET | `/api/auth/me` | Get current user | ✅ |

### Post Routes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/posts?page=1&limit=8` | Get paginated feed | No |
| POST | `/api/posts` | Create post (form-data) | ✅ |
| PATCH | `/api/posts/:id/like` | Toggle like | ✅ |
| POST | `/api/posts/:id/comment` | Add comment | ✅ |
| DELETE | `/api/posts/:id` | Delete own post | ✅ |
| GET | `/api/posts/:id` | Get single post | No |

---

## 🗄️ MongoDB Collections

Only **2 collections** are used, as required:

**`users`**
```js
{ username, email, password (hashed), avatar, bio, createdAt, updatedAt }
```

**`posts`**
```js
{
  author: ObjectId → users,
  content: String,
  image: { url, publicId },
  likes: [ObjectId → users],
  comments: [{ user, username, text, createdAt }],
  createdAt, updatedAt
}
```

---

## ✅ Checklist

- [x] Signup & Login with JWT
- [x] Create post — text only / image only / both
- [x] Public feed with pagination (infinite scroll)
- [x] Like / Unlike with instant UI update
- [x] Comment with modal
- [x] Delete own posts
- [x] Image upload via Cloudinary
- [x] Responsive MUI design
- [x] Route protection (private routes)
- [x] 2 MongoDB collections only
- [x] Ready for Vercel + Render + Atlas deployment

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, MUI v5, Axios |
| Backend | Node.js, Express 4, express-validator, multer |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Images | Cloudinary v2, streamifier |
| Deployment | Vercel (frontend), Render (backend), Atlas (DB) |

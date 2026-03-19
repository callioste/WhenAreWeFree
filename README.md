# WhenAreWeFree

A web application for creating and sharing availability calendars. It allows users to easily find a common time slot for meetings or events.

This project was created for university purposes as part of my learning process in backend development, with a focus on building REST APIs and working with databases.

---

## 📌 Features

- Create a shared availability calendar
- Join a calendar using a unique token
- Add and manage availability time blocks
- Visualize overlapping availability across participants (common free time highlighted in green)

---

## 📌 Tech Stack

- Backend: Node.js, Express
- Database: SQLite
- Frontend: HTML, CSS, JavaScript

---

## 📌 Installation

In root directory:

```bash
cd src
npm install 
```

---

## 📌 Environment Variables

An .env file in the root directory:

```env
PORT = 3000
DB_PATH = data.db
```

## 📌 Run the App
```bash
node src/index.js
```

App will be available at:

```
http://localhost:3000
```
(or another port defined in ```.env```)

---

## 📌 How It Works

1. A user creates a calendar
2. A unique token is generated
3. Participants join using the token
4. Users add their availability
5. The app displays overlapping free time

---

## 📌 Project Structure

- ```public/``` – frontend (UI)

- ```src/routes/``` – API routes

- ```src/models/``` – database logic

- ```src/middleware/``` – error handling & async support

- ```src/db.js``` – database setup

---

## 📌 API Overview

- ```POST /calendars```

- ```GET /calendars/:token```

- ```GET /calendars/:token/full```

- ```POST /participants```

- ```POST /availability-blocks```



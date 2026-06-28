# Expense Tracker (with Firebase Authentication & Database)

A web app to track daily expenses, categorize spending, and visualize where the money goes. Each user logs in with their own account, and their expenses are saved permanently in a cloud database — not just in one browser.

**Live Demo:** [Add your GitHub Pages link here once deployed]

## Features

- User signup and login (email & password) via Firebase Authentication
- Each user's expenses are private and only visible to them
- Add expenses with a title, amount, category, and date
- Real-time running total of all expenses
- Doughnut chart breaking down spending by category (Chart.js)
- Delete any expense
- Data is stored permanently in Firebase Firestore (a real cloud database), so it's available on any device the user logs in from — not lost on browser refresh or limited to one device

## Tech Stack

- HTML5, CSS3 (custom styling)
- JavaScript (ES6 modules)
- **Firebase Authentication** — handles user signup/login
- **Firebase Firestore** — cloud NoSQL database, stores each user's expenses
- [Chart.js](https://www.chartjs.org/) for the category breakdown chart

## How It Works

- `login.html` handles signup and login using Firebase Authentication. On success, the user is redirected to the main app.
- `index.html` / `script.js` check if a user is logged in on page load; if not, they're redirected back to the login page.
- Every expense is saved as a document in a Firestore collection called `expenses`, tagged with the logged-in user's unique ID (`userId`).
- The app uses Firestore's real-time listener (`onSnapshot`) to automatically update the UI whenever the data changes — no manual refresh needed.
- Firestore security rules ensure a user can only read, create, or delete their own expenses (see `FIRESTORE_RULES.txt`).

## Running Locally

1. Clone or download this repository
2. Open `login.html` in a browser (must be served over `http://` or `https://`, not opened directly as a `file://` path, since Firebase requires this — see note below)
3. Create an account or log in, and start tracking expenses

**Note:** Because this uses Firebase JavaScript modules, opening the file directly by double-clicking may not work in all browsers. If so, run a simple local server (e.g. VS Code's "Live Server" extension, or `python -m http.server`) and open it via `http://localhost`.

## Security

This project uses Firestore security rules to ensure users can only access their own data — not just relying on the app's UI to hide it. See `FIRESTORE_RULES.txt` for the rules and an explanation of what they do.

## Possible Improvements

- Add monthly/weekly filtering
- Add editing of existing expenses
- Add a budget limit with warnings when exceeded
- Add Google Sign-In as an additional login option

---

Built as a personal project to practice real-world skills: user authentication, cloud databases, real-time data syncing, and basic security rules — beyond what a static frontend project alone can show.

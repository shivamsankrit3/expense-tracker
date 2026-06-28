// ---------------------------------------------
// Expense Tracker — script.js (Firebase version)
// Handles: user login check, reading/writing expenses
// to Firestore (instead of localStorage), and the UI.
// ---------------------------------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your project's Firebase configuration (same values as login.html)
const firebaseConfig = {
  apiKey: "AIzaSyAfsyCsAPQ0GSALrenHE1qrBOznscM52zg",
  authDomain: "expense-tracker-shivamece.firebaseapp.com",
  projectId: "expense-tracker-shivamece",
  storageBucket: "expense-tracker-shivamece.firebasestorage.app",
  messagingSenderId: "642986534662",
  appId: "1:642986534662:web:ac54b770a4a90b9291a087",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Reference to the "expenses" collection in Firestore.
// Every expense document will live inside this collection,
// tagged with a userId so each person only sees their own data.
const expensesRef = collection(db, "expenses");

// ---------------------------------------------
// DOM references
// ---------------------------------------------
const form = document.getElementById("expenseForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const totalAmountEl = document.getElementById("totalAmount");
const expenseListEl = document.getElementById("expenseList");
const listEmptyState = document.getElementById("listEmptyState");
const chartEmptyState = document.getElementById("chartEmptyState");
const userEmailEl = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");

let categoryChart = null;
let currentUser = null;
let expenses = []; // will be filled live from Firestore

dateInput.valueAsDate = new Date();

// ---------------------------------------------
// Check login status as soon as the page loads.
// If nobody is logged in, send them to the login page.
// ---------------------------------------------
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  userEmailEl.textContent = "Logged in as " + user.email;
  listenForExpenses(); // start listening to this user's data
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

// ---------------------------------------------
// Format a number as Indian Rupees, e.g. 1234 -> ₹1,234.00
// ---------------------------------------------
function formatCurrency(value) {
  return "₹" + value.toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

// ---------------------------------------------
// Listen for real-time updates to this user's expenses.
// onSnapshot fires immediately with current data, AND
// again automatically whenever the data changes (e.g. on
// another device) — this is the "real-time database" part.
// ---------------------------------------------
function listenForExpenses() {
  const userExpensesQuery = query(
    expensesRef,
    where("userId", "==", currentUser.uid)
  );

  onSnapshot(userExpensesQuery, (snapshot) => {
    expenses = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    render();
  });
}

// ---------------------------------------------
// Re-render everything: total, list, and chart.
// ---------------------------------------------
function render() {
  renderTotal();
  renderList();
  renderChart();
}

function renderTotal() {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  totalAmountEl.textContent = formatCurrency(total);
}

function renderList() {
  expenseListEl.innerHTML = "";

  if (expenses.length === 0) {
    listEmptyState.classList.remove("hidden");
    return;
  }
  listEmptyState.classList.add("hidden");

  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  sorted.forEach((exp) => {
    const li = document.createElement("li");
    li.className = "expense-item";
    li.innerHTML = `
      <div class="expense-info">
        <span class="expense-title">${exp.title}</span>
        <span class="expense-meta">${exp.category} • ${exp.date}</span>
      </div>
      <div class="expense-right">
        <span class="expense-amount">${formatCurrency(exp.amount)}</span>
        <button class="delete-btn" data-id="${exp.id}">Delete</button>
      </div>
    `;
    expenseListEl.appendChild(li);
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteExpense(btn.dataset.id));
  });
}

function renderChart() {
  const totalsByCategory = {};
  expenses.forEach((exp) => {
    totalsByCategory[exp.category] = (totalsByCategory[exp.category] || 0) + exp.amount;
  });

  const labels = Object.keys(totalsByCategory);
  const data = Object.values(totalsByCategory);

  if (labels.length === 0) {
    chartEmptyState.classList.remove("hidden");
    if (categoryChart) {
      categoryChart.destroy();
      categoryChart = null;
    }
    return;
  }
  chartEmptyState.classList.add("hidden");

  const colors = ["#2563EB", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#EC4899"];

  if (categoryChart) {
    categoryChart.destroy();
  }

  const ctx = document.getElementById("categoryChart").getContext("2d");
  categoryChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 0,
      }],
    },
    options: {
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 12 } } },
      },
    },
  });
}

// ---------------------------------------------
// Add a new expense — this writes a new document
// to Firestore instead of pushing into a local array.
// ---------------------------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = parseFloat(amountInput.value);
  const title = titleInput.value.trim();

  if (!title || isNaN(amount) || amount <= 0) {
    alert("Please enter a valid title and amount.");
    return;
  }

  try {
    await addDoc(expensesRef, {
      userId: currentUser.uid, // tag this expense with the logged-in user
      title: title,
      amount: amount,
      category: categoryInput.value,
      date: dateInput.value,
      createdAt: Date.now(),
    });
    form.reset();
    dateInput.valueAsDate = new Date();
  } catch (err) {
    alert("Could not save expense: " + err.message);
  }
});

// ---------------------------------------------
// Delete an expense by its Firestore document id
// ---------------------------------------------
async function deleteExpense(id) {
  try {
    await deleteDoc(doc(db, "expenses", id));
  } catch (err) {
    alert("Could not delete expense: " + err.message);
  }
}

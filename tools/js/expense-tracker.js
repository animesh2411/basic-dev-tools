const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const clearBtn = document.getElementById('clearBtn');

// Get transactions from local storage
const localStorageTransactions = JSON.parse(
  localStorage.getItem('transactions')
);

let transactions =
  localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

// Add transaction
function addTransaction(e) {
  e.preventDefault();

  if (text.value.trim() === '' || amount.value.trim() === '') {
    alert('Please add a text and amount');
    return;
  }

  const type = document.querySelector('input[name="transType"]:checked').value;
  let amountValue = +amount.value;
  
  // If expense, make it negative for storage logic if we were summing simply, 
  // but here we might want to keep the value positive and just tag it.
  // Let's adopt the convention: Income = positive, Expense = negative stored value
  if (type === 'expense') {
      amountValue = -Math.abs(amountValue);
  } else {
      amountValue = Math.abs(amountValue);
  }

  const transaction = {
    id: generateID(),
    text: text.value,
    amount: amountValue
  };

  transactions.push(transaction);

  addTransactionDOM(transaction);
  updateValues();

  updateLocalStorage();

  text.value = '';
  amount.value = '';
}

// Generate random ID
function generateID() {
  return Math.floor(Math.random() * 100000000);
}

// Add transaction to DOM list
function addTransactionDOM(transaction) {
  // Get sign
  const sign = transaction.amount < 0 ? '-' : '+';

  const item = document.createElement('li');

  // Add class based on value
  item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

  item.innerHTML = `
    ${transaction.text} 
    <span>${sign}₹${formatMoney(Math.abs(transaction.amount))}</span> 
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
  `;

  list.appendChild(item);
}

// Update the balance, income and expense
function updateValues() {
  const amounts = transactions.map(transaction => transaction.amount);

  const total = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);

  const income = amounts
    .filter(item => item > 0)
    .reduce((acc, item) => acc + item, 0)
    .toFixed(2);

  const expense = (
    amounts.filter(item => item < 0).reduce((acc, item) => acc + item, 0) *
    -1
  ).toFixed(2);

  balance.innerText = `₹${formatMoney(total)}`;
  money_plus.innerText = `+₹${formatMoney(income)}`;
  money_minus.innerText = `-₹${formatMoney(expense)}`;
}

// Format money (comma separation for thousands if possible, but basic 2 decimal here)
function formatMoney(num) {
    // Basic Indian number system formatting could be complex, sticking to standard locale string for "en-IN"
    return Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Remove transaction by ID
function removeTransaction(id) {
  transactions = transactions.filter(transaction => transaction.id !== id);

  updateLocalStorage();

  init();
}

// Update local storage transactions
function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Init app
function init() {
  list.innerHTML = '';

  transactions.forEach(addTransactionDOM);
  updateValues();
}

// Clear all data
clearBtn.addEventListener('click', () => {
    if(confirm('Are you sure you want to clear all data?')) {
        transactions = [];
        updateLocalStorage();
        init();
    }
});

form.addEventListener('submit', addTransaction);

init();

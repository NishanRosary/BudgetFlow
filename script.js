// Transaction Data Storage
let transactions = [];

// DOM Elements
const transactionForm = document.getElementById('transactionForm');
const transactionBody = document.getElementById('transactionBody');
const transactionTable = document.getElementById('transactionTable');
const tableContainer = document.getElementById('tableContainer');
const emptyState = document.getElementById('emptyState');
const balanceEl = document.getElementById('balance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const monthFilter = document.getElementById('monthFilter');
const clearFilterBtn = document.getElementById('clearFilter');

// Initialize date input with today's date
document.getElementById('date').valueAsDate = new Date();

// Load transactions from localStorage on page load
function loadTransactions() {
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    }
    renderTransactions();
    updateDashboard();
}

// Save transactions to localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Format currency (Indian Rupees)
function formatCurrency(amount) {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format date to readable format
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Calculate totals from transactions array
function calculateTotals(filteredTransactions = null) {
    const transactionsToCalculate = filteredTransactions || transactions;
    
    const totals = transactionsToCalculate.reduce(
        (acc, transaction) => {
            if (transaction.type === 'income') {
                acc.income += parseFloat(transaction.amount);
            } else {
                acc.expense += parseFloat(transaction.amount);
            }
            return acc;
        },
        { income: 0, expense: 0 }
    );

    totals.balance = totals.income - totals.expense;
    return totals;
}

// Update dashboard with current totals
function updateDashboard(filteredTransactions = null) {
    const totals = calculateTotals(filteredTransactions);
    
    balanceEl.textContent = formatCurrency(totals.balance);
    totalIncomeEl.textContent = formatCurrency(totals.income);
    totalExpenseEl.textContent = formatCurrency(totals.expense);

    // Update balance color based on positive/negative
    if (totals.balance >= 0) {
        balanceEl.parentElement.style.background = 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)';
    } else {
        balanceEl.parentElement.style.background = 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)';
    }
}

// Get filtered transactions based on selected month
function getFilteredTransactions() {
    const selectedMonth = monthFilter.value;
    if (!selectedMonth) {
        return transactions;
    }

    return transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
        return transactionMonth === selectedMonth;
    });
}

// Render transactions table
function renderTransactions() {
    const filteredTransactions = getFilteredTransactions();

    // Show/hide empty state
    if (filteredTransactions.length === 0) {
        tableContainer.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        tableContainer.style.display = 'block';
        emptyState.style.display = 'none';
    }

    // Clear existing rows
    transactionBody.innerHTML = '';

    // Sort transactions by date (newest first)
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    // Create table rows
    sortedTransactions.forEach((transaction, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.reason}</td>
            <td><span class="type-badge ${transaction.type}">${transaction.type}</span></td>
            <td class="amount-cell ${transaction.type}">${transaction.type === 'income' ? '+' : '-'}${formatCurrency(parseFloat(transaction.amount))}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteTransaction(${transaction.id})">Delete</button>
            </td>
        `;
        
        transactionBody.appendChild(row);
    });

    // Update dashboard with filtered transactions
    updateDashboard(filteredTransactions);
}

// Add new transaction
function addTransaction(transaction) {
    // Generate unique ID
    transaction.id = Date.now();
    
    transactions.push(transaction);
    saveTransactions();
    renderTransactions();
}

// Delete transaction by ID
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        saveTransactions();
        renderTransactions();
    }
}

// Handle form submission
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const reason = document.getElementById('reason').value.trim();
    const date = document.getElementById('date').value;

    // Validate inputs
    if (amount <= 0) {
        alert('Amount must be greater than 0');
        return;
    }

    if (!type) {
        alert('Please select a transaction type');
        return;
    }

    if (!reason) {
        alert('Please enter a reason');
        return;
    }

    // Create transaction object
    const transaction = {
        amount: amount,
        type: type,
        reason: reason,
        date: date
    };

    // Add transaction
    addTransaction(transaction);

    // Reset form
    transactionForm.reset();
    document.getElementById('date').valueAsDate = new Date();
});

// Handle month filter change
monthFilter.addEventListener('change', () => {
    renderTransactions();
});

// Handle clear filter button
clearFilterBtn.addEventListener('click', () => {
    monthFilter.value = '';
    renderTransactions();
});

// Initialize app
loadTransactions();


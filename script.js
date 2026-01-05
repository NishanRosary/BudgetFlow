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


// -- Income Grouping Feature Logic --

// Toggle between standard history and income analysis view
function toggleIncomeAnalysisView() {
    const historySection = document.getElementById('historySection');
    const incomeAnalysisSection = document.getElementById('incomeAnalysis');
    const toggleBtn = document.getElementById('toggleAnalysisBtn');
    
    if (incomeAnalysisSection.style.display === 'none') {
        renderIncomeGroups();
        historySection.style.display = 'none';
        incomeAnalysisSection.style.display = 'block';
        toggleBtn.textContent = 'Back to history';
    } else {
        historySection.style.display = 'block';
        incomeAnalysisSection.style.display = 'none';
        toggleBtn.textContent = 'View Income Groups';
    }
}

// Calculate groups of expenses based on preceding income
function calculateIncomeGroups() {
    // 1. Sort transactions by Date ASC (Oldest first) so we can flow through time
    // If dates are equal, we can use ID as secondary sort if needed, or assume entry order
    const sorted = [...transactions].sort((a, b) => {
       const dateA = new Date(a.date);
       const dateB = new Date(b.date);
       if(dateA - dateB !== 0) return dateA - dateB;
       return a.id - b.id; // Secondary sort by creation time
    });

    const groups = [];
    
    // Initial group for expenses before any income
    let currentGroup = {
        income: null, // No source income yet
        expenses: [],
        totalExpense: 0,
        remaining: 0
    };
    
    // We only add the initial group if it has content used
    let isInitialGroupUsed = false;

    sorted.forEach(transaction => {
        if (transaction.type === 'income') {
            // Push the previous group if valid
            if (currentGroup.income || isInitialGroupUsed) {
                groups.push(currentGroup);
            }
            
            // Start a new group
            currentGroup = {
                income: transaction,
                expenses: [],
                totalExpense: 0,
                remaining: parseFloat(transaction.amount)
            };
            
        } else if (transaction.type === 'expense') {
            const amount = parseFloat(transaction.amount);
            currentGroup.expenses.push(transaction);
            currentGroup.totalExpense += amount;
            
            // If there's an income source, subtract from it. 
            // If it's the initial "no income" group, remaining becomes negative.
            if (currentGroup.income) {
                currentGroup.remaining -= amount;
            } else {
                currentGroup.remaining -= amount;
                isInitialGroupUsed = true;
            }
        }
    });

    // Push the final group
    if (currentGroup.income || (currentGroup === groups[0] && isInitialGroupUsed)) {
        groups.push(currentGroup);
    }
    
    // Return reversed groups (newest income block first)
    return groups.reverse(); 
}

// Render the income groups UI
function renderIncomeGroups() {
    const container = document.getElementById('analysisContainer');
    const groups = calculateIncomeGroups();
    
    container.innerHTML = '';
    
    if (groups.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">No data available for analysis.</p>';
        return;
    }

    groups.forEach(group => {
        const groupDiv = document.createElement('div');
        groupDiv.className = `analysis-group ${group.income ? '' : 'initial-expense'}`;
        
        // Header
        let headerHtml = '';
        if (group.income) {
            headerHtml = `
                <div class="group-header">
                    <h3>
                        Income: ${group.income.reason} 
                        <span style="font-size: 0.9em; color: #6b7280; font-weight: normal;">
                            (${formatDate(group.income.date)})
                        </span>
                    </h3>
                    <span class="income-amount">${formatCurrency(parseFloat(group.income.amount))}</span>
                </div>
            `;
        } else {
            headerHtml = `
                <div class="group-header">
                    <h3 style="color: var(--text-secondary);">Previous Expenses (Before any income)</h3>
                    <span class="income-amount" style="color: var(--text-secondary);">--</span>
                </div>
            `;
        } // Expenses List
        let expensesHtml = '<div class="group-expenses-list">';
        if (group.expenses.length > 0) {
            group.expenses.forEach(exp => {
                expensesHtml += `
                    <div class="expense-item">
                        <span class="expense-reason">${exp.reason} (${formatDate(exp.date)})</span>
                        <span class="expense-amount">-${formatCurrency(parseFloat(exp.amount))}</span>
                    </div>
                `;
            });
        } else {
            expensesHtml += '<p style="font-size: 0.9rem; color: #9ca3af; font-style: italic;">No expenses recorded.</p>';
        }
        expensesHtml += '</div>';

        // Summary Footer
        const balanceClass = group.remaining >= 0 ? 'balance-positive' : 'balance-negative';
        
        const summaryHtml = `
            <div class="group-summary">
                <div class="summary-item">
                    <span class="label">Total Spent:</span>
                    <span class="value" style="color: var(--expense-color);">${formatCurrency(group.totalExpense)}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Remaining:</span>
                    <span class="value ${balanceClass}">${formatCurrency(group.remaining)}</span>
                </div>
            </div>
        `;

        groupDiv.innerHTML = headerHtml + expensesHtml + summaryHtml;
        container.appendChild(groupDiv);
    });
}

// Initialize app
loadTransactions();


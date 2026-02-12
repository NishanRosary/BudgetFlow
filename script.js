// Transaction Data Storage
let transactions = [];

// Private Budget Mode
let isPrivateMode = false; // Track if we're in private budget mode
let privateTransactions = []; // Separate storage for private transactions

// Family Member Management
let currentMemberId = 'default'; // Current selected member
let customMembers = {}; // Store custom member names { id: displayName }

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

// Family Member DOM Elements
const memberSelect = document.getElementById('memberSelect');
const customMemberGroup = document.getElementById('customMemberGroup');
const customMemberName = document.getElementById('customMemberName');
const addCustomMemberBtn = document.getElementById('addCustomMemberBtn');
const currentMemberDisplay = document.getElementById('currentMemberDisplay');

// Initialize date input with today's date
document.getElementById('date').valueAsDate = new Date();

// Load transactions from localStorage on page load
function loadTransactions() {
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);

        // Migration: Add memberId to existing transactions (backward compatibility)
        let needsMigration = false;
        transactions = transactions.map(transaction => {
            if (!transaction.memberId) {
                needsMigration = true;
                return { ...transaction, memberId: 'default' };
            }
            return transaction;
        });

        // Save migrated data
        if (needsMigration) {
            saveTransactions();
        }
    }

    // Load custom members
    const storedCustomMembers = localStorage.getItem('customMembers');
    if (storedCustomMembers) {
        customMembers = JSON.parse(storedCustomMembers);
        populateCustomMembersInDropdown();
    }

    // Load last selected member
    const storedMemberId = localStorage.getItem('currentMemberId');
    if (storedMemberId) {
        currentMemberId = storedMemberId;
        memberSelect.value = storedMemberId;
        updateCurrentMemberDisplay();
    }

    renderTransactions();
}

// Save transactions to localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Save custom members to localStorage
function saveCustomMembers() {
    localStorage.setItem('customMembers', JSON.stringify(customMembers));
}

// Save current member selection
function saveCurrentMember() {
    localStorage.setItem('currentMemberId', currentMemberId);
}

// Get member display name
function getMemberDisplayName(memberId) {
    const predefinedMembers = {
        'default': 'All Members (Default)',
        'mom': 'Mom',
        'dad': 'Dad',
        'sister': 'Sister',
        'brother': 'Brother',
        'grandma': 'Grandma',
        'grandpa': 'Grandpa'
    };

    if (predefinedMembers[memberId]) {
        return predefinedMembers[memberId];
    }

    // Check custom members
    if (customMembers[memberId]) {
        return customMembers[memberId];
    }

    return memberId;
}

// Get transactions for current member
function getCurrentMemberTransactions() {
    // If in private mode, return private transactions
    if (isPrivateMode) {
        return privateTransactions;
    }

    // Otherwise, return family transactions filtered by member
    if (currentMemberId === 'default') {
        return transactions; // Show all transactions
    }
    return transactions.filter(t => t.memberId === currentMemberId);
}

// Update current member display
function updateCurrentMemberDisplay() {
    const displayName = getMemberDisplayName(currentMemberId);
    currentMemberDisplay.textContent = displayName;
}

// Populate custom members in dropdown
function populateCustomMembersInDropdown() {
    // Remove existing custom member options (except "other")
    const options = Array.from(memberSelect.options);
    options.forEach(option => {
        if (option.value !== 'other' && !['default', 'mom', 'dad', 'sister', 'brother', 'grandma', 'grandpa'].includes(option.value)) {
            option.remove();
        }
    });

    // Add custom members before "other" option
    const otherOption = memberSelect.querySelector('option[value="other"]');
    Object.keys(customMembers).forEach(memberId => {
        const option = document.createElement('option');
        option.value = memberId;
        option.textContent = customMembers[memberId];
        memberSelect.insertBefore(option, otherOption);
    });
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

// Get filtered transactions based on selected month and member
function getFilteredTransactions() {
    // First filter by member
    const memberTransactions = getCurrentMemberTransactions();

    // Then filter by month if selected
    const selectedMonth = monthFilter.value;
    if (!selectedMonth) {
        return memberTransactions;
    }

    return memberTransactions.filter(transaction => {
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

    if (isPrivateMode) {
        // Add to private transactions
        privateTransactions.push(transaction);
        savePrivateTransactions();
    } else {
        // Assign current member ID
        transaction.memberId = currentMemberId;

        // Add to family transactions
        transactions.push(transaction);
        saveTransactions();
    }

    renderTransactions();
}

// Delete transaction by ID
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        if (isPrivateMode) {
            privateTransactions = privateTransactions.filter(transaction => transaction.id !== id);
            savePrivateTransactions();
        } else {
            transactions = transactions.filter(transaction => transaction.id !== id);
            saveTransactions();
        }
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
    // Use private transactions if in private mode, otherwise all family transactions
    const activeTransactions = isPrivateMode ? privateTransactions : transactions;

    // 1. Sort transactions by Date ASC (Oldest first) so we can flow through time
    // If dates are equal, we can use ID as secondary sort if needed, or assume entry order
    const sorted = [...activeTransactions].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA - dateB !== 0) return dateA - dateB;
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

// ===== FAMILY MEMBER EVENT LISTENERS =====

// Handle member selection change
// We use a try-catch block to ensure any potential DOM errors are caught
try {
    if (memberSelect) {
        memberSelect.addEventListener('change', (e) => {
            const selectedValue = e.target.value;

            if (selectedValue === 'other') {
                // Show custom member input
                customMemberGroup.style.display = 'block';
                customMemberName.focus();
            } else {
                // Hide custom member input
                customMemberGroup.style.display = 'none';

                // Update current member
                currentMemberId = selectedValue;
                saveCurrentMember();
                updateCurrentMemberDisplay();

                // Refresh data - this will call updateDashboard internally with correct filtered values
                renderTransactions();
            }
        });
    }

    // Handle adding custom member
    if (addCustomMemberBtn) {
        addCustomMemberBtn.addEventListener('click', () => {
            const customName = customMemberName.value.trim();

            if (!customName) {
                alert('Please enter a member name');
                return;
            }

            // Generate unique ID for custom member
            const customId = 'custom_' + Date.now();

            // Save custom member
            customMembers[customId] = customName;
            saveCustomMembers();

            // Add to dropdown
            populateCustomMembersInDropdown();

            // Select the new member
            memberSelect.value = customId;
            currentMemberId = customId;
            saveCurrentMember();
            updateCurrentMemberDisplay();

            // Hide custom input and clear
            customMemberGroup.style.display = 'none';
            customMemberName.value = '';

            // Refresh data
            renderTransactions();
        });
    }

    // Allow Enter key to add custom member
    if (customMemberName) {
        customMemberName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCustomMemberBtn.click();
            }
        });
    }
} catch (error) {
    console.error('Error initializing family member listeners:', error);
}

// ===== PRIVATE BUDGET MODE =====

// DOM Elements for Private Budget
const privateBudgetBtn = document.getElementById('privateBudgetBtn');
const pinModal = document.getElementById('pinModal');
const closePinModal = document.getElementById('closePinModal');
const cancelPinBtn = document.getElementById('cancelPinBtn');
const submitPinBtn = document.getElementById('submitPinBtn');
const pinModalTitle = document.getElementById('pinModalTitle');
const pinModalMessage = document.getElementById('pinModalMessage');
const pinError = document.getElementById('pinError');
const pinConfirmContainer = document.getElementById('pinConfirmContainer');

// Get all PIN input fields
const pinInputs = [
    document.getElementById('pin1'),
    document.getElementById('pin2'),
    document.getElementById('pin3'),
    document.getElementById('pin4'),
    document.getElementById('pin5'),
    document.getElementById('pin6')
];

const pinConfirmInputs = [
    document.getElementById('pinConfirm1'),
    document.getElementById('pinConfirm2'),
    document.getElementById('pinConfirm3'),
    document.getElementById('pinConfirm4'),
    document.getElementById('pinConfirm5'),
    document.getElementById('pinConfirm6')
];

// PIN Modal State
let isSettingNewPin = false;

// Load private transactions from localStorage
function loadPrivateTransactions() {
    const stored = localStorage.getItem('privateBudgetTransactions');
    if (stored) {
        privateTransactions = JSON.parse(stored);
    }
}

// Save private transactions to localStorage
function savePrivateTransactions() {
    localStorage.setItem('privateBudgetTransactions', JSON.stringify(privateTransactions));
}

// Get PIN from localStorage
function getStoredPin() {
    return localStorage.getItem('privateBudgetPIN');
}

// Set PIN in localStorage
function setStoredPin(pin) {
    localStorage.setItem('privateBudgetPIN', pin);
}

// Get PIN from input fields
function getPinFromInputs(inputs) {
    return inputs.map(input => input.value).join('');
}

// Clear PIN inputs
function clearPinInputs(inputs) {
    inputs.forEach(input => {
        input.value = '';
    });
    if (inputs.length > 0) {
        inputs[0].focus();
    }
}

// Show error message
function showPinError(message) {
    pinError.textContent = message;
    pinError.style.display = 'block';
    setTimeout(() => {
        pinError.style.display = 'none';
    }, 3000);
}

// Open PIN modal
function openPinModal() {
    // Check if PIN modal exists
    if (!pinModal || !pinInputs || !pinConfirmInputs || pinInputs.length === 0) {
        console.error('PIN modal elements not initialized');
        return;
    }

    const storedPin = getStoredPin();

    if (!storedPin) {
        // First time - set up PIN
        isSettingNewPin = true;
        pinModalTitle.textContent = 'Set Up Private Budget PIN';
        pinModalMessage.textContent = 'Create a 6-digit PIN to secure your private budget';
        pinConfirmContainer.style.display = 'block';
    } else {
        // PIN exists - authenticate
        isSettingNewPin = false;
        pinModalTitle.textContent = 'Enter PIN';
        pinModalMessage.textContent = 'Enter your 6-digit PIN to access Private Budget';
        pinConfirmContainer.style.display = 'none';
    }

    clearPinInputs(pinInputs);
    clearPinInputs(pinConfirmInputs);
    pinError.style.display = 'none';
    pinModal.style.display = 'flex';

    // Re-initialize Lucide icons for modal
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        lucide.createIcons();
    }

    // Focus first input
    setTimeout(() => pinInputs[0].focus(), 100);
}

// Close PIN modal
function closePinModalFunc() {
    pinModal.style.display = 'none';
    clearPinInputs(pinInputs);
    clearPinInputs(pinConfirmInputs);
}

// Enter Private Mode
function enterPrivateMode() {
    isPrivateMode = true;
    loadPrivateTransactions();

    // Add private mode class to body for styling
    document.body.classList.add('private-mode');

    // Update UI
    privateBudgetBtn.classList.add('active');
    const currentMemberDisplay = document.getElementById('currentMemberDisplay');
    const currentMemberDisplayParent = currentMemberDisplay.parentElement;
    currentMemberDisplayParent.classList.add('private-mode-active');
    currentMemberDisplay.textContent = '🔒 Private Budget';

    // Hide member selector controls
    const memberSelectorSection = document.querySelector('.member-selector-section');
    if (memberSelectorSection) {
        memberSelectorSection.style.display = 'none';
    }

    // Render private transactions
    renderTransactions();

    closePinModalFunc();
}

// Exit Private Mode
function exitPrivateMode() {
    isPrivateMode = false;

    // Remove private mode class from body for styling
    document.body.classList.remove('private-mode');

    // Update UI
    privateBudgetBtn.classList.remove('active');
    const currentMemberDisplay = document.getElementById('currentMemberDisplay');
    const currentMemberDisplayParent = currentMemberDisplay.parentElement;
    currentMemberDisplayParent.classList.remove('private-mode-active');
    updateCurrentMemberDisplay();

    // Show member selector controls
    const memberSelectorSection = document.querySelector('.member-selector-section');
    if (memberSelectorSection) {
        memberSelectorSection.style.display = 'block';
    }

    // Render family transactions
    renderTransactions();
}

// Handle PIN submission
function handlePinSubmit() {
    const enteredPin = getPinFromInputs(pinInputs);

    // Validate PIN length
    if (enteredPin.length !== 6) {
        showPinError('Please enter all 6 digits');
        return;
    }

    // Validate PIN contains only numbers
    if (!/^\d{6}$/.test(enteredPin)) {
        showPinError('PIN must contain only numbers');
        return;
    }

    if (isSettingNewPin) {
        // Setting new PIN - need confirmation
        const confirmPin = getPinFromInputs(pinConfirmInputs);

        if (confirmPin.length !== 6) {
            showPinError('Please confirm your PIN');
            return;
        }

        if (enteredPin !== confirmPin) {
            showPinError('PINs do not match. Please try again.');
            clearPinInputs(pinInputs);
            clearPinInputs(pinConfirmInputs);
            return;
        }

        // Save new PIN
        setStoredPin(enteredPin);
        enterPrivateMode();
    } else {
        // Verifying existing PIN
        const storedPin = getStoredPin();

        if (enteredPin === storedPin) {
            enterPrivateMode();
        } else {
            showPinError('Incorrect PIN. Please try again.');
            clearPinInputs(pinInputs);
        }
    }
}

// Auto-focus next input on digit entry
function setupPinInputAutoFocus(inputs) {
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            // Only allow numbers
            e.target.value = e.target.value.replace(/[^0-9]/g, '');

            // Move to next input if digit entered
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            // Move to previous input on backspace if current is empty
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }

            // Submit on Enter key
            if (e.key === 'Enter') {
                e.preventDefault();
                handlePinSubmit();
            }
        });

        // Handle paste
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');

            if (pastedData.length === 6) {
                pastedData.split('').forEach((digit, i) => {
                    if (inputs[i]) {
                        inputs[i].value = digit;
                    }
                });
                inputs[5].focus();
            }
        });
    });
}

// Event Listeners
if (privateBudgetBtn) {
    privateBudgetBtn.addEventListener('click', () => {
        if (isPrivateMode) {
            // Already in private mode - exit
            exitPrivateMode();
        } else {
            // Enter private mode - show PIN modal
            if (!pinModal) {
                alert('PIN modal not available. Please refresh the page.');
                return;
            }
            openPinModal();
        }
    });
}

if (closePinModal) {
    closePinModal.addEventListener('click', closePinModalFunc);
}

if (cancelPinBtn) {
    cancelPinBtn.addEventListener('click', closePinModalFunc);
}

if (submitPinBtn) {
    submitPinBtn.addEventListener('click', handlePinSubmit);
}

// Close modal on outside click
if (pinModal) {
    pinModal.addEventListener('click', (e) => {
        if (e.target === pinModal) {
            closePinModalFunc();
        }
    });
}

// Setup auto-focus for PIN inputs
if (pinInputs && pinInputs.length === 6) {
    setupPinInputAutoFocus(pinInputs);
}

if (pinConfirmInputs && pinConfirmInputs.length === 6) {
    setupPinInputAutoFocus(pinConfirmInputs);
}

// Initialize app
loadTransactions();


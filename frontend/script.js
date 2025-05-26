class ExpenseTracker {
    constructor() {
        this.expenses = this.loadExpenses();
        this.form = document.getElementById('expenseForm');
        this.expensesBody = document.getElementById('expensesBody');
        this.totalAmount = document.getElementById('totalAmount');
        this.monthlyAmount = document.getElementById('monthlyAmount');
        this.totalEntries = document.getElementById('totalEntries');
        this.chart = null;
        this.isDarkMode = this.loadTheme();

        this.init();
    }

    init() {
        // Set today's date as default
        document.getElementById('date').valueAsDate = new Date();
        
        // Bind events
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Initialize theme
        this.applyTheme();
        
        // Initial render
        this.renderExpenses();
        this.updateSummary();
        this.initChart();
    }

    handleSubmit(e) {
        e.preventDefault();
        
        if (this.validateForm()) {
            const formData = new FormData(this.form);
            const expense = {
                id: Date.now(),
                description: formData.get('description').trim(),
                amount: parseFloat(formData.get('amount')),
                category: formData.get('category'),
                date: formData.get('date')
            };

            this.addExpense(expense);
            this.form.reset();
            document.getElementById('date').valueAsDate = new Date();
            this.clearErrors();
        }
    }

    validateForm() {
        let isValid = true;
        this.clearErrors();

        const description = document.getElementById('description').value.trim();
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;

        if (!description) {
            this.showError('descriptionError', 'Description is required');
            isValid = false;
        }

        if (!amount || parseFloat(amount) <= 0) {
            this.showError('amountError', 'Please enter a valid amount');
            isValid = false;
        }

        if (!category) {
            this.showError('categoryError', 'Please select a category');
            isValid = false;
        }

        if (!date) {
            this.showError('dateError', 'Date is required');
            isValid = false;
        }

        return isValid;
    }

    showError(elementId, message) {
        document.getElementById(elementId).textContent = message;
    }

    clearErrors() {
        const errorElements = document.querySelectorAll('.error');
        errorElements.forEach(element => element.textContent = '');
    }

    addExpense(expense) {
        this.expenses.unshift(expense);
        this.saveExpenses();
        this.renderExpenses();
        this.updateSummary();
        this.updateChart();
    }

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(expense => expense.id !== id);
            this.saveExpenses();
            this.renderExpenses();
            this.updateSummary();
            this.updateChart();
        }
    }

    renderExpenses() {
        if (this.expenses.length === 0) {
            this.expensesBody.innerHTML = `
                <tr class="no-expenses">
                    <td colspan="5">No expenses added yet. Add your first expense above!</td>
                </tr>
            `;
            return;
        }

        this.expensesBody.innerHTML = this.expenses.map(expense => `
            <tr>
                <td>${this.formatDate(expense.date)}</td>
                <td>${expense.description}</td>
                <td><span class="category-badge category-${expense.category}">${this.formatCategory(expense.category)}</span></td>
                <td>$${expense.amount.toFixed(2)}</td>
                <td>
                    <button class="btn btn-delete" onclick="expenseTracker.deleteExpense(${expense.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateSummary() {
        const total = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyTotal = this.expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === currentMonth && 
                       expenseDate.getFullYear() === currentYear;
            })
            .reduce((sum, expense) => sum + expense.amount, 0);

        this.totalAmount.textContent = `$${total.toFixed(2)}`;
        this.monthlyAmount.textContent = `$${monthlyTotal.toFixed(2)}`;
        this.totalEntries.textContent = this.expenses.length;
    }

    initChart() {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF'
                    ],
                    borderWidth: 2,
                    borderColor: this.isDarkMode ? '#16213e' : '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: this.isDarkMode ? '#eee' : '#333',
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        this.updateChart();
    }

    updateChart() {
        if (!this.chart) return;

        const categoryTotals = this.expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {});

        const labels = Object.keys(categoryTotals).map(cat => this.formatCategory(cat));
        const data = Object.values(categoryTotals);

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.data.datasets[0].borderColor = this.isDarkMode ? '#16213e' : '#ffffff';
        this.chart.options.plugins.legend.labels.color = this.isDarkMode ? '#eee' : '#333';

        const noDataMessage = document.getElementById('noDataMessage');
        const chartCanvas = document.getElementById('expenseChart');

        if (data.length === 0) {
            noDataMessage.style.display = 'block';
            chartCanvas.style.display = 'none';
        } else {
            noDataMessage.style.display = 'none';
            chartCanvas.style.display = 'block';
            this.chart.update();
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.saveTheme();
        this.applyTheme();
        if (this.chart) {
            this.updateChart();
        }
    }

    applyTheme() {
        const themeToggle = document.getElementById('themeToggle');
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️';
            themeToggle.title = 'Switch to light mode';
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.textContent = '🌙';
            themeToggle.title = 'Switch to dark mode';
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatCategory(category) {
        const categories = {
            food: 'Food & Dining',
            transport: 'Transportation',
            entertainment: 'Entertainment',
            utilities: 'Utilities',
            other: 'Other'
        };
        return categories[category] || category;
    }

    loadExpenses() {
        const stored = localStorage.getItem('expenses');
        return stored ? JSON.parse(stored) : [];
    }

    saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }

    loadTheme() {
        const stored = localStorage.getItem('darkMode');
        return stored ? JSON.parse(stored) : false;
    }

    saveTheme() {
        localStorage.setItem('darkMode', JSON.stringify(this.isDarkMode));
    }
}

// Initialize the expense tracker
const expenseTracker = new ExpenseTracker();
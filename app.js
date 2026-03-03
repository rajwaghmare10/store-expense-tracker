// ==================== ANGULAR APP INITIALIZATION ====================
var app = angular.module('expenseTrackerApp', []);

// ==================== MAIN CONTROLLER ====================
app.controller('MainController', ['$scope', '$timeout', function($scope, $timeout) {
    
    // ==================== INITIAL DATA SETUP ====================
    
    // Default categories with icons
    var defaultCategories = [
        { id: 1, name: 'Sales', icon: 'fa-shopping-cart', type: 'income' },
        { id: 2, name: 'Services', icon: 'fa-hands-helping', type: 'income' },
        { id: 3, name: 'Rent', icon: 'fa-home', type: 'expense' },
        { id: 4, name: 'Utilities', icon: 'fa-bolt', type: 'expense' },
        { id: 5, name: 'Salaries', icon: 'fa-users', type: 'expense' },
        { id: 6, name: 'Inventory', icon: 'fa-boxes', type: 'expense' },
        { id: 7, name: 'Marketing', icon: 'fa-bullhorn', type: 'expense' },
        { id: 8, name: 'Maintenance', icon: 'fa-tools', type: 'expense' }
    ];

    // Sample transactions for demonstration
    var sampleTransactions = [
        { id: 1, date: '2025-10-20', type: 'income', category: 'Sales', description: 'Daily sales revenue', amount: 5000 },
        { id: 2, date: '2025-10-20', type: 'expense', category: 'Inventory', description: 'Stock purchase', amount: 2000 },
        { id: 3, date: '2025-10-21', type: 'income', category: 'Services', description: 'Consultation fee', amount: 1500 },
        { id: 4, date: '2025-10-21', type: 'expense', category: 'Utilities', description: 'Electricity bill', amount: 300 },
        { id: 5, date: '2025-10-22', type: 'income', category: 'Sales', description: 'Weekend sales', amount: 7500 },
        { id: 6, date: '2025-10-22', type: 'expense', category: 'Salaries', description: 'Staff payment', amount: 4000 },
        { id: 7, date: '2025-10-23', type: 'expense', category: 'Rent', description: 'Monthly rent', amount: 3000 },
        { id: 8, date: '2025-10-23', type: 'income', category: 'Sales', description: 'Today sales', amount: 4200 }
    ];

    // ==================== LOAD DATA FROM LOCALSTORAGE ====================
    var storedTransactions = localStorage.getItem('transactions');
    var storedCategories = localStorage.getItem('categories');
    
    $scope.transactions = storedTransactions ? JSON.parse(storedTransactions) : sampleTransactions;
    $scope.categories = storedCategories ? JSON.parse(storedCategories) : defaultCategories;
    $scope.filteredTransactions = $scope.transactions.slice();
    
    // ==================== SCOPE VARIABLES ====================
    $scope.currentPage = 'dashboard';
    $scope.showModal = false;
    $scope.showCategoryModal = false;
    $scope.isEdit = false;
    $scope.isCategoryEdit = false;

    // Available icons for categories
    $scope.availableIcons = [
        'fa-shopping-cart', 'fa-hands-helping', 'fa-home', 'fa-bolt',
        'fa-users', 'fa-boxes', 'fa-bullhorn', 'fa-tools', 'fa-car',
        'fa-utensils', 'fa-laptop', 'fa-heart', 'fa-graduation-cap',
        'fa-plane', 'fa-gift', 'fa-coffee', 'fa-dumbbell', 'fa-book'
    ];

    // Initialize filters
    $scope.filters = {
        type: '',
        category: '',
        startDate: '',
        endDate: '',
        search: ''
    };

    // Initialize new transaction with Date object
    $scope.newTransaction = {
        date: new Date(),
        type: 'expense',
        category: '',
        description: '',
        amount: 0
    };

    // Initialize new category
    $scope.newCategory = {
        name: '',
        icon: 'fa-tag',
        type: 'expense'
    };

    // ==================== HELPER FUNCTIONS ====================
    
    // Save data to localStorage
    function saveData() {
        localStorage.setItem('transactions', JSON.stringify($scope.transactions));
        localStorage.setItem('categories', JSON.stringify($scope.categories));
    }

    // Calculate statistics for dashboard
    function calculateStats() {
        var totalIncome = $scope.transactions
            .filter(function(t) { return t.type === 'income'; }) 
            .reduce(function(sum, t) { return sum + parseFloat(t.amount); }, 0);
        
        var totalExpense = $scope.transactions
            .filter(function(t) { return t.type === 'expense'; })
            .reduce(function(sum, t) { return sum + parseFloat(t.amount); }, 0);
        
        $scope.stats = {
            totalIncome: totalIncome,
            totalExpense: totalExpense,
            netProfit: totalIncome - totalExpense
        };

        $scope.recentTransactions = $scope.transactions.slice(-5).reverse();
    }

    // ==================== PAGE NAVIGATION ====================
    $scope.showPage = function(page) {
        $scope.currentPage = page;
        
        if (page === 'dashboard') {
            calculateStats();
            $timeout(function() { renderDashboardCharts(); }, 100);
        } else if (page === 'reports') {
            calculateReports();
            $timeout(function() { renderReportCharts(); }, 100);
        }
    };

    // ==================== TRANSACTION FUNCTIONS ====================
    
    // Open modal to add new transaction
    $scope.openAddModal = function() {
        $scope.isEdit = false;
        $scope.newTransaction = {
            date: new Date(),
            type: 'expense',
            category: '',
            description: '',
            amount: 0
        };
        $scope.showModal = true;
    };

    // Open modal to edit existing transaction
    $scope.openEditModal = function(transaction) {
        $scope.isEdit = true;
        var transactionCopy = angular.copy(transaction);
        transactionCopy.date = new Date(transactionCopy.date);
        $scope.newTransaction = transactionCopy;
        $scope.showModal = true;
    };

    // Close transaction modal
    $scope.closeModal = function() {
        $scope.showModal = false;
    };

    // Save transaction (add or update)
    $scope.saveTransaction = function() {
        var transactionToSave = angular.copy($scope.newTransaction);
        transactionToSave.date = $scope.newTransaction.date.toISOString().split('T')[0];
        
        if ($scope.isEdit) {
            var index = $scope.transactions.findIndex(function(t) { 
                return t.id === transactionToSave.id; 
            });
            if (index !== -1) {
                $scope.transactions[index] = transactionToSave;
            }
        } else {
            transactionToSave.id = Date.now();
            $scope.transactions.push(transactionToSave);
        }
        
        saveData();
        $scope.applyFilters();
        calculateStats();
        $scope.closeModal();
    };

    // Delete transaction
    $scope.deleteTransaction = function(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            $scope.transactions = $scope.transactions.filter(function(t) { 
                return t.id !== id; 
            });
            saveData();
            $scope.applyFilters();
            calculateStats();
        }
    };

    // ==================== FILTER FUNCTIONS ====================
    
    // Apply filters to transactions
    $scope.applyFilters = function() {
        $scope.filteredTransactions = $scope.transactions.filter(function(t) {
            var matchType = !$scope.filters.type || t.type === $scope.filters.type;
            var matchCategory = !$scope.filters.category || t.category === $scope.filters.category;
            var matchSearch = !$scope.filters.search || 
                t.description.toLowerCase().indexOf($scope.filters.search.toLowerCase()) !== -1 ||
                t.category.toLowerCase().indexOf($scope.filters.search.toLowerCase()) !== -1;
            
            var matchDateStart = true;
            var matchDateEnd = true;
            
            if ($scope.filters.startDate) {
                var startDate = new Date($scope.filters.startDate);
                startDate.setHours(0, 0, 0, 0);
                matchDateStart = new Date(t.date) >= startDate;
            }
            
            if ($scope.filters.endDate) {
                var endDate = new Date($scope.filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                matchDateEnd = new Date(t.date) <= endDate;
            }
            
            return matchType && matchCategory && matchSearch && matchDateStart && matchDateEnd;
        });
    };

    // Reset all filters
    $scope.resetFilters = function() {
        $scope.filters = {
            type: '',
            category: '',
            startDate: '',
            endDate: '',
            search: ''
        };
        $scope.filteredTransactions = $scope.transactions.slice();
    };

    // ==================== EXPORT FUNCTIONS ====================
    
    // Export transactions to CSV
    $scope.exportToCSV = function() {
        var csv = 'Date,Type,Category,Description,Amount\n';
        $scope.filteredTransactions.forEach(function(t) {
            csv += t.date + ',' + t.type + ',' + t.category + ',"' + t.description + '",' + t.amount + '\n';
        });
        
        var blob = new Blob([csv], { type: 'text/csv' });
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'transactions_' + new Date().toISOString().split('T')[0] + '.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // ==================== CATEGORY FUNCTIONS ====================
    
    // Open modal to add new category
    $scope.openCategoryModal = function() {
        $scope.isCategoryEdit = false;
        $scope.newCategory = {
            name: '',
            icon: 'fa-tag',
            type: 'expense'
        };
        $scope.showCategoryModal = true;
    };

    // Open modal to edit existing category
    $scope.openCategoryEditModal = function(category) {
        $scope.isCategoryEdit = true;
        $scope.newCategory = angular.copy(category);
        $scope.showCategoryModal = true;
    };

    // Close category modal
    $scope.closeCategoryModal = function() {
        $scope.showCategoryModal = false;
    };

    // Save category (add or update)
    $scope.saveCategory = function() {
        if ($scope.newCategory.name) {
            if ($scope.isCategoryEdit) {
                var index = $scope.categories.findIndex(function(c) { 
                    return c.id === $scope.newCategory.id; 
                });
                if (index !== -1) {
                    $scope.categories[index] = $scope.newCategory;
                }
            } else {
                $scope.newCategory.id = Date.now();
                $scope.categories.push($scope.newCategory);
            }
            saveData();
            $scope.closeCategoryModal();
        }
    };

    // Delete category
    $scope.deleteCategory = function(id) {
        if (confirm('Are you sure you want to delete this category?')) {
            $scope.categories = $scope.categories.filter(function(c) { 
                return c.id !== id; 
            });
            saveData();
        }
    };

    // Get categories by type (income or expense)
    $scope.getCategoriesByType = function(type) {
        return $scope.categories.filter(function(c) { 
            return c.type === type; 
        });
    };

    // ==================== REPORTS FUNCTIONS ====================
    
    // Calculate weekly and monthly data for reports
    function calculateReports() {
        var weeklyData = {};
        var monthlyData = {};
        
        $scope.transactions.forEach(function(t) {
            var date = new Date(t.date);
            var week = 'Week ' + Math.ceil(date.getDate() / 7);
            var month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            
            if (!weeklyData[week]) {
                weeklyData[week] = { income: 0, expense: 0 };
            }
            if (!monthlyData[month]) {
                monthlyData[month] = { income: 0, expense: 0 };
            }
            
            if (t.type === 'income') {
                weeklyData[week].income += parseFloat(t.amount);
                monthlyData[month].income += parseFloat(t.amount);
            } else {
                weeklyData[week].expense += parseFloat(t.amount);
                monthlyData[month].expense += parseFloat(t.amount);
            }
        });

        $scope.weeklyData = weeklyData;
        $scope.monthlyData = monthlyData;
    }

    // ==================== CHART RENDERING ====================
    
    var dashboardChartsRendered = false;
    var reportChartsRendered = false;

    // Render dashboard charts (pie and bar)
    function renderDashboardCharts() {
        if (dashboardChartsRendered) return;
        
        // Pie chart for income vs expenses
        var pieCtx = document.getElementById('pieChart');
        if (pieCtx) {
            new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: ['Income', 'Expenses'],
                    datasets: [{
                        data: [$scope.stats.totalIncome, $scope.stats.totalExpense],
                        backgroundColor: ['#27ae60', '#e74c3c']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        // Bar chart for category-wise breakdown
        var barCtx = document.getElementById('barChart');
        if (barCtx) {
            var categories = {};
            $scope.transactions.forEach(function(t) {
                if (!categories[t.category]) {
                    categories[t.category] = 0;
                }
                categories[t.category] += parseFloat(t.amount);
            });

            new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(categories),
                    datasets: [{
                        label: 'Amount (₹)',
                        data: Object.values(categories),
                        backgroundColor: '#3498db'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
        
        dashboardChartsRendered = true;
    }

    // Render report charts (weekly and monthly)
    function renderReportCharts() {
        if (reportChartsRendered) return;
        
        // Weekly line chart
        var weeklyCtx = document.getElementById('weeklyChart');
        if (weeklyCtx) {
            new Chart(weeklyCtx, {
                type: 'line',
                data: {
                    labels: Object.keys($scope.weeklyData),
                    datasets: [{
                        label: 'Income (₹)',
                        data: Object.values($scope.weeklyData).map(function(d) { 
                            return d.income; 
                        }),
                        borderColor: '#27ae60',
                        backgroundColor: 'rgba(39, 174, 96, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Expense (₹)',
                        data: Object.values($scope.weeklyData).map(function(d) { 
                            return d.expense; 
                        }),
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Weekly Summary'
                        }
                    }
                }
            });
        }

        // Monthly bar chart
        var monthlyCtx = document.getElementById('monthlyChart');
        if (monthlyCtx) {
            new Chart(monthlyCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys($scope.monthlyData),
                    datasets: [{
                        label: 'Income (₹)',
                        data: Object.values($scope.monthlyData).map(function(d) { 
                            return d.income; 
                        }),
                        backgroundColor: '#27ae60'
                    }, {
                        label: 'Expense (₹)',
                        data: Object.values($scope.monthlyData).map(function(d) { 
                            return d.expense; 
                        }),
                        backgroundColor: '#e74c3c'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Monthly Summary'
                        }
                    }
                }
            });
        }
        
        reportChartsRendered = true;
    }

    // ==================== INITIALIZATION ====================
    
    // Display current date in navigation
    var dateElement = document.getElementById('current-date');
    var today = new Date();
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = today.toLocaleDateString('en-US', options);

    // Initialize dashboard on load
    $scope.showPage('dashboard');
}]);
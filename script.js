// Состояние приложения
let expenses = JSON.parse(localStorage.getItem('zenSpend_data')) || [];
let categoryChart, dailyChart;

// Элементы
const form = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const totalSumEl = document.getElementById('total-sum');
const totalCountEl = document.getElementById('total-count');

// Инициализация графиков
function initCharts() {
    const ctxCat = document.getElementById('categoryChart').getContext('2d');
    const ctxDay = document.getElementById('dailyChart').getContext('2d');

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
    };

    categoryChart = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: ['Food', 'Transport', 'Entertainment', 'Other'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#3f3f46'],
                borderWidth: 0
            }]
        },
        options: commonOptions
    });

    dailyChart = new Chart(ctxDay, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: '#6366f1',
                borderRadius: 4
            }]
        },
        options: {
            ...commonOptions,
            scales: { 
                y: { display: false }, 
                x: { grid: { display: false }, ticks: { color: '#71717a', font: { size: 10 } } } 
            }
        }
    });
}

// Обновление интерфейса
function updateUI() {
    expenseList.innerHTML = '';
    let total = 0;
    
    const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(exp => {
        total += parseFloat(exp.amount);
        const item = document.createElement('div');
        item.className = 'expense-item';
        item.innerHTML = `
            <div class="expense-info">
                <span class="cat">${translateCat(exp.category)}</span>
                <span class="comm">${exp.comment || 'Без комментария'}</span>
                <span class="date">${formatDate(exp.date)}</span>
            </div>
            <div class="expense-amount">
                <span class="amt">${parseFloat(exp.amount).toLocaleString()} ₽</span>
                <button class="delete-btn" onclick="deleteExpense('${exp.id}', this)">Удалить</button>
            </div>
        `;
        expenseList.appendChild(item);
    });

    totalSumEl.textContent = `${total.toLocaleString()} ₽`;
    totalCountEl.textContent = `${expenses.length} зап.`;
    
    updateCharts();
    localStorage.setItem('zenSpend_data', JSON.stringify(expenses));
}

function updateCharts() {
    const cats = { Food: 0, Transport: 0, Entertainment: 0, Other: 0 };
    expenses.forEach(e => cats[e.category] += parseFloat(e.amount));
    categoryChart.data.datasets[0].data = Object.values(cats);
    categoryChart.update();

    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const dailyData = last7Days.map(date => {
        return expenses
            .filter(e => e.date === date)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    });

    dailyChart.data.labels = last7Days.map(d => d.split('-').slice(2)); 
    dailyChart.data.datasets[0].data = dailyData;
    dailyChart.update();
}

// Функции-помощники
const translateCat = (cat) => ({
    'Food': 'Еда', 'Transport': 'Транспорт', 'Entertainment': 'Досуг', 'Other': 'Другое'
}[cat]);

const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

// Обработка формы
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newExp = {
        id: Date.now().toString(),
        amount: document.getElementById('amount').value,
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
        comment: document.getElementById('comment').value
    };
    expenses.push(newExp);
    form.reset();
    document.getElementById('date').valueAsDate = new Date();
    updateUI();
});

// Удаление и Экспорт
window.deleteExpense = (id, btn) => {
    if (btn.classList.contains('confirm')) {
        expenses = expenses.filter(e => e.id !== id);
        updateUI();
    } else {
        btn.textContent = 'Уверены?';
        btn.classList.add('confirm');
        setTimeout(() => { if(btn) { btn.textContent = 'Удалить'; btn.classList.remove('confirm'); } }, 3000);
    }
};

document.getElementById('export-btn').addEventListener('click', () => {
    if (!expenses.length) return alert('Нет данных');
    const content = "Дата;Категория;Сумма;Комментарий\n" + 
        expenses.map(e => `${e.date};${e.category};${e.amount};${e.comment}`).join("\n");
    const blob = new Blob(["\ufeff" + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ZenSpend_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
});

window.onload = () => {
    document.getElementById('date').valueAsDate = new Date();
    initCharts();
    updateUI();
};

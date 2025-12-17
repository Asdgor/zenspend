let expenses = JSON.parse(localStorage.getItem('zen_pro_data')) || [];
let budget = localStorage.getItem('zen_budget') || 0;
let catChart;

window.onload = () => {
    document.getElementById('date').valueAsDate = new Date();
    document.getElementById('budget-input').value = budget > 0 ? budget : '';
    initChart();
    render();
};

function initChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    catChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Food', 'Transport', 'Entertainment', 'Other'],
            datasets: [{
                data: [0,0,0,0],
                backgroundColor: ['#8b5cf6', '#06b6d4', '#f59e0b', '#4b5563'],
                borderWidth: 0,
                cutout: '85%'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function render(filterTerm = '') {
    const list = document.getElementById('expense-list');
    list.innerHTML = '';
    let total = 0;

    const filtered = expenses.filter(e => 
        e.comment.toLowerCase().includes(filterTerm.toLowerCase()) || 
        e.category.toLowerCase().includes(filterTerm.toLowerCase())
    );

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(exp => {
        total += parseFloat(exp.amount);
        const el = document.createElement('div');
        el.className = 'expense-item';
        el.style = "display:flex; justify-content:space-between; padding:15px 0; border-bottom:1px solid var(--border);";
        el.innerHTML = `
            <div>
                <div style="font-size:10px; color:var(--accent); font-weight:800;">${exp.category.toUpperCase()}</div>
                <div style="font-size:14px; font-weight:500;">${exp.comment || 'Без описания'}</div>
                <div style="font-size:11px; color:var(--text-dim);">${exp.date}</div>
            </div>
            <div style="text-align:right;">
                <div class="amt" style="font-weight:700;">${parseFloat(exp.amount).toLocaleString()} ₽</div>
                <div style="font-size:10px; color:var(--danger); cursor:pointer;" onclick="deleteItem('${exp.id}')">Удалить</div>
            </div>
        `;
        list.appendChild(el);
    });

    document.getElementById('total-sum').textContent = `${total.toLocaleString()} ₽`;
    updateBudget(total);
    updateChartData();
    generateInsights(total);
    localStorage.setItem('zen_pro_data', JSON.stringify(expenses));
}

function updateBudget(total) {
    const progress = document.getElementById('budget-progress');
    const text = document.getElementById('budget-text');
    
    if (budget > 0) {
        const percent = Math.min((total / budget) * 100, 100);
        progress.style.width = percent + '%';
        progress.classList.toggle('warning', percent > 85);
        text.innerHTML = `Израсходовано ${Math.round(percent)}% от лимита (${budget} ₽)`;
    }
}

function generateInsights(total) {
    const panel = document.getElementById('insights-panel');
    const counts = { Food: 0, Transport: 0, Entertainment: 0, Other: 0 };
    expenses.forEach(e => counts[e.category] += parseFloat(e.amount));
    
    const maxCat = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    
    panel.innerHTML = `
        <div class="insight-item">💡 Больше всего трат в категории: <b>${maxCat}</b></div>
        <div class="insight-item">📈 Средний чек: <b>${expenses.length ? Math.round(total/expenses.length) : 0} ₽</b></div>
    `;
}

// Events
document.getElementById('expense-form').onsubmit = (e) => {
    e.preventDefault();
    expenses.push({
        id: Date.now().toString(),
        amount: document.getElementById('amount').value,
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
        comment: document.getElementById('comment').value
    });
    e.target.reset();
    document.getElementById('date').valueAsDate = new Date();
    render();
};

document.getElementById('budget-input').onchange = (e) => {
    budget = parseFloat(e.target.value) || 0;
    localStorage.setItem('zen_budget', budget);
    render();
};

document.getElementById('search-input').oninput = (e) => render(e.target.value);

document.getElementById('privacy-toggle').onclick = () => document.body.classList.toggle('privacy-enabled');

document.getElementById('download-png').onclick = () => {
    html2canvas(document.getElementById('capture-area'), { backgroundColor: '#050505', scale: 2 }).then(canvas => {
        const a = document.createElement('a');
        a.href = canvas.toDataURL();
        a.download = 'report.png';
        a.click();
    });
};

function deleteItem(id) {
    if(confirm('Удалить запись?')) {
        expenses = expenses.filter(e => e.id !== id);
        render();
    }
}

function updateChartData() {
    const counts = { Food: 0, Transport: 0, Entertainment: 0, Other: 0 };
    expenses.forEach(e => counts[e.category] += parseFloat(e.amount));
    catChart.data.datasets[0].data = Object.values(counts);
    catChart.update();
}

function exportCSV() {
    let csv = "\uFEFFДата,Категория,Сумма,Комментарий\n";
    expenses.forEach(e => csv += `${e.date},${e.category},${e.amount},"${e.comment}"\n`);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'expenses.csv';
    link.click();
}

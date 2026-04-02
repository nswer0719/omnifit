// js/tdee.js
let weightChart;

document.addEventListener('DOMContentLoaded', () => {
    initChart();
});

function initChart() {
    const ctx = document.getElementById('weightChart').getContext('2d');
    const labels = ['3/27', '3/28', '3/29', '3/30', '3/31', '4/01', '今日'];
    const data = [71.5, 71.2, 71.3, 70.8, 70.5, 70.2, 70.0];

    weightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '體重 (kg)',
                data: data,
                borderColor: '#00d2ff',
                backgroundColor: 'rgba(0, 210, 255, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#00d2ff',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#a0a0a0' } },
                x: { grid: { display: false }, ticks: { color: '#a0a0a0' } }
            }
        }
    });
}

function calculateTDEE() {
    const gender = document.getElementById('gender').value;
    const age = parseFloat(document.getElementById('age').value);
    const height = parseFloat(document.getElementById('height').value);
    const currentWeight = parseFloat(document.getElementById('current-weight').value);
    const targetWeight = parseFloat(document.getElementById('target-weight').value);
    const activity = parseFloat(document.getElementById('activity-level').value);

    if (!age || !height || !currentWeight || !targetWeight) {
        alert("請完整填寫所有個人數據");
        return;
    }

    let bmrCurrent, bmrTarget;
    if (gender === 'male') {
        bmrCurrent = (10 * currentWeight) + (6.25 * height) - (5 * age) + 5;
        bmrTarget = (10 * targetWeight) + (6.25 * height) - (5 * age) + 5;
    } else {
        bmrCurrent = (10 * currentWeight) + (6.25 * height) - (5 * age) - 161;
        bmrTarget = (10 * targetWeight) + (6.25 * height) - (5 * age) - 161;
    }

    const tdeeCurrent = Math.round(bmrCurrent * activity);
    const tdeeTarget = Math.round(bmrTarget * activity);

    document.getElementById('tdee-current').innerText = tdeeCurrent.toLocaleString();
    document.getElementById('tdee-target').innerText = tdeeTarget.toLocaleString();
    document.getElementById('dashboard-target-tdee').innerText = tdeeTarget.toLocaleString();

    weightChart.data.datasets[0].data[6] = currentWeight;
    weightChart.update();
    
    alert("數據已更新並同步至餐單系統！");
}
/**
 * Cloud Computing Cost Estimator - Data Visualization & Chart Engine
 * 
 * Uses Chart.js if loaded from CDN, and provides a zero-dependency HTML5/CSS
 * visual fallback if offline or the CDN is blocked.
 */

const CostCharts = (() => {
  let distributionChartInstance = null;
  let spendingChartInstance = null;
  let providerChartInstance = null;

  // Modern Cloud Console Color Palette
  const THEME_COLORS = {
    compute: '#3b82f6',     // Blue
    storage: '#8b5cf6',     // Violet
    dataTransfer: '#06b6d4',// Cyan
    database: '#10b981',    // Emerald
    loadBalancer: '#f59e0b',// Amber
    additional: '#ec4899',  // Pink
    aws: '#ff9900',         // AWS Orange
    azure: '#0089d6',       // Azure Blue
    gcp: '#4285f4',         // GCP Blue
    custom: '#6366f1'       // Indigo
  };

  /**
   * Check if Chart.js is available
   */
  function isChartJsAvailable() {
    return typeof Chart !== 'undefined';
  }

  /**
   * Render Cost Distribution Chart (Doughnut)
   */
  function renderDistributionChart(canvasId, fallbackId, subtotals, currency = 'INR') {
    const canvas = document.getElementById(canvasId);
    const fallback = document.getElementById(fallbackId);
    if (!canvas) return;

    const labels = ['Compute', 'Storage', 'Data Transfer', 'Database', 'Load Balancer', 'Additional'];
    const data = [
      subtotals.compute || 0,
      subtotals.storage || 0,
      subtotals.dataTransfer || 0,
      subtotals.database || 0,
      subtotals.loadBalancer || 0,
      subtotals.additional || 0
    ];
    const colors = [
      THEME_COLORS.compute,
      THEME_COLORS.storage,
      THEME_COLORS.dataTransfer,
      THEME_COLORS.database,
      THEME_COLORS.loadBalancer,
      THEME_COLORS.additional
    ];

    const total = data.reduce((a, b) => a + b, 0);

    if (isChartJsAvailable()) {
      if (fallback) fallback.style.display = 'none';
      canvas.style.display = 'block';

      if (distributionChartInstance) {
        distributionChartInstance.destroy();
      }

      const ctx = canvas.getContext('2d');
      distributionChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: document.body.classList.contains('dark-theme') ? '#1e293b' : '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: { family: "'Inter', sans-serif", size: 11 },
                color: document.body.classList.contains('dark-theme') ? '#cbd5e1' : '#475569'
              }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const val = context.raw || 0;
                  const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                  return `${context.label}: ${PricingEngine.formatCurrency(val, currency)} (${pct}%)`;
                }
              }
            }
          },
          cutout: '68%'
        }
      });
    } else {
      // HTML/CSS Fallback
      canvas.style.display = 'none';
      if (fallback) {
        fallback.style.display = 'flex';
        renderHtmlFallbackBars(fallback, labels, data, colors, total, currency);
      }
    }
  }

  /**
   * Render Monthly Spending Trend Chart
   */
  function renderSpendingChart(canvasId, fallbackId, monthlyTotal, currency = 'INR') {
    const canvas = document.getElementById(canvasId);
    const fallback = document.getElementById(fallbackId);
    if (!canvas) return;

    const months = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6',
                    'Month 7', 'Month 8', 'Month 9', 'Month 10', 'Month 11', 'Month 12'];
    
    // Illustrate cumulative 12-month linear projection
    const cumulativeData = months.map((m, idx) => (idx + 1) * monthlyTotal);

    if (isChartJsAvailable()) {
      if (fallback) fallback.style.display = 'none';
      canvas.style.display = 'block';

      if (spendingChartInstance) {
        spendingChartInstance.destroy();
      }

      const ctx = canvas.getContext('2d');
      spendingChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Cumulative Cost',
            data: cumulativeData,
            borderColor: THEME_COLORS.compute,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `Projected Total: ${PricingEngine.formatCurrency(context.raw, currency)}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: document.body.classList.contains('dark-theme') ? '#94a3b8' : '#64748b',
                font: { family: "'Inter', sans-serif", size: 10 },
                callback: (val) => PricingEngine.formatCurrency(val, currency).split('.')[0]
              },
              grid: {
                color: document.body.classList.contains('dark-theme') ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
              }
            },
            x: {
              ticks: {
                color: document.body.classList.contains('dark-theme') ? '#94a3b8' : '#64748b',
                font: { family: "'Inter', sans-serif", size: 10 }
              },
              grid: { display: false }
            }
          }
        }
      });
    } else {
      canvas.style.display = 'none';
      if (fallback) {
        fallback.style.display = 'block';
        fallback.innerHTML = `
          <div class="fallback-summary">
            <p><strong>Cumulative Projection:</strong> Month 6: ${PricingEngine.formatCurrency(monthlyTotal * 6, currency)} | Month 12: ${PricingEngine.formatCurrency(monthlyTotal * 12, currency)}</p>
          </div>
        `;
      }
    }
  }

  /**
   * Render Multi-Provider Comparison Chart (Bar)
   */
  function renderProviderChart(canvasId, fallbackId, providerTotals, currency = 'INR') {
    const canvas = document.getElementById(canvasId);
    const fallback = document.getElementById(fallbackId);
    if (!canvas) return;

    const labels = ['AWS', 'Microsoft Azure', 'Google Cloud', 'Custom'];
    const data = [
      providerTotals.aws || 0,
      providerTotals.azure || 0,
      providerTotals.gcp || 0,
      providerTotals.custom || 0
    ];
    const colors = [THEME_COLORS.aws, THEME_COLORS.azure, THEME_COLORS.gcp, THEME_COLORS.custom];

    if (isChartJsAvailable()) {
      if (fallback) fallback.style.display = 'none';
      canvas.style.display = 'block';

      if (providerChartInstance) {
        providerChartInstance.destroy();
      }

      const ctx = canvas.getContext('2d');
      providerChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Estimated Monthly Cost',
            data: data,
            backgroundColor: colors,
            borderRadius: 6,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `Est. Cost: ${PricingEngine.formatCurrency(context.raw, currency)}/mo`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: document.body.classList.contains('dark-theme') ? '#94a3b8' : '#64748b',
                callback: (val) => PricingEngine.formatCurrency(val, currency).split('.')[0]
              },
              grid: {
                color: document.body.classList.contains('dark-theme') ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
              }
            },
            x: {
              ticks: {
                color: document.body.classList.contains('dark-theme') ? '#94a3b8' : '#64748b',
                font: { family: "'Inter', sans-serif", weight: '600' }
              },
              grid: { display: false }
            }
          }
        }
      });
    } else {
      canvas.style.display = 'none';
      if (fallback) {
        fallback.style.display = 'flex';
        renderHtmlFallbackBars(fallback, labels, data, colors, Math.max(...data), currency, true);
      }
    }
  }

  /**
   * Helper for HTML fallback bars when Chart.js is not loaded
   */
  function renderHtmlFallbackBars(container, labels, data, colors, maxVal, currency, isDirectMax = false) {
    container.innerHTML = '';
    labels.forEach((label, idx) => {
      const val = data[idx] || 0;
      const pct = maxVal > 0 ? ((val / maxVal) * 100).toFixed(1) : 0;
      const row = document.createElement('div');
      row.className = 'fallback-bar-row';
      row.innerHTML = `
        <div class="fallback-bar-info">
          <span class="fallback-bar-label">${label}</span>
          <span class="fallback-bar-val">${PricingEngine.formatCurrency(val, currency)} (${pct}%)</span>
        </div>
        <div class="fallback-bar-track">
          <div class="fallback-bar-fill" style="width: ${pct}%; background-color: ${colors[idx % colors.length]};"></div>
        </div>
      `;
      container.appendChild(row);
    });
  }

  return {
    renderDistributionChart,
    renderSpendingChart,
    renderProviderChart,
    isChartJsAvailable
  };
})();

if (typeof module !== 'undefined') {
  module.exports = CostCharts;
}

/**
 * Cloud Computing Cost Estimator - Main Application Controller
 * 
 * Orchestrates DOM events, LocalStorage persistence, live recalculation,
 * multi-provider comparison, configuration diffs, and report export.
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  let currentConfig = CostCalculator.createDefaultConfig();
  let savedConfigs = [];
  let currentCurrency = 'INR';
  let currentTheme = 'light';
  let activeSection = 'dashboard';

  // Secondary configs for comparison tab
  let compareConfigA = CostCalculator.createDefaultConfig('Config A (Basic Tier)');
  compareConfigA.compute.vms = 1;
  compareConfigA.loadBalancer.enabled = false;

  let compareConfigB = CostCalculator.createDefaultConfig('Config B (HA Multi-AZ)');
  compareConfigB.compute.vms = 4;
  compareConfigB.loadBalancer.enabled = true;
  compareConfigB.database.instances = 2;

  // DOM Elements - Navigation & Shell
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.app-section');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const currencySelect = document.getElementById('currency-select');
  const providerSelect = document.getElementById('provider-select');
  const resetCalcBtn = document.getElementById('reset-calc-btn');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  const toastContainer = document.getElementById('toast-container');

  // Load Preferences & Storage
  function initStorage() {
    try {
      const storedTheme = localStorage.getItem('cc_theme');
      if (storedTheme === 'dark') setTheme('dark');

      const storedCurrency = localStorage.getItem('cc_currency');
      if (storedCurrency && (storedCurrency === 'INR' || storedCurrency === 'USD')) {
        currentCurrency = storedCurrency;
        currencySelect.value = currentCurrency;
      }

      const storedList = localStorage.getItem('cc_saved_configs');
      if (storedList) {
        savedConfigs = JSON.parse(storedList);
      }
    } catch (e) {
      console.warn('LocalStorage unavailable or restricted:', e);
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem('cc_saved_configs', JSON.stringify(savedConfigs));
      localStorage.setItem('cc_theme', currentTheme);
      localStorage.setItem('cc_currency', currentCurrency);
    } catch (e) {
      console.warn('Failed saving to LocalStorage:', e);
    }
  }

  function showToast(message, type = 'info') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Theme Handling
  function setTheme(theme) {
    currentTheme = theme;
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      themeToggleBtn.innerHTML = '☀️ Light Mode';
    } else {
      document.body.classList.remove('dark-theme');
      themeToggleBtn.innerHTML = '🌙 Dark Mode';
    }
    saveToStorage();
    refreshAllViews();
  }

  themeToggleBtn.addEventListener('click', () => {
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
  });

  // Currency Switcher
  currencySelect.addEventListener('change', (e) => {
    const oldCurrency = currentCurrency;
    currentCurrency = e.target.value;
    saveToStorage();

    // Adjust currentConfig rates when switching currency
    if (oldCurrency !== currentCurrency) {
      syncRatesForCurrency();
    }
    refreshAllViews();
    showToast(`Currency updated to ${currentCurrency}`);
  });

  function syncRatesForCurrency() {
    const profile = PricingEngine.getProfile(currentConfig.provider, currentCurrency);
    currentConfig.currency = currentCurrency;
    currentConfig.compute.hourlyRate = profile.computeHourly;
    currentConfig.storage.pricePerGb = profile.storage[currentConfig.storage.type || 'standard'];
    currentConfig.dataTransfer.pricePerGb = profile.egressPerGb;
    currentConfig.database.monthlyPrice = profile.databaseMonthly;
    currentConfig.loadBalancer.monthlyPrice = profile.loadBalancerMonthly;

    // Convert additional items
    currentConfig.additionalServices.forEach(srv => {
      if (currentCurrency === 'INR') {
        srv.monthlyPrice = srv.monthlyPrice * PricingEngine.EXCHANGE_RATE_USD_TO_INR;
      } else {
        srv.monthlyPrice = srv.monthlyPrice / PricingEngine.EXCHANGE_RATE_USD_TO_INR;
      }
    });

    populateFormFields();
  }

  // Navigation Logic
  function switchSection(sectionId) {
    activeSection = sectionId;
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === sectionId);
    });
    sections.forEach(sec => {
      sec.classList.toggle('active', sec.id === `section-${sectionId}`);
    });
    if (window.innerWidth <= 768 && sidebar) {
      sidebar.classList.remove('open');
    }
    refreshAllViews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchSection(link.dataset.section);
    });
  });

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Action buttons on dashboard
  const newEstimateBtn = document.getElementById('new-estimate-btn');
  if (newEstimateBtn) {
    newEstimateBtn.addEventListener('click', () => switchSection('calculator'));
  }

  // Provider Selection Handler
  providerSelect.addEventListener('change', (e) => {
    const pKey = e.target.value;
    currentConfig.provider = pKey;
    const profile = PricingEngine.getProfile(pKey, currentCurrency);

    currentConfig.compute.hourlyRate = profile.computeHourly;
    currentConfig.storage.pricePerGb = profile.storage[currentConfig.storage.type || 'standard'];
    currentConfig.dataTransfer.pricePerGb = profile.egressPerGb;
    currentConfig.dataTransfer.freeAllowanceGb = profile.freeEgressAllowance;
    currentConfig.database.monthlyPrice = profile.databaseMonthly;
    currentConfig.loadBalancer.monthlyPrice = profile.loadBalancerMonthly;

    populateFormFields();
    refreshAllViews();
    showToast(`Loaded ${profile.name} sample pricing`);
  });

  // Populate Calculator Form from currentConfig
  function populateFormFields() {
    document.getElementById('config-name-input').value = currentConfig.name || '';
    providerSelect.value = currentConfig.provider || 'aws';

    // Compute
    document.getElementById('compute-vms').value = currentConfig.compute.vms;
    document.getElementById('compute-vcpu').value = currentConfig.compute.vCpu;
    document.getElementById('compute-ram').value = currentConfig.compute.ramGb;
    document.getElementById('compute-hours').value = currentConfig.compute.hoursPerMonth;
    document.getElementById('compute-rate').value = currentConfig.compute.hourlyRate.toFixed(4);

    // Storage
    document.getElementById('storage-capacity').value = currentConfig.storage.capacityGb;
    document.getElementById('storage-type').value = currentConfig.storage.type;
    document.getElementById('storage-rate').value = currentConfig.storage.pricePerGb.toFixed(4);

    // Transfer
    document.getElementById('transfer-outbound').value = currentConfig.dataTransfer.outboundGb;
    document.getElementById('transfer-free').value = currentConfig.dataTransfer.freeAllowanceGb;
    document.getElementById('transfer-rate').value = currentConfig.dataTransfer.pricePerGb.toFixed(4);

    // Database
    const dbToggle = document.getElementById('database-enabled');
    dbToggle.checked = currentConfig.database.enabled;
    document.getElementById('db-options-panel').style.display = dbToggle.checked ? 'block' : 'none';
    document.getElementById('db-instances').value = currentConfig.database.instances;
    document.getElementById('db-rate').value = currentConfig.database.monthlyPrice.toFixed(2);

    // Load Balancer
    const lbToggle = document.getElementById('lb-enabled');
    lbToggle.checked = currentConfig.loadBalancer.enabled;
    document.getElementById('lb-options-panel').style.display = lbToggle.checked ? 'block' : 'none';
    document.getElementById('lb-count').value = currentConfig.loadBalancer.count;
    document.getElementById('lb-rate').value = currentConfig.loadBalancer.monthlyPrice.toFixed(2);

    renderAdditionalServicesList();
  }

  // Read Form Fields into currentConfig
  function readFormFields() {
    currentConfig.name = document.getElementById('config-name-input').value.trim() || 'Untitled Configuration';
    currentConfig.provider = providerSelect.value;
    currentConfig.currency = currentCurrency;

    // Compute
    currentConfig.compute.vms = CostCalculator.sanitizeNumber(document.getElementById('compute-vms').value, 1, 1000, 1);
    currentConfig.compute.vCpu = CostCalculator.sanitizeNumber(document.getElementById('compute-vcpu').value, 1, 128, 2);
    currentConfig.compute.ramGb = CostCalculator.sanitizeNumber(document.getElementById('compute-ram').value, 1, 1024, 4);
    currentConfig.compute.hoursPerMonth = CostCalculator.sanitizeNumber(document.getElementById('compute-hours').value, 0, 744, 730);
    currentConfig.compute.hourlyRate = CostCalculator.sanitizeNumber(document.getElementById('compute-rate').value, 0, 10000, 0);

    // Storage
    currentConfig.storage.capacityGb = CostCalculator.sanitizeNumber(document.getElementById('storage-capacity').value, 0, 1000000, 100);
    currentConfig.storage.type = document.getElementById('storage-type').value;
    currentConfig.storage.pricePerGb = CostCalculator.sanitizeNumber(document.getElementById('storage-rate').value, 0, 1000, 0);

    // Transfer
    currentConfig.dataTransfer.outboundGb = CostCalculator.sanitizeNumber(document.getElementById('transfer-outbound').value, 0, 1000000, 100);
    currentConfig.dataTransfer.freeAllowanceGb = CostCalculator.sanitizeNumber(document.getElementById('transfer-free').value, 0, 1000000, 100);
    currentConfig.dataTransfer.pricePerGb = CostCalculator.sanitizeNumber(document.getElementById('transfer-rate').value, 0, 1000, 0);

    // Database
    currentConfig.database.enabled = document.getElementById('database-enabled').checked;
    currentConfig.database.instances = CostCalculator.sanitizeNumber(document.getElementById('db-instances').value, 1, 100, 1);
    currentConfig.database.monthlyPrice = CostCalculator.sanitizeNumber(document.getElementById('db-rate').value, 0, 100000, 0);

    // Load Balancer
    currentConfig.loadBalancer.enabled = document.getElementById('lb-enabled').checked;
    currentConfig.loadBalancer.count = CostCalculator.sanitizeNumber(document.getElementById('lb-count').value, 1, 100, 1);
    currentConfig.loadBalancer.monthlyPrice = CostCalculator.sanitizeNumber(document.getElementById('lb-rate').value, 0, 100000, 0);
  }

  // Additional Services Dynamic Rows
  const additionalListContainer = document.getElementById('additional-services-list');
  const addServiceBtn = document.getElementById('add-service-btn');

  function renderAdditionalServicesList() {
    if (!additionalListContainer) return;
    additionalListContainer.innerHTML = '';

    if (currentConfig.additionalServices.length === 0) {
      additionalListContainer.innerHTML = '<p class="text-muted text-sm">No additional services configured.</p>';
      return;
    }

    currentConfig.additionalServices.forEach((service, index) => {
      const row = document.createElement('div');
      row.className = 'additional-item-row';
      row.innerHTML = `
        <input type="text" class="input-text form-control-sm srv-name-input" value="${escapeHtml(service.name)}" placeholder="Service Name (e.g. Backups)">
        <div class="input-with-symbol">
          <span class="currency-symbol">${currentCurrency === 'INR' ? '₹' : '$'}</span>
          <input type="number" class="input-number form-control-sm srv-price-input" value="${service.monthlyPrice.toFixed(2)}" min="0" step="any">
        </div>
        <button type="button" class="btn-icon btn-danger-icon remove-srv-btn" title="Remove Service">&times;</button>
      `;

      row.querySelector('.srv-name-input').addEventListener('input', (e) => {
        service.name = e.target.value;
        refreshAllViews();
      });

      row.querySelector('.srv-price-input').addEventListener('input', (e) => {
        service.monthlyPrice = CostCalculator.sanitizeNumber(e.target.value, 0, 1000000, 0);
        refreshAllViews();
      });

      row.querySelector('.remove-srv-btn').addEventListener('click', () => {
        currentConfig.additionalServices.splice(index, 1);
        renderAdditionalServicesList();
        refreshAllViews();
      });

      additionalListContainer.appendChild(row);
    });
  }

  if (addServiceBtn) {
    addServiceBtn.addEventListener('click', () => {
      currentConfig.additionalServices.push({
        id: 'srv_' + Date.now(),
        name: 'Custom Service',
        monthlyPrice: currentCurrency === 'INR' ? 500 : 6.0
      });
      renderAdditionalServicesList();
      refreshAllViews();
    });
  }

  // Storage Type Dropdown Event: auto updates rate based on provider
  document.getElementById('storage-type').addEventListener('change', (e) => {
    const sType = e.target.value;
    currentConfig.storage.type = sType;
    const profile = PricingEngine.getProfile(currentConfig.provider, currentCurrency);
    currentConfig.storage.pricePerGb = profile.storage[sType] || profile.storage.standard;
    document.getElementById('storage-rate').value = currentConfig.storage.pricePerGb.toFixed(4);
    refreshAllViews();
  });

  // Toggles Event Listeners
  document.getElementById('database-enabled').addEventListener('change', (e) => {
    document.getElementById('db-options-panel').style.display = e.target.checked ? 'block' : 'none';
    readFormFields();
    refreshAllViews();
  });

  document.getElementById('lb-enabled').addEventListener('change', (e) => {
    document.getElementById('lb-options-panel').style.display = e.target.checked ? 'block' : 'none';
    readFormFields();
    refreshAllViews();
  });

  // Attach live input listeners to all calculator inputs
  const calculatorForm = document.getElementById('cost-calculator-form');
  if (calculatorForm) {
    calculatorForm.addEventListener('input', () => {
      readFormFields();
      refreshAllViews();
    });
  }

  // Reset Button
  if (resetCalcBtn) {
    resetCalcBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset the calculator to default configuration?')) {
        currentConfig = CostCalculator.createDefaultConfig();
        populateFormFields();
        refreshAllViews();
        showToast('Calculator reset to defaults');
      }
    });
  }

  // Master View Refresh
  function refreshAllViews() {
    const report = CostCalculator.calculateCosts(currentConfig);

    // 1. Update Dashboard Metric Cards
    document.getElementById('dash-monthly-total').textContent = PricingEngine.formatCurrency(report.monthlyTotal, currentCurrency);
    document.getElementById('dash-annual-total').textContent = PricingEngine.formatCurrency(report.annualTotal, currentCurrency);
    document.getElementById('dash-resource-count').textContent = report.metrics.totalResourcesCount;
    document.getElementById('dash-active-provider').textContent = PricingEngine.PROFILES[currentConfig.provider]?.shortName || 'AWS';

    // 2. Update Breakdown Table
    updateBreakdownTable(report);

    // 3. Update Charts
    CostCharts.renderDistributionChart('chart-distribution', 'chart-distribution-fallback', report.subtotals, currentCurrency);
    CostCharts.renderSpendingChart('chart-spending', 'chart-spending-fallback', report.monthlyTotal, currentCurrency);

    // 4. Update Provider Comparison Section
    updateProviderComparisonView();

    // 5. Update Config Comparison Section (if active)
    updateConfigurationComparisonView();

    // 6. Update Saved List
    renderSavedConfigsList();
  }

  function updateBreakdownTable(report) {
    document.getElementById('subtotal-compute').textContent = PricingEngine.formatCurrency(report.subtotals.compute, currentCurrency);
    document.getElementById('subtotal-storage').textContent = PricingEngine.formatCurrency(report.subtotals.storage, currentCurrency);
    document.getElementById('subtotal-transfer').textContent = PricingEngine.formatCurrency(report.subtotals.dataTransfer, currentCurrency);
    document.getElementById('subtotal-database').textContent = PricingEngine.formatCurrency(report.subtotals.database, currentCurrency);
    document.getElementById('subtotal-lb').textContent = PricingEngine.formatCurrency(report.subtotals.loadBalancer, currentCurrency);
    document.getElementById('subtotal-additional').textContent = PricingEngine.formatCurrency(report.subtotals.additional, currentCurrency);
    document.getElementById('total-monthly').textContent = PricingEngine.formatCurrency(report.monthlyTotal, currentCurrency);
    document.getElementById('total-annual').textContent = PricingEngine.formatCurrency(report.annualTotal, currentCurrency);
  }

  // Multi-Provider Comparison View
  function updateProviderComparisonView() {
    const providerKeys = ['aws', 'azure', 'gcp', 'custom'];
    const providerTotals = {};

    providerKeys.forEach(pKey => {
      // Create cloned config with provider's rates
      const pProfile = PricingEngine.getProfile(pKey, currentCurrency);
      const tempConfig = JSON.parse(JSON.stringify(currentConfig));
      tempConfig.provider = pKey;
      tempConfig.compute.hourlyRate = pProfile.computeHourly;
      tempConfig.storage.pricePerGb = pProfile.storage[tempConfig.storage.type || 'standard'];
      tempConfig.dataTransfer.pricePerGb = pProfile.egressPerGb;
      tempConfig.dataTransfer.freeAllowanceGb = pProfile.freeEgressAllowance;
      tempConfig.database.monthlyPrice = pProfile.databaseMonthly;
      tempConfig.loadBalancer.monthlyPrice = pProfile.loadBalancerMonthly;

      const pReport = CostCalculator.calculateCosts(tempConfig);
      providerTotals[pKey] = pReport.monthlyTotal;

      const cardEl = document.getElementById(`provider-card-${pKey}`);
      if (cardEl) {
        cardEl.querySelector('.provider-monthly-cost').textContent = PricingEngine.formatCurrency(pReport.monthlyTotal, currentCurrency);
        cardEl.querySelector('.provider-annual-cost').textContent = PricingEngine.formatCurrency(pReport.annualTotal, currentCurrency);
      }
    });

    CostCharts.renderProviderChart('chart-providers', 'chart-providers-fallback', providerTotals, currentCurrency);
  }

  // Configuration Comparison Section
  const selectCompABtn = document.getElementById('load-comp-a-btn');
  const selectCompBBtn = document.getElementById('load-comp-b-btn');

  function updateConfigurationComparisonView() {
    const compResult = CostCalculator.compareConfigurations(compareConfigA, compareConfigB);

    document.getElementById('comp-a-name').textContent = compareConfigA.name;
    document.getElementById('comp-b-name').textContent = compareConfigB.name;

    document.getElementById('comp-a-monthly').textContent = PricingEngine.formatCurrency(compResult.configA.report.monthlyTotal, currentCurrency);
    document.getElementById('comp-b-monthly').textContent = PricingEngine.formatCurrency(compResult.configB.report.monthlyTotal, currentCurrency);

    document.getElementById('comp-a-annual').textContent = PricingEngine.formatCurrency(compResult.configA.report.annualTotal, currentCurrency);
    document.getElementById('comp-b-annual').textContent = PricingEngine.formatCurrency(compResult.configB.report.annualTotal, currentCurrency);

    document.getElementById('comp-a-vms').textContent = `${compareConfigA.compute.vms} VMs (${compareConfigA.compute.vCpu} vCPU, ${compareConfigA.compute.ramGb}GB)`;
    document.getElementById('comp-b-vms').textContent = `${compareConfigB.compute.vms} VMs (${compareConfigB.compute.vCpu} vCPU, ${compareConfigB.compute.ramGb}GB)`;

    document.getElementById('comp-a-storage').textContent = `${compareConfigA.storage.capacityGb} GB (${compareConfigA.storage.type})`;
    document.getElementById('comp-b-storage').textContent = `${compareConfigB.storage.capacityGb} GB (${compareConfigB.storage.type})`;

    document.getElementById('comp-a-db').textContent = compareConfigA.database.enabled ? `${compareConfigA.database.instances} instance(s)` : 'Disabled';
    document.getElementById('comp-b-db').textContent = compareConfigB.database.enabled ? `${compareConfigB.database.instances} instance(s)` : 'Disabled';

    document.getElementById('comp-a-lb').textContent = compareConfigA.loadBalancer.enabled ? `${compareConfigA.loadBalancer.count} unit(s)` : 'Disabled';
    document.getElementById('comp-b-lb').textContent = compareConfigB.loadBalancer.enabled ? `${compareConfigB.loadBalancer.count} unit(s)` : 'Disabled';

    const diffAbs = Math.abs(compResult.monthlyDiff);
    const diffText = `${PricingEngine.formatCurrency(diffAbs, currentCurrency)} / mo (${Math.abs(compResult.percentageDiff).toFixed(1)}%)`;
    
    const banner = document.getElementById('comp-delta-banner');
    if (compResult.winner === 'configA') {
      banner.className = 'comparison-banner banner-a-cheaper';
      banner.innerHTML = `<strong>${compareConfigA.name}</strong> is more economical by <strong>${diffText}</strong> compared to ${compareConfigB.name}.`;
    } else if (compResult.winner === 'configB') {
      banner.className = 'comparison-banner banner-b-cheaper';
      banner.innerHTML = `<strong>${compareConfigB.name}</strong> is more economical by <strong>${diffText}</strong> compared to ${compareConfigA.name}.`;
    } else {
      banner.className = 'comparison-banner banner-equal';
      banner.innerHTML = `Both configurations have equivalent monthly costs under these assumptions.`;
    }
  }

  if (selectCompABtn) {
    selectCompABtn.addEventListener('click', () => {
      compareConfigA = JSON.parse(JSON.stringify(currentConfig));
      compareConfigA.name = prompt('Enter a label for Configuration A:', currentConfig.name) || 'Config A';
      updateConfigurationComparisonView();
      showToast('Set current configuration as Config A');
    });
  }

  if (selectCompBBtn) {
    selectCompBBtn.addEventListener('click', () => {
      compareConfigB = JSON.parse(JSON.stringify(currentConfig));
      compareConfigB.name = prompt('Enter a label for Configuration B:', currentConfig.name) || 'Config B';
      updateConfigurationComparisonView();
      showToast('Set current configuration as Config B');
    });
  }

  // Saved Estimates Management
  const saveEstimateBtn = document.getElementById('save-estimate-btn');
  const savedEstimatesTableBody = document.getElementById('saved-estimates-tbody');
  const emptySavedState = document.getElementById('empty-saved-state');

  if (saveEstimateBtn) {
    saveEstimateBtn.addEventListener('click', () => {
      const name = currentConfig.name || 'Saved Estimate';
      const newSaved = JSON.parse(JSON.stringify(currentConfig));
      newSaved.id = 'est_' + Date.now();
      newSaved.savedAt = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();

      savedConfigs.unshift(newSaved);
      saveToStorage();
      renderSavedConfigsList();
      showToast(`Saved "${name}" to browser storage`);
    });
  }

  function renderSavedConfigsList() {
    if (!savedEstimatesTableBody) return;
    savedEstimatesTableBody.innerHTML = '';

    if (savedConfigs.length === 0) {
      if (emptySavedState) emptySavedState.style.display = 'block';
      return;
    }

    if (emptySavedState) emptySavedState.style.display = 'none';

    savedConfigs.forEach((est, idx) => {
      const report = CostCalculator.calculateCosts(est);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(est.name)}</strong><br><span class="text-muted text-xs">${est.savedAt || 'Recently'}</span></td>
        <td><span class="badge badge-provider">${PricingEngine.PROFILES[est.provider]?.shortName || 'AWS'}</span></td>
        <td>${report.metrics.totalResourcesCount} resources</td>
        <td><strong>${PricingEngine.formatCurrency(report.monthlyTotal, currentCurrency)}</strong></td>
        <td>
          <button class="btn-sm btn-secondary load-est-btn" data-idx="${idx}">Load</button>
          <button class="btn-sm btn-secondary dup-est-btn" data-idx="${idx}">Duplicate</button>
          <button class="btn-sm btn-secondary rename-est-btn" data-idx="${idx}">Rename</button>
          <button class="btn-sm btn-danger del-est-btn" data-idx="${idx}">Delete</button>
        </td>
      `;

      tr.querySelector('.load-est-btn').addEventListener('click', () => {
        currentConfig = JSON.parse(JSON.stringify(savedConfigs[idx]));
        populateFormFields();
        refreshAllViews();
        switchSection('calculator');
        showToast(`Loaded "${currentConfig.name}"`);
      });

      tr.querySelector('.dup-est-btn').addEventListener('click', () => {
        const copy = JSON.parse(JSON.stringify(savedConfigs[idx]));
        copy.id = 'est_' + Date.now();
        copy.name = copy.name + ' (Copy)';
        copy.savedAt = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
        savedConfigs.splice(idx + 1, 0, copy);
        saveToStorage();
        renderSavedConfigsList();
        showToast(`Duplicated "${copy.name}"`);
      });

      tr.querySelector('.rename-est-btn').addEventListener('click', () => {
        const newName = prompt('Enter new name for configuration:', savedConfigs[idx].name);
        if (newName && newName.trim()) {
          savedConfigs[idx].name = newName.trim();
          saveToStorage();
          renderSavedConfigsList();
          showToast('Configuration renamed');
        }
      });

      tr.querySelector('.del-est-btn').addEventListener('click', () => {
        if (confirm(`Delete saved estimate "${savedConfigs[idx].name}"?`)) {
          savedConfigs.splice(idx, 1);
          saveToStorage();
          renderSavedConfigsList();
          showToast('Estimate deleted');
        }
      });

      savedEstimatesTableBody.appendChild(tr);
    });
  }

  // Export Reports
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const exportJsonBtn = document.getElementById('export-json-btn');
  const printReportBtn = document.getElementById('print-report-btn');

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      const report = CostCalculator.calculateCosts(currentConfig);
      const csvContent = [
        ['Cloud Computing Cost Estimator - Cost Breakdown Report'],
        ['Generated Date', new Date().toISOString()],
        ['Project Name', currentConfig.name],
        ['Cloud Provider', PricingEngine.PROFILES[currentConfig.provider]?.name || 'AWS'],
        ['Currency', currentCurrency],
        [''],
        ['Category', 'Configured Units', 'Subtotal (' + currentCurrency + ')'],
        ['Compute Virtual Machines', `${currentConfig.compute.vms} VMs (${currentConfig.compute.hoursPerMonth} hrs/mo)`, report.subtotals.compute.toFixed(2)],
        ['Storage', `${currentConfig.storage.capacityGb} GB (${currentConfig.storage.type})`, report.subtotals.storage.toFixed(2)],
        ['Outbound Data Transfer', `${report.metrics.billableTransfer} GB billable (after ${report.metrics.freeAllowance} GB free)`, report.subtotals.dataTransfer.toFixed(2)],
        ['Managed Database', currentConfig.database.enabled ? `${currentConfig.database.instances} instance(s)` : 'Disabled', report.subtotals.database.toFixed(2)],
        ['Load Balancer', currentConfig.loadBalancer.enabled ? `${currentConfig.loadBalancer.count} unit(s)` : 'Disabled', report.subtotals.loadBalancer.toFixed(2)],
        ['Additional Services', `${currentConfig.additionalServices.length} custom service(s)`, report.subtotals.additional.toFixed(2)],
        [''],
        ['Estimated Monthly Total', '', report.monthlyTotal.toFixed(2)],
        ['Estimated Annual Total', '', report.annualTotal.toFixed(2)],
        [''],
        ['DISCLAIMER: All amounts are illustrative estimations for academic planning and do not reflect official cloud provider billing quotations.']
      ].map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

      downloadFile(csvContent, `cloud_cost_estimate_${Date.now()}.csv`, 'text/csv');
      showToast('CSV Report downloaded');
    });
  }

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', () => {
      const report = CostCalculator.calculateCosts(currentConfig);
      const exportData = {
        metadata: {
          app: 'Cloud Computing Cost Estimator',
          version: '1.0.0',
          generatedAt: new Date().toISOString(),
          disclaimer: 'Illustrative estimates for educational planning only.'
        },
        configuration: currentConfig,
        costReport: report
      };

      downloadFile(JSON.stringify(exportData, null, 2), `cloud_config_${Date.now()}.json`, 'application/json');
      showToast('JSON Configuration exported');
    });
  }

  if (printReportBtn) {
    printReportBtn.addEventListener('click', () => {
      window.print();
    });
  }

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  // Initial Boot
  initStorage();
  populateFormFields();
  refreshAllViews();
});

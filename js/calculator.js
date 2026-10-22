/**
 * Cloud Computing Cost Estimator - Core Calculation Engine
 * 
 * Provides pure business logic for calculating infrastructure resource costs,
 * validating inputs, computing subtotals/totals, and comparing configurations.
 */

const CostCalculator = (() => {
  /**
   * Defensive parser for numerical inputs
   */
  function sanitizeNumber(value, min = 0, max = 100000000, fallback = 0) {
    const num = parseFloat(value);
    if (isNaN(num) || !isFinite(num)) return fallback;
    if (num < min) return min;
    if (num > max) return max;
    return num;
  }

  /**
   * Default configuration state
   */
  function createDefaultConfig(name = 'Standard Production Deployment') {
    return {
      id: 'cfg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: name,
      provider: 'aws',
      currency: 'INR',
      compute: {
        vms: 2,
        vCpu: 2,
        ramGb: 4,
        hoursPerMonth: 730, // Standard 24x7 month (approx 365*24/12)
        hourlyRate: 3.45    // Converted illustrative INR rate (~$0.0416)
      },
      storage: {
        capacityGb: 150,
        type: 'standard', // 'standard', 'block', 'archive'
        pricePerGb: 1.91  // Converted illustrative INR rate (~$0.023)
      },
      dataTransfer: {
        outboundGb: 250,
        freeAllowanceGb: 100,
        pricePerGb: 7.47  // Converted illustrative INR rate (~$0.09)
      },
      database: {
        enabled: true,
        instances: 1,
        monthlyPrice: 2490.0 // Converted illustrative INR rate (~$30)
      },
      loadBalancer: {
        enabled: true,
        count: 1,
        monthlyPrice: 1494.0 // Converted illustrative INR rate (~$18)
      },
      additionalServices: [
        { id: 'srv_1', name: 'CloudWatch / Datadog Monitoring', monthlyPrice: 830.0 },
        { id: 'srv_2', name: 'Automated Snapshot Backups', monthlyPrice: 415.0 }
      ]
    };
  }

  /**
   * Calculate detailed cost breakdown from a configuration object
   * @param {Object} config - Configuration object
   * @returns {Object} Comprehensive calculation report
   */
  function calculateCosts(config) {
    if (!config) config = createDefaultConfig();

    // 1. Compute Cost
    const vms = sanitizeNumber(config.compute?.vms, 0, 10000, 1);
    const hours = sanitizeNumber(config.compute?.hoursPerMonth, 0, 744, 730);
    const computeRate = sanitizeNumber(config.compute?.hourlyRate, 0, 100000, 0);
    const computeSubtotal = vms * hours * computeRate;

    // 2. Storage Cost
    const storageGb = sanitizeNumber(config.storage?.capacityGb, 0, 10000000, 0);
    const storageRate = sanitizeNumber(config.storage?.pricePerGb, 0, 10000, 0);
    const storageSubtotal = storageGb * storageRate;

    // 3. Data Transfer Cost
    const outboundGb = sanitizeNumber(config.dataTransfer?.outboundGb, 0, 10000000, 0);
    const freeAllowance = sanitizeNumber(config.dataTransfer?.freeAllowanceGb, 0, 10000000, 0);
    const transferRate = sanitizeNumber(config.dataTransfer?.pricePerGb, 0, 10000, 0);
    const billableTransfer = Math.max(0, outboundGb - freeAllowance);
    const dataTransferSubtotal = billableTransfer * transferRate;

    // 4. Database Cost
    let databaseSubtotal = 0;
    const dbEnabled = Boolean(config.database?.enabled);
    if (dbEnabled) {
      const dbInstances = sanitizeNumber(config.database?.instances, 0, 1000, 1);
      const dbRate = sanitizeNumber(config.database?.monthlyPrice, 0, 1000000, 0);
      databaseSubtotal = dbInstances * dbRate;
    }

    // 5. Load Balancer Cost
    let loadBalancerSubtotal = 0;
    const lbEnabled = Boolean(config.loadBalancer?.enabled);
    if (lbEnabled) {
      const lbCount = sanitizeNumber(config.loadBalancer?.count, 0, 1000, 1);
      const lbRate = sanitizeNumber(config.loadBalancer?.monthlyPrice, 0, 1000000, 0);
      loadBalancerSubtotal = lbCount * lbRate;
    }

    // 6. Additional Services Subtotal
    let additionalSubtotal = 0;
    const additionalItems = Array.isArray(config.additionalServices) ? config.additionalServices : [];
    additionalItems.forEach(item => {
      const price = sanitizeNumber(item.monthlyPrice, 0, 1000000, 0);
      additionalSubtotal += price;
    });

    // 7. Aggregate Totals
    const monthlyTotal = computeSubtotal + storageSubtotal + dataTransferSubtotal +
                         databaseSubtotal + loadBalancerSubtotal + additionalSubtotal;
    const annualTotal = monthlyTotal * 12;

    // Resource summary metrics
    const totalResourcesCount = vms + (dbEnabled ? (config.database?.instances || 1) : 0) +
                                (lbEnabled ? (config.loadBalancer?.count || 1) : 0);

    return {
      subtotals: {
        compute: computeSubtotal,
        storage: storageSubtotal,
        dataTransfer: dataTransferSubtotal,
        database: databaseSubtotal,
        loadBalancer: loadBalancerSubtotal,
        additional: additionalSubtotal
      },
      metrics: {
        vms,
        hours,
        storageGb,
        outboundGb,
        billableTransfer,
        freeAllowance,
        dbEnabled,
        dbInstances: config.database?.instances || 0,
        lbEnabled,
        lbCount: config.loadBalancer?.count || 0,
        totalResourcesCount
      },
      monthlyTotal,
      annualTotal,
      currency: config.currency || 'INR'
    };
  }

  /**
   * Compare two configurations side by side
   * @param {Object} configA - Baseline configuration
   * @param {Object} configB - Target configuration
   * @returns {Object} Comparison metrics and deltas
   */
  function compareConfigurations(configA, configB) {
    const reportA = calculateCosts(configA);
    const reportB = calculateCosts(configB);

    const monthlyDiff = reportB.monthlyTotal - reportA.monthlyTotal;
    const annualDiff = reportB.annualTotal - reportA.annualTotal;

    let percentageDiff = 0;
    if (reportA.monthlyTotal > 0) {
      percentageDiff = ((reportB.monthlyTotal - reportA.monthlyTotal) / reportA.monthlyTotal) * 100;
    }

    let winner = 'equivalent';
    if (reportA.monthlyTotal < reportB.monthlyTotal) {
      winner = 'configA';
    } else if (reportB.monthlyTotal < reportA.monthlyTotal) {
      winner = 'configB';
    }

    return {
      configA: {
        name: configA.name || 'Configuration A',
        report: reportA
      },
      configB: {
        name: configB.name || 'Configuration B',
        report: reportB
      },
      monthlyDiff,
      annualDiff,
      percentageDiff,
      isMoreExpensive: monthlyDiff > 0,
      winner
    };
  }

  return {
    sanitizeNumber,
    createDefaultConfig,
    calculateCosts,
    compareConfigurations
  };
})();

if (typeof module !== 'undefined') {
  module.exports = CostCalculator;
}

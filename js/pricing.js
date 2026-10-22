/**
 * Cloud Computing Cost Estimator - Pricing Profiles & Currency Engine
 * 
 * DISCLAIMER:
 * All rates contained in this file are illustrative sample values for academic
 * demonstration and infrastructure planning purposes. They are NOT live quotes
 * or official pricing from AWS, Microsoft Azure, or Google Cloud Platform.
 */

const PricingEngine = (() => {
  // Configurable illustrative exchange rate (1 USD to INR)
  const EXCHANGE_RATE_USD_TO_INR = 83.0;

  // Base illustrative pricing profiles in USD
  const PROFILES = {
    aws: {
      name: 'Amazon Web Services (AWS)',
      shortName: 'AWS',
      computeHourly: 0.0416, // approx t3.medium
      storage: {
        standard: 0.023,    // S3 Standard ($/GB/mo)
        block: 0.08,        // EBS gp3 ($/GB/mo)
        archive: 0.004      // S3 Glacier Flexible ($/GB/mo)
      },
      egressPerGb: 0.09,    // Internet Egress ($/GB)
      freeEgressAllowance: 100, // 100 GB/mo free tier
      databaseMonthly: 30.0,// db.t3.micro/medium
      loadBalancerMonthly: 18.0 // ALB base cost
    },
    azure: {
      name: 'Microsoft Azure',
      shortName: 'Azure',
      computeHourly: 0.0400, // approx B2s / D2s
      storage: {
        standard: 0.020,    // Blob Hot ($/GB/mo)
        block: 0.075,       // Azure Premium SSD / Standard SSD
        archive: 0.002      // Blob Archive ($/GB/mo)
      },
      egressPerGb: 0.087,   // Outbound data ($/GB)
      freeEgressAllowance: 100, // 100 GB/mo free tier
      databaseMonthly: 28.5,// Azure SQL Database basic/general purpose
      loadBalancerMonthly: 18.25 // Azure Standard Load Balancer
    },
    gcp: {
      name: 'Google Cloud Platform (GCP)',
      shortName: 'GCP',
      computeHourly: 0.0385, // approx e2-medium
      storage: {
        standard: 0.020,    // Cloud Storage Standard ($/GB/mo)
        block: 0.080,       // Balanced Persistent Disk
        archive: 0.0025     // Archive Storage ($/GB/mo)
      },
      egressPerGb: 0.085,   // Worldwide egress ($/GB)
      freeEgressAllowance: 100, // 100 GB/mo free tier
      databaseMonthly: 26.0,// Cloud SQL micro/small
      loadBalancerMonthly: 18.0 // Cloud Load Balancing forwarding rule
    },
    custom: {
      name: 'Custom Provider / Private Cloud',
      shortName: 'Custom',
      computeHourly: 0.0450,
      storage: {
        standard: 0.025,
        block: 0.090,
        archive: 0.005
      },
      egressPerGb: 0.080,
      freeEgressAllowance: 50,
      databaseMonthly: 25.0,
      loadBalancerMonthly: 15.0
    }
  };

  /**
   * Convert an amount between currencies
   * @param {number} amount - Amount in base currency (USD)
   * @param {string} targetCurrency - 'INR' or 'USD'
   * @returns {number} Converted amount
   */
  function convert(amount, targetCurrency) {
    if (typeof amount !== 'number' || isNaN(amount)) return 0;
    if (targetCurrency === 'INR') {
      return amount * EXCHANGE_RATE_USD_TO_INR;
    }
    return amount;
  }

  /**
   * Format a numerical value as currency
   * @param {number} amount - Amount to format
   * @param {string} currency - 'INR' or 'USD'
   * @returns {string} Formatted string, e.g. "₹3,450.00"
   */
  function formatCurrency(amount, currency = 'INR') {
    if (typeof amount !== 'number' || isNaN(amount)) amount = 0;
    
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get a specific provider's profile in the target currency
   * @param {string} providerKey - 'aws', 'azure', 'gcp', or 'custom'
   * @param {string} currency - 'INR' or 'USD'
   * @returns {Object} Profile with prices converted
   */
  function getProfile(providerKey = 'aws', currency = 'INR') {
    const raw = PROFILES[providerKey] || PROFILES.aws;
    return {
      key: providerKey,
      name: raw.name,
      shortName: raw.shortName,
      computeHourly: convert(raw.computeHourly, currency),
      storage: {
        standard: convert(raw.storage.standard, currency),
        block: convert(raw.storage.block, currency),
        archive: convert(raw.storage.archive, currency)
      },
      egressPerGb: convert(raw.egressPerGb, currency),
      freeEgressAllowance: raw.freeEgressAllowance,
      databaseMonthly: convert(raw.databaseMonthly, currency),
      loadBalancerMonthly: convert(raw.loadBalancerMonthly, currency)
    };
  }

  return {
    PROFILES,
    EXCHANGE_RATE_USD_TO_INR,
    convert,
    formatCurrency,
    getProfile
  };
})();

if (typeof module !== 'undefined') {
  module.exports = PricingEngine;
}

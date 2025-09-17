/**
 * Format helpers for dashboard components
 */

/**
 * Format number with locale-specific thousands separators
 * @param {number} n - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(n) {
  return new Intl.NumberFormat().format(n);
}

/**
 * Generate period options for the time filter
 * @returns {Array} Array of period options
 */
export function generatePeriodOptions() {
  return [
    { id: "2025-02_2025-09", label: "Feb – Sep 2025" },
    { id: "2025-09", label: "Sep 2025" },
    { id: "2025-08", label: "Aug 2025" },
    { id: "2025-07", label: "Jul 2025" },
    { id: "2025-06", label: "Jun 2025" },
    { id: "2025-05", label: "May 2025" },
    { id: "2025-04", label: "Apr 2025" },
    { id: "2025-03", label: "Mar 2025" },
    { id: "2025-02", label: "Feb 2025" },
  ];
}
/**
 * Calculate the start and end date of the current budget cycle
 * based on the user's reset date.
 * 
 * @param {number} resetDate - The day of the month the cycle resets (1-31)
 * @param {Date} referenceDate - The date to check against (default: now)
 * @returns {Object} { startDate, endDate }
 */
function getCycleDateRange(resetDate, referenceDate = new Date()) {
    const currentYear = referenceDate.getFullYear();
    const currentMonth = referenceDate.getMonth(); // 0-11
    const currentDay = referenceDate.getDate();

    let startDate, endDate;

    // If today is before the reset date, we are in the previous month's cycle
    // Example: Reset = 25, Today = Feb 10. Cycle = Jan 25 - Feb 24.
    if (currentDay < resetDate) {
        // Start date is last month's reset date
        startDate = new Date(currentYear, currentMonth - 1, resetDate);

        // End date is day before this month's reset date
        endDate = new Date(currentYear, currentMonth, resetDate - 1);
        endDate.setHours(23, 59, 59, 999);
    }
    // If today is on or after the reset date, we are in the current month's cycle
    // Example: Reset = 25, Today = Feb 26. Cycle = Feb 25 - Mar 24.
    else {
        // Start date is this month's reset date
        startDate = new Date(currentYear, currentMonth, resetDate);

        // End date is day before next month's reset date
        endDate = new Date(currentYear, currentMonth + 1, resetDate - 1);
        endDate.setHours(23, 59, 59, 999);
    }

    // Handle edge cases for months with fewer days (e.g. Feb)
    // If resetDate is 31 and we go to Feb, JS Date object automatically handles overflow (Feb 31 -> Mar 3/2 etc)
    // We might want to clamp it to the last day of the month if strictly following "end of month" logic,
    // but typically "payday 31st" means "last day of month".

    // Check if startDate's day matches resetDate (handling month length differences)
    // If resetDate is 31, but startDate month only has 30 days, startDate will be 1st of next month.
    // We should probably clamp to last day of month.

    // Helper to clamp date to last day of month if overflowed
    const clampDate = (year, month, day) => {
        const lastDay = new Date(year, month + 1, 0).getDate();
        return new Date(year, month, Math.min(day, lastDay));
    };

    if (currentDay < resetDate) {
        startDate = clampDate(currentYear, currentMonth - 1, resetDate);
        endDate = clampDate(currentYear, currentMonth, resetDate);
        endDate.setDate(endDate.getDate() - 1); // Day before next reset
        endDate.setHours(23, 59, 59, 999);

        // However, the endDate logic above is tricky with clamping. 
        // Let's simplify: Cycle ends the day before the next cycle starts.
        // Next cycle starts at clampDate(currentYear, currentMonth, resetDate).
        const nextCycleStart = clampDate(currentYear, currentMonth, resetDate);
        endDate = new Date(nextCycleStart);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);

    } else {
        startDate = clampDate(currentYear, currentMonth, resetDate);

        const nextCycleStart = clampDate(currentYear, currentMonth + 1, resetDate);
        endDate = new Date(nextCycleStart);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
}

module.exports = { getCycleDateRange };

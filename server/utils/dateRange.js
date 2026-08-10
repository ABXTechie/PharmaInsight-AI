export const getDateRange = ({
  startDate,
  endDate,
} = {}) => {
  if (!startDate && !endDate) {
    return null;
  }

  if (!startDate || !endDate) {
    throw new Error(
      "Both startDate and endDate are required."
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new Error("Invalid date range.");
  }

  if (start > end) {
    throw new Error(
      "Start date cannot be after end date."
    );
  }

  // Make the end date inclusive.
  end.setHours(23, 59, 59, 999);

  return {
    $gte: start,
    $lte: end,
  };
};
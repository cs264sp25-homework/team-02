/**
 * Format a date for display in the chat interface
 * Shows today as "Today", yesterday as "Yesterday", and other dates as month/day/year
 */
export const formatDate = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (dateOnly.getTime() === today.getTime()) {
    return `Today, ${formatTime(date)}`;
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return `Yesterday, ${formatTime(date)}`;
  } else {
    // Format as Month Day, Year for older dates
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
};

/**
 * Format time in 12-hour format with AM/PM
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};
/**
 * Format a date string to yyyy-MM-dd format
 * @param dateString - Date string, Date object, or null/undefined
 * @returns Formatted date string in yyyy-MM-dd format or empty string if invalid
 */
export const formatDateToYMD = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string provided to formatDateToYMD:', dateString);
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateString);
    return '';
  }
};

/**
 * Parse a date string in yyyy-MM-dd format to a Date object
 * @param dateString - Date string in yyyy-MM-dd format
 * @returns Date object or null if invalid
 */
export const parseYMDDate = (dateString: string): Date | null => {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Check if the date is valid
    if (isNaN(date.getTime()) || 
        date.getFullYear() !== year || 
        date.getMonth() !== month - 1 || 
        date.getDate() !== day) {
      return null;
    }
    
    return date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Check if a date string is in yyyy-MM-dd format
 * @param dateString - Date string to check
 * @returns boolean indicating if the string is in yyyy-MM-dd format
 */
export const isYMDDateFormat = (dateString: string): boolean => {
  const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
  return regex.test(dateString);
};

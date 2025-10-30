//utils/date.ts
import {logger} from "@/utils/logger";

/**
 * Format a date object to a readable string format
 * @param locales - The locale to use for formatting (default: 'en')
 * @param date - The date object to format (default: current date)
 * @returns Formatted date string in YYYY-MM-DD HH:mm:ss format
 */
export const formatDate = (locales: string = 'en', date: Date = new Date()): string => {
    return date.toLocaleString(locales, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replaceAll('/', '-');
};

/**
 * Parse a formatted date string back to a Date object
 * @param dateString - The formatted date string in YYYY-MM-DD HH:mm:ss format
 * @param locales - The locale used for parsing (default: 'en')
 * @returns Date object or null if parsing fails
 */
export const parseFormattedDate = (dateString: string, locales: string = 'en'): Date | null => {
    try {
        // Replace dashes with slashes for Date constructor compatibility
        const normalizedString = dateString.replaceAll('-', '/');
        return new Date(normalizedString);
    } catch (error) {
        logger.error(`Failed to parse date string: ${dateString}`, error);
        return null;
    }
};

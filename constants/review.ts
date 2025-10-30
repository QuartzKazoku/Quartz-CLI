//constants/review.ts
/**
 * @fileoverview Code review related constants for Quartz CLI
 * @description Defines score thresholds, rating levels, and review-related constants
 * @author Quartz CLI Team
 * @version 1.0.0
 * @since 2025-10-29
 * @license MIT
 * @copyright (c) 2025 Quartz
 *
 * @example
 *   import { REVIEW_SCORE } from '@/constants/review';
 *   if (score >= REVIEW_SCORE.THRESHOLD_GOOD) {
 *     console.log('Good code quality!');
 *   }
 *
 * @namespace ReviewConstants
 * @module constants/review
 */

/**
 * Code review score thresholds
 * Defines score ranges for different quality levels
 * @type {object}
 * @readonly
 * @property {number} THRESHOLD_EXCELLENT - Minimum score for excellent rating (80+)
 * @property {number} THRESHOLD_GOOD - Minimum score for good rating (60+)
 * @property {number} SEPARATOR_LENGTH - Length of separator line in review output
 */
export const REVIEW_SCORE = {
    /** Minimum score for excellent quality rating */
    THRESHOLD_EXCELLENT: 80,
    /** Minimum score for good quality rating */
    THRESHOLD_GOOD: 60,
    /** Length of separator line in review output */
    SEPARATOR_LENGTH: 60,
} as const;
/**
 * Email sending optimization and tracking
 * Uses in-memory tracking to prevent duplicate emails and implement rate limiting
 * No database dependency - data is kept in memory and cleared periodically
 */
// No imports needed - pure in-memory tracking

interface EmailRecord {
  recipientEmail: string;
  emailType: string;
  timestamp: number;
  status: 'sent' | 'failed';
  errorMessage?: string;
}

// In-memory email tracking (cleared every hour)
const emailHistory: EmailRecord[] = [];

// Clear email history every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const beforeLength = emailHistory.length;
  
  // Remove emails older than 1 hour
  for (let i = emailHistory.length - 1; i >= 0; i--) {
    if (emailHistory[i].timestamp < oneHourAgo) {
      emailHistory.splice(i, 1);
    }
  }
  
  if (beforeLength > emailHistory.length) {
    console.log(`[EmailOptimization] Cleared ${beforeLength - emailHistory.length} old email records`);
  }
}, 60 * 60 * 1000); // Run every hour

/**
 * Validate email address format
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  // RFC 5322 simplified regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 320;
}

/**
 * Log email sending attempt
 */
export function logEmailAttempt(
  recipientEmail: string,
  emailType: string,
  status: 'sent' | 'failed',
  errorMessage?: string
): void {
  // Validate email before logging
  if (!isValidEmail(recipientEmail)) {
    console.error(`[EmailLog] Invalid email format: ${recipientEmail}`);
    return;
  }

  emailHistory.push({
    recipientEmail: recipientEmail.toLowerCase(),
    emailType,
    timestamp: Date.now(),
    status,
    errorMessage,
  });

  console.log(`[EmailLog] ${emailType} to ${recipientEmail}: ${status}${errorMessage ? ` (${errorMessage})` : ''}`);
}

/**
 * Check if email was recently sent to prevent duplicates
 * @param recipientEmail - Email address to check
 * @param emailType - Type of email (e.g., 'verification', 'welcome')
 * @param minutesWindow - Time window in minutes to check (default: 5)
 */
export function hasRecentEmail(
  recipientEmail: string,
  emailType: string,
  minutesWindow: number = 5
): boolean {
  const cutoffTime = Date.now() - minutesWindow * 60 * 1000;
  const normalizedEmail = recipientEmail.toLowerCase();

  const recentEmail = emailHistory.find(
    record =>
      record.recipientEmail === normalizedEmail &&
      record.emailType === emailType &&
      record.timestamp >= cutoffTime
  );

  return !!recentEmail;
}

/**
 * Get email sending statistics for a recipient
 */
export function getEmailStats(
  recipientEmail: string,
  hoursWindow: number = 24
): {
  total: number;
  sent: number;
  failed: number;
  byType: Record<string, number>;
} {
  const cutoffTime = Date.now() - hoursWindow * 60 * 60 * 1000;
  const normalizedEmail = recipientEmail.toLowerCase();

  const relevantEmails = emailHistory.filter(
    record =>
      record.recipientEmail === normalizedEmail &&
      record.timestamp >= cutoffTime
  );

  const stats = {
    total: relevantEmails.length,
    sent: relevantEmails.filter(e => e.status === 'sent').length,
    failed: relevantEmails.filter(e => e.status === 'failed').length,
    byType: {} as Record<string, number>,
  };

  // Count by type
  relevantEmails.forEach(email => {
    stats.byType[email.emailType] = (stats.byType[email.emailType] || 0) + 1;
  });

  return stats;
}

/**
 * Determine if email should be sent based on optimization rules
 * Mobile app requests bypass rate limiting
 */
export function shouldSendEmail(
  recipientEmail: string,
  emailType: string,
  options?: {
    maxPerHour?: number;
    skipIfRecentMinutes?: number;
    isMobileApp?: boolean;
  }
): { should: boolean; reason?: string } {
  // Skip rate limiting for mobile app requests
  if (options?.isMobileApp) {
    return { should: true };
  }
  
  const maxPerHour = options?.maxPerHour || 5;
  const skipIfRecentMinutes = options?.skipIfRecentMinutes || 5;

  // Check for recent duplicate
  const hasRecent = hasRecentEmail(recipientEmail, emailType, skipIfRecentMinutes);
  if (hasRecent) {
    return {
      should: false,
      reason: `Email of type '${emailType}' was sent recently (within ${skipIfRecentMinutes} minutes)`,
    };
  }

  // Check hourly limit
  const stats = getEmailStats(recipientEmail, 1);
  if (stats.total >= maxPerHour) {
    return {
      should: false,
      reason: `Hourly email limit (${maxPerHour}) reached for ${recipientEmail}`,
    };
  }

  return { should: true };
}

/**
 * Email sending configuration for different email types
 */
export const EMAIL_CONFIG = {
  verification: {
    maxPerHour: 3,
    skipIfRecentMinutes: 5,
    description: 'Email verification',
  },
  welcome: {
    maxPerHour: 1,
    skipIfRecentMinutes: 60,
    description: 'Welcome email',
  },
  password_reset: {
    maxPerHour: 3,
    skipIfRecentMinutes: 10,
    description: 'Password reset',
  },
  password_reset_success: {
    maxPerHour: 2,
    skipIfRecentMinutes: 30,
    description: 'Password reset success',
  },
  order_confirmation: {
    maxPerHour: 10,
    skipIfRecentMinutes: 1,
    description: 'Order confirmation',
  },
  courier_assigned: {
    maxPerHour: 10,
    skipIfRecentMinutes: 1,
    description: 'Courier assigned',
  },
  delivery_completed: {
    maxPerHour: 10,
    skipIfRecentMinutes: 1,
    description: 'Delivery completed',
  },
  courier_approval: {
    maxPerHour: 3,
    skipIfRecentMinutes: 60,
    description: 'Courier approval',
  },
  business_approval: {
    maxPerHour: 3,
    skipIfRecentMinutes: 60,
    description: 'Business approval',
  },
};

/**
 * Get configuration for email type
 */
export function getEmailConfig(emailType: string) {
  return (
    EMAIL_CONFIG[emailType as keyof typeof EMAIL_CONFIG] || {
      maxPerHour: 5,
      skipIfRecentMinutes: 5,
      description: emailType,
    }
  );
}

/**
 * Get current email tracking statistics (for debugging)
 */
export function getTrackingStats() {
  const stats: Record<string, any> = {
    totalRecords: emailHistory.length,
    byEmail: {} as Record<string, any>,
    byType: {} as Record<string, number>,
  };

  emailHistory.forEach(record => {
    // By email
    if (!stats.byEmail[record.recipientEmail]) {
      stats.byEmail[record.recipientEmail] = {
        total: 0,
        sent: 0,
        failed: 0,
        types: {} as Record<string, number>,
      };
    }
    stats.byEmail[record.recipientEmail].total++;
    if (record.status === 'sent') stats.byEmail[record.recipientEmail].sent++;
    if (record.status === 'failed') stats.byEmail[record.recipientEmail].failed++;
    stats.byEmail[record.recipientEmail].types[record.emailType] =
      (stats.byEmail[record.recipientEmail].types[record.emailType] || 0) + 1;

    // By type
    stats.byType[record.emailType] = (stats.byType[record.emailType] || 0) + 1;
  });

  return stats;
}

/**
 * Secure logging utility for Lumbus
 * Redacts PII in production while maintaining useful logs
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Redact email address - shows domain in production, full email in dev
 * Example: user@example.com -> u***@example.com
 */
export function redactEmail(email: string | null | undefined): string {
  if (!email) return '[no-email]';
  if (isDevelopment) return email;

  const [username, domain] = email.split('@');
  if (!domain) return '[invalid-email]';

  const redactedUsername = username.charAt(0) + '***';
  return `${redactedUsername}@${domain}`;
}

/**
 * Redact user ID - shows last 4 chars in production
 * Example: 123e4567-e89b-12d3-a456-426614174000 -> ****4000
 */
export function redactUserId(userId: string | null | undefined): string {
  if (!userId) return '[no-user-id]';
  if (isDevelopment) return userId;

  return '****' + userId.slice(-4);
}

/**
 * Redact IP address - shows first 2 octets only
 * Example: 192.168.1.100 -> 192.168.*.*
 */
export function redactIP(ip: string | null | undefined): string {
  if (!ip) return '[no-ip]';
  if (isDevelopment) return ip;

  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  return '[redacted-ip]';
}

/**
 * Secure logger that redacts PII in production
 */
export const logger = {
  info: (message: string, data?: Record<string, any>) => {
    if (data) {
      console.log(message, sanitizeLogData(data));
    } else {
      console.log(message);
    }
  },

  error: (message: string, error?: any) => {
    if (error instanceof Error) {
      console.error(message, {
        name: error.name,
        message: error.message,
        stack: isDevelopment ? error.stack : undefined,
      });
    } else {
      console.error(message, error);
    }
  },

  warn: (message: string, data?: Record<string, any>) => {
    if (data) {
      console.warn(message, sanitizeLogData(data));
    } else {
      console.warn(message);
    }
  },
};

/**
 * Sanitize log data by redacting known PII fields
 */
function sanitizeLogData(data: Record<string, any>): Record<string, any> {
  if (isDevelopment) return data;

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Redact email fields
    if (lowerKey.includes('email')) {
      sanitized[key] = redactEmail(value);
    }
    // Redact user ID fields
    else if (lowerKey.includes('userid') || lowerKey === 'id' && typeof value === 'string' && value.includes('-')) {
      sanitized[key] = redactUserId(value);
    }
    // Redact IP fields
    else if (lowerKey.includes('ip')) {
      sanitized[key] = redactIP(value);
    }
    // Keep other fields as-is
    else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

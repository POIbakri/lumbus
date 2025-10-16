/**
 * Health Check API Endpoint
 *
 * GET /api/health
 *
 * Checks the health of all critical services:
 * - Supabase database
 * - eSIM Access API
 * - Stripe API
 * - Resend email service
 *
 * Returns:
 * - 200 OK: All services healthy
 * - 503 Service Unavailable: One or more services unhealthy
 *
 * Response format:
 * {
 *   "status": "healthy" | "degraded" | "unhealthy",
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "services": {
 *     "database": { "status": "up", "latency_ms": 45 },
 *     "esimaccess": { "status": "up", "latency_ms": 120 },
 *     "stripe": { "status": "up", "latency_ms": 80 },
 *     "email": { "status": "up", "latency_ms": 60 }
 *   }
 * }
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  latency_ms?: number;
  error?: string;
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    esimaccess: ServiceHealth;
    stripe: ServiceHealth;
    email: ServiceHealth;
  };
}

async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      return {
        status: 'down',
        error: error.message,
      };
    }

    return {
      status: 'up',
      latency_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkEsimAccess(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const apiUrl = process.env.ESIMACCESS_API_URL;
    const apiKey = process.env.ESIMACCESS_API_KEY;
    const apiSecret = process.env.ESIMACCESS_API_SECRET;

    if (!apiUrl || !apiKey || !apiSecret) {
      return {
        status: 'down',
        error: 'Missing eSIM Access credentials',
      };
    }

    // Try to get account balance as a health check
    const response = await fetch(`${apiUrl}/account/balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        apiSecret,
      }),
    });

    if (!response.ok) {
      return {
        status: 'down',
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    // Check if response has expected format
    if (data.errorCode && data.errorCode !== '000000') {
      return {
        status: 'down',
        error: `API Error: ${data.errorCode}`,
      };
    }

    return {
      status: 'up',
      latency_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkStripe(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        status: 'down',
        error: 'Missing Stripe credentials',
      };
    }

    // Try to retrieve account balance as a health check
    await stripe.balance.retrieve();

    return {
      status: 'up',
      latency_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkEmail(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return {
        status: 'down',
        error: 'Missing Resend credentials',
      };
    }

    // Try to list domains as a health check (lightweight API call)
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return {
        status: 'down',
        error: `HTTP ${response.status}`,
      };
    }

    return {
      status: 'up',
      latency_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET() {
  try {
    // Run all health checks in parallel
    const [database, esimaccess, stripeHealth, email] = await Promise.all([
      checkDatabase(),
      checkEsimAccess(),
      checkStripe(),
      checkEmail(),
    ]);

    const services = {
      database,
      esimaccess,
      stripe: stripeHealth,
      email,
    };

    // Determine overall status
    const serviceStatuses = Object.values(services).map(s => s.status);
    const allUp = serviceStatuses.every(s => s === 'up');
    const anyDown = serviceStatuses.some(s => s === 'down');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (allUp) {
      overallStatus = 'healthy';
    } else if (anyDown) {
      overallStatus = 'unhealthy';
    } else {
      overallStatus = 'degraded';
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
    };

    // Return appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : 503;

    return NextResponse.json(response, { status: httpStatus });
  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 503 }
    );
  }
}

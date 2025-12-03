/**
 * Test User Data Simulation
 *
 * Simulates realistic data usage for test/reviewer accounts.
 * This allows app store reviewers to see the full eSIM lifecycle:
 * - Data being used over time
 * - Data running low warnings
 * - Data depleted state
 * - Validity expired state
 *
 * IMPORTANT: Only applies to users with is_test_user = true
 * Real users are never affected by this simulation.
 */

interface SimulatedUsage {
  activated_at: string | null;
  data_usage_bytes: number;
  data_remaining_bytes: number;
  last_usage_update: string;
  simulated: boolean;
}

interface OrderForSimulation {
  id: string;
  status: string;
  created_at: string;
  activated_at?: string | null;
  data_usage_bytes?: number | null;
  data_remaining_bytes?: number | null;
  smdp?: string | null;
  activation_code?: string | null;
  plan?: {
    data_gb: number;
    validity_days: number;
  } | null;
}

/**
 * Simulate data usage for a test user's order
 *
 * Simulation timeline (compressed for demo purposes):
 * - Activation: Happens 1 minute after order creation (simulates user installing eSIM)
 * - Usage: Consumes ~20% of data per hour after activation
 * - Depleted: Data runs out after ~5 hours of "use"
 * - Expired: Validity ends based on plan's validity_days (accelerated: 1 real day = 1 validity day)
 *
 * This gives reviewers a realistic experience within a short testing window.
 */
export function simulateTestUserUsage(order: OrderForSimulation): SimulatedUsage | null {
  // Only simulate for completed orders with activation details
  if (!order.smdp || !order.activation_code) {
    return null;
  }

  if (!order.plan) {
    return null;
  }

  const now = new Date();
  const orderCreated = new Date(order.created_at);
  const minutesSinceCreation = (now.getTime() - orderCreated.getTime()) / (1000 * 60);

  // Total data in bytes
  const totalDataBytes = order.plan.data_gb * 1024 * 1024 * 1024;

  // Simulate activation 1 minute after order creation
  const activationDelayMinutes = 1;

  if (minutesSinceCreation < activationDelayMinutes) {
    // Not yet "activated" - no usage yet
    return {
      activated_at: null,
      data_usage_bytes: 0,
      data_remaining_bytes: totalDataBytes,
      last_usage_update: now.toISOString(),
      simulated: true,
    };
  }

  // Calculate simulated activation time
  const activatedAt = new Date(orderCreated.getTime() + activationDelayMinutes * 60 * 1000);
  const minutesSinceActivation = (now.getTime() - activatedAt.getTime()) / (1000 * 60);

  // Usage rate: consume 20% of total data per hour (3.33% per 10 minutes)
  // This means data depletes in ~5 hours of real time
  const usageRatePerMinute = totalDataBytes * 0.20 / 60; // 20% per hour

  // Calculate used data (capped at total)
  let usedBytes = Math.floor(minutesSinceActivation * usageRatePerMinute);
  usedBytes = Math.min(usedBytes, totalDataBytes); // Cap at total

  // Add some randomness to make it look more realistic (±5%)
  const randomFactor = 0.95 + Math.random() * 0.10;
  usedBytes = Math.floor(usedBytes * randomFactor);
  usedBytes = Math.min(usedBytes, totalDataBytes); // Re-cap after randomness

  const remainingBytes = Math.max(0, totalDataBytes - usedBytes);

  return {
    activated_at: activatedAt.toISOString(),
    data_usage_bytes: usedBytes,
    data_remaining_bytes: remainingBytes,
    last_usage_update: now.toISOString(),
    simulated: true,
  };
}

/**
 * Apply simulation to an array of orders for a test user
 */
export function applyTestSimulationToOrders<T extends OrderForSimulation>(
  orders: T[],
  isTestUser: boolean
): T[] {
  if (!isTestUser) {
    return orders;
  }

  return orders.map(order => {
    // Only simulate for completed/provisioning orders with activation details
    if (order.status !== 'completed' && order.status !== 'provisioning') {
      return order;
    }

    const simulation = simulateTestUserUsage(order);
    if (!simulation) {
      return order;
    }

    return {
      ...order,
      activated_at: simulation.activated_at,
      data_usage_bytes: simulation.data_usage_bytes,
      data_remaining_bytes: simulation.data_remaining_bytes,
      last_usage_update: simulation.last_usage_update,
    };
  });
}

/**
 * Check if an order should show as expired for test simulation
 * Uses accelerated time: checks if enough real time has passed
 * to simulate the validity period ending
 */
export function isTestOrderExpired(
  order: OrderForSimulation,
  isTestUser: boolean
): boolean {
  if (!isTestUser || !order.plan) {
    return false;
  }

  const simulation = simulateTestUserUsage(order);
  if (!simulation || !simulation.activated_at) {
    return false;
  }

  // For testing: 1 real hour = 1 validity day
  // So a 7-day plan expires after 7 real hours
  const activatedAt = new Date(simulation.activated_at);
  const now = new Date();
  const hoursSinceActivation = (now.getTime() - activatedAt.getTime()) / (1000 * 60 * 60);

  return hoursSinceActivation >= order.plan.validity_days;
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Nav } from '@/components/nav';

interface Order {
  id: string;
  status: string;
  created_at: string;
  user_email: string;
  plan_name: string;
  stripe_session_id: string | null;
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      if (response.status === 401) {
        // Browser will prompt for basic auth
        setError('Authentication required');
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to load orders');
      }
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <div className="pt-32 pb-20 px-4 sm:px-8">
        <div className="container mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Lumbus Admin</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage orders and view analytics</p>
          </div>

        <Card className="card-lumbus">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-muted-foreground">No orders yet</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">{order.plan_name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{order.user_email}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:text-right w-full sm:w-auto">
                      <Badge
                        variant={
                          order.status === 'completed'
                            ? 'default'
                            : order.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {order.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {order.id.substring(0, 8)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}

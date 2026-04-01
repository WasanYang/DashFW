'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const FASTWORK_FEE_RATE = 0.1; // 10%

export function FinancialDashboard() {
  const [grossPrice, setGrossPrice] = useState<number | string>('');

  const netProfit = useMemo(() => {
    const price = Number(grossPrice);
    if (isNaN(price) || price <= 0) return 0;
    return price * (1 - FASTWORK_FEE_RATE);
  }, [grossPrice]);

  const fee = useMemo(() => {
    const price = Number(grossPrice);
    if (isNaN(price) || price <= 0) return 0;
    return price * FASTWORK_FEE_RATE;
  }, [grossPrice]);

  const monthlyData = [
    { month: 'Jan', pipeline: 1200, withdrawn: 900 },
    { month: 'Feb', pipeline: 1800, withdrawn: 1500 },
    { month: 'Mar', pipeline: 1500, withdrawn: 1600 },
    { month: 'Apr', pipeline: 2200, withdrawn: 1800 },
    { month: 'May', pipeline: 2500, withdrawn: 2100 },
    { month: 'Jun', pipeline: 1900, withdrawn: 2200 },
  ];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Auto-Fee Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="gross-price">Gross Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="gross-price"
                  type="number"
                  placeholder="e.g., 500"
                  value={grossPrice}
                  onChange={(e) => setGrossPrice(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2 rounded-lg bg-muted p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fastwork Fee (10%)</span>
                <span>${fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Net Profit</span>
                <span className="text-primary">${netProfit.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Income Summary (Weekly/Monthly)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-lg bg-primary/5">
                    <p className="text-sm text-muted-foreground">Money in Pipeline</p>
                    <p className="text-2xl font-bold">$3,750.00</p>
                </div>
                 <div className="p-4 rounded-lg bg-chart-2/10 text-chart-2">
                    <p className="text-sm">Withdrawn Earnings</p>
                    <p className="text-2xl font-bold">$8,100.00</p>
                </div>
            </div>

            <h4 className="font-semibold mb-4">Monthly Performance</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Legend iconSize={10} />
                  <Bar dataKey="pipeline" fill="hsl(var(--primary))" name="In Pipeline" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withdrawn" fill="hsl(var(--accent))" name="Withdrawn" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

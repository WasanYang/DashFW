'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetTasksQuery } from '@/services/taskApi';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
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
  const { data: tasks = [], isLoading } = useGetTasksQuery();
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

  // Dynamically calculate Pipeline and Withdrawn Earnings from DB
  const pipelineTotal = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'Completed' && t.status !== 'Paid')
      .reduce((sum, t) => sum + (t.gross_price || 0), 0);
  }, [tasks]);

  const withdrawnTotal = useMemo(() => {
    return tasks
      .filter((t) => t.status === 'Paid')
      .reduce((sum, t) => sum + (t.gross_price || 0) * (1 - FASTWORK_FEE_RATE), 0);
  }, [tasks]);

  const monthlyData = useMemo(() => {
    // Generate the last 6 months dynamically (including the current month)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push(subMonths(new Date(), i));
    }

    return months.map((monthDate) => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const label = format(monthDate, 'MMM');

      // Filter tasks that have deadline in this month
      const monthTasks = tasks.filter((t) => {
        if (!t.deadline) return false;
        const d = new Date(t.deadline);
        return d >= monthStart && d <= monthEnd;
      });

      const pipeline = monthTasks
        .filter((t) => t.status !== 'Completed' && t.status !== 'Paid')
        .reduce((sum, t) => sum + (t.gross_price || 0), 0);

      const withdrawn = monthTasks
        .filter((t) => t.status === 'Paid')
        .reduce((sum, t) => sum + (t.gross_price || 0) * (1 - FASTWORK_FEE_RATE), 0);

      return {
        month: label,
        pipeline,
        withdrawn,
      };
    });
  }, [tasks]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading financials...</div>;
  }

  return (
    <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
      <div className='lg:col-span-1 space-y-8'>
        <Card>
          <CardHeader>
            <CardTitle>Auto-Fee Calculator (เครื่องคำนวณหักค่าธรรมเนียม)</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label htmlFor='gross-price'>Gross Price (ยอดเงินเสนอราคา)</Label>
              <div className='relative'>
                <Input
                  id='gross-price'
                  type='number'
                  placeholder='เช่น 5000'
                  value={grossPrice}
                  onChange={(e) => setGrossPrice(e.target.value)}
                  className='pl-8 font-semibold'
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">฿</span>
              </div>
            </div>
            <div className='space-y-2 rounded-lg bg-card p-4 border border-border/60 shadow-xs'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>
                  Fastwork Fee (ค่าธรรมเนียมหัก 10%)
                </span>
                <span className="font-medium">฿{fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className='flex justify-between font-semibold text-lg'>
                <span>Net Profit (รายได้สุทธิ)</span>
                <span className='text-primary'>฿{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='lg:col-span-2'>
        <Card>
          <CardHeader>
            <CardTitle>Income Summary (สรุปรายได้หมุนเวียน)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4 mb-8'>
              <div className='p-4 rounded-lg bg-card border border-border/60 shadow-xs'>
                <p className='text-sm text-muted-foreground'>
                  Money in Pipeline (ยอดเงินที่อยู่ระหว่างดำเนินงาน)
                </p>
                <p className='text-2xl font-bold text-primary'>฿{pipelineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className='p-4 rounded-lg bg-card border border-border/60 shadow-xs text-chart-2'>
                <p className='text-sm font-semibold'>Withdrawn Earnings (รายได้สุทธิที่ได้รับจริง)</p>
                <p className='text-2xl font-bold'>฿{withdrawnTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            <h4 className='font-semibold mb-4'>Monthly Performance (เปรียบเทียบผลประกอบการรายเดือน)</h4>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={monthlyData}>
                  <XAxis
                    dataKey='month'
                    stroke='hsl(var(--muted-foreground))'
                    fontSize={12}
                  />
                  <YAxis
                    stroke='hsl(var(--muted-foreground))'
                    fontSize={12}
                    tickFormatter={(value) => `฿${value}`}
                  />
                  <Tooltip
                    formatter={(value) => [`฿${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, '']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Legend iconSize={10} />
                  <Bar
                    dataKey='pipeline'
                    fill='hsl(var(--primary))'
                    name='In Pipeline (ระหว่างทำ)'
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey='withdrawn'
                    fill='hsl(var(--accent))'
                    name='Withdrawn (จ่ายแล้ว)'
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


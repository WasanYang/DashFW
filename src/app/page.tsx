import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, ListTodo, Package, Wallet } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const t = await getTranslations('Dashboard');

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('activeProjects')}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              2 in review, 3 in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('pipeline')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,850.00</div>
            <p className="text-xs text-muted-foreground">
              From 5 active projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('earnings')}
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,320.50</div>
            <p className="text-xs text-muted-foreground">
              +15.2% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('openTasks')}</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Package className="h-4 w-4" />
                </div>
                <p className="text-sm">
                  <span className="font-semibold">Suanson Hotel</span> project moved to 'Completed'.
                </p>
                <time className="ml-auto text-xs text-muted-foreground">
                  2h ago
                </time>
              </li>
              <li className="flex items-center gap-4">
                <div className="rounded-full bg-accent/10 p-2 text-accent">
                  <DollarSign className="h-4 w-4" />
                </div>
                <p className="text-sm">
                  Received payment for <span className="font-semibold">Only U Villa</span> project.
                </p>
                <time className="ml-auto text-xs text-muted-foreground">
                  1 day ago
                </time>
              </li>
              <li className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <ListTodo className="h-4 w-4" />
                </div>
                <p className="text-sm">
                  New revision requested for <span className="font-semibold">"Digital Marketer Portfolio"</span>.
                </p>
                <time className="ml-auto text-xs text-muted-foreground">
                  3 days ago
                </time>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('upcomingDeadlines')}</CardTitle>
          </CardHeader>
          <CardContent>
          <ul className="space-y-4">
              <li className="flex items-center gap-4">
                <p className="text-sm font-semibold">"Google Business SEO"</p>
                <p className="text-sm text-destructive">in 2 days</p>
              </li>
              <li className="flex items-center gap-4">
                <p className="text-sm font-semibold">"New OTA Listing Setup"</p>
                <p className="text-sm text-muted-foreground">in 5 days</p>
              </li>
               <li className="flex items-center gap-4">
                <p className="text-sm font-semibold">"E-commerce Site" final review</p>
                <p className="text-sm text-muted-foreground">in 1 week</p>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

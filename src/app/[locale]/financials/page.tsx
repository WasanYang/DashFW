import { FinancialDashboard } from "@/components/financials/financial-dashboard";
import { getTranslations } from "next-intl/server";

export default async function FinancialsPage() {
  const t = await getTranslations('Financials');
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <FinancialDashboard />
    </div>
  );
}

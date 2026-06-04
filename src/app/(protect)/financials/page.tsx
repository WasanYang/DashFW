import { FinancialDashboard } from "@/components/financials/financial-dashboard";

export default async function FinancialsPage() {
  return (
    <div className="flex flex-col gap-4 w-full min-h-full p-4 sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground/90 px-1 mb-2">Financials</h1>
      <FinancialDashboard />
    </div>
  );
}

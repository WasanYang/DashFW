import { FinancialDashboard } from "@/components/financials/financial-dashboard";

export default function FinancialsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Financials</h1>
      <FinancialDashboard />
    </div>
  );
}

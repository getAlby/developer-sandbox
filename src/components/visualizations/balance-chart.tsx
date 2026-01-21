import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useTransactionStore, useScenarioStore } from "@/stores";
import { WALLET_PERSONAS } from "@/types";

const WALLET_COLORS: Record<string, string> = {
  alice: "var(--color-chart-1)",
  bob: "var(--color-chart-2)",
  charlie: "var(--color-chart-3)",
  david: "var(--color-chart-4)",
};

export function BalanceChart() {
  const { balanceHistory } = useTransactionStore();
  const { currentScenario } = useScenarioStore();

  const chartConfig: ChartConfig = currentScenario.requiredWallets.reduce(
    (acc, walletId) => ({
      ...acc,
      [walletId]: {
        label: WALLET_PERSONAS[walletId]?.name ?? walletId,
        color: WALLET_COLORS[walletId] || "hsl(var(--chart-5))",
      },
    }),
    {} as ChartConfig,
  );

  if (balanceHistory.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No balance data yet. Execute transactions to see balance changes over
        time.
      </div>
    );
  }

  // Group balance snapshots by timestamp and transform for recharts
  const chartData = transformBalanceData(
    balanceHistory,
    currentScenario.requiredWallets,
  );

  return (
    <div className="h-full p-4">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {currentScenario.requiredWallets.map((walletId) => (
            <Line
              key={walletId}
              type="monotone"
              dataKey={walletId}
              stroke={WALLET_COLORS[walletId] || "hsl(var(--chart-5))"}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}

interface ChartDataPoint {
  label: string;
  [walletId: string]: number | string;
}

function transformBalanceData(
  balanceHistory: Array<{ timestamp: Date; walletId: string; balance: number }>,
  walletIds: string[],
): ChartDataPoint[] {
  // Group by timestamp (rounded to seconds)
  const grouped = new Map<number, Map<string, number>>();
  const lastBalances = new Map<string, number>();

  for (const snapshot of balanceHistory) {
    const timeKey = Math.floor(snapshot.timestamp.getTime() / 1000) * 1000;

    if (!grouped.has(timeKey)) {
      // Copy last known balances
      grouped.set(timeKey, new Map(lastBalances));
    }

    grouped.get(timeKey)!.set(snapshot.walletId, snapshot.balance);
    lastBalances.set(snapshot.walletId, snapshot.balance);
  }

  // Convert to array sorted by time
  const sortedTimes = Array.from(grouped.keys()).sort();

  return sortedTimes.map((time, index) => {
    const balances = grouped.get(time)!;
    const point: ChartDataPoint = {
      label: index === 0 ? "Start" : `Tx${index}`,
    };

    for (const walletId of walletIds) {
      point[walletId] = balances.get(walletId) ?? 0;
    }

    return point;
  });
}

"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Boxes,
  Factory,
  FlaskConical,
  Gauge,
  PackageCheck,
  ShieldAlert,
  Truck,
  Warehouse,
  Crown,
  Activity,
  TrendingUp,
  Layers3,
  Clock3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type ScenarioKey = "base" | "bull" | "stress";
type ViewKey = "overview" | "inventory" | "sourcing";
type RiskLevel = "High" | "Medium" | "Low";

type InventoryItem = {
  material: string;
  onHand: number;
  reorderPoint: number;
  safetyStock: number;
  incoming: number;
  daysCover: number;
  risk: RiskLevel;
  criticality: string;
  fillRate: number;
  spend: number;
};

type StageItem = {
  stage: string;
  capacity: number;
  actual: number;
  yield: number;
  wip: number;
};

type SupplierItem = {
  supplier: string;
  material: string;
  otd: number;
  leadTime: number;
  risk: RiskLevel;
  status: string;
};

const scenarios: Record<
  ScenarioKey,
  {
    name: string;
    assumptions: string[];
    plantTargetSqftWeek: number;
    oee: number;
    utilization: number;
    serviceLevel: number;
    yield: number;
    otif: number;
    inventoryTurns: number;
    wipDays: number;
    backlogUnits: number;
    safetyIncidents: number;
    openPOs: number;
    incomingToday: number;
    riskMaterials: number;
    vessel36Cycles: number;
    vessel60Cycles: number;
    rawMaterialDays: number;
    stockRisk: RiskLevel;
    weeklyThroughput: { week: string; sqft: number; target: number }[];
    stageFlow: StageItem[];
    inventory: InventoryItem[];
    supplierRiskMix: { name: string; value: number }[];
    serviceTrend: { day: string; service: number }[];
    sourcing: SupplierItem[];
  }
> = {
  base: {
    name: "Base",
    assumptions: ["Stable demand", "Normal supplier lead time", "Expected process yield"],
    plantTargetSqftWeek: 5600,
    oee: 84.2,
    utilization: 79.4,
    serviceLevel: 97.8,
    yield: 91.6,
    otif: 95.1,
    inventoryTurns: 9.7,
    wipDays: 2.9,
    backlogUnits: 42,
    safetyIncidents: 0,
    openPOs: 27,
    incomingToday: 8,
    riskMaterials: 3,
    vessel36Cycles: 1,
    vessel60Cycles: 4,
    rawMaterialDays: 18.4,
    stockRisk: "Low",
    weeklyThroughput: [
      { week: "W1", sqft: 4920, target: 5600 },
      { week: "W2", sqft: 5210, target: 5600 },
      { week: "W3", sqft: 5470, target: 5600 },
      { week: "W4", sqft: 5660, target: 5600 },
      { week: "W5", sqft: 5515, target: 5600 },
      { week: "W6", sqft: 5830, target: 5600 },
      { week: "W7", sqft: 5725, target: 5600 },
      { week: "W8", sqft: 5940, target: 5600 },
    ],
    stageFlow: [
      { stage: "Molding", capacity: 75, actual: 69, yield: 90, wip: 14 },
      { stage: "Solvex + CPD", capacity: 72, actual: 67, yield: 98, wip: 18 },
      { stage: "Annealing", capacity: 70, actual: 64, yield: 97, wip: 22 },
      { stage: "Cutting", capacity: 80, actual: 62, yield: 96, wip: 7 },
      { stage: "Composite", capacity: 128, actual: 118, yield: 98, wip: 11 },
      { stage: "IGU", capacity: 126, actual: 120, yield: 99, wip: 8 },
    ],
    inventory: [
      { material: "Silica precursor", onHand: 1280, reorderPoint: 880, safetyStock: 310, incoming: 420, daysCover: 18, risk: "High", criticality: "A", fillRate: 98.2, spend: 148000 },
      { material: "Solvent", onHand: 2540, reorderPoint: 1600, safetyStock: 420, incoming: 900, daysCover: 21, risk: "Medium", criticality: "A", fillRate: 99.1, spend: 112000 },
      { material: "CO2 process input", onHand: 3220, reorderPoint: 1400, safetyStock: 260, incoming: 0, daysCover: 29, risk: "Low", criticality: "B", fillRate: 99.6, spend: 42000 },
      { material: "Low-e glass lite", onHand: 760, reorderPoint: 540, safetyStock: 120, incoming: 220, daysCover: 13, risk: "Medium", criticality: "A", fillRate: 97.4, spend: 174000 },
      { material: "Spacer", onHand: 1960, reorderPoint: 900, safetyStock: 180, incoming: 500, daysCover: 25, risk: "Low", criticality: "B", fillRate: 99.3, spend: 26000 },
      { material: "Adhesive / sealant", onHand: 430, reorderPoint: 380, safetyStock: 95, incoming: 80, daysCover: 11, risk: "High", criticality: "A", fillRate: 96.5, spend: 69000 },
    ],
    supplierRiskMix: [
      { name: "High", value: 2 },
      { name: "Medium", value: 2 },
      { name: "Low", value: 2 },
    ],
    serviceTrend: [
      { day: "Mon", service: 98.4 },
      { day: "Tue", service: 97.9 },
      { day: "Wed", service: 99.1 },
      { day: "Thu", service: 98.8 },
      { day: "Fri", service: 97.2 },
      { day: "Sat", service: 98.5 },
      { day: "Sun", service: 99.0 },
    ],
    sourcing: [
      { supplier: "Supplier A", material: "Silica precursor", otd: 91, leadTime: 18, risk: "High", status: "Dual source needed" },
      { supplier: "Supplier D", material: "Low-e glass lite", otd: 93, leadTime: 14, risk: "Medium", status: "Monitor weekly" },
      { supplier: "Supplier F", material: "Adhesive / sealant", otd: 89, leadTime: 16, risk: "High", status: "Expedite backup PO" },
      { supplier: "Supplier B", material: "Solvent", otd: 95, leadTime: 10, risk: "Medium", status: "Stable" },
    ],
  },
  bull: {
    name: "Bull",
    assumptions: ["Demand +25%", "High line loading", "No major supplier disruption"],
    plantTargetSqftWeek: 6200,
    oee: 81.1,
    utilization: 86.7,
    serviceLevel: 95.9,
    yield: 89.8,
    otif: 92.8,
    inventoryTurns: 10.8,
    wipDays: 3.4,
    backlogUnits: 77,
    safetyIncidents: 0,
    openPOs: 34,
    incomingToday: 11,
    riskMaterials: 4,
    vessel36Cycles: 1,
    vessel60Cycles: 4,
    rawMaterialDays: 15.2,
    stockRisk: "Medium",
    weeklyThroughput: [
      { week: "W1", sqft: 5600, target: 6200 },
      { week: "W2", sqft: 5780, target: 6200 },
      { week: "W3", sqft: 6030, target: 6200 },
      { week: "W4", sqft: 6140, target: 6200 },
      { week: "W5", sqft: 5950, target: 6200 },
      { week: "W6", sqft: 6240, target: 6200 },
      { week: "W7", sqft: 6105, target: 6200 },
      { week: "W8", sqft: 6320, target: 6200 },
    ],
    stageFlow: [
      { stage: "Molding", capacity: 78, actual: 74, yield: 89, wip: 17 },
      { stage: "Solvex + CPD", capacity: 76, actual: 72, yield: 97, wip: 21 },
      { stage: "Annealing", capacity: 72, actual: 69, yield: 96, wip: 24 },
      { stage: "Cutting", capacity: 82, actual: 66, yield: 95, wip: 8 },
      { stage: "Composite", capacity: 136, actual: 126, yield: 97, wip: 14 },
      { stage: "IGU", capacity: 132, actual: 126, yield: 98, wip: 10 },
    ],
    inventory: [
      { material: "Silica precursor", onHand: 1320, reorderPoint: 960, safetyStock: 360, incoming: 520, daysCover: 16, risk: "High", criticality: "A", fillRate: 97.2, spend: 164000 },
      { material: "Solvent", onHand: 2490, reorderPoint: 1770, safetyStock: 460, incoming: 860, daysCover: 18, risk: "Medium", criticality: "A", fillRate: 98.2, spend: 124000 },
      { material: "CO2 process input", onHand: 3050, reorderPoint: 1550, safetyStock: 290, incoming: 300, daysCover: 25, risk: "Low", criticality: "B", fillRate: 99.1, spend: 47000 },
      { material: "Low-e glass lite", onHand: 740, reorderPoint: 620, safetyStock: 150, incoming: 260, daysCover: 11, risk: "High", criticality: "A", fillRate: 95.3, spend: 192000 },
      { material: "Spacer", onHand: 1880, reorderPoint: 980, safetyStock: 190, incoming: 600, daysCover: 22, risk: "Low", criticality: "B", fillRate: 98.7, spend: 29000 },
      { material: "Adhesive / sealant", onHand: 405, reorderPoint: 410, safetyStock: 110, incoming: 100, daysCover: 9, risk: "High", criticality: "A", fillRate: 94.8, spend: 76000 },
    ],
    supplierRiskMix: [
      { name: "High", value: 3 },
      { name: "Medium", value: 1 },
      { name: "Low", value: 2 },
    ],
    serviceTrend: [
      { day: "Mon", service: 96.8 },
      { day: "Tue", service: 97.1 },
      { day: "Wed", service: 96.0 },
      { day: "Thu", service: 97.6 },
      { day: "Fri", service: 95.9 },
      { day: "Sat", service: 97.4 },
      { day: "Sun", service: 98.0 },
    ],
    sourcing: [
      { supplier: "Supplier A", material: "Silica precursor", otd: 90, leadTime: 19, risk: "High", status: "Add contingency lot" },
      { supplier: "Supplier D", material: "Low-e glass lite", otd: 91, leadTime: 15, risk: "High", status: "Reserve weekly allocation" },
      { supplier: "Supplier F", material: "Adhesive / sealant", otd: 88, leadTime: 17, risk: "High", status: "Qualify second source" },
      { supplier: "Supplier B", material: "Solvent", otd: 95, leadTime: 10, risk: "Medium", status: "Stable" },
    ],
  },
  stress: {
    name: "Stress",
    assumptions: ["Supplier delays", "Yield loss", "Capacity under pressure"],
    plantTargetSqftWeek: 5600,
    oee: 74.9,
    utilization: 88.1,
    serviceLevel: 91.7,
    yield: 86.2,
    otif: 88.5,
    inventoryTurns: 8.3,
    wipDays: 4.1,
    backlogUnits: 126,
    safetyIncidents: 1,
    openPOs: 38,
    incomingToday: 5,
    riskMaterials: 5,
    vessel36Cycles: 1,
    vessel60Cycles: 3,
    rawMaterialDays: 9.7,
    stockRisk: "High",
    weeklyThroughput: [
      { week: "W1", sqft: 4380, target: 5600 },
      { week: "W2", sqft: 4610, target: 5600 },
      { week: "W3", sqft: 4895, target: 5600 },
      { week: "W4", sqft: 5120, target: 5600 },
      { week: "W5", sqft: 4760, target: 5600 },
      { week: "W6", sqft: 5230, target: 5600 },
      { week: "W7", sqft: 4990, target: 5600 },
      { week: "W8", sqft: 5310, target: 5600 },
    ],
    stageFlow: [
      { stage: "Molding", capacity: 68, actual: 60, yield: 86, wip: 22 },
      { stage: "Solvex + CPD", capacity: 65, actual: 57, yield: 95, wip: 24 },
      { stage: "Annealing", capacity: 61, actual: 54, yield: 93, wip: 28 },
      { stage: "Cutting", capacity: 76, actual: 51, yield: 92, wip: 11 },
      { stage: "Composite", capacity: 118, actual: 102, yield: 95, wip: 18 },
      { stage: "IGU", capacity: 115, actual: 99, yield: 97, wip: 15 },
    ],
    inventory: [
      { material: "Silica precursor", onHand: 980, reorderPoint: 950, safetyStock: 390, incoming: 120, daysCover: 11, risk: "High", criticality: "A", fillRate: 93.7, spend: 151000 },
      { material: "Solvent", onHand: 1840, reorderPoint: 1710, safetyStock: 500, incoming: 420, daysCover: 13, risk: "High", criticality: "A", fillRate: 94.8, spend: 116000 },
      { material: "CO2 process input", onHand: 2440, reorderPoint: 1600, safetyStock: 310, incoming: 0, daysCover: 18, risk: "Medium", criticality: "B", fillRate: 97.1, spend: 44000 },
      { material: "Low-e glass lite", onHand: 520, reorderPoint: 640, safetyStock: 170, incoming: 140, daysCover: 8, risk: "High", criticality: "A", fillRate: 89.6, spend: 186000 },
      { material: "Spacer", onHand: 1500, reorderPoint: 1040, safetyStock: 220, incoming: 200, daysCover: 16, risk: "Medium", criticality: "B", fillRate: 96.2, spend: 28000 },
      { material: "Adhesive / sealant", onHand: 310, reorderPoint: 430, safetyStock: 120, incoming: 0, daysCover: 6, risk: "High", criticality: "A", fillRate: 88.9, spend: 73000 },
    ],
    supplierRiskMix: [
      { name: "High", value: 4 },
      { name: "Medium", value: 2 },
      { name: "Low", value: 0 },
    ],
    serviceTrend: [
      { day: "Mon", service: 91.5 },
      { day: "Tue", service: 92.8 },
      { day: "Wed", service: 90.7 },
      { day: "Thu", service: 91.9 },
      { day: "Fri", service: 89.8 },
      { day: "Sat", service: 92.2 },
      { day: "Sun", service: 93.4 },
    ],
    sourcing: [
      { supplier: "Supplier A", material: "Silica precursor", otd: 87, leadTime: 22, risk: "High", status: "Escalate executive review" },
      { supplier: "Supplier D", material: "Low-e glass lite", otd: 88, leadTime: 18, risk: "High", status: "Expedite and split lots" },
      { supplier: "Supplier F", material: "Adhesive / sealant", otd: 84, leadTime: 19, risk: "High", status: "Emergency backup source" },
      { supplier: "Supplier B", material: "Solvent", otd: 91, leadTime: 13, risk: "High", status: "Safety stock increase" },
    ],
  },
};

const riskColor: Record<RiskLevel, string> = {
  High: "bg-rose-500/15 text-rose-200 border-rose-400/30",
  Medium: "bg-amber-500/15 text-amber-200 border-amber-400/30",
  Low: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
};

const pieColors = ["#fb7185", "#fbbf24", "#34d399"];

function kpiTone(value: number, good: number, warn: number) {
  if (value >= good) return "text-emerald-300";
  if (value >= warn) return "text-amber-300";
  return "text-rose-300";
}

function formatMoney(value: number) {
  return `$${value.toLocaleString()}`;
}

function calcSupplierRiskScore(item: SupplierItem) {
  const reliabilityPenalty = 100 - item.otd;
  const leadPenalty = item.leadTime * 1.4;
  const criticalPenalty = item.risk === "High" ? 20 : item.risk === "Medium" ? 10 : 4;
  return Math.round(reliabilityPenalty + leadPenalty + criticalPenalty);
}

function calcInventoryRisk(item: InventoryItem): RiskLevel {
  const coverGap = item.onHand - item.reorderPoint;
  if (coverGap <= 0 || item.daysCover <= 8 || item.fillRate < 95) return "High";
  if (item.daysCover <= 14 || item.fillRate < 98) return "Medium";
  return "Low";
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "text-slate-50",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  tone?: string;
}) {
  return (
    <Card className="border-slate-800/80 bg-slate-950/50 shadow-2xl shadow-black/25 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">{title}</p>
            <p className={`mt-4 text-4xl font-semibold ${tone}`}>{value}</p>
            <p className="mt-3 text-base text-slate-300">{subtitle}</p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-950 p-4 shadow-inner shadow-cyan-500/10">
            <Icon className="h-7 w-7 text-cyan-300" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DataTable({
  title,
  columns,
  rows,
  dense = false,
}: {
  title: string;
  columns: { key: string; label: string; render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode }[];
  rows: Record<string, unknown>[];
  dense?: boolean;
}) {
  return (
    <Card className="border-slate-800/80 bg-slate-950/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-slate-50">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-y-2">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 pb-2 text-left text-[11px] uppercase tracking-[0.2em] text-slate-400"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="rounded-2xl bg-slate-950/80">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 ${dense ? "py-2" : "py-3"} text-sm text-slate-100`}
                    >
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 text-lg font-medium transition-all duration-200 ${
        active
          ? "bg-slate-100 text-slate-950 shadow-lg"
          : "text-slate-200 hover:bg-slate-800/60 hover:text-white"
      }`}
      type="button"
    >
      {children}
    </button>
  );
}

function InsightBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-100">{children}</p>
    </div>
  );
}

export default function AeroShieldOperationsDashboard() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>("base");
  const [view, setView] = useState<ViewKey>("overview");

  const data = scenarios[scenarioKey];

  const summary = useMemo(() => {
    const totalSpend = data.inventory.reduce((sum, item) => sum + item.spend, 0);
    const materialsBelowROP = data.inventory.filter((item) => item.onHand <= item.reorderPoint).length;
    const highRiskSuppliers = data.sourcing.filter((item) => item.risk === "High").length;
    const bottleneck = [...data.stageFlow].sort((a, b) => b.actual / b.capacity - a.actual / a.capacity)[0];
    const weakestFill = [...data.inventory].sort((a, b) => a.fillRate - b.fillRate)[0];
    const highestSupplierRisk = [...data.sourcing].sort(
      (a, b) => calcSupplierRiskScore(b) - calcSupplierRiskScore(a)
    )[0];
    return { totalSpend, materialsBelowROP, highRiskSuppliers, bottleneck, weakestFill, highestSupplierRisk };
  }, [data]);

  const decisionAlert = useMemo(() => {
    if (scenarioKey === "stress") {
      return {
        title: "Immediate Action",
        body: `Protect ${summary.weakestFill.material}, expedite ${summary.highestSupplierRisk.supplier}, and add a controlled WIP buffer before ${summary.bottleneck.stage}.`,
      };
    }
    if (scenarioKey === "bull") {
      return {
        title: "Capacity Risk",
        body: `Demand pressure is rising. Reserve supply capacity now and protect flow through ${summary.bottleneck.stage} before utilization becomes unstable.`,
      };
    }
    return {
      title: "Daily Focus",
      body: `Operations are stable. Monitor ${summary.bottleneck.stage}, maintain service above 97%, and review materials approaching reorder point every day.`,
    };
  }, [scenarioKey, summary]);

  const inventoryRows = useMemo(
    () =>
      data.inventory.map((item) => ({
        ...item,
        stockRisk: calcInventoryRisk(item),
      })),
    [data.inventory]
  );

  const sourcingRows = useMemo(
    () =>
      data.sourcing.map((item) => ({
        ...item,
        riskScore: calcSupplierRiskScore(item),
        sourceModel: item.risk === "High" ? "Single / fragile" : "Managed / mixed",
      })),
    [data.sourcing]
  );

  const overviewThroughputGap = data.weeklyThroughput[data.weeklyThroughput.length - 1].sqft - data.plantTargetSqftWeek;

  const inventoryColumns = [
    { key: "material", label: "Material" },
    { key: "criticality", label: "Class" },
    {
      key: "onHand",
      label: "On Hand",
      render: (v: unknown) => <span className="font-medium text-slate-50">{Number(v).toLocaleString()}</span>,
    },
    { key: "reorderPoint", label: "ROP" },
    { key: "safetyStock", label: "Safety Stock" },
    { key: "daysCover", label: "Days Cover" },
    {
      key: "stockRisk",
      label: "Stock Risk",
      render: (v: unknown) => <Badge className={`border ${riskColor[v as RiskLevel]}`}>{String(v)}</Badge>,
    },
    {
      key: "fillRate",
      label: "Service Level",
      render: (v: unknown) => <span className={kpiTone(Number(v), 98, 95)}>{Number(v).toFixed(1)}%</span>,
    },
  ];

  const sourcingColumns = [
    { key: "supplier", label: "Supplier" },
    { key: "material", label: "Material" },
    {
      key: "otd",
      label: "Reliability",
      render: (v: unknown) => <span className={kpiTone(Number(v), 95, 90)}>{Number(v)}%</span>,
    },
    { key: "leadTime", label: "Lead Time" },
    { key: "sourceModel", label: "Source Model" },
    {
      key: "riskScore",
      label: "Risk Score",
      render: (v: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{Number(v)}</span>
          <Badge className={`border ${riskColor[row.risk as RiskLevel]}`}>{String(row.risk)}</Badge>
        </div>
      ),
    },
    { key: "status", label: "Action" },
  ];

  const chartTooltip = {
    contentStyle: {
      background: "#020617",
      border: "1px solid #334155",
      borderRadius: 16,
      color: "#f8fafc",
    },
    labelStyle: { color: "#f8fafc" },
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0b1737_0%,_#020617_46%,_#000814_100%)] text-slate-50">
      <div className="mx-auto max-w-[1600px] p-6 md:p-8">
        <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-5 py-3 text-sm uppercase tracking-[0.35em] text-cyan-100 shadow-lg shadow-cyan-500/10">
              <Factory className="h-4 w-4" /> AeroShield SCALEUP Facility
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
              Operations Manager Dashboard
            </h1>
            <p className="mt-4 max-w-4xl text-lg leading-9 text-slate-300 md:text-2xl">
              Decision-focused control layer for throughput, capacity, inventory health, and sourcing risk.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="space-y-3">
              <Select value={scenarioKey} onValueChange={(value: ScenarioKey) => setScenarioKey(value)}>
                <SelectTrigger className="h-16 w-[260px] border-slate-700 bg-slate-950/70 text-xl text-slate-50">
                  <SelectValue placeholder="Scenario" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-950 text-slate-50">
                  <SelectItem value="base">Base Scenario</SelectItem>
                  <SelectItem value="bull">Bull Scenario</SelectItem>
                  <SelectItem value="stress">Stress Scenario</SelectItem>
                </SelectContent>
              </Select>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Scenario assumptions</p>
                <div className="mt-3 space-y-2">
                  {data.assumptions.map((item) => (
                    <div key={item} className="text-sm text-slate-200">• {item}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 p-2 shadow-lg">
              <SectionButton active={view === "overview"} onClick={() => setView("overview")}>
                Overview
              </SectionButton>
              <SectionButton active={view === "inventory"} onClick={() => setView("inventory")}>
                Inventory
              </SectionButton>
              <SectionButton active={view === "sourcing"} onClick={() => setView("sourcing")}>
                Sourcing
              </SectionButton>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 text-cyan-200" />
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">{decisionAlert.title}</p>
              <p className="mt-2 text-sm leading-7 text-slate-100">{decisionAlert.body}</p>
            </div>
          </div>
        </div>

        {view === "overview" && (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="OEE" value={`${data.oee.toFixed(1)}%`} subtitle="Overall equipment effectiveness" icon={Gauge} tone={kpiTone(data.oee, 85, 78)} />
              <MetricCard title="Utilization" value={`${data.utilization.toFixed(1)}%`} subtitle="Capacity consumed" icon={Activity} tone={kpiTone(100 - Math.abs(82 - data.utilization), 95, 85)} />
              <MetricCard title="Service Level" value={`${data.serviceLevel.toFixed(1)}%`} subtitle="Customer service stability" icon={PackageCheck} tone={kpiTone(data.serviceLevel, 98, 95)} />
              <MetricCard title="Yield" value={`${data.yield.toFixed(1)}%`} subtitle="End-to-end process yield" icon={FlaskConical} tone={kpiTone(data.yield, 92, 88)} />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
              <Card className="col-span-1 border-slate-800/80 bg-slate-950/50 xl:col-span-8">
                <CardHeader>
                  <CardTitle className="text-slate-50">Throughput vs Weekly Target</CardTitle>
                </CardHeader>
                <CardContent className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.weeklyThroughput}>
                      <CartesianGrid stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="week" stroke="#cbd5e1" />
                      <YAxis stroke="#cbd5e1" />
                      <Tooltip {...chartTooltip} />
                      <Bar dataKey="sqft" radius={[10, 10, 0, 0]} fill="#38bdf8" />
                      <Bar dataKey="target" radius={[10, 10, 0, 0]} fill="#475569" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="col-span-1 grid grid-cols-1 gap-4 xl:col-span-4">
                <Card className="border-slate-800/80 bg-slate-950/50">
                  <CardHeader>
                    <CardTitle className="text-slate-50">Operations Focus</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Bottleneck stage</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-50">{summary.bottleneck.stage}</p>
                      <p className="mt-1 text-sm text-slate-300">Actual {summary.bottleneck.actual} vs capacity {summary.bottleneck.capacity}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Backlog</p>
                      <p className={`mt-2 text-2xl font-semibold ${data.backlogUnits > 80 ? "text-rose-300" : "text-amber-300"}`}>{data.backlogUnits}</p>
                      <p className="mt-1 text-sm text-slate-300">Units waiting release</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Throughput gap</p>
                      <p className={`mt-2 text-2xl font-semibold ${overviewThroughputGap >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{overviewThroughputGap >= 0 ? "+" : ""}{overviewThroughputGap.toLocaleString()} sqft</p>
                      <p className="mt-1 text-sm text-slate-300">Latest week vs target</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <Card className="col-span-1 border-slate-800/80 bg-slate-950/50 xl:col-span-5">
                <CardHeader>
                  <CardTitle className="text-slate-50">Stage Loading</CardTitle>
                </CardHeader>
                <CardContent className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.stageFlow} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#cbd5e1" />
                      <YAxis type="category" dataKey="stage" stroke="#cbd5e1" width={110} />
                      <Tooltip {...chartTooltip} />
                      <Bar dataKey="capacity" fill="#475569" radius={[0, 8, 8, 0]} />
                      <Bar dataKey="actual" fill="#60a5fa" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="col-span-1 border-slate-800/80 bg-slate-950/50 xl:col-span-4">
                <CardHeader>
                  <CardTitle className="text-slate-50">Service Level Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.serviceTrend}>
                      <CartesianGrid stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="day" stroke="#cbd5e1" />
                      <YAxis stroke="#cbd5e1" domain={[85, 100]} />
                      <Tooltip {...chartTooltip} />
                      <Line type="monotone" dataKey="service" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="col-span-1 space-y-4 xl:col-span-3">
                <InsightBox title="Key operations insight">
                  {scenarioKey === "stress"
                    ? `The plant is not failing because of one metric. It is failing because low yield, backlog, and supplier pressure are all converging around ${summary.bottleneck.stage}.`
                    : scenarioKey === "bull"
                    ? `The system can still grow, but ${summary.bottleneck.stage} is becoming the control point. Demand is increasing faster than flexibility.`
                    : `Base case is stable, but ${summary.bottleneck.stage} remains the first constraint to watch if demand increases.`}
                </InsightBox>
                <Card className="border-slate-800/80 bg-slate-950/50">
                  <CardHeader>
                    <CardTitle className="text-slate-50">Plant Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-200">
                    <div className="flex items-center justify-between rounded-xl bg-slate-950/80 p-3"><span>Open POs</span><span>{data.openPOs}</span></div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-950/80 p-3"><span>Inbound Today</span><span>{data.incomingToday}</span></div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-950/80 p-3"><span>60&quot; Vessel Cycles</span><span>{data.vessel60Cycles}</span></div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-950/80 p-3"><span>Safety Incidents</span><span className={data.safetyIncidents === 0 ? "text-emerald-300" : "text-rose-300"}>{data.safetyIncidents}</span></div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {view === "inventory" && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="col-span-1 xl:col-span-8">
              <DataTable title="Inventory Control Board" columns={inventoryColumns} rows={inventoryRows as unknown as Record<string, unknown>[]} />
            </div>

            <div className="col-span-1 space-y-4 xl:col-span-4">
              <Card className="border-slate-800/80 bg-slate-950/50">
                <CardHeader>
                  <CardTitle className="text-slate-50">Inventory Control Panel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">WIP Days</p>
                      <p className={`mt-2 text-3xl font-semibold ${data.wipDays <= 3 ? "text-emerald-300" : data.wipDays <= 3.5 ? "text-amber-300" : "text-rose-300"}`}>{data.wipDays.toFixed(1)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Raw Material Days</p>
                      <p className={`mt-2 text-3xl font-semibold ${data.rawMaterialDays > 14 ? "text-emerald-300" : data.rawMaterialDays > 10 ? "text-amber-300" : "text-rose-300"}`}>{data.rawMaterialDays.toFixed(1)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Inventory Turns</p>
                      <p className="mt-2 text-3xl font-semibold text-cyan-300">{data.inventoryTurns.toFixed(1)}x</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Stock Risk</p>
                      <div className="mt-3"><Badge className={`border ${riskColor[data.stockRisk]}`}>{data.stockRisk}</Badge></div>
                    </div>
                  </div>
                  <InsightBox title="Inventory insight">
                    {scenarioKey === "stress"
                      ? `Inventory is now a stability problem, not a cost problem. ${summary.weakestFill.material} is the first material that can break service.`
                      : scenarioKey === "bull"
                      ? `Bull demand does not only increase stock usage. It shortens reaction time. Safety stock and reorder discipline become more important.`
                      : `Base inventory is adequate, but the dashboard shows which materials are closest to risk if demand shifts upward.`}
                  </InsightBox>
                </CardContent>
              </Card>

              <Card className="border-slate-800/80 bg-slate-950/50">
                <CardHeader>
                  <CardTitle className="text-slate-50">Recommended Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm leading-6 text-slate-200">
                    <div className="flex items-start gap-3"><Crown className="mt-1 h-5 w-5 text-cyan-300" /><span>Protect {summary.weakestFill.material} first and raise safety cover before service degrades further.</span></div>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm leading-6 text-slate-200">
                    <div className="flex items-start gap-3"><Crown className="mt-1 h-5 w-5 text-cyan-300" /><span>Use daily review on materials near reorder point instead of only weekly review.</span></div>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm leading-6 text-slate-200">
                    <div className="flex items-start gap-3"><Crown className="mt-1 h-5 w-5 text-cyan-300" /><span>Keep a controlled WIP buffer before {summary.bottleneck.stage}, not across all stages.</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="col-span-1 border-slate-800/80 bg-slate-950/50 xl:col-span-6">
              <CardHeader>
                <CardTitle className="text-slate-50">Material Spend by Item</CardTitle>
              </CardHeader>
              <CardContent className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.inventory}>
                    <CartesianGrid stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="material" stroke="#cbd5e1" angle={-15} textAnchor="end" height={80} interval={0} />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip {...chartTooltip} />
                    <Bar dataKey="spend" radius={[10, 10, 0, 0]} fill="#22d3ee" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1 border-slate-800/80 bg-slate-950/50 xl:col-span-6">
              <CardHeader>
                <CardTitle className="text-slate-50">On Hand vs Reorder Point</CardTitle>
              </CardHeader>
              <CardContent className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.inventory}>
                    <CartesianGrid stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="material" stroke="#cbd5e1" angle={-15} textAnchor="end" height={80} interval={0} />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip {...chartTooltip} />
                    <Bar dataKey="onHand" radius={[10, 10, 0, 0]} fill="#60a5fa" />
                    <Bar dataKey="reorderPoint" radius={[10, 10, 0, 0]} fill="#f43f5e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {view === "sourcing" && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="col-span-1 xl:col-span-8">
              <DataTable title="Supplier Action Board" columns={sourcingColumns} rows={sourcingRows as unknown as Record<string, unknown>[]} dense />
            </div>

            <div className="col-span-1 space-y-4 xl:col-span-4">
              <Card className="border-slate-800/80 bg-slate-950/50">
                <CardHeader>
                  <CardTitle className="text-slate-50">Sourcing Risk Panel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Highest supplier risk</p>
                    <p className="mt-2 text-xl font-semibold text-slate-50">{summary.highestSupplierRisk.supplier}</p>
                    <p className="mt-1 text-sm text-slate-300">{summary.highestSupplierRisk.material}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">High-risk suppliers</p>
                    <p className="mt-2 text-3xl font-semibold text-rose-300">{summary.highRiskSuppliers}</p>
                  </div>
                  <InsightBox title="Sourcing insight">
                    {scenarioKey === "stress"
                      ? `Under stress, supplier reliability becomes the main driver of service failure. Capacity alone will not save the system.`
                      : `Sourcing must be managed like an operations lever. External instability translates directly into internal throughput risk.`}
                  </InsightBox>
                </CardContent>
              </Card>
            </div>

            <Card className="col-span-1 border-slate-800/80 bg-slate-950/50 xl:col-span-6">
              <CardHeader>
                <CardTitle className="text-slate-50">Supplier Risk Mix</CardTitle>
              </CardHeader>
              <CardContent className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.supplierRiskMix} dataKey="value" nameKey="name" innerRadius={70} outerRadius={120} paddingAngle={4}>
                      {data.supplierRiskMix.map((entry, idx) => (
                        <Cell key={entry.name} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1 border-slate-800/80 bg-slate-950/50 xl:col-span-6">
              <CardHeader>
                <CardTitle className="text-slate-50">WIP and Yield Exposure</CardTitle>
              </CardHeader>
              <CardContent className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.stageFlow}>
                    <CartesianGrid stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="stage" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip {...chartTooltip} />
                    <Area type="monotone" dataKey="wip" stackId="1" stroke="#a855f7" fill="#7c3aed" fillOpacity={0.5} />
                    <Area type="monotone" dataKey="yield" stackId="2" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.35} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-6 rounded-[28px] border border-slate-800/80 bg-slate-950/50 p-5 text-sm text-slate-300">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-slate-50">Operations manager use case</p>
              <p className="mt-1 max-w-4xl leading-7 text-slate-300">
                This dashboard is now structured around three decisions: is the plant under control, will inventory support the plan, and where can sourcing break the system.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Material Spend</p>
                <p className="mt-1 text-xl font-semibold text-cyan-300">{formatMoney(summary.totalSpend)}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Materials Below ROP</p>
                <p className="mt-1 text-xl font-semibold text-amber-300">{summary.materialsBelowROP}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Warehouse Status</p>
                <p className="mt-1 text-xl font-semibold text-cyan-300"><Warehouse className="mr-2 inline h-4 w-4" />Live</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

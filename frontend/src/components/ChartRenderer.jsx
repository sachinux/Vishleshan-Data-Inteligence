import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, BarChart3, LineChart as LineIcon, PieChart as PieIcon, ScatterChart as ScatterIcon } from "lucide-react";

const CHART_COLORS = [
  "hsl(40, 100%, 50%)",   // Primary amber
  "hsl(160, 60%, 45%)",   // Teal
  "hsl(200, 70%, 50%)",   // Blue
  "hsl(280, 65%, 60%)",   // Purple
  "hsl(340, 75%, 55%)",   // Pink
  "hsl(30, 80%, 55%)",    // Orange
  "hsl(120, 50%, 45%)",   // Green
];

export const ChartRenderer = ({ config, data }) => {
  const [chartType, setChartType] = useState(config?.type || "bar");

  if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No data available for chart</p>
      </div>
    );
  }

  const chartData = data.data;
  const columns = data.columns || Object.keys(chartData[0] || {});
  
  // Determine x and y columns
  const xColumn = config?.x_column || columns[0];
  const yColumn = config?.y_column || columns[1] || columns[0];
  const colorBy = config?.color_by;

  // Get numeric columns for y-axis options
  const numericColumns = columns.filter((col) => {
    return chartData.some((row) => typeof row[col] === "number");
  });

  const chartTypes = [
    { value: "bar", label: "Bar", icon: BarChart3 },
    { value: "line", label: "Line", icon: LineIcon },
    { value: "pie", label: "Pie", icon: PieIcon },
    { value: "scatter", label: "Scatter", icon: ScatterIcon },
  ];

  const handleDownload = () => {
    // Create CSV
    const headers = columns.join(",");
    const rows = chartData.map((row) => columns.map((col) => row[col]).join(","));
    const csv = [headers, ...rows].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chart_data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3">
          <p className="font-mono text-xs text-primary mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs font-mono">
              <span className="text-muted-foreground">{entry.name}: </span>
              <span style={{ color: entry.color }}>
                {typeof entry.value === "number"
                  ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                  : entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey={xColumn}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey={yColumn} fill={CHART_COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey={xColumn}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey={yColumn}
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[0], r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={yColumn}
                nameKey={xColumn}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey={xColumn}
                type="number"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                name={xColumn}
              />
              <YAxis
                dataKey={yColumn}
                type="number"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                name={yColumn}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Scatter name="Data" data={chartData} fill={CHART_COLORS[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div data-testid="chart-renderer">
      {/* Chart Controls */}
      <div className="chart-controls flex items-center gap-3 mb-4">
        <div className="flex gap-1">
          {chartTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.value}
                variant={chartType === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType(type.value)}
                className="font-mono text-xs"
                data-testid={`chart-type-${type.value}`}
              >
                <Icon className="h-3 w-3" />
              </Button>
            );
          })}
        </div>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="font-mono text-xs"
          data-testid="download-chart-data"
        >
          <Download className="h-3 w-3 mr-1" />
          CSV
        </Button>
      </div>

      {/* Chart */}
      {renderChart()}
    </div>
  );
};

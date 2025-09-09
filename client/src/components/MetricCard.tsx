import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection: "up" | "down" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export default function MetricCard({ 
  title, 
  value, 
  trend, 
  trendDirection, 
  icon: Icon, 
  iconColor = "text-primary" 
}: MetricCardProps) {
  const trendColorClass = {
    up: "text-green-500",
    down: "text-red-500",
    neutral: "text-muted-foreground"
  }[trendDirection];

  return (
    <Card data-testid={`metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="text-2xl font-bold" data-testid={`metric-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        {trend && (
          <div className="flex items-center mt-2 text-sm">
            <span className={trendColorClass}>{trend}</span>
            <span className="text-muted-foreground ml-1">vs last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

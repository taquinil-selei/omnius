import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardMetrics } from "@shared/schema";

interface ArtifactDistributionProps {
  distribution: DashboardMetrics["artifactDistribution"];
}

export default function ArtifactDistribution({ distribution }: ArtifactDistributionProps) {
  return (
    <Card data-testid="artifact-distribution">
      <CardHeader>
        <CardTitle>Artifact Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {distribution.map((item, index) => (
            <div key={item.type} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm" data-testid={`artifact-type-${item.type.toLowerCase().replace(/\s+/g, '-')}`}>
                  {item.type}
                </span>
              </div>
              <span className="text-sm font-medium" data-testid={`artifact-count-${item.type.toLowerCase().replace(/\s+/g, '-')}`}>
                {item.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Finding } from "@shared/schema";

interface FindingsListProps {
  findings: Finding[];
  onViewAll?: () => void;
}

const getSeverityClass = (severity: string) => {
  switch (severity.toLowerCase()) {
    case "critical":
      return "severity-critical";
    case "high":
      return "severity-high";
    case "medium":
      return "severity-medium";
    case "low":
      return "severity-low";
    default:
      return "severity-low";
  }
};

export default function FindingsList({ findings, onViewAll }: FindingsListProps) {
  return (
    <Card className="lg:col-span-2" data-testid="findings-list">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Findings</CardTitle>
          {onViewAll && (
            <Button variant="link" onClick={onViewAll} data-testid="view-all-findings">
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {findings.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No findings to display
            </div>
          ) : (
            findings.map((finding) => (
              <div 
                key={finding.id} 
                className="p-6 hover:bg-accent/50"
                data-testid={`finding-${finding.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      finding.severity === "HIGH" ? "bg-red-500" :
                      finding.severity === "MEDIUM" ? "bg-amber-500" :
                      finding.severity === "CRITICAL" ? "bg-purple-500" :
                      "bg-blue-500"
                    }`} />
                    <div>
                      <h4 className="font-medium" data-testid={`finding-message-${finding.id}`}>
                        {finding.message}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Policy violation detected
                      </p>
                    </div>
                  </div>
                  <Badge className={getSeverityClass(finding.severity)} data-testid={`finding-severity-${finding.id}`}>
                    {finding.severity}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground ml-5">
                  <span>
                    {finding.artifactRefs && Array.isArray(finding.artifactRefs) && finding.artifactRefs.length > 0
                      ? `${finding.artifactRefs.length} artifacts affected`
                      : "No artifacts specified"
                    }
                  </span>
                  <span data-testid={`finding-date-${finding.id}`}>
                    {new Date(finding.createdAt).toRelativeString?.() || "Recently"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

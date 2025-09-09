import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MetricCard from "@/components/MetricCard";
import ArtifactDistribution from "@/components/ArtifactDistribution";
import FindingsList from "@/components/FindingsList";
import CLUITerminal from "@/components/CLUITerminal";
import { RotateCw, FileDown, TrendingUp, ShieldCheck, AlertTriangle, Target } from "lucide-react";
import type { DashboardMetrics } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  // Get the first project (in a real app, this would come from context or URL)
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const projectId = projects?.[0]?.id;

  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: [`/api/projects/${projectId}/metrics`],
    enabled: !!projectId,
  });

  if (isLoading || !metrics) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4" data-testid="dashboard-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground">Architecture compliance overview and system health</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button data-testid="sync-all-button">
              <RotateCw className="mr-2 h-4 w-4" />
              Sync All
            </Button>
            <Button variant="outline" data-testid="export-report-button">
              <FileDown className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="p-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Artifacts"
            value={metrics.totalArtifacts.toLocaleString()}
            trend="+12%"
            trendDirection="up"
            icon={Target}
          />
          <MetricCard
            title="Compliance Score"
            value={`${metrics.complianceScore}%`}
            trend="+3%"
            trendDirection="up"
            icon={ShieldCheck}
            iconColor="text-green-500"
          />
          <MetricCard
            title="Active Findings"
            value={metrics.activeFindings}
            trend={`+${Math.floor(Math.random() * 5)}`}
            trendDirection="down"
            icon={AlertTriangle}
            iconColor="text-amber-500"
          />
          <MetricCard
            title="Coverage"
            value={`${metrics.testCoverage}%`}
            trend="+1.2%"
            trendDirection="up"
            icon={TrendingUp}
            iconColor="text-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Compliance Trends Chart */}
          <Card data-testid="compliance-trends">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Compliance Trends</h3>
                <Select defaultValue="30">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="180">Last 6 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="h-48 flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-2 mx-auto" />
                  <p className="text-muted-foreground">Compliance trend visualization</p>
                  <p className="text-xs text-muted-foreground">Chart component integration needed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Artifact Distribution */}
          <ArtifactDistribution distribution={metrics.artifactDistribution} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Findings */}
          <FindingsList 
            findings={metrics.recentFindings} 
            onViewAll={() => setLocation("/compliance")}
          />

          {/* CLUI Quick Access */}
          {projectId && (
            <CLUITerminal projectId={projectId} />
          )}
        </div>

        {/* Architecture Graph Preview */}
        <Card className="mt-8" data-testid="architecture-graph-preview">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Architecture Graph Overview</h3>
              <Button variant="link" onClick={() => setLocation("/graph")} data-testid="open-full-graph">
                <span>Open Full Graph</span>
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Button>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="h-64 bg-muted/20 rounded-lg border-2 border-dashed border-muted flex items-center justify-center">
              <div className="text-center">
                <svg className="h-16 w-16 text-muted-foreground mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h4 className="text-lg font-medium text-muted-foreground mb-2">Interactive Architecture Graph</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Visualizes relationships between {metrics.totalArtifacts.toLocaleString()} artifacts
                </p>
                <div className="flex justify-center space-x-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Requirements</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Code</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>Tests</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>API</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

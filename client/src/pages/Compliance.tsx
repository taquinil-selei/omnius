import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, AlertTriangle, CheckCircle, Play, Filter, Plus, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import type { Finding, Policy } from "@shared/schema";

const getSeverityIcon = (severity: string) => {
  switch (severity.toLowerCase()) {
    case "critical":
      return "🔴";
    case "high":
      return "🟠";
    case "medium":
      return "🟡";
    case "low":
      return "🟢";
    default:
      return "⚪";
  }
};

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

export default function Compliance() {
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const { data: projects } = useQuery({ queryKey: ["/api/projects"] });
  const projectId = projects?.[0]?.id;

  const { data: findings, isLoading: findingsLoading } = useQuery<Finding[]>({
    queryKey: [`/api/projects/${projectId}/findings`],
    enabled: !!projectId,
  });

  const { data: policies } = useQuery<Policy[]>({
    queryKey: [`/api/projects/${projectId}/policies`],
    enabled: !!projectId,
  });

  const runComplianceCheck = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/compliance/check`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/findings`] });
    },
  });

  const filteredFindings = findings?.filter(finding => {
    const matchesSeverity = selectedSeverity === "all" || finding.severity === selectedSeverity;
    const matchesStatus = selectedStatus === "all" || finding.status === selectedStatus;
    return matchesSeverity && matchesStatus;
  });

  const findingsByStatus = {
    open: findings?.filter(f => f.status === "open").length || 0,
    acknowledged: findings?.filter(f => f.status === "acknowledged").length || 0,
    resolved: findings?.filter(f => f.status === "resolved").length || 0,
  };

  return (
    <>
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Compliance (SACC)</h2>
            <p className="text-muted-foreground">System Architecture Compliance Checking</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => runComplianceCheck.mutate()}
              disabled={runComplianceCheck.isPending}
              data-testid="run-compliance-check"
            >
              <Play className="mr-2 h-4 w-4" />
              {runComplianceCheck.isPending ? "Running..." : "Run Check"}
            </Button>
            <Button data-testid="add-policy">
              <Plus className="mr-2 h-4 w-4" />
              Add Policy
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="total-findings">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Findings</p>
                  <p className="text-2xl font-bold">{findings?.length || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="active-findings">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-red-600">{findingsByStatus.open}</p>
                </div>
                <Shield className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="resolved-findings">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{findingsByStatus.resolved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="active-policies">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Policies</p>
                  <p className="text-2xl font-bold">{policies?.filter(p => p.enabled).length || 0}</p>
                </div>
                <Settings className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="findings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="findings">Findings</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="findings" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Findings List */}
            <Card data-testid="findings-list">
              <CardHeader>
                <CardTitle>Compliance Findings</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {findingsLoading ? (
                  <div className="p-6">
                    <div className="animate-pulse space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-muted rounded"></div>
                      ))}
                    </div>
                  </div>
                ) : !filteredFindings?.length ? (
                  <div className="p-12 text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No compliance issues found</h3>
                    <p className="text-muted-foreground">
                      {selectedSeverity !== "all" || selectedStatus !== "all"
                        ? "Try adjusting your filters"
                        : "Your project is compliant with all configured policies"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredFindings.map((finding) => (
                      <div 
                        key={finding.id} 
                        className="p-6 hover:bg-accent/50"
                        data-testid={`finding-${finding.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-3">
                            <div className="text-lg">{getSeverityIcon(finding.severity)}</div>
                            <div className="flex-1">
                              <h4 className="font-medium">{finding.message}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Policy violation detected
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getSeverityClass(finding.severity)}>
                              {finding.severity}
                            </Badge>
                            <Badge variant={finding.status === "open" ? "destructive" : "secondary"}>
                              {finding.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground ml-8">
                          <span>
                            {finding.artifactRefs && Array.isArray(finding.artifactRefs) && finding.artifactRefs.length > 0
                              ? `${finding.artifactRefs.length} artifacts affected`
                              : "No artifacts specified"
                            }
                          </span>
                          <span>{new Date(finding.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex space-x-2 mt-3 ml-8">
                          <Button size="sm" variant="outline" data-testid={`view-finding-${finding.id}`}>
                            View Details
                          </Button>
                          {finding.status === "open" && (
                            <Button size="sm" variant="outline" data-testid={`resolve-finding-${finding.id}`}>
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-6">
            <Card data-testid="policies-list">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Compliance Policies</CardTitle>
                  <Button size="sm" data-testid="add-policy-tab">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Policy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!policies?.length ? (
                  <div className="text-center py-12">
                    <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No policies configured</h3>
                    <p className="text-muted-foreground">Add your first compliance policy to start monitoring</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {policies.map((policy) => (
                      <Card key={policy.id} data-testid={`policy-${policy.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="outline">{policy.scope}</Badge>
                                <Badge className={getSeverityClass(policy.severity)}>
                                  {policy.severity}
                                </Badge>
                                {policy.enabled ? (
                                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Disabled</Badge>
                                )}
                              </div>
                              <p className="text-sm">{policy.expression}</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" data-testid={`edit-policy-${policy.id}`}>
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" data-testid={`test-policy-${policy.id}`}>
                                Test
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card data-testid="compliance-reports">
              <CardHeader>
                <CardTitle>Compliance Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Report generation coming soon</h3>
                  <p className="text-muted-foreground">Automated compliance reports will be available in the next release</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

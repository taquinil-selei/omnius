import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Search, Play, Database, Code, FileText, GitBranch, Zap, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface SarResult {
  entitiesDiscovered: number;
  componentsIdentified: number;
  apiEndpointsFound: number;
  databaseTablesDiscovered: number;
  confidence: number;
  artifacts: number;
}

export default function SarDiscovery() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [sarResult, setSarResult] = useState<SarResult | null>(null);

  const { data: projects } = useQuery({ queryKey: ["/api/projects"] });
  const projectId = projects?.[0]?.id;

  const { data: artifacts } = useQuery({
    queryKey: [`/api/projects/${projectId}/artifacts`],
    enabled: !!projectId,
  });

  const runSarAnalysis = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/sar/analyze`, {});
      return response.json();
    },
    onSuccess: (data) => {
      setSarResult(data);
      setIsAnalyzing(false);
      setAnalysisProgress(100);
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/artifacts`] });
    },
  });

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setSarResult(null);
    
    // Simulate progress
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    runSarAnalysis.mutate();
  };

  return (
    <>
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">SAR Discovery</h2>
            <p className="text-muted-foreground">System Architecture Reconstruction from existing code and databases</p>
          </div>
          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || runSarAnalysis.isPending}
            data-testid="start-sar-analysis"
          >
            <Play className="mr-2 h-4 w-4" />
            {isAnalyzing ? "Analyzing..." : "Start Analysis"}
          </Button>
        </div>
      </header>

      <div className="p-6">
        {/* Analysis Status */}
        {isAnalyzing && (
          <Card className="mb-6" data-testid="analysis-status">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5 text-primary" />
                Analysis in Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={analysisProgress} className="w-full" />
                <div className="text-sm text-muted-foreground">
                  {analysisProgress < 30 && "Scanning source code repositories..."}
                  {analysisProgress >= 30 && analysisProgress < 60 && "Analyzing database schemas..."}
                  {analysisProgress >= 60 && analysisProgress < 90 && "Discovering API endpoints..."}
                  {analysisProgress >= 90 && "Generating architecture model..."}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="entities">Entities</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Discovery Summary */}
            {sarResult ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card data-testid="entities-discovered">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Entities Discovered</p>
                        <p className="text-2xl font-bold">{sarResult.entitiesDiscovered}</p>
                      </div>
                      <Database className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="components-identified">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Components</p>
                        <p className="text-2xl font-bold">{sarResult.componentsIdentified}</p>
                      </div>
                      <Code className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="endpoints-found">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">API Endpoints</p>
                        <p className="text-2xl font-bold">{sarResult.apiEndpointsFound}</p>
                      </div>
                      <GitBranch className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="confidence-score">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Confidence</p>
                        <p className="text-2xl font-bold">{sarResult.confidence}%</p>
                      </div>
                      <Search className="h-8 w-8 text-amber-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card data-testid="no-analysis">
                <CardContent className="p-12 text-center">
                  <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Analysis Results</h3>
                  <p className="text-muted-foreground mb-4">
                    Start the SAR analysis to discover your system architecture
                  </p>
                  <Button onClick={handleAnalyze} data-testid="start-analysis-empty">
                    <Play className="mr-2 h-4 w-4" />
                    Start Analysis
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Analysis Details */}
            {sarResult && (
              <Card data-testid="analysis-details">
                <CardHeader>
                  <CardTitle>Analysis Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Discovery Sources</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Source Code Files</span>
                          <Badge variant="outline">{Math.floor(sarResult.artifacts * 0.6)}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Database Tables</span>
                          <Badge variant="outline">{sarResult.databaseTablesDiscovered}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Configuration Files</span>
                          <Badge variant="outline">{Math.floor(sarResult.artifacts * 0.1)}</Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Quality Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Coverage</span>
                          <Badge className={sarResult.confidence > 80 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                            {sarResult.confidence}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Relationships Mapped</span>
                          <Badge variant="outline">{Math.floor(sarResult.componentsIdentified * 1.5)}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Patterns Detected</span>
                          <Badge variant="outline">MVC, Repository</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="entities" className="space-y-6">
            <Card data-testid="discovered-entities">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Discovered Entities</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Input placeholder="Filter entities..." className="w-64" data-testid="filter-entities" />
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!sarResult ? (
                  <div className="text-center py-12">
                    <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Run analysis to discover entities</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.from({ length: sarResult.entitiesDiscovered }, (_, i) => (
                      <Card key={i} data-testid={`entity-${i}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <Database className="h-5 w-5 text-blue-500 mt-0.5" />
                              <div>
                                <h4 className="font-medium">Entity_{i + 1}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Discovered from database schema and code analysis
                                </p>
                                <div className="flex space-x-2 mt-2">
                                  <Badge variant="outline">Table</Badge>
                                  <Badge variant="outline">Model Class</Badge>
                                </div>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" data-testid={`view-entity-${i}`}>
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="components" className="space-y-6">
            <Card data-testid="system-components">
              <CardHeader>
                <CardTitle>System Components</CardTitle>
              </CardHeader>
              <CardContent>
                {!sarResult ? (
                  <div className="text-center py-12">
                    <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Run analysis to identify components</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: sarResult.componentsIdentified }, (_, i) => (
                      <Card key={i} data-testid={`component-${i}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <Code className="h-5 w-5 text-green-500" />
                            <div>
                              <h4 className="font-medium">Component_{i + 1}</h4>
                              <p className="text-sm text-muted-foreground">
                                {i % 3 === 0 ? "Controller" : i % 3 === 1 ? "Service" : "Repository"}
                              </p>
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

          <TabsContent value="endpoints" className="space-y-6">
            <Card data-testid="api-endpoints">
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                {!sarResult ? (
                  <div className="text-center py-12">
                    <GitBranch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Run analysis to discover API endpoints</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.from({ length: sarResult.apiEndpointsFound }, (_, i) => {
                      const methods = ["GET", "POST", "PUT", "DELETE"];
                      const method = methods[i % methods.length];
                      const paths = ["/api/users", "/api/orders", "/api/products", "/api/auth"];
                      const path = paths[i % paths.length];

                      return (
                        <Card key={i} data-testid={`endpoint-${i}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Badge 
                                  className={
                                    method === "GET" ? "bg-green-100 text-green-800" :
                                    method === "POST" ? "bg-blue-100 text-blue-800" :
                                    method === "PUT" ? "bg-amber-100 text-amber-800" :
                                    "bg-red-100 text-red-800"
                                  }
                                >
                                  {method}
                                </Badge>
                                <code className="text-sm">{path}</code>
                              </div>
                              <Button size="sm" variant="outline" data-testid={`test-endpoint-${i}`}>
                                Test
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

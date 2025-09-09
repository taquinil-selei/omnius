import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Plus, RefreshCw, CheckCircle, AlertCircle, Play, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import type { Integration } from "@shared/schema";

const cicdPlatforms = [
  { id: "github-actions", name: "GitHub Actions", icon: "🐙" },
  { id: "gitlab-ci", name: "GitLab CI/CD", icon: "🦊" },
  { id: "jenkins", name: "Jenkins", icon: "🤖" },
  { id: "azure-devops", name: "Azure DevOps", icon: "☁️" },
  { id: "circleci", name: "CircleCI", icon: "⭕" },
];

export default function CicdIntegration() {
  const [pipelineConfig, setPipelineConfig] = useState({
    platform: "",
    name: "",
    url: "",
    token: "",
    webhook: "",
    complianceChecks: true,
    autoGenerate: false,
  });

  const { data: projects } = useQuery({ queryKey: ["/api/projects"] });
  const projectId = projects?.[0]?.id;

  const { data: integrations, isLoading } = useQuery<Integration[]>({
    queryKey: [`/api/projects/${projectId}/integrations`],
    enabled: !!projectId,
  });

  const addIntegration = useMutation({
    mutationFn: async (config: any) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/integrations`, config);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/integrations`] });
      setPipelineConfig({
        platform: "",
        name: "",
        url: "",
        token: "",
        webhook: "",
        complianceChecks: true,
        autoGenerate: false,
      });
    },
  });

  const triggerPipeline = useMutation({
    mutationFn: async (integrationId: string) => {
      // In a real implementation, this would trigger the CI/CD pipeline
      return new Promise(resolve => setTimeout(() => resolve({ success: true }), 2000));
    },
  });

  const cicdIntegrations = integrations?.filter(i => i.type === "cicd") || [];

  const handleAddPipeline = () => {
    if (!pipelineConfig.platform || !pipelineConfig.name) return;

    addIntegration.mutate({
      type: "cicd",
      name: pipelineConfig.name,
      config: {
        ...pipelineConfig,
      }
    });
  };

  const handleTriggerPipeline = (integrationId: string) => {
    triggerPipeline.mutate(integrationId);
  };

  const getPipelineStatus = () => {
    // Mock pipeline status
    const statuses = ["success", "running", "failed", "pending"];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "running":
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <>
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">CI/CD Integration</h2>
            <p className="text-muted-foreground">Connect and monitor CI/CD pipelines</p>
          </div>
          <Button 
            onClick={handleAddPipeline}
            disabled={!pipelineConfig.platform || !pipelineConfig.name || addIntegration.isPending}
            data-testid="add-pipeline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Pipeline
          </Button>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="pipelines" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
            <TabsTrigger value="gates">Quality Gates</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="pipelines" className="space-y-6">
            {/* Add Pipeline */}
            <Card data-testid="add-pipeline-form">
              <CardHeader>
                <CardTitle>Add CI/CD Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Platform</label>
                    <Select 
                      value={pipelineConfig.platform} 
                      onValueChange={(value) => setPipelineConfig(prev => ({ ...prev, platform: value }))}
                    >
                      <SelectTrigger data-testid="platform-select">
                        <SelectValue placeholder="Select CI/CD platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {cicdPlatforms.map((platform) => (
                          <SelectItem key={platform.id} value={platform.id}>
                            {platform.icon} {platform.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Pipeline Name</label>
                    <Input
                      placeholder="main-pipeline"
                      value={pipelineConfig.name}
                      onChange={(e) => setPipelineConfig(prev => ({ ...prev, name: e.target.value }))}
                      data-testid="pipeline-name-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Pipeline URL</label>
                    <Input
                      placeholder="https://github.com/user/repo/actions"
                      value={pipelineConfig.url}
                      onChange={(e) => setPipelineConfig(prev => ({ ...prev, url: e.target.value }))}
                      data-testid="pipeline-url-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Access Token</label>
                    <Input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxx"
                      value={pipelineConfig.token}
                      onChange={(e) => setPipelineConfig(prev => ({ ...prev, token: e.target.value }))}
                      data-testid="access-token-input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Webhook URL</label>
                    <Input
                      placeholder="https://api.example.com/webhooks/cicd"
                      value={pipelineConfig.webhook}
                      onChange={(e) => setPipelineConfig(prev => ({ ...prev, webhook: e.target.value }))}
                      data-testid="webhook-url-input"
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="compliance-checks"
                      checked={pipelineConfig.complianceChecks}
                      onChange={(e) => setPipelineConfig(prev => ({ ...prev, complianceChecks: e.target.checked }))}
                      data-testid="compliance-checks-checkbox"
                    />
                    <label htmlFor="compliance-checks" className="text-sm">Enable compliance checks in pipeline</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-generate"
                      checked={pipelineConfig.autoGenerate}
                      onChange={(e) => setPipelineConfig(prev => ({ ...prev, autoGenerate: e.target.checked }))}
                      data-testid="auto-generate-checkbox"
                    />
                    <label htmlFor="auto-generate" className="text-sm">Auto-generate pipeline configuration</label>
                  </div>
                </div>

                <Button 
                  onClick={handleAddPipeline}
                  disabled={!pipelineConfig.platform || !pipelineConfig.name || addIntegration.isPending}
                  className="mt-6"
                  data-testid="add-pipeline-button"
                >
                  {addIntegration.isPending ? "Adding..." : "Add Pipeline"}
                </Button>
              </CardContent>
            </Card>

            {/* Connected Pipelines */}
            <Card data-testid="connected-pipelines">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Connected Pipelines ({cicdIntegrations.length})</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/integrations`] })}
                    data-testid="refresh-pipelines"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : cicdIntegrations.length === 0 ? (
                  <div className="text-center py-12">
                    <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No pipelines connected</h3>
                    <p className="text-muted-foreground">Connect your first CI/CD pipeline to enable automated compliance checks</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cicdIntegrations.map((integration) => {
                      const config = integration.config as any;
                      const platform = cicdPlatforms.find(p => p.id === config.platform);
                      const status = getPipelineStatus();
                      
                      return (
                        <Card key={integration.id} data-testid={`pipeline-${integration.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <div className="text-2xl mt-0.5">{platform?.icon || "⚙️"}</div>
                                <div className="flex-1">
                                  <h4 className="font-medium">{integration.name}</h4>
                                  <p className="text-sm text-muted-foreground">{platform?.name}</p>
                                  <div className="flex items-center space-x-4 mt-2">
                                    <div className="flex items-center space-x-1">
                                      {getStatusIcon(status)}
                                      <span className="text-xs text-muted-foreground capitalize">{status}</span>
                                    </div>
                                    {config.complianceChecks && (
                                      <Badge variant="outline">Compliance Enabled</Badge>
                                    )}
                                    <div className="flex items-center space-x-1">
                                      <span className="text-xs text-muted-foreground">
                                        Last run: 2 hours ago
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleTriggerPipeline(integration.id)}
                                  disabled={triggerPipeline.isPending}
                                  data-testid={`trigger-pipeline-${integration.id}`}
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  {triggerPipeline.isPending ? "Running..." : "Run"}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  data-testid={`configure-pipeline-${integration.id}`}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </div>
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

          <TabsContent value="gates" className="space-y-6">
            <Card data-testid="quality-gates">
              <CardHeader>
                <CardTitle>Quality Gates Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Quality Gates</h3>
                  <p className="text-muted-foreground">Configure compliance checks and quality gates for your pipelines</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card data-testid="pipeline-templates">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pipeline Templates</CardTitle>
                  <Button size="sm" data-testid="add-template">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Pipeline Templates</h3>
                  <p className="text-muted-foreground">Create reusable pipeline configurations with compliance checks</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

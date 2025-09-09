import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitBranch, Plus, Settings, RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import type { Integration } from "@shared/schema";

export default function GitIntegration() {
  const [newRepoUrl, setNewRepoUrl] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("main");

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
      setNewRepoUrl("");
    },
  });

  const syncRepository = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await apiRequest("PUT", `/api/integrations/${integrationId}`, {
        lastSync: new Date().toISOString()
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/integrations`] });
    },
  });

  const gitIntegrations = integrations?.filter(i => i.type === "git") || [];

  const handleAddRepository = () => {
    if (!newRepoUrl.trim()) return;

    addIntegration.mutate({
      type: "git",
      name: newRepoUrl.split("/").pop()?.replace(".git", "") || "Repository",
      config: {
        url: newRepoUrl,
        branch: selectedBranch,
        autoSync: true,
        webhookEnabled: false,
      }
    });
  };

  const handleSync = (integrationId: string) => {
    syncRepository.mutate(integrationId);
  };

  const getSyncStatus = (integration: Integration) => {
    if (!integration.lastSync) return "never";
    
    const lastSyncTime = new Date(integration.lastSync).getTime();
    const now = Date.now();
    const hoursSinceSync = (now - lastSyncTime) / (1000 * 60 * 60);
    
    if (hoursSinceSync < 1) return "recent";
    if (hoursSinceSync < 24) return "stale";
    return "outdated";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "recent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "stale":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "outdated":
      case "never":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <>
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Git Integration</h2>
            <p className="text-muted-foreground">Connect and sync with Git repositories</p>
          </div>
          <Button 
            onClick={handleAddRepository}
            disabled={!newRepoUrl.trim() || addIntegration.isPending}
            data-testid="add-repository"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Repository
          </Button>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="repositories" className="space-y-6">
          <TabsList>
            <TabsTrigger value="repositories">Repositories</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="repositories" className="space-y-6">
            {/* Add Repository */}
            <Card data-testid="add-repository-form">
              <CardHeader>
                <CardTitle>Add New Repository</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <Input
                    placeholder="https://github.com/user/repository.git"
                    value={newRepoUrl}
                    onChange={(e) => setNewRepoUrl(e.target.value)}
                    className="flex-1"
                    data-testid="repository-url-input"
                  />
                  <Input
                    placeholder="Branch (main)"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-32"
                    data-testid="branch-input"
                  />
                  <Button 
                    onClick={handleAddRepository}
                    disabled={!newRepoUrl.trim() || addIntegration.isPending}
                    data-testid="add-repo-button"
                  >
                    {addIntegration.isPending ? "Adding..." : "Add"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Connected Repositories */}
            <Card data-testid="connected-repositories">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Connected Repositories ({gitIntegrations.length})</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/integrations`] })}
                    data-testid="refresh-repos"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : gitIntegrations.length === 0 ? (
                  <div className="text-center py-12">
                    <GitBranch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No repositories connected</h3>
                    <p className="text-muted-foreground">Add your first Git repository to start syncing artifacts</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {gitIntegrations.map((integration) => {
                      const config = integration.config as any;
                      const syncStatus = getSyncStatus(integration);
                      
                      return (
                        <Card key={integration.id} data-testid={`repository-${integration.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <GitBranch className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div className="flex-1">
                                  <h4 className="font-medium">{integration.name}</h4>
                                  <p className="text-sm text-muted-foreground">{config.url}</p>
                                  <div className="flex items-center space-x-4 mt-2">
                                    <div className="flex items-center space-x-1">
                                      <Badge variant="outline">Branch: {config.branch}</Badge>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      {getStatusIcon(syncStatus)}
                                      <span className="text-xs text-muted-foreground">
                                        {integration.lastSync 
                                          ? `Synced ${new Date(integration.lastSync).toRelativeString?.() || "recently"}`
                                          : "Never synced"
                                        }
                                      </span>
                                    </div>
                                    {integration.enabled && (
                                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleSync(integration.id)}
                                  disabled={syncRepository.isPending}
                                  data-testid={`sync-repo-${integration.id}`}
                                >
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  {syncRepository.isPending ? "Syncing..." : "Sync"}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  data-testid={`configure-repo-${integration.id}`}
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

          <TabsContent value="settings" className="space-y-6">
            <Card data-testid="git-settings">
              <CardHeader>
                <CardTitle>Git Integration Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Sync Configuration</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-sync frequency</p>
                        <p className="text-sm text-muted-foreground">How often to check for repository updates</p>
                      </div>
                      <select className="border border-border rounded px-3 py-2" data-testid="sync-frequency">
                        <option value="5">Every 5 minutes</option>
                        <option value="15">Every 15 minutes</option>
                        <option value="60">Every hour</option>
                        <option value="0">Manual only</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Deep analysis</p>
                        <p className="text-sm text-muted-foreground">Analyze file content for artifacts</p>
                      </div>
                      <input type="checkbox" defaultChecked data-testid="deep-analysis-checkbox" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Track file changes</p>
                        <p className="text-sm text-muted-foreground">Monitor individual file modifications</p>
                      </div>
                      <input type="checkbox" defaultChecked data-testid="track-changes-checkbox" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">File Filters</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium">Include patterns</label>
                      <Input placeholder="*.java, *.ts, *.md" data-testid="include-patterns" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Exclude patterns</label>
                      <Input placeholder="node_modules/, *.log, dist/" data-testid="exclude-patterns" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <Card data-testid="webhook-settings">
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Webhook Integration</h3>
                  <p className="text-muted-foreground">Configure webhooks for real-time repository updates</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

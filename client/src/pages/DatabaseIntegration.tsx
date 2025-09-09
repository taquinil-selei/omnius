import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Plus, RefreshCw, CheckCircle, AlertCircle, Settings, Table } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import type { Integration } from "@shared/schema";

const databaseTypes = [
  { id: "postgresql", name: "PostgreSQL", port: 5432 },
  { id: "mysql", name: "MySQL", port: 3306 },
  { id: "mongodb", name: "MongoDB", port: 27017 },
  { id: "sqlserver", name: "SQL Server", port: 1433 },
  { id: "oracle", name: "Oracle", port: 1521 },
];

export default function DatabaseIntegration() {
  const [dbConfig, setDbConfig] = useState({
    type: "",
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
    ssl: false,
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
      setDbConfig({
        type: "",
        host: "",
        port: "",
        database: "",
        username: "",
        password: "",
        ssl: false,
      });
    },
  });

  const testConnection = useMutation({
    mutationFn: async (config: any) => {
      // In a real implementation, this would test the database connection
      return new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000));
    },
  });

  const syncDatabase = useMutation({
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

  const databaseIntegrations = integrations?.filter(i => i.type === "database") || [];

  const handleAddDatabase = () => {
    if (!dbConfig.type || !dbConfig.host || !dbConfig.database) return;

    addIntegration.mutate({
      type: "database",
      name: `${dbConfig.database} (${dbConfig.type})`,
      config: {
        ...dbConfig,
        connectionString: `${dbConfig.type}://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`,
      }
    });
  };

  const handleTestConnection = () => {
    testConnection.mutate(dbConfig);
  };

  const handleTypeChange = (type: string) => {
    const dbType = databaseTypes.find(db => db.id === type);
    setDbConfig(prev => ({
      ...prev,
      type,
      port: dbType?.port.toString() || "",
    }));
  };

  return (
    <>
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Database Integration</h2>
            <p className="text-muted-foreground">Connect and analyze database schemas</p>
          </div>
          <Button 
            onClick={handleAddDatabase}
            disabled={!dbConfig.type || !dbConfig.host || addIntegration.isPending}
            data-testid="add-database"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Database
          </Button>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="databases" className="space-y-6">
          <TabsList>
            <TabsTrigger value="databases">Databases</TabsTrigger>
            <TabsTrigger value="schema">Schema Analysis</TabsTrigger>
            <TabsTrigger value="migration">Migration Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="databases" className="space-y-6">
            {/* Add Database */}
            <Card data-testid="add-database-form">
              <CardHeader>
                <CardTitle>Add Database Connection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Database Type</label>
                    <Select value={dbConfig.type} onValueChange={handleTypeChange}>
                      <SelectTrigger data-testid="database-type-select">
                        <SelectValue placeholder="Select database type" />
                      </SelectTrigger>
                      <SelectContent>
                        {databaseTypes.map((db) => (
                          <SelectItem key={db.id} value={db.id}>
                            {db.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Host</label>
                    <Input
                      placeholder="localhost"
                      value={dbConfig.host}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, host: e.target.value }))}
                      data-testid="database-host-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Port</label>
                    <Input
                      placeholder="5432"
                      value={dbConfig.port}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, port: e.target.value }))}
                      data-testid="database-port-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Database Name</label>
                    <Input
                      placeholder="myapp_db"
                      value={dbConfig.database}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, database: e.target.value }))}
                      data-testid="database-name-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Username</label>
                    <Input
                      placeholder="user"
                      value={dbConfig.username}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, username: e.target.value }))}
                      data-testid="database-username-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      placeholder="password"
                      value={dbConfig.password}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, password: e.target.value }))}
                      data-testid="database-password-input"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <input
                    type="checkbox"
                    id="ssl-enabled"
                    checked={dbConfig.ssl}
                    onChange={(e) => setDbConfig(prev => ({ ...prev, ssl: e.target.checked }))}
                    data-testid="ssl-checkbox"
                  />
                  <label htmlFor="ssl-enabled" className="text-sm">Enable SSL</label>
                </div>

                <div className="flex space-x-2 mt-6">
                  <Button 
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={!dbConfig.host || testConnection.isPending}
                    data-testid="test-connection"
                  >
                    {testConnection.isPending ? "Testing..." : "Test Connection"}
                  </Button>
                  <Button 
                    onClick={handleAddDatabase}
                    disabled={!dbConfig.type || !dbConfig.host || addIntegration.isPending}
                    data-testid="add-db-button"
                  >
                    {addIntegration.isPending ? "Adding..." : "Add Database"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Connected Databases */}
            <Card data-testid="connected-databases">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Connected Databases ({databaseIntegrations.length})</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/integrations`] })}
                    data-testid="refresh-databases"
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
                ) : databaseIntegrations.length === 0 ? (
                  <div className="text-center py-12">
                    <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No databases connected</h3>
                    <p className="text-muted-foreground">Connect your first database to start schema analysis</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {databaseIntegrations.map((integration) => {
                      const config = integration.config as any;
                      
                      return (
                        <Card key={integration.id} data-testid={`database-${integration.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <Database className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div className="flex-1">
                                  <h4 className="font-medium">{integration.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {config.host}:{config.port}/{config.database}
                                  </p>
                                  <div className="flex items-center space-x-4 mt-2">
                                    <Badge variant="outline">{config.type}</Badge>
                                    {config.ssl && <Badge variant="outline">SSL</Badge>}
                                    <div className="flex items-center space-x-1">
                                      {integration.lastSync ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <AlertCircle className="h-4 w-4 text-amber-500" />
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        {integration.lastSync 
                                          ? `Synced ${new Date(integration.lastSync).toRelativeString?.() || "recently"}`
                                          : "Never synced"
                                        }
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => syncDatabase.mutate(integration.id)}
                                  disabled={syncDatabase.isPending}
                                  data-testid={`sync-db-${integration.id}`}
                                >
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Sync
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  data-testid={`configure-db-${integration.id}`}
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

          <TabsContent value="schema" className="space-y-6">
            <Card data-testid="schema-analysis">
              <CardHeader>
                <CardTitle>Schema Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Table className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Schema Analysis Tools</h3>
                  <p className="text-muted-foreground">Analyze database schemas and generate entity models</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="migration" className="space-y-6">
            <Card data-testid="migration-tools">
              <CardHeader>
                <CardTitle>Migration Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Database Migration</h3>
                  <p className="text-muted-foreground">Generate and manage database migration scripts</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, FileText, Database, TestTube, Download, Play, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const scaffoldTypes = [
  { id: "worker", name: "Microservice Worker", icon: Code, description: "Generate a complete microservice worker with basic CRUD operations" },
  { id: "db-migration", name: "Database Migration", icon: Database, description: "Create database migration scripts from entity models" },
  { id: "api-client", name: "API Client", icon: FileText, description: "Generate type-safe API client from OpenAPI specification" },
  { id: "test-suite", name: "Test Suite", icon: TestTube, description: "Create comprehensive test cases for existing components" },
];

export default function CodeGeneration() {
  const [selectedType, setSelectedType] = useState<string>("");
  const [generationConfig, setGenerationConfig] = useState({
    entityName: "",
    outputPath: "",
    framework: "",
    includeTests: true,
    includeDocumentation: true,
  });

  const { data: projects } = useQuery({ queryKey: ["/api/projects"] });
  const projectId = projects?.[0]?.id;

  const { data: artifacts } = useQuery({
    queryKey: [`/api/projects/${projectId}/artifacts`],
    enabled: !!projectId,
  });

  const generateScaffold = useMutation({
    mutationFn: async (config: any) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/generate`, config);
      return response.json();
    },
  });

  const handleGenerate = () => {
    if (!selectedType) return;
    
    generateScaffold.mutate({
      type: selectedType,
      ...generationConfig,
    });
  };

  const modelArtifacts = artifacts?.filter(a => a.type === "ModelElement") || [];
  const apiArtifacts = artifacts?.filter(a => a.type === "API Contract") || [];

  return (
    <>
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Code Generation</h2>
            <p className="text-muted-foreground">Generate scaffolds, migrations, and boilerplate code</p>
          </div>
          <Button 
            onClick={handleGenerate}
            disabled={!selectedType || generateScaffold.isPending}
            data-testid="generate-code"
          >
            <Play className="mr-2 h-4 w-4" />
            {generateScaffold.isPending ? "Generating..." : "Generate"}
          </Button>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="scaffold" className="space-y-6">
          <TabsList>
            <TabsTrigger value="scaffold">Scaffold Generator</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="history">Generation History</TabsTrigger>
          </TabsList>

          <TabsContent value="scaffold" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Scaffold Type Selection */}
              <Card className="lg:col-span-2" data-testid="scaffold-types">
                <CardHeader>
                  <CardTitle>Select Scaffold Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scaffoldTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = selectedType === type.id;
                      
                      return (
                        <Card 
                          key={type.id}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "border-primary bg-primary/5" : "hover:bg-accent/50"
                          }`}
                          onClick={() => setSelectedType(type.id)}
                          data-testid={`scaffold-type-${type.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <Icon className={`h-6 w-6 mt-0.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                              <div className="flex-1">
                                <h4 className="font-medium">{type.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Configuration Panel */}
              <Card data-testid="generation-config">
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedType && (
                    <>
                      <div>
                        <label className="text-sm font-medium">Entity/Component Name</label>
                        <Input
                          value={generationConfig.entityName}
                          onChange={(e) => setGenerationConfig(prev => ({ ...prev, entityName: e.target.value }))}
                          placeholder="e.g., User, Order, Product"
                          data-testid="entity-name-input"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Output Path</label>
                        <Input
                          value={generationConfig.outputPath}
                          onChange={(e) => setGenerationConfig(prev => ({ ...prev, outputPath: e.target.value }))}
                          placeholder="src/services/"
                          data-testid="output-path-input"
                        />
                      </div>

                      {selectedType === "worker" && (
                        <div>
                          <label className="text-sm font-medium">Framework</label>
                          <Select 
                            value={generationConfig.framework} 
                            onValueChange={(value) => setGenerationConfig(prev => ({ ...prev, framework: value }))}
                          >
                            <SelectTrigger data-testid="framework-select">
                              <SelectValue placeholder="Select framework" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="spring-boot">Spring Boot</SelectItem>
                              <SelectItem value="express">Express.js</SelectItem>
                              <SelectItem value="fastapi">FastAPI</SelectItem>
                              <SelectItem value="django">Django</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="include-tests"
                            checked={generationConfig.includeTests}
                            onChange={(e) => setGenerationConfig(prev => ({ ...prev, includeTests: e.target.checked }))}
                            data-testid="include-tests-checkbox"
                          />
                          <label htmlFor="include-tests" className="text-sm">Include test files</label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="include-docs"
                            checked={generationConfig.includeDocumentation}
                            onChange={(e) => setGenerationConfig(prev => ({ ...prev, includeDocumentation: e.target.checked }))}
                            data-testid="include-docs-checkbox"
                          />
                          <label htmlFor="include-docs" className="text-sm">Include documentation</label>
                        </div>
                      </div>
                    </>
                  )}

                  {!selectedType && (
                    <div className="text-center py-8">
                      <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Select a scaffold type to configure generation options</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Source Artifacts */}
            <Card data-testid="source-artifacts">
              <CardHeader>
                <CardTitle>Source Artifacts</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="models">
                  <TabsList>
                    <TabsTrigger value="models">Data Models ({modelArtifacts.length})</TabsTrigger>
                    <TabsTrigger value="apis">API Contracts ({apiArtifacts.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="models" className="mt-4">
                    {modelArtifacts.length === 0 ? (
                      <div className="text-center py-8">
                        <Database className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No data models found. Import or create models to use as generation sources.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {modelArtifacts.map((artifact) => (
                          <Card key={artifact.id} className="cursor-pointer hover:bg-accent/50" data-testid={`model-${artifact.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{artifact.locator}</h4>
                                  <p className="text-sm text-muted-foreground">{artifact.origin}</p>
                                </div>
                                <input type="checkbox" data-testid={`select-model-${artifact.id}`} />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="apis" className="mt-4">
                    {apiArtifacts.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No API contracts found. Import OpenAPI specifications to generate client code.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {apiArtifacts.map((artifact) => (
                          <Card key={artifact.id} className="cursor-pointer hover:bg-accent/50" data-testid={`api-${artifact.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{artifact.locator}</h4>
                                  <p className="text-sm text-muted-foreground">{artifact.origin}</p>
                                </div>
                                <input type="checkbox" data-testid={`select-api-${artifact.id}`} />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card data-testid="code-templates">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Code Templates</CardTitle>
                  <Button size="sm" data-testid="add-template">
                    <FileText className="mr-2 h-4 w-4" />
                    Add Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Custom Templates</h3>
                  <p className="text-muted-foreground">Create and manage custom code generation templates</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card data-testid="generation-history">
              <CardHeader>
                <CardTitle>Generation History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Generation History</h3>
                  <p className="text-muted-foreground">Generated code artifacts will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

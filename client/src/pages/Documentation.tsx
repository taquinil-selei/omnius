import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Eye, Settings, Book, ExternalLink, RefreshCw } from "lucide-react";

const exportFormats = [
  { id: "html", name: "HTML", description: "Interactive web documentation" },
  { id: "pdf", name: "PDF", description: "Print-ready document" },
  { id: "markdown", name: "Markdown", description: "Developer-friendly format" },
  { id: "confluence", name: "Confluence", description: "Wiki pages export" },
];

const documentTypes = [
  { id: "requirements", name: "Requirements Document", icon: FileText },
  { id: "architecture", name: "Architecture Overview", icon: Book },
  { id: "api", name: "API Documentation", icon: ExternalLink },
  { id: "deployment", name: "Deployment Guide", icon: Settings },
];

export default function Documentation() {
  const [selectedFormat, setSelectedFormat] = useState("html");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const { data: projects } = useQuery({ queryKey: ["/api/projects"] });
  const projectId = projects?.[0]?.id;

  const { data: artifacts } = useQuery({
    queryKey: [`/api/projects/${projectId}/artifacts`],
    enabled: !!projectId,
  });

  const requirementArtifacts = artifacts?.filter(a => a.type === "Requirements") || [];
  const apiArtifacts = artifacts?.filter(a => a.type === "API Contract") || [];

  const handleExport = () => {
    // In a real implementation, this would trigger the documentation export
    console.log("Exporting documentation:", { format: selectedFormat, types: selectedTypes });
  };

  const toggleDocumentType = (typeId: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  return (
    <>
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Documentation</h2>
            <p className="text-muted-foreground">Generate and export living documentation from artifacts</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" data-testid="refresh-docs">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleExport} data-testid="export-documentation">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList>
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Document Configuration */}
              <Card className="lg:col-span-2" data-testid="document-config">
                <CardHeader>
                  <CardTitle>Document Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Document Types */}
                  <div>
                    <h4 className="font-medium mb-3">Document Types</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {documentTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = selectedTypes.includes(type.id);
                        
                        return (
                          <Card 
                            key={type.id}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "border-primary bg-primary/5" : "hover:bg-accent/50"
                            }`}
                            onClick={() => toggleDocumentType(type.id)}
                            data-testid={`doc-type-${type.id}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                <span className="font-medium">{type.name}</span>
                                {isSelected && (
                                  <Badge className="ml-auto">Selected</Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Export Format */}
                  <div>
                    <h4 className="font-medium mb-3">Export Format</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {exportFormats.map((format) => (
                        <Card 
                          key={format.id}
                          className={`cursor-pointer transition-colors ${
                            selectedFormat === format.id ? "border-primary bg-primary/5" : "hover:bg-accent/50"
                          }`}
                          onClick={() => setSelectedFormat(format.id)}
                          data-testid={`format-${format.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-medium">{format.name}</h5>
                                <p className="text-sm text-muted-foreground">{format.description}</p>
                              </div>
                              {selectedFormat === format.id && (
                                <Badge>Selected</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Export Options */}
              <Card data-testid="export-options">
                <CardHeader>
                  <CardTitle>Export Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Document Title</label>
                    <Input 
                      placeholder="Project Documentation" 
                      data-testid="document-title"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Version</label>
                    <Input 
                      placeholder="v1.0.0" 
                      data-testid="document-version"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Author</label>
                    <Input 
                      placeholder="Development Team" 
                      data-testid="document-author"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="include-toc"
                        defaultChecked
                        data-testid="include-toc-checkbox"
                      />
                      <label htmlFor="include-toc" className="text-sm">Include table of contents</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="include-diagrams"
                        defaultChecked
                        data-testid="include-diagrams-checkbox"
                      />
                      <label htmlFor="include-diagrams" className="text-sm">Include diagrams</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="include-metadata"
                        data-testid="include-metadata-checkbox"
                      />
                      <label htmlFor="include-metadata" className="text-sm">Include artifact metadata</label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Source Artifacts Summary */}
            <Card data-testid="source-summary">
              <CardHeader>
                <CardTitle>Source Artifacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{requirementArtifacts.length}</div>
                    <div className="text-sm text-muted-foreground">Requirements</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{apiArtifacts.length}</div>
                    <div className="text-sm text-muted-foreground">API Contracts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{artifacts?.filter(a => a.type === "Test Cases").length || 0}</div>
                    <div className="text-sm text-muted-foreground">Test Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{artifacts?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Artifacts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card data-testid="document-preview">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Document Preview</CardTitle>
                  <Button variant="outline" size="sm" data-testid="full-preview">
                    <Eye className="mr-2 h-4 w-4" />
                    Full Preview
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Document Preview</h3>
                  <p className="text-muted-foreground mb-4">
                    Select document types and configure options to generate a preview
                  </p>
                  {selectedTypes.length > 0 && (
                    <div className="flex justify-center space-x-2">
                      {selectedTypes.map(typeId => (
                        <Badge key={typeId} variant="outline">
                          {documentTypes.find(t => t.id === typeId)?.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card data-testid="document-templates">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Document Templates</CardTitle>
                  <Button size="sm" data-testid="add-template">
                    <FileText className="mr-2 h-4 w-4" />
                    Add Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Book className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Custom Templates</h3>
                  <p className="text-muted-foreground">Create and manage custom documentation templates</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

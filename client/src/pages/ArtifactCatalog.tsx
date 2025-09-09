import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, FileText, Code, Database, TestTube, Settings } from "lucide-react";
import type { Artifact } from "@shared/schema";

const artifactIcons = {
  "Source Code": Code,
  "Requirements": FileText,
  "Test Cases": TestTube,
  "API Contract": Settings,
  "Database Entity": Database,
} as const;

const artifactColors = {
  "Source Code": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Requirements": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Test Cases": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "API Contract": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "Database Entity": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
} as const;

export default function ArtifactCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: projects } = useQuery({ queryKey: ["/api/projects"] });
  const projectId = projects?.[0]?.id;

  const { data: artifacts, isLoading } = useQuery<Artifact[]>({
    queryKey: [`/api/projects/${projectId}/artifacts`],
    enabled: !!projectId,
  });

  const filteredArtifacts = artifacts?.filter(artifact => {
    const matchesSearch = artifact.locator.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artifact.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || artifact.type === selectedType;
    return matchesSearch && matchesType;
  });

  const artifactTypes = [...new Set(artifacts?.map(a => a.type) || [])];

  return (
    <>
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Artifact Catalog</h2>
            <p className="text-muted-foreground">Manage and explore all project artifacts</p>
          </div>
          <Button data-testid="add-artifact">
            <Plus className="mr-2 h-4 w-4" />
            Add Artifact
          </Button>
        </div>
      </header>

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search artifacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-artifacts"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {artifactTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{artifacts?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total Artifacts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{artifactTypes.length}</div>
              <div className="text-sm text-muted-foreground">Types</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{filteredArtifacts?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Filtered</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {artifacts?.filter(a => a.updatedAt && new Date(a.updatedAt) > new Date(Date.now() - 24*60*60*1000)).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Updated Today</div>
            </CardContent>
          </Card>
        </div>

        {/* Artifacts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-4 w-3/4"></div>
                  <div className="h-3 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !filteredArtifacts?.length ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No artifacts found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedType !== "all" 
                  ? "Try adjusting your search filters"
                  : "Start by adding your first artifact to the catalog"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtifacts.map((artifact) => {
              const Icon = artifactIcons[artifact.type as keyof typeof artifactIcons] || FileText;
              const colorClass = artifactColors[artifact.type as keyof typeof artifactColors] || "bg-gray-100 text-gray-800";
              
              return (
                <Card key={artifact.id} className="hover:shadow-md transition-shadow" data-testid={`artifact-${artifact.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <Badge className={colorClass}>
                        {artifact.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{artifact.locator}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div><strong>Origin:</strong> {artifact.origin}</div>
                      <div><strong>Version:</strong> {artifact.version}</div>
                      <div><strong>Updated:</strong> {new Date(artifact.updatedAt).toLocaleDateString()}</div>
                      {artifact.contentHash && (
                        <div><strong>Hash:</strong> {artifact.contentHash.slice(0, 8)}...</div>
                      )}
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" variant="outline" data-testid={`view-artifact-${artifact.id}`}>
                        View
                      </Button>
                      <Button size="sm" variant="outline" data-testid={`edit-artifact-${artifact.id}`}>
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

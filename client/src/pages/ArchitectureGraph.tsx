import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Maximize2, Filter, Download, RefreshCw, Zap } from "lucide-react";
import type { Artifact, ArtifactLink } from "@shared/schema";

export default function ArchitectureGraph() {
  const [selectedLayout, setSelectedLayout] = useState("force");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const { data: projects } = useQuery({ queryKey: ["/api/projects"] });
  const projectId = projects?.[0]?.id;

  const { data: artifacts } = useQuery<Artifact[]>({
    queryKey: [`/api/projects/${projectId}/artifacts`],
    enabled: !!projectId,
  });

  const { data: links } = useQuery<ArtifactLink[]>({
    queryKey: [`/api/projects/${projectId}/links`],
    enabled: !!projectId,
  });

  const linkTypes = [...new Set(links?.map(l => l.kind) || [])];
  const artifactTypes = [...new Set(artifacts?.map(a => a.type) || [])];

  return (
    <>
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Architecture Graph</h2>
            <p className="text-muted-foreground">Visualize artifact relationships and dependencies</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" data-testid="refresh-graph">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" data-testid="export-graph">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" data-testid="fullscreen-graph">
              <Maximize2 className="mr-2 h-4 w-4" />
              Fullscreen
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Graph Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={selectedLayout} onValueChange={setSelectedLayout}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="force">Force Layout</SelectItem>
              <SelectItem value="hierarchical">Hierarchical</SelectItem>
              <SelectItem value="circular">Circular</SelectItem>
              <SelectItem value="grid">Grid</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter relationships" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Relationships</SelectItem>
              {linkTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Graph Visualization */}
          <Card className="lg:col-span-3" data-testid="graph-visualization">
            <CardHeader>
              <CardTitle className="flex items-center">
                <GitBranch className="mr-2 h-5 w-5" />
                Interactive Graph
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-muted/20 rounded-lg border-2 border-dashed border-muted flex items-center justify-center">
                <div className="text-center">
                  <GitBranch className="h-16 w-16 text-muted-foreground mb-4 mx-auto" />
                  <h4 className="text-lg font-medium text-muted-foreground mb-2">Graph Visualization</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Interactive graph showing {artifacts?.length || 0} artifacts and {links?.length || 0} relationships
                  </p>
                  <p className="text-xs text-muted-foreground">
                    D3.js or React Flow integration needed for visualization
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Graph Stats & Legend */}
          <div className="space-y-6">
            {/* Stats */}
            <Card data-testid="graph-stats">
              <CardHeader>
                <CardTitle className="text-base">Graph Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nodes</span>
                  <span className="text-sm font-medium">{artifacts?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Edges</span>
                  <span className="text-sm font-medium">{links?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Components</span>
                  <span className="text-sm font-medium">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Density</span>
                  <span className="text-sm font-medium">0.23</span>
                </div>
              </CardContent>
            </Card>

            {/* Node Types Legend */}
            <Card data-testid="node-legend">
              <CardHeader>
                <CardTitle className="text-base">Node Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {artifactTypes.map((type, index) => {
                  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-cyan-500"];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div key={type} className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${color}`} />
                      <span className="text-sm">{type}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {artifacts?.filter(a => a.type === type).length || 0}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Relationship Types */}
            <Card data-testid="relationship-legend">
              <CardHeader>
                <CardTitle className="text-base">Relationships</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {linkTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No relationships found</p>
                ) : (
                  linkTypes.map((type) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-0.5 bg-muted-foreground" />
                        <span className="text-sm">{type}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {links?.filter(l => l.kind === type).length || 0}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button size="sm" variant="outline" className="w-full justify-start" data-testid="center-graph">
                  <Zap className="mr-2 h-4 w-4" />
                  Center Graph
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start" data-testid="fit-view">
                  <Maximize2 className="mr-2 h-4 w-4" />
                  Fit to View
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start" data-testid="show-orphans">
                  <Filter className="mr-2 h-4 w-4" />
                  Show Orphaned Nodes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Graph Analysis */}
        <Card className="mt-6" data-testid="graph-analysis">
          <CardHeader>
            <CardTitle>Graph Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {artifacts?.filter(a => links?.some(l => l.fromId === a.id || l.toId === a.id)).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Connected Artifacts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {artifacts?.filter(a => !links?.some(l => l.fromId === a.id || l.toId === a.id)).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Orphaned Artifacts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((links?.length || 0) * 100 / Math.max(1, (artifacts?.length || 1) * ((artifacts?.length || 1) - 1) / 2))}%
                </div>
                <div className="text-sm text-muted-foreground">Graph Density</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

import { Link, useLocation } from "wouter";
import { ChevronDown, User, Moon, Sun, BarChart3, Archive, GitBranch, Shield, Search, Code, Book, Terminal, Database, Settings } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import type { Project } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SidebarProps {
  projects: Project[];
  selectedProject: string | null;
  onProjectChange: (projectId: string) => void;
}

const navigationItems = [
  { path: "/", icon: BarChart3, label: "Dashboard" },
  { path: "/artifacts", icon: Archive, label: "Artifact Catalog" },
  { path: "/graph", icon: GitBranch, label: "Architecture Graph" },
  { path: "/compliance", icon: Shield, label: "Compliance (SACC)" },
  { path: "/sar", icon: Search, label: "SAR Discovery" },
  { path: "/generation", icon: Code, label: "Code Generation" },
  { path: "/documentation", icon: Book, label: "Documentation" },
  { path: "/clui", icon: Terminal, label: "CLUI Console" },
];

const integrationItems = [
  { path: "/integrations/git", icon: GitBranch, label: "Git Repositories" },
  { path: "/integrations/database", icon: Database, label: "Database Schemas" },
  { path: "/integrations/cicd", icon: Settings, label: "CI/CD Pipelines" },
];

export default function Sidebar({ projects, selectedProject, onProjectChange }: SidebarProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      {/* Logo and Title */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <GitBranch className="text-primary-foreground text-sm" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Omnius</h1>
            <p className="text-xs text-muted-foreground">Architecture Platform</p>
          </div>
        </div>
      </div>

      {/* Project Selector */}
      <div className="p-4 border-b border-border">
        <label className="block text-xs font-medium text-muted-foreground mb-2">PROJECT</label>
        <Select value={selectedProject || ""} onValueChange={onProjectChange}>
          <SelectTrigger data-testid="project-selector">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id} data-testid={`project-option-${project.id}`}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="w-full justify-start"
                    data-testid={`nav-${item.path.replace("/", "")}`}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 pt-4 border-t border-border">
          <h3 className="text-xs font-medium text-muted-foreground mb-3">INTEGRATIONS</h3>
          <ul className="space-y-2">
            {integrationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <li key={item.path}>
                  <Link href={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className="w-full justify-start"
                      data-testid={`integration-nav-${item.path.split("/").pop()}`}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="text-primary-foreground text-sm" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">John Developer</p>
            <p className="text-xs text-muted-foreground">Solutions Architect</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleTheme}
            data-testid="theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import type { Project } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        projects={projects || []} 
        selectedProject={selectedProject} 
        onProjectChange={setSelectedProject}
      />
      <main className="flex-1 overflow-auto">
        {selectedProject ? children : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">No Project Selected</h2>
              <p className="text-muted-foreground">Please select a project to continue</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

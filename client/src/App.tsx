import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/ThemeProvider";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ArtifactCatalog from "./pages/ArtifactCatalog";
import ArchitectureGraph from "./pages/ArchitectureGraph";
import Compliance from "./pages/Compliance";
import SarDiscovery from "./pages/SarDiscovery";
import CodeGeneration from "./pages/CodeGeneration";
import Documentation from "./pages/Documentation";
import CLUIConsole from "./pages/CLUIConsole";
import GitIntegration from "./pages/GitIntegration";
import DatabaseIntegration from "./pages/DatabaseIntegration";
import CicdIntegration from "./pages/CicdIntegration";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/artifacts" component={ArtifactCatalog} />
        <Route path="/graph" component={ArchitectureGraph} />
        <Route path="/compliance" component={Compliance} />
        <Route path="/sar" component={SarDiscovery} />
        <Route path="/generation" component={CodeGeneration} />
        <Route path="/documentation" component={Documentation} />
        <Route path="/clui" component={CLUIConsole} />
        <Route path="/integrations/git" component={GitIntegration} />
        <Route path="/integrations/database" component={DatabaseIntegration} />
        <Route path="/integrations/cicd" component={CicdIntegration} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, HelpCircle, History, Command, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import type { CommandHistory } from "@shared/schema";

const commandCategories = [
  {
    id: "compliance",
    name: "Compliance",
    commands: [
      { cmd: "/check --scope model:db", desc: "Check model-database compliance" },
      { cmd: "/check --scope req:test", desc: "Check requirement-test coverage" },
      { cmd: "/check --scope api:impl", desc: "Check API-implementation alignment" },
    ]
  },
  {
    id: "generation",
    name: "Generation",
    commands: [
      { cmd: "/generate scaffold --type worker", desc: "Generate microservice worker" },
      { cmd: "/generate migration --entity User", desc: "Generate database migration" },
      { cmd: "/generate test --target UserService", desc: "Generate test cases" },
    ]
  },
  {
    id: "documentation",
    name: "Documentation",
    commands: [
      { cmd: "/doc export --format pdf", desc: "Export documentation as PDF" },
      { cmd: "/doc export --format html", desc: "Export as HTML" },
      { cmd: "/doc refresh", desc: "Refresh documentation" },
    ]
  },
  {
    id: "analysis",
    name: "Analysis",
    commands: [
      { cmd: "/audit import legacy --repo main", desc: "Import legacy system" },
      { cmd: "/graph analyze", desc: "Analyze architecture graph" },
      { cmd: "/metrics summary", desc: "Show project metrics" },
    ]
  }
];

export default function CLUIConsole() {
  const [command, setCommand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: projects } = useQuery({ queryKey: ["/api/projects"] });
  const projectId = projects?.[0]?.id;

  const { data: history, refetch } = useQuery<CommandHistory[]>({
    queryKey: [`/api/projects/${projectId}/commands`],
    enabled: !!projectId,
  });

  const executeCommand = useMutation({
    mutationFn: async (cmd: string) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/commands`, { command: cmd });
      return response.json();
    },
    onSuccess: () => {
      refetch();
      setCommand("");
      // Focus back to input
      setTimeout(() => inputRef.current?.focus(), 100);
    },
  });

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      executeCommand.mutate(command.trim());
    }
  };

  const handleQuickCommand = (cmd: string) => {
    setCommand(cmd);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" && history?.length) {
      e.preventDefault();
      const lastCommand = history[0]?.command;
      if (lastCommand) {
        setCommand(lastCommand);
      }
    }
  };

  return (
    <>
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">CLUI Console</h2>
            <p className="text-muted-foreground">Command Line User Interface for Omnius operations</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" data-testid="god-mode-status">
              <Zap className="mr-1 h-3 w-3" />
              Standard Mode
            </Badge>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Terminal */}
          <Card className="lg:col-span-2" data-testid="main-terminal">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center space-x-2">
                <Terminal className="text-primary h-5 w-5" />
                <span>Terminal</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Terminal Output */}
              <div 
                ref={terminalRef}
                className="bg-black text-green-400 font-mono text-sm p-4 h-96 overflow-y-auto clui-terminal"
                data-testid="terminal-output"
              >
                <div className="text-blue-400 mb-2">Omnius CLUI v1.0.0 - Type /help for available commands</div>
                {history?.slice(-20).map((cmd) => (
                  <div key={cmd.id} className="mb-2">
                    <div className="text-blue-400">
                      <span className="text-gray-500">[{new Date(cmd.executedAt).toLocaleTimeString()}]</span>{" "}
                      $ {cmd.command}
                    </div>
                    <div className={cmd.success ? "text-green-400" : "text-red-400"}>
                      {cmd.result}
                    </div>
                  </div>
                ))}
                {executeCommand.isPending && (
                  <div className="text-amber-400 animate-pulse">Executing command...</div>
                )}
                <div className="text-blue-400 flex items-center">
                  $ <span className="animate-pulse ml-1">_</span>
                </div>
              </div>

              {/* Command Input */}
              <div className="p-4 border-t border-border bg-muted/50">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Enter command or natural language..."
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="font-mono flex-1"
                    data-testid="command-input"
                  />
                  <Button 
                    type="submit" 
                    disabled={executeCommand.isPending || !command.trim()}
                    data-testid="execute-command"
                  >
                    Execute
                  </Button>
                </form>
                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                  <span>Press ↑ for command history</span>
                  <span>Ctrl+C to cancel</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Command Reference */}
          <div className="space-y-6">
            <Card data-testid="command-reference">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HelpCircle className="h-5 w-5" />
                  <span>Command Reference</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedCategory || commandCategories[0].id}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger 
                      value="compliance" 
                      onClick={() => setSelectedCategory("compliance")}
                      data-testid="tab-compliance"
                    >
                      Check
                    </TabsTrigger>
                    <TabsTrigger 
                      value="generation" 
                      onClick={() => setSelectedCategory("generation")}
                      data-testid="tab-generation"
                    >
                      Generate
                    </TabsTrigger>
                  </TabsList>

                  {commandCategories.map((category) => (
                    <TabsContent key={category.id} value={category.id} className="mt-4">
                      <div className="space-y-2">
                        {category.commands.map((cmd, index) => (
                          <div 
                            key={index}
                            className="group p-2 rounded border hover:bg-accent cursor-pointer"
                            onClick={() => handleQuickCommand(cmd.cmd)}
                            data-testid={`quick-command-${cmd.cmd.split(' ')[0].slice(1)}`}
                          >
                            <code className="text-sm font-mono text-primary">{cmd.cmd}</code>
                            <p className="text-xs text-muted-foreground mt-1">{cmd.desc}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Command History */}
            <Card data-testid="command-history-panel">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Recent Commands</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!history?.length ? (
                  <div className="text-center py-6">
                    <Command className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No command history</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {history.slice(0, 10).map((cmd) => (
                      <div 
                        key={cmd.id}
                        className="group p-2 rounded border hover:bg-accent cursor-pointer"
                        onClick={() => handleQuickCommand(cmd.command)}
                        data-testid={`history-command-${cmd.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <code className="text-xs font-mono">{cmd.command}</code>
                          <Badge 
                            variant={cmd.success ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {cmd.success ? "✓" : "✗"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(cmd.executedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help & Tips */}
            <Card data-testid="help-tips">
              <CardHeader>
                <CardTitle className="text-base">Tips & Shortcuts</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab</kbd> - Autocomplete commands</div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">↑/↓</kbd> - Navigate command history</div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">/help</kbd> - Show all available commands</div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">/clear</kbd> - Clear terminal output</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal, HelpCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CommandHistory } from "@shared/schema";

interface CLUITerminalProps {
  projectId: string;
  className?: string;
}

export default function CLUITerminal({ projectId, className }: CLUITerminalProps) {
  const [command, setCommand] = useState("");
  const terminalRef = useRef<HTMLDivElement>(null);

  const { data: history, refetch } = useQuery<CommandHistory[]>({
    queryKey: [`/api/projects/${projectId}/commands`],
  });

  const executeCommand = useMutation({
    mutationFn: async (cmd: string) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/commands`, { command: cmd });
      return response.json();
    },
    onSuccess: () => {
      refetch();
      setCommand("");
    },
  });

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      executeCommand.mutate(command.trim());
    }
  };

  const quickCommands = [
    "/check --scope req:test",
    "/doc export --format pdf",
    "/audit import legacy",
    "/generate scaffold --type worker"
  ];

  return (
    <Card className={className} data-testid="clui-terminal">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center space-x-2">
          <Terminal className="text-primary h-5 w-5" />
          <span>CLUI Console</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div 
          ref={terminalRef}
          className="bg-black text-green-400 font-mono text-xs p-4 rounded-lg h-32 overflow-y-auto mb-4 clui-terminal"
          data-testid="terminal-output"
        >
          {history?.slice(-10).map((cmd) => (
            <div key={cmd.id}>
              <div className="text-blue-400">$ {cmd.command}</div>
              <div className={cmd.success ? "text-green-400" : "text-red-400"}>
                {cmd.result}
              </div>
            </div>
          ))}
          {executeCommand.isPending && (
            <div className="text-amber-400">Executing command...</div>
          )}
          <div className="text-blue-400">$ </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            type="text"
            placeholder="Enter command or natural language..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="font-mono"
            data-testid="command-input"
          />
          <div className="flex space-x-2">
            <Button 
              type="submit" 
              disabled={executeCommand.isPending || !command.trim()}
              data-testid="execute-command"
            >
              Execute
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              data-testid="help-button"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Help
            </Button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-2">Quick Commands</h4>
          <div className="space-y-1">
            {quickCommands.map((cmd) => (
              <button
                key={cmd}
                onClick={() => setCommand(cmd)}
                className="block w-full text-left text-xs text-muted-foreground hover:text-foreground font-mono"
                data-testid={`quick-command-${cmd.split(' ')[0].slice(1)}`}
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

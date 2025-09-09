import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertArtifactSchema, insertArtifactLinkSchema, 
         insertPolicySchema, insertFindingSchema, insertCommandSchema, insertIntegrationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.extend({
        ownerId: z.string()
      }).parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // Dashboard metrics
  app.get("/api/projects/:id/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics(req.params.id);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // Artifacts
  app.get("/api/projects/:projectId/artifacts", async (req, res) => {
    try {
      const artifacts = await storage.getArtifactsByProject(req.params.projectId);
      res.json(artifacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch artifacts" });
    }
  });

  app.post("/api/projects/:projectId/artifacts", async (req, res) => {
    try {
      const validatedData = insertArtifactSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const artifact = await storage.createArtifact(validatedData);
      res.status(201).json(artifact);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/artifacts/:id", async (req, res) => {
    try {
      const artifact = await storage.getArtifact(req.params.id);
      if (!artifact) {
        return res.status(404).json({ error: "Artifact not found" });
      }
      res.json(artifact);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch artifact" });
    }
  });

  app.put("/api/artifacts/:id", async (req, res) => {
    try {
      const validatedData = insertArtifactSchema.partial().parse(req.body);
      const artifact = await storage.updateArtifact(req.params.id, validatedData);
      res.json(artifact);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete("/api/artifacts/:id", async (req, res) => {
    try {
      const success = await storage.deleteArtifact(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Artifact not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete artifact" });
    }
  });

  // Artifact Links
  app.get("/api/projects/:projectId/links", async (req, res) => {
    try {
      const links = await storage.getLinksByProject(req.params.projectId);
      res.json(links);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch links" });
    }
  });

  app.post("/api/links", async (req, res) => {
    try {
      const validatedData = insertArtifactLinkSchema.parse(req.body);
      const link = await storage.createArtifactLink(validatedData);
      res.status(201).json(link);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete("/api/links/:id", async (req, res) => {
    try {
      const success = await storage.deleteArtifactLink(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Link not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete link" });
    }
  });

  // Policies
  app.get("/api/projects/:projectId/policies", async (req, res) => {
    try {
      const policies = await storage.getPoliciesByProject(req.params.projectId);
      res.json(policies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch policies" });
    }
  });

  app.post("/api/projects/:projectId/policies", async (req, res) => {
    try {
      const validatedData = insertPolicySchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const policy = await storage.createPolicy(validatedData);
      res.status(201).json(policy);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/policies/:id", async (req, res) => {
    try {
      const validatedData = insertPolicySchema.partial().parse(req.body);
      const policy = await storage.updatePolicy(req.params.id, validatedData);
      res.json(policy);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Findings
  app.get("/api/projects/:projectId/findings", async (req, res) => {
    try {
      const findings = req.query.active === 'true' 
        ? await storage.getActiveFindingsByProject(req.params.projectId)
        : await storage.getFindingsByProject(req.params.projectId);
      res.json(findings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch findings" });
    }
  });

  app.post("/api/projects/:projectId/findings", async (req, res) => {
    try {
      const validatedData = insertFindingSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const finding = await storage.createFinding(validatedData);
      res.status(201).json(finding);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/findings/:id", async (req, res) => {
    try {
      const validatedData = insertFindingSchema.partial().parse(req.body);
      const finding = await storage.updateFinding(req.params.id, validatedData);
      res.json(finding);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // CLUI Commands
  app.post("/api/projects/:projectId/commands", async (req, res) => {
    try {
      const { command } = req.body;
      if (!command) {
        return res.status(400).json({ error: "Command is required" });
      }

      // Simple command processing (would be enhanced with actual AI/NLP)
      let result = "";
      let success = true;

      if (command.startsWith("/check")) {
        const artifacts = await storage.getArtifactsByProject(req.params.projectId);
        const findings = await storage.getActiveFindingsByProject(req.params.projectId);
        result = `Found ${findings.length} compliance issues across ${artifacts.length} artifacts`;
      } else if (command.startsWith("/generate")) {
        result = "Code generation initiated. Check the artifacts catalog for results.";
      } else if (command.startsWith("/doc")) {
        result = "Documentation export started. PDF will be available shortly.";
      } else {
        result = `Unknown command: ${command}. Type /help for available commands.`;
        success = false;
      }

      const commandRecord = await storage.createCommand({
        projectId: req.params.projectId,
        userId: "user-1", // Would come from auth
        command,
        result,
        success
      });

      res.json(commandRecord);
    } catch (error) {
      res.status(500).json({ error: "Failed to execute command" });
    }
  });

  app.get("/api/projects/:projectId/commands", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await storage.getCommandHistory(req.params.projectId, limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch command history" });
    }
  });

  // Integrations
  app.get("/api/projects/:projectId/integrations", async (req, res) => {
    try {
      const integrations = await storage.getIntegrationsByProject(req.params.projectId);
      res.json(integrations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  app.post("/api/projects/:projectId/integrations", async (req, res) => {
    try {
      const validatedData = insertIntegrationSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const integration = await storage.createIntegration(validatedData);
      res.status(201).json(integration);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/integrations/:id", async (req, res) => {
    try {
      const validatedData = insertIntegrationSchema.partial().parse(req.body);
      const integration = await storage.updateIntegration(req.params.id, validatedData);
      res.json(integration);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Compliance checks
  app.post("/api/projects/:projectId/compliance/check", async (req, res) => {
    try {
      // Simulate running compliance checks
      const policies = await storage.getPoliciesByProject(req.params.projectId);
      const artifacts = await storage.getArtifactsByProject(req.params.projectId);
      
      // Mock compliance check logic
      const newFindings = [];
      for (const policy of policies.filter(p => p.enabled)) {
        // Simulate finding compliance issues
        if (Math.random() > 0.7) { // 30% chance of finding an issue
          const finding = await storage.createFinding({
            projectId: req.params.projectId,
            policyId: policy.id,
            severity: policy.severity,
            message: `Compliance issue detected for policy: ${policy.scope}`,
            artifactRefs: artifacts.slice(0, 2).map(a => a.id),
            status: "open"
          });
          newFindings.push(finding);
        }
      }

      res.json({
        message: `Compliance check completed. Found ${newFindings.length} new issues.`,
        newFindings: newFindings.length,
        totalPoliciesChecked: policies.length
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to run compliance check" });
    }
  });

  // SAR (System Architecture Reconstruction)
  app.post("/api/projects/:projectId/sar/analyze", async (req, res) => {
    try {
      // Simulate SAR analysis
      const artifacts = await storage.getArtifactsByProject(req.params.projectId);
      
      // Mock SAR results
      const analysisResult = {
        entitiesDiscovered: Math.floor(Math.random() * 20) + 10,
        componentsIdentified: Math.floor(Math.random() * 15) + 5,
        apiEndpointsFound: Math.floor(Math.random() * 50) + 25,
        databaseTablesDiscovered: Math.floor(Math.random() * 30) + 15,
        confidence: Math.floor(Math.random() * 20) + 80,
        artifacts: artifacts.length
      };

      res.json(analysisResult);
    } catch (error) {
      res.status(500).json({ error: "Failed to run SAR analysis" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

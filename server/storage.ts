import { type User, type InsertUser, type Project, type InsertProject, type Artifact, type InsertArtifact, 
         type ArtifactLink, type InsertArtifactLink, type Policy, type InsertPolicy, type Finding, 
         type InsertFinding, type CommandHistory, type InsertCommand, type Integration, type InsertIntegration,
         type DashboardMetrics } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project management
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByUser(userId: string): Promise<Project[]>;
  createProject(project: InsertProject & { ownerId: string }): Promise<Project>;
  getAllProjects(): Promise<Project[]>;

  // Artifact management
  getArtifact(id: string): Promise<Artifact | undefined>;
  getArtifactsByProject(projectId: string): Promise<Artifact[]>;
  createArtifact(artifact: InsertArtifact): Promise<Artifact>;
  updateArtifact(id: string, artifact: Partial<InsertArtifact>): Promise<Artifact>;
  deleteArtifact(id: string): Promise<boolean>;
  getArtifactsByType(projectId: string, type: string): Promise<Artifact[]>;

  // Artifact links (graph)
  getArtifactLink(id: string): Promise<ArtifactLink | undefined>;
  getLinksByArtifact(artifactId: string): Promise<ArtifactLink[]>;
  createArtifactLink(link: InsertArtifactLink): Promise<ArtifactLink>;
  deleteArtifactLink(id: string): Promise<boolean>;
  getLinksByProject(projectId: string): Promise<ArtifactLink[]>;

  // Policy management
  getPolicy(id: string): Promise<Policy | undefined>;
  getPoliciesByProject(projectId: string): Promise<Policy[]>;
  createPolicy(policy: InsertPolicy): Promise<Policy>;
  updatePolicy(id: string, policy: Partial<InsertPolicy>): Promise<Policy>;

  // Findings management
  getFinding(id: string): Promise<Finding | undefined>;
  getFindingsByProject(projectId: string): Promise<Finding[]>;
  createFinding(finding: InsertFinding): Promise<Finding>;
  updateFinding(id: string, finding: Partial<InsertFinding>): Promise<Finding>;
  getActiveFindingsByProject(projectId: string): Promise<Finding[]>;

  // Command history
  getCommandHistory(projectId: string, limit?: number): Promise<CommandHistory[]>;
  createCommand(command: InsertCommand): Promise<CommandHistory>;

  // Integrations
  getIntegration(id: string): Promise<Integration | undefined>;
  getIntegrationsByProject(projectId: string): Promise<Integration[]>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: string, integration: Partial<InsertIntegration>): Promise<Integration>;

  // Dashboard metrics
  getDashboardMetrics(projectId: string): Promise<DashboardMetrics>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private projects: Map<string, Project> = new Map();
  private artifacts: Map<string, Artifact> = new Map();
  private artifactLinks: Map<string, ArtifactLink> = new Map();
  private policies: Map<string, Policy> = new Map();
  private findings: Map<string, Finding> = new Map();
  private commandHistory: Map<string, CommandHistory> = new Map();
  private integrations: Map<string, Integration> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create a default user
    const defaultUser: User = {
      id: "user-1",
      username: "john.developer",
      email: "john@company.com",
      role: "architect",
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create sample projects
    const project1: Project = {
      id: "project-1",
      name: "E-Commerce Platform",
      description: "Modern e-commerce platform with microservices architecture",
      ownerId: defaultUser.id,
      createdAt: new Date(),
    };
    this.projects.set(project1.id, project1);

    // Create sample policies
    const policy1: Policy = {
      id: "policy-1",
      projectId: project1.id,
      scope: "model:code",
      expression: "Every model entity must have corresponding code implementation",
      severity: "HIGH",
      enabled: true,
      createdAt: new Date(),
    };
    this.policies.set(policy1.id, policy1);

    // Create sample findings
    const finding1: Finding = {
      id: "finding-1",
      projectId: project1.id,
      policyId: policy1.id,
      severity: "HIGH",
      message: "Model-Code Mismatch in User Entity",
      artifactRefs: ["artifact-1", "artifact-2"],
      status: "open",
      createdAt: new Date(),
      resolvedAt: null,
    };
    this.findings.set(finding1.id, finding1);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role || "developer",
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Project methods
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.ownerId === userId);
  }

  async createProject(project: InsertProject & { ownerId: string }): Promise<Project> {
    const id = randomUUID();
    const newProject: Project = {
      ...project,
      id,
      description: project.description || null,
      createdAt: new Date(),
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  // Artifact methods
  async getArtifact(id: string): Promise<Artifact | undefined> {
    return this.artifacts.get(id);
  }

  async getArtifactsByProject(projectId: string): Promise<Artifact[]> {
    return Array.from(this.artifacts.values()).filter(artifact => artifact.projectId === projectId);
  }

  async createArtifact(artifact: InsertArtifact): Promise<Artifact> {
    const id = randomUUID();
    const newArtifact: Artifact = {
      ...artifact,
      id,
      version: artifact.version || "1.0.0",
      metadata: artifact.metadata || null,
      content: artifact.content || null,
      schemaRef: artifact.schemaRef || null,
      contentHash: artifact.contentHash || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.artifacts.set(id, newArtifact);
    return newArtifact;
  }

  async updateArtifact(id: string, artifact: Partial<InsertArtifact>): Promise<Artifact> {
    const existing = this.artifacts.get(id);
    if (!existing) throw new Error("Artifact not found");
    
    const updated: Artifact = {
      ...existing,
      ...artifact,
      updatedAt: new Date(),
    };
    this.artifacts.set(id, updated);
    return updated;
  }

  async deleteArtifact(id: string): Promise<boolean> {
    return this.artifacts.delete(id);
  }

  async getArtifactsByType(projectId: string, type: string): Promise<Artifact[]> {
    return Array.from(this.artifacts.values())
      .filter(artifact => artifact.projectId === projectId && artifact.type === type);
  }

  // Artifact link methods
  async getArtifactLink(id: string): Promise<ArtifactLink | undefined> {
    return this.artifactLinks.get(id);
  }

  async getLinksByArtifact(artifactId: string): Promise<ArtifactLink[]> {
    return Array.from(this.artifactLinks.values())
      .filter(link => link.fromId === artifactId || link.toId === artifactId);
  }

  async createArtifactLink(link: InsertArtifactLink): Promise<ArtifactLink> {
    const id = randomUUID();
    const newLink: ArtifactLink = {
      ...link,
      id,
      cardinality: link.cardinality || "1:1",
      confidence: link.confidence || 100,
      createdAt: new Date(),
    };
    this.artifactLinks.set(id, newLink);
    return newLink;
  }

  async deleteArtifactLink(id: string): Promise<boolean> {
    return this.artifactLinks.delete(id);
  }

  async getLinksByProject(projectId: string): Promise<ArtifactLink[]> {
    const projectArtifacts = await this.getArtifactsByProject(projectId);
    const artifactIds = new Set(projectArtifacts.map(a => a.id));
    
    return Array.from(this.artifactLinks.values())
      .filter(link => artifactIds.has(link.fromId) || artifactIds.has(link.toId));
  }

  // Policy methods
  async getPolicy(id: string): Promise<Policy | undefined> {
    return this.policies.get(id);
  }

  async getPoliciesByProject(projectId: string): Promise<Policy[]> {
    return Array.from(this.policies.values()).filter(policy => policy.projectId === projectId);
  }

  async createPolicy(policy: InsertPolicy): Promise<Policy> {
    const id = randomUUID();
    const newPolicy: Policy = {
      ...policy,
      id,
      enabled: policy.enabled !== undefined ? policy.enabled : true,
      createdAt: new Date(),
    };
    this.policies.set(id, newPolicy);
    return newPolicy;
  }

  async updatePolicy(id: string, policy: Partial<InsertPolicy>): Promise<Policy> {
    const existing = this.policies.get(id);
    if (!existing) throw new Error("Policy not found");
    
    const updated: Policy = {
      ...existing,
      ...policy,
    };
    this.policies.set(id, updated);
    return updated;
  }

  // Findings methods
  async getFinding(id: string): Promise<Finding | undefined> {
    return this.findings.get(id);
  }

  async getFindingsByProject(projectId: string): Promise<Finding[]> {
    return Array.from(this.findings.values()).filter(finding => finding.projectId === projectId);
  }

  async createFinding(finding: InsertFinding): Promise<Finding> {
    const id = randomUUID();
    const newFinding: Finding = {
      ...finding,
      id,
      status: finding.status || "open",
      artifactRefs: finding.artifactRefs || null,
      createdAt: new Date(),
      resolvedAt: null,
    };
    this.findings.set(id, newFinding);
    return newFinding;
  }

  async updateFinding(id: string, finding: Partial<InsertFinding>): Promise<Finding> {
    const existing = this.findings.get(id);
    if (!existing) throw new Error("Finding not found");
    
    const updated: Finding = {
      ...existing,
      ...finding,
      resolvedAt: finding.status === "resolved" ? new Date() : existing.resolvedAt,
    };
    this.findings.set(id, updated);
    return updated;
  }

  async getActiveFindingsByProject(projectId: string): Promise<Finding[]> {
    return Array.from(this.findings.values())
      .filter(finding => finding.projectId === projectId && finding.status === "open");
  }

  // Command history methods
  async getCommandHistory(projectId: string, limit: number = 50): Promise<CommandHistory[]> {
    return Array.from(this.commandHistory.values())
      .filter(cmd => cmd.projectId === projectId)
      .sort((a, b) => (b.executedAt?.getTime() || 0) - (a.executedAt?.getTime() || 0))
      .slice(0, limit);
  }

  async createCommand(command: InsertCommand): Promise<CommandHistory> {
    const id = randomUUID();
    const newCommand: CommandHistory = {
      ...command,
      id,
      success: command.success !== undefined ? command.success : true,
      result: command.result || null,
      executedAt: new Date(),
    };
    this.commandHistory.set(id, newCommand);
    return newCommand;
  }

  // Integration methods
  async getIntegration(id: string): Promise<Integration | undefined> {
    return this.integrations.get(id);
  }

  async getIntegrationsByProject(projectId: string): Promise<Integration[]> {
    return Array.from(this.integrations.values()).filter(integration => integration.projectId === projectId);
  }

  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const id = randomUUID();
    const newIntegration: Integration = {
      ...integration,
      id,
      enabled: integration.enabled !== undefined ? integration.enabled : true,
      lastSync: null,
      createdAt: new Date(),
    };
    this.integrations.set(id, newIntegration);
    return newIntegration;
  }

  async updateIntegration(id: string, integration: Partial<InsertIntegration>): Promise<Integration> {
    const existing = this.integrations.get(id);
    if (!existing) throw new Error("Integration not found");
    
    const updated: Integration = {
      ...existing,
      ...integration,
    };
    this.integrations.set(id, updated);
    return updated;
  }

  // Dashboard metrics
  async getDashboardMetrics(projectId: string): Promise<DashboardMetrics> {
    const artifacts = await this.getArtifactsByProject(projectId);
    const findings = await this.getActiveFindingsByProject(projectId);
    const allFindings = await this.getFindingsByProject(projectId);

    // Calculate compliance score (simplified)
    const totalChecks = allFindings.length || 1;
    const openFindings = findings.length;
    const complianceScore = Math.round(((totalChecks - openFindings) / totalChecks) * 100);

    // Artifact distribution
    const typeCount = artifacts.reduce((acc, artifact) => {
      acc[artifact.type] = (acc[artifact.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ["hsl(12, 76%, 61%)", "hsl(173, 58%, 39%)", "hsl(197, 37%, 24%)", "hsl(43, 74%, 66%)", "hsl(27, 87%, 67%)"];
    const artifactDistribution = Object.entries(typeCount).map(([type, count], index) => ({
      type,
      count,
      color: colors[index % colors.length],
    }));

    // Mock compliance trends (would be calculated from historical data)
    const complianceTrends = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
      score: Math.round(75 + Math.random() * 25),
    }));

    return {
      totalArtifacts: artifacts.length,
      complianceScore,
      activeFindings: findings.length,
      testCoverage: 94, // This would be calculated from actual test coverage data
      artifactDistribution,
      recentFindings: findings.slice(0, 10),
      complianceTrends,
    };
  }
}

export const storage = new MemStorage();

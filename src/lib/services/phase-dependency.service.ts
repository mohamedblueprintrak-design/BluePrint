import { prisma } from '@/lib/db';

/**
 * Phase Dependency Service
 * Validates and enforces engineering workflow dependencies:
 *
 * Rules:
 * 1. Structural cannot start before Architectural Client Approval is COMPLETED
 * 2. Municipality submission cannot happen without Final Drawings being COMPLETED
 * 3. MEP cannot start before Architectural is at least IN_PROGRESS
 * 4. Invoice cannot be issued for a phase that hasn't started
 */

interface ValidationResult {
  allowed: boolean;
  reason?: string;
  blockedBy?: string;
}

/**
 * Check if a phase transition is allowed based on dependencies
 */
export async function validatePhaseTransition(
  phaseId: string,
  targetStatus: string
): Promise<ValidationResult> {
  const phase = await prisma.workflowPhase.findUnique({
    where: { id: phaseId },
    include: {
      project: {
        include: {
          workflowPhases: true,
        },
      },
      dependsOn: true,
    },
  });

  if (!phase) {
    return { allowed: false, reason: 'Phase not found' };
  }

  // Only enforce dependencies when transitioning TO in_progress
  if (targetStatus !== 'IN_PROGRESS') {
    return { allowed: true };
  }

  // Check direct dependency (dependsOnId)
  if (phase.dependsOnId) {
    const dependency = phase.dependsOn;
    if (dependency && dependency.status !== 'COMPLETED') {
      return {
        allowed: false,
        reason: `Cannot start until "${dependency.phaseType}" is completed`,
        blockedBy: dependency.phaseType,
      };
    }
  }

  // Rule 1: Structural phases require Architectural Client Approval
  if (phase.phaseCategory === 'STRUCTURAL') {
    const archClientApproval = phase.project.workflowPhases.find(
      p => p.phaseType === 'CLIENT_APPROVAL' && p.phaseCategory === 'ARCHITECTURAL'
    );
    if (archClientApproval && archClientApproval.status !== 'COMPLETED') {
      return {
        allowed: false,
        reason: 'Structural work requires Architectural Client Approval to be completed first',
        blockedBy: 'Architectural Client Approval',
      };
    }
  }

  // Rule 2: Government submissions require Final Drawings
  if (phase.phaseCategory === 'GOVERNMENT') {
    const finalDrawings = phase.project.workflowPhases.find(
      p => p.phaseType === 'FINAL_DRAWINGS' && p.phaseCategory === 'ARCHITECTURAL'
    );
    if (finalDrawings && finalDrawings.status !== 'COMPLETED') {
      return {
        allowed: false,
        reason: 'Government submissions require Final Drawings to be completed first',
        blockedBy: 'Final Drawings',
      };
    }
  }

  // Rule 3: MEP requires Architectural at least IN_PROGRESS
  if (phase.phaseCategory === 'MEP') {
    const archPhases = phase.project.workflowPhases.filter(
      p => p.phaseCategory === 'ARCHITECTURAL'
    );
    const hasInProgress = archPhases.some(p => p.status === 'IN_PROGRESS' || p.status === 'COMPLETED');
    if (!hasInProgress && archPhases.length > 0) {
      return {
        allowed: false,
        reason: 'MEP work requires Architectural phase to be in progress at minimum',
        blockedBy: 'Architectural phases',
      };
    }
  }

  return { allowed: true };
}

/**
 * Get all phases that are blocked by dependencies
 */
export async function getBlockedPhases(projectId: string) {
  const phases = await prisma.workflowPhase.findMany({
    where: { projectId },
    include: { dependsOn: true },
  });

  const blocked: Array<{ phaseId: string; phaseType: string; blockedBy: string }> = [];

  for (const phase of phases) {
    if (phase.status === 'NOT_STARTED' && phase.dependsOnId) {
      const dependency = phase.dependsOn;
      if (dependency && dependency.status !== 'COMPLETED') {
        blocked.push({
          phaseId: phase.id,
          phaseType: phase.phaseType,
          blockedBy: dependency.phaseType,
        });
      }
    }
  }

  return blocked;
}

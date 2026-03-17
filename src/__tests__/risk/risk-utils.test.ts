/**
 * Tests for Risk Register Utility Functions
 * اختبارات دوال سجل المخاطر المساعدة
 */

// Utility functions for risk calculations
export function calculateRiskScore(probability: number, impact: number): number {
  return Math.max(1, Math.min(5, probability)) * Math.max(1, Math.min(5, impact));
}

export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 15) return 'critical';
  if (score >= 10) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

export function getRiskScoreColor(score: number): string {
  if (score >= 15) return '#dc2626'; // Critical - Red
  if (score >= 10) return '#f59e0b'; // High - Amber
  if (score >= 5) return '#3b82f6';  // Medium - Blue
  return '#10b981';                   // Low - Green
}

export function getRiskTrend(currentScore: number, previousScore: number): 'increasing' | 'decreasing' | 'stable' {
  if (currentScore > previousScore) return 'increasing';
  if (currentScore < previousScore) return 'decreasing';
  return 'stable';
}

export function calculateResidualRisk(originalScore: number, mitigationEffectiveness: number): number {
  // mitigationEffectiveness is 0-100 (percentage)
  const reduction = originalScore * (mitigationEffectiveness / 100);
  return Math.max(1, Math.round(originalScore - reduction));
}

export function getRisksByCategory(risks: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  risks.forEach(risk => {
    counts[risk.category] = (counts[risk.category] || 0) + 1;
  });
  
  return counts;
}

export function getOpenRisksCount(risks: any[]): number {
  return risks.filter(r => r.status === 'open').length;
}

export function getHighPriorityRisks(risks: any[]): any[] {
  return risks.filter(r => r.riskScore >= 10);
}

export function calculateAverageRiskScore(risks: any[]): number {
  if (risks.length === 0) return 0;
  
  const total = risks.reduce((sum, risk) => sum + (risk.riskScore || 0), 0);
  return Math.round(total / risks.length);
}

describe('Risk Register Utilities', () => {
  describe('calculateRiskScore', () => {
    it('should calculate risk score correctly', () => {
      expect(calculateRiskScore(3, 4)).toBe(12);
      expect(calculateRiskScore(5, 5)).toBe(25);
      expect(calculateRiskScore(1, 1)).toBe(1);
    });

    it('should clamp probability to valid range', () => {
      expect(calculateRiskScore(0, 3)).toBe(3);
      expect(calculateRiskScore(6, 3)).toBe(15);
      expect(calculateRiskScore(-1, 3)).toBe(3);
    });

    it('should clamp impact to valid range', () => {
      expect(calculateRiskScore(3, 0)).toBe(3);
      expect(calculateRiskScore(3, 6)).toBe(15);
      expect(calculateRiskScore(3, -1)).toBe(3);
    });
  });

  describe('getRiskLevel', () => {
    it('should return critical for scores 15+', () => {
      expect(getRiskLevel(15)).toBe('critical');
      expect(getRiskLevel(20)).toBe('critical');
      expect(getRiskLevel(25)).toBe('critical');
    });

    it('should return high for scores 10-14', () => {
      expect(getRiskLevel(10)).toBe('high');
      expect(getRiskLevel(12)).toBe('high');
      expect(getRiskLevel(14)).toBe('high');
    });

    it('should return medium for scores 5-9', () => {
      expect(getRiskLevel(5)).toBe('medium');
      expect(getRiskLevel(7)).toBe('medium');
      expect(getRiskLevel(9)).toBe('medium');
    });

    it('should return low for scores 1-4', () => {
      expect(getRiskLevel(1)).toBe('low');
      expect(getRiskLevel(2)).toBe('low');
      expect(getRiskLevel(4)).toBe('low');
    });
  });

  describe('getRiskScoreColor', () => {
    it('should return red for critical risks', () => {
      expect(getRiskScoreColor(15)).toBe('#dc2626');
    });

    it('should return amber for high risks', () => {
      expect(getRiskScoreColor(10)).toBe('#f59e0b');
    });

    it('should return blue for medium risks', () => {
      expect(getRiskScoreColor(5)).toBe('#3b82f6');
    });

    it('should return green for low risks', () => {
      expect(getRiskScoreColor(1)).toBe('#10b981');
    });
  });

  describe('getRiskTrend', () => {
    it('should return increasing when score goes up', () => {
      expect(getRiskTrend(10, 5)).toBe('increasing');
    });

    it('should return decreasing when score goes down', () => {
      expect(getRiskTrend(5, 10)).toBe('decreasing');
    });

    it('should return stable when score is same', () => {
      expect(getRiskTrend(5, 5)).toBe('stable');
    });
  });

  describe('calculateResidualRisk', () => {
    it('should calculate residual risk with 50% mitigation', () => {
      expect(calculateResidualRisk(10, 50)).toBe(5);
    });

    it('should calculate residual risk with 100% mitigation', () => {
      expect(calculateResidualRisk(10, 100)).toBe(1);
    });

    it('should calculate residual risk with 0% mitigation', () => {
      expect(calculateResidualRisk(10, 0)).toBe(10);
    });

    it('should not go below 1', () => {
      expect(calculateResidualRisk(2, 90)).toBe(1);
    });
  });

  describe('getRisksByCategory', () => {
    it('should count risks by category', () => {
      const risks = [
        { category: 'technical' },
        { category: 'technical' },
        { category: 'financial' },
        { category: 'schedule' },
        { category: 'technical' },
      ];

      const counts = getRisksByCategory(risks);

      expect(counts['technical']).toBe(3);
      expect(counts['financial']).toBe(1);
      expect(counts['schedule']).toBe(1);
    });

    it('should return empty object for empty array', () => {
      expect(getRisksByCategory([])).toEqual({});
    });
  });

  describe('getOpenRisksCount', () => {
    it('should count open risks', () => {
      const risks = [
        { status: 'open' },
        { status: 'mitigated' },
        { status: 'open' },
        { status: 'closed' },
      ];

      expect(getOpenRisksCount(risks)).toBe(2);
    });

    it('should return 0 for empty array', () => {
      expect(getOpenRisksCount([])).toBe(0);
    });
  });

  describe('getHighPriorityRisks', () => {
    it('should filter high priority risks', () => {
      const risks = [
        { id: '1', riskScore: 15 },
        { id: '2', riskScore: 5 },
        { id: '3', riskScore: 12 },
        { id: '4', riskScore: 3 },
      ];

      const highPriority = getHighPriorityRisks(risks);

      expect(highPriority).toHaveLength(2);
      expect(highPriority.map(r => r.id)).toContain('1');
      expect(highPriority.map(r => r.id)).toContain('3');
    });

    it('should return empty array for no high priority', () => {
      const risks = [
        { riskScore: 5 },
        { riskScore: 3 },
      ];

      expect(getHighPriorityRisks(risks)).toHaveLength(0);
    });
  });

  describe('calculateAverageRiskScore', () => {
    it('should calculate average score', () => {
      const risks = [
        { riskScore: 10 },
        { riskScore: 15 },
        { riskScore: 5 },
      ];

      expect(calculateAverageRiskScore(risks)).toBe(10);
    });

    it('should return 0 for empty array', () => {
      expect(calculateAverageRiskScore([])).toBe(0);
    });

    it('should handle risks without score', () => {
      const risks = [
        { riskScore: 10 },
        {}, // No score
        { riskScore: 20 },
      ];

      expect(calculateAverageRiskScore(risks)).toBe(10);
    });
  });
});

const {
  calculateMatchScore,
  calculateAvailabilityOverlap,
  calculateHaversineDistance,
  calculateProficiencyBonus
} = require('../../src/services/matchingService');

describe('Matching Engine Unit Tests (Phase 3)', () => {
  const guitarSkill = { _id: 'skill_guitar_01', name: 'Acoustic Guitar', category: 'Music' };
  const cookingSkill = { _id: 'skill_cooking_02', name: 'Italian Pasta Making', category: 'Cooking' };
  const pythonSkill = { _id: 'skill_python_03', name: 'Python for Data Science', category: 'Coding' };
  const pianoSkill = { _id: 'skill_piano_04', name: 'Piano & Keyboard', category: 'Music' };

  const baseUserA = {
    _id: 'user_a_001',
    name: 'Alice',
    location: { city: 'Boston', coordinates: { lat: 42.3601, lng: -71.0589 } },
    availability: [
      {
        dayOfWeek: 'Saturday',
        slots: [{ startTime: '10:00', endTime: '12:00' }]
      }
    ],
    ratingAverage: 4.8,
    ratingCount: 10
  };

  const baseUserB = {
    _id: 'user_b_002',
    name: 'Bob',
    location: { city: 'Boston', coordinates: { lat: 42.3605, lng: -71.0595 } },
    availability: [
      {
        dayOfWeek: 'Saturday',
        slots: [{ startTime: '11:00', endTime: '13:00' }] // Overlaps 11:00-12:00
      }
    ],
    ratingAverage: 4.9,
    ratingCount: 15
  };

  describe('1. Mutual Match Scenario', () => {
    it('should identify a mutual match when A teaches what B wants and B teaches what A wants', () => {
      // Alice teaches Guitar, wants Cooking
      const userASkills = [
        { skill: guitarSkill, type: 'TEACH', proficiency: 'Expert' },
        { skill: cookingSkill, type: 'LEARN', proficiency: 'Beginner' }
      ];

      // Bob teaches Cooking, wants Guitar
      const userBSkills = [
        { skill: cookingSkill, type: 'TEACH', proficiency: 'Expert' },
        { skill: guitarSkill, type: 'LEARN', proficiency: 'Beginner' }
      ];

      const result = calculateMatchScore(baseUserA, baseUserB, userASkills, userBSkills);

      expect(result.isMatch).toBe(true);
      expect(result.matchType).toBe('MUTUAL');
      expect(result.isCreditBased).toBe(false);
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.primaryOfferedSkill.name).toBe('Acoustic Guitar');
      expect(result.primaryRequestedSkill.name).toBe('Italian Pasta Making');
      expect(result.explanation.summary).toContain('Mutual Match');
    });
  });

  describe('2. One-Way Credit Match Scenario', () => {
    it('should identify a one-way credit match when B teaches what A wants, but A does not teach what B wants', () => {
      // Alice teaches Guitar, wants Python
      const userASkills = [
        { skill: guitarSkill, type: 'TEACH', proficiency: 'Expert' },
        { skill: pythonSkill, type: 'LEARN', proficiency: 'Beginner' }
      ];

      // Bob teaches Python, wants Piano (Alice does not teach Piano)
      const userBSkills = [
        { skill: pythonSkill, type: 'TEACH', proficiency: 'Intermediate' },
        { skill: pianoSkill, type: 'LEARN', proficiency: 'Beginner' }
      ];

      const result = calculateMatchScore(baseUserA, baseUserB, userASkills, userBSkills);

      expect(result.isMatch).toBe(true);
      expect(result.matchType).toBe('ONE_WAY');
      expect(result.isCreditBased).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(30);
      expect(result.primaryOfferedSkill).toBeNull();
      expect(result.primaryRequestedSkill.name).toBe('Python for Data Science');
      expect(result.explanation.summary).toContain('One-Way');
    });
  });

  describe('3. No-Match Scenario', () => {
    it('should return score 0 and isMatch false when candidate teaches nothing the user wants', () => {
      // Alice wants Cooking
      const userASkills = [
        { skill: guitarSkill, type: 'TEACH', proficiency: 'Expert' },
        { skill: cookingSkill, type: 'LEARN', proficiency: 'Beginner' }
      ];

      // Bob teaches Python (not Cooking)
      const userBSkills = [
        { skill: pythonSkill, type: 'TEACH', proficiency: 'Expert' },
        { skill: guitarSkill, type: 'LEARN', proficiency: 'Beginner' }
      ];

      const result = calculateMatchScore(baseUserA, baseUserB, userASkills, userBSkills);

      expect(result.isMatch).toBe(false);
      expect(result.matchType).toBe('NONE');
      expect(result.score).toBe(0);
    });
  });

  describe('4. Bonus Points Calculation', () => {
    it('should award location bonus for matching city / close proximity', () => {
      const userASkills = [{ skill: pythonSkill, type: 'LEARN', proficiency: 'Beginner' }];
      const userBSkills = [{ skill: pythonSkill, type: 'TEACH', proficiency: 'Intermediate' }];

      const userSameCity = { ...baseUserB, location: { city: 'Boston' } };
      const userDiffCity = { ...baseUserB, location: { city: 'Seattle' }, coordinates: null };

      const scoreSameCity = calculateMatchScore(baseUserA, userSameCity, userASkills, userBSkills);
      const scoreDiffCity = calculateMatchScore(baseUserA, userDiffCity, userASkills, userBSkills);

      expect(scoreSameCity.score).toBeGreaterThan(scoreDiffCity.score);
    });

    it('should award availability bonus for overlapping time windows', () => {
      const availA = [
        { dayOfWeek: 'Sunday', slots: [{ startTime: '14:00', endTime: '16:00' }] }
      ];
      const availB = [
        { dayOfWeek: 'Sunday', slots: [{ startTime: '15:00', endTime: '17:00' }] }
      ];
      const availNoOverlap = [
        { dayOfWeek: 'Monday', slots: [{ startTime: '15:00', endTime: '17:00' }] }
      ];

      expect(calculateAvailabilityOverlap(availA, availB)).toBe(1);
      expect(calculateAvailabilityOverlap(availA, availNoOverlap)).toBe(0);
    });

    it('should award proficiency bonus based on teacher-learner experience tiers', () => {
      expect(calculateProficiencyBonus('Beginner', 'Expert')).toBe(10);
      expect(calculateProficiencyBonus('Intermediate', 'Expert')).toBe(10);
      expect(calculateProficiencyBonus('Intermediate', 'Intermediate')).toBe(7);
      expect(calculateProficiencyBonus('Expert', 'Expert')).toBe(8);
    });
  });

  describe('5. Tie Case & Deterministic Sorting', () => {
    it('should break score ties by candidate average rating and rating count', () => {
      const candidate1 = {
        name: 'Candidate 1',
        score: 85,
        user: { ratingAverage: 4.9, ratingCount: 20 }
      };
      const candidate2 = {
        name: 'Candidate 2',
        score: 85,
        user: { ratingAverage: 4.5, ratingCount: 30 }
      };
      const candidate3 = {
        name: 'Candidate 3',
        score: 95,
        user: { ratingAverage: 4.2, ratingCount: 5 }
      };

      const candidates = [candidate1, candidate2, candidate3];

      // Sort logic identical to getRankedMatchesForUser
      candidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.user.ratingAverage !== a.user.ratingAverage) {
          return (b.user.ratingAverage || 0) - (a.user.ratingAverage || 0);
        }
        return (b.user.ratingCount || 0) - (a.user.ratingCount || 0);
      });

      expect(candidates[0].name).toBe('Candidate 3'); // Score 95
      expect(candidates[1].name).toBe('Candidate 1'); // Score 85, rating 4.9
      expect(candidates[2].name).toBe('Candidate 2'); // Score 85, rating 4.5
    });
  });
});


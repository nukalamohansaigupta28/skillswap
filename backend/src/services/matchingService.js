const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Skill = require('../models/Skill');

/**
 * Calculates Haversine distance in kilometers between two lat/lng coordinates
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculates availability overlap between two users
 * Returns number of overlapping time slots
 */
const calculateAvailabilityOverlap = (availA = [], availB = []) => {
  if (!Array.isArray(availA) || !Array.isArray(availB)) return 0;
  let overlappingSlotsCount = 0;

  for (const dayScheduleA of availA) {
    const matchingDayB = availB.find(
      (dayB) => dayB.dayOfWeek?.toLowerCase() === dayScheduleA.dayOfWeek?.toLowerCase()
    );
    if (!matchingDayB || !Array.isArray(matchingDayB.slots)) continue;

    for (const slotA of dayScheduleA.slots || []) {
      for (const slotB of matchingDayB.slots || []) {
        // Compare slot times e.g. "10:00" and "12:00"
        if (slotA.startTime && slotA.endTime && slotB.startTime && slotB.endTime) {
          const startMax = slotA.startTime > slotB.startTime ? slotA.startTime : slotB.startTime;
          const endMin = slotA.endTime < slotB.endTime ? slotA.endTime : slotB.endTime;
          if (startMax < endMin) {
            overlappingSlotsCount++;
          }
        }
      }
    }
  }

  return overlappingSlotsCount;
};

/**
 * Calculates proficiency fit bonus points (+up to 10)
 */
const calculateProficiencyBonus = (learnerProf = 'Beginner', teacherProf = 'Intermediate') => {
  const l = (learnerProf || 'Beginner').toLowerCase();
  const t = (teacherProf || 'Intermediate').toLowerCase();

  if (l === 'beginner' && (t === 'expert' || t === 'intermediate')) return 10;
  if (l === 'intermediate' && t === 'expert') return 10;
  if (l === 'intermediate' && t === 'intermediate') return 7;
  if (l === 'expert' && t === 'expert') return 8;
  return 4;
};

/**
 * Core Matching Scoring Function
 * Compares User A (current user) and User B (candidate user)
 */
const calculateMatchScore = (userA, userB, userASkills = [], userBSkills = []) => {
  // A's skills
  const aTeaches = userASkills.filter((s) => s.type === 'TEACH');
  const aWants = userASkills.filter((s) => s.type === 'LEARN');

  // B's skills
  const bTeaches = userBSkills.filter((s) => s.type === 'TEACH');
  const bWants = userBSkills.filter((s) => s.type === 'LEARN');

  // Find what B teaches that A wants to learn
  const bTeachesWhatAWants = [];
  for (const learnItem of aWants) {
    const learnSkillId = learnItem.skill?._id?.toString() || learnItem.skill?.toString();
    const teachItem = bTeaches.find((t) => {
      const teachSkillId = t.skill?._id?.toString() || t.skill?.toString();
      return teachSkillId === learnSkillId;
    });
    if (teachItem) {
      bTeachesWhatAWants.push({
        skill: teachItem.skill,
        learnerItem: learnItem,
        teacherItem: teachItem
      });
    }
  }

  // If candidate B teaches nothing that User A wants to learn, no match
  if (bTeachesWhatAWants.length === 0) {
    return {
      score: 0,
      isMatch: false,
      matchType: 'NONE',
      explanation: {
        summary: 'No complementary skill match.',
        factors: []
      }
    };
  }

  // Find what A teaches that B wants to learn
  const aTeachesWhatBWants = [];
  for (const learnItem of bWants) {
    const learnSkillId = learnItem.skill?._id?.toString() || learnItem.skill?.toString();
    const teachItem = aTeaches.find((t) => {
      const teachSkillId = t.skill?._id?.toString() || t.skill?.toString();
      return teachSkillId === learnSkillId;
    });
    if (teachItem) {
      aTeachesWhatBWants.push({
        skill: teachItem.skill,
        learnerItem: learnItem,
        teacherItem: teachItem
      });
    }
  }

  const isMutual = aTeachesWhatBWants.length > 0;
  const matchType = isMutual ? 'MUTUAL' : 'ONE_WAY';
  const isCreditBased = !isMutual;

  // Base score: 60 for mutual match, 30 for one-way credit-based match
  let baseScore = isMutual ? 60 : 30;
  const factors = [];

  const offeredSkillName = isMutual
    ? (aTeachesWhatBWants[0].skill?.name || 'Your skill')
    : null;
  const requestedSkillName = bTeachesWhatAWants[0].skill?.name || 'Their skill';

  factors.push({
    name: isMutual ? 'Mutual Skill Swap' : 'One-Way Learning Match',
    points: baseScore,
    detail: isMutual
      ? `You teach "${offeredSkillName}", they teach "${requestedSkillName}".`
      : `They teach "${requestedSkillName}" (Skill credits used).`
  });

  // 1. Location Proximity Bonus (+up to 15)
  let locationBonus = 0;
  const cityA = userA.location?.city?.trim().toLowerCase();
  const cityB = userB.location?.city?.trim().toLowerCase();

  const distance = calculateHaversineDistance(
    userA.location?.coordinates?.lat,
    userA.location?.coordinates?.lng,
    userB.location?.coordinates?.lat,
    userB.location?.coordinates?.lng
  );

  if (distance !== null && distance <= 15) {
    locationBonus = 15;
    factors.push({
      name: 'Location Proximity',
      points: locationBonus,
      detail: `Within ${Math.round(distance)} km distance.`
    });
  } else if (cityA && cityB && cityA === cityB) {
    locationBonus = 15;
    factors.push({
      name: 'Location Proximity',
      points: locationBonus,
      detail: `Both located in ${userA.location.city}.`
    });
  } else if (distance !== null && distance <= 40) {
    locationBonus = 8;
    factors.push({
      name: 'Location Proximity',
      points: locationBonus,
      detail: `Within driving distance (${Math.round(distance)} km).`
    });
  }

  // 2. Availability Overlap Bonus (+up to 15)
  const overlapCount = calculateAvailabilityOverlap(userA.availability, userB.availability);
  let availabilityBonus = 0;
  if (overlapCount >= 3) {
    availabilityBonus = 15;
  } else if (overlapCount === 2) {
    availabilityBonus = 10;
  } else if (overlapCount === 1) {
    availabilityBonus = 5;
  }

  if (availabilityBonus > 0) {
    factors.push({
      name: 'Schedule Availability',
      points: availabilityBonus,
      detail: `${overlapCount} overlapping time slot(s) during the week.`
    });
  }

  // 3. Rating & Reputation Bonus (+up to 10)
  const rating = userB.ratingAverage || 0;
  let ratingBonus = 0;
  if (rating >= 4.5) {
    ratingBonus = 10;
  } else if (rating >= 4.0) {
    ratingBonus = 7;
  } else if (rating >= 3.5) {
    ratingBonus = 4;
  } else if (userB.ratingCount === 0) {
    ratingBonus = 5; // New member welcoming bonus
  }

  if (ratingBonus > 0) {
    factors.push({
      name: 'Teacher Rating',
      points: ratingBonus,
      detail: userB.ratingCount > 0
        ? `${rating.toFixed(1)} average rating across ${userB.ratingCount} reviews.`
        : 'New verified member bonus.'
    });
  }

  // 4. Proficiency Fit Bonus (+up to 10)
  const learnerPref = bTeachesWhatAWants[0].learnerItem?.proficiency || 'Beginner';
  const teacherProf = bTeachesWhatAWants[0].teacherItem?.proficiency || 'Intermediate';
  const proficiencyBonus = calculateProficiencyBonus(learnerPref, teacherProf);

  factors.push({
    name: 'Proficiency Alignment',
    points: proficiencyBonus,
    detail: `You seek ${learnerPref} level, teacher provides ${teacherProf} expertise.`
  });

  // Composite Score (0 - 100)
  const totalScore = Math.min(
    100,
    baseScore + locationBonus + availabilityBonus + ratingBonus + proficiencyBonus
  );

  const summary = isMutual
    ? `Mutual Match! You can teach ${offeredSkillName} which they want, and they teach ${requestedSkillName} which you want.`
    : `One-Way Credit Match! They teach ${requestedSkillName} which you want to learn.`;

  return {
    score: totalScore,
    isMatch: true,
    matchType,
    isCreditBased,
    primaryOfferedSkill: isMutual ? aTeachesWhatBWants[0].skill : null,
    primaryRequestedSkill: bTeachesWhatAWants[0].skill,
    complementarySkills: {
      bTeachesWhatAWants: bTeachesWhatAWants.map((item) => item.skill),
      aTeachesWhatBWants: aTeachesWhatBWants.map((item) => item.skill),
      candidateTeaches: bTeachesWhatAWants.map((item) => ({
        skill: item.skill,
        proficiency: item.proficiency || 'Intermediate'
      })),
      userTeaches: aTeachesWhatBWants.map((item) => ({
        skill: item.skill,
        proficiency: item.proficiency || 'Intermediate'
      }))
    },
    scoreBreakdown: {
      baseScore,
      locationBonus,
      availabilityBonus,
      ratingBonus,
      proficiencyBonus
    },
    explanation: {
      summary,
      factors
    }
  };
};

/**
 * Service to retrieve ranked match recommendations for a given user
 */
const getRankedMatchesForUser = async (userId, options = {}) => {
  const { category, city, matchType, page = 1, limit = 10 } = options;

  const currentUser = await User.findById(userId);
  if (!currentUser) {
    throw new Error('User not found');
  }

  // Fetch current user's skills
  const currentUserSkills = await UserSkill.find({ user: userId }).populate('skill');

  if (currentUserSkills.length === 0) {
    return {
      total: 0,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: 0,
      matches: []
    };
  }

  // Query candidate active users (excluding current user)
  const candidateFilter = {
    _id: { $ne: userId },
    status: 'active'
  };

  if (city) {
    candidateFilter['location.city'] = { $regex: new RegExp(city.trim(), 'i') };
  }

  const candidates = await User.find(candidateFilter);
  const candidateIds = candidates.map((c) => c._id);

  // Fetch all candidate skills
  const allCandidateSkills = await UserSkill.find({
    user: { $in: candidateIds }
  }).populate('skill');

  // Compute matches and score
  const matchResults = [];

  for (const candidate of candidates) {
    const candidateSkills = allCandidateSkills.filter(
      (s) => s.user.toString() === candidate._id.toString()
    );

    // Optional category filter: check if candidate has skills in specified category
    if (category) {
      const hasCategory = candidateSkills.some(
        (cs) => cs.skill?.category?.toLowerCase() === category.toLowerCase()
      );
      if (!hasCategory) continue;
    }

    const matchAnalysis = calculateMatchScore(
      currentUser,
      candidate,
      currentUserSkills,
      candidateSkills
    );

    if (matchAnalysis.isMatch) {
      if (matchType && matchType !== 'ALL' && matchAnalysis.matchType !== matchType.toUpperCase()) {
        continue;
      }

      matchResults.push({
        user: {
          _id: candidate._id,
          name: candidate.name,
          bio: candidate.bio,
          location: candidate.location,
          photoUrl: candidate.photoUrl,
          ratingAverage: candidate.ratingAverage,
          ratingCount: candidate.ratingCount,
          lastActiveAt: candidate.lastActiveAt
        },
        candidate: {
          _id: candidate._id,
          name: candidate.name,
          bio: candidate.bio,
          location: candidate.location,
          photoUrl: candidate.photoUrl,
          ratingAverage: candidate.ratingAverage,
          ratingCount: candidate.ratingCount,
          lastActiveAt: candidate.lastActiveAt
        },
        score: matchAnalysis.score,
        matchType: matchAnalysis.matchType,
        isCreditBased: matchAnalysis.isCreditBased,
        primaryOfferedSkill: matchAnalysis.primaryOfferedSkill,
        primaryRequestedSkill: matchAnalysis.primaryRequestedSkill,
        complementarySkills: matchAnalysis.complementarySkills,
        scoreBreakdown: matchAnalysis.scoreBreakdown,
        explanation: matchAnalysis.explanation
      });
    }
  }

  // Sort descending by score; break ties by ratingAverage and ratingCount
  matchResults.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.user.ratingAverage !== a.user.ratingAverage) {
      return (b.user.ratingAverage || 0) - (a.user.ratingAverage || 0);
    }
    return (b.user.ratingCount || 0) - (a.user.ratingCount || 0);
  });

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const total = matchResults.length;
  const paginatedMatches = matchResults.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
    matches: paginatedMatches
  };
};

module.exports = {
  calculateMatchScore,
  calculateAvailabilityOverlap,
  calculateHaversineDistance,
  calculateProficiencyBonus,
  getRankedMatchesForUser
};

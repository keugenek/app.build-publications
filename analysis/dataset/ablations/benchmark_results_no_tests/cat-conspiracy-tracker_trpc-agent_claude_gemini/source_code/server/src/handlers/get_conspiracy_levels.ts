// Utility handler for conspiracy level calculations and constants

export interface ConspiracyLevelInfo {
    level: 'innocent' | 'suspicious' | 'plotting' | 'dangerous' | 'world_domination';
    minPoints: number;
    maxPoints: number;
    description: string;
}

// Define conspiracy level thresholds
export const CONSPIRACY_LEVELS: ConspiracyLevelInfo[] = [
    {
        level: 'innocent',
        minPoints: 0,
        maxPoints: 20,
        description: "Your cat appears to be behaving normally today. But don't let your guard down..."
    },
    {
        level: 'suspicious',
        minPoints: 21,
        maxPoints: 50,
        description: "Some questionable activities detected. Keep an eye on your feline friend."
    },
    {
        level: 'plotting',
        minPoints: 51,
        maxPoints: 100,
        description: "Definite signs of conspiracy! Your cat is planning something significant."
    },
    {
        level: 'dangerous',
        minPoints: 101,
        maxPoints: 150,
        description: "High alert! Your cat is actively engaged in suspicious operations."
    },
    {
        level: 'world_domination',
        minPoints: 151,
        maxPoints: Infinity,
        description: "MAXIMUM THREAT LEVEL! Your cat has clearly begun their plan for world domination!"
    }
];

export function calculateConspiracyLevel(totalPoints: number): ConspiracyLevelInfo {
    // Handle negative points by treating them as 0
    const normalizedPoints = Math.max(0, totalPoints);
    
    // Find the appropriate conspiracy level based on points
    for (const levelInfo of CONSPIRACY_LEVELS) {
        if (normalizedPoints >= levelInfo.minPoints && normalizedPoints <= levelInfo.maxPoints) {
            return levelInfo;
        }
    }
    
    // Default to innocent if no match (shouldn't happen with current thresholds)
    return CONSPIRACY_LEVELS[0];
}

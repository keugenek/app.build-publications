import { describe, expect, it } from 'bun:test';
import { calculatePlantMood } from '../handlers/calculate_mood';
import { type Plant } from '../schema';

// Helper function to create a test plant with specified watering date and light exposure
const createTestPlant = (daysAgo: number, lightExposure: 'low' | 'medium' | 'high'): Plant => {
  const wateredDate = new Date();
  wateredDate.setDate(wateredDate.getDate() - daysAgo);
  
  return {
    id: 1,
    name: 'Test Plant',
    type: 'Test Type',
    last_watered_date: wateredDate,
    light_exposure: lightExposure,
    created_at: new Date(),
    updated_at: new Date()
  };
};

describe('calculatePlantMood', () => {
  describe('Happy mood conditions', () => {
    it('should return Happy for recently watered plant with medium light', () => {
      const plant = createTestPlant(3, 'medium'); // Watered 3 days ago
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Happy');
    });

    it('should return Happy for recently watered plant with high light', () => {
      const plant = createTestPlant(1, 'high'); // Watered 1 day ago
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Happy');
    });

    it('should return Happy for plant watered exactly 6 days ago with good light', () => {
      const plant = createTestPlant(6, 'medium'); // Edge case: 6 days ago (still recent)
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Happy');
    });

    it('should return Happy for plant watered today with high light', () => {
      const plant = createTestPlant(0, 'high'); // Watered today
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Happy');
    });
  });

  describe('Thirsty mood conditions', () => {
    it('should return Thirsty for plant not watered for 7+ days with medium light', () => {
      const plant = createTestPlant(8, 'medium'); // Watered 8 days ago
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Thirsty');
    });

    it('should return Thirsty for plant not watered for 7+ days with high light', () => {
      const plant = createTestPlant(10, 'high'); // Watered 10 days ago
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Thirsty');
    });

    it('should return Thirsty for plant watered exactly 7 days ago with good light', () => {
      const plant = createTestPlant(7, 'medium'); // Edge case: 7 days ago (no longer recent)
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Thirsty');
    });

    it('should return Thirsty for plant watered weeks ago with high light', () => {
      const plant = createTestPlant(14, 'high'); // Watered 14 days ago
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Thirsty');
    });
  });

  describe('Needs Sun mood conditions', () => {
    it('should return Needs Sun for recently watered plant with low light', () => {
      const plant = createTestPlant(2, 'low'); // Watered 2 days ago
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Needs Sun');
    });

    it('should return Needs Sun for plant watered today with low light', () => {
      const plant = createTestPlant(0, 'low'); // Watered today
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Needs Sun');
    });

    it('should return Needs Sun for plant watered exactly 6 days ago with low light', () => {
      const plant = createTestPlant(6, 'low'); // Edge case: 6 days ago with low light
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Needs Sun');
    });
  });

  describe('Wilting mood conditions', () => {
    it('should return Wilting for plant not watered for 7+ days with low light', () => {
      const plant = createTestPlant(8, 'low'); // Watered 8 days ago
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Wilting');
    });

    it('should return Wilting for plant watered exactly 7 days ago with low light', () => {
      const plant = createTestPlant(7, 'low'); // Edge case: 7 days ago with low light
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Wilting');
    });

    it('should return Wilting for plant watered weeks ago with low light', () => {
      const plant = createTestPlant(21, 'low'); // Watered 21 days ago
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Wilting');
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle future watering dates gracefully', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      
      const plant: Plant = {
        id: 1,
        name: 'Future Plant',
        type: 'Test Type',
        last_watered_date: futureDate,
        light_exposure: 'medium',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Happy'); // Future date should be treated as very recent
    });

    it('should handle plants watered many months ago', () => {
      const plant = createTestPlant(100, 'medium'); // Watered 100 days ago
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Thirsty');
    });

    it('should handle plants with various light exposure combinations', () => {
      // Test all light exposure levels with recent watering
      const lowLightPlant = createTestPlant(1, 'low');
      const mediumLightPlant = createTestPlant(1, 'medium');
      const highLightPlant = createTestPlant(1, 'high');

      expect(calculatePlantMood(lowLightPlant)).toBe('Needs Sun');
      expect(calculatePlantMood(mediumLightPlant)).toBe('Happy');
      expect(calculatePlantMood(highLightPlant)).toBe('Happy');
    });
  });

  describe('Time calculation accuracy', () => {
    it('should correctly calculate days for plants watered hours ago', () => {
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - 12); // 12 hours ago
      
      const plant: Plant = {
        id: 1,
        name: 'Recent Plant',
        type: 'Test Type',
        last_watered_date: hoursAgo,
        light_exposure: 'medium',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Happy'); // Should still be considered recent (same day)
    });

    it('should handle exact 7-day boundary correctly', () => {
      // Create a date exactly 7 days ago
      const exactlySevenDays = new Date();
      exactlySevenDays.setDate(exactlySevenDays.getDate() - 7);
      exactlySevenDays.setHours(exactlySevenDays.getHours() - 1); // Ensure it's over 7 days
      
      const plant: Plant = {
        id: 1,
        name: 'Boundary Plant',
        type: 'Test Type',
        last_watered_date: exactlySevenDays,
        light_exposure: 'medium',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const mood = calculatePlantMood(plant);
      expect(mood).toBe('Thirsty'); // Should be thirsty after 7+ days
    });
  });
});

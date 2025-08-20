import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type EngineeringDiscipline } from '../schema';
import { getEngineeringDisciplines } from '../handlers/get_engineering_disciplines';

describe('getEngineeringDisciplines', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all engineering disciplines', async () => {
    const result = await getEngineeringDisciplines();

    // Verify we get an array of disciplines
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(10);

    // Verify all expected disciplines are present
    const expectedDisciplines: EngineeringDiscipline[] = [
      'Software',
      'Electrical',
      'Mechanical',
      'Civil',
      'Chemical',
      'Aerospace',
      'Biomedical',
      'Environmental',
      'Industrial',
      'Materials'
    ];

    expectedDisciplines.forEach(discipline => {
      expect(result).toContain(discipline);
    });
  });

  it('should return disciplines in the expected order', async () => {
    const result = await getEngineeringDisciplines();

    // Verify the order matches our schema definition
    expect(result[0]).toBe('Software');
    expect(result[1]).toBe('Electrical');
    expect(result[2]).toBe('Mechanical');
    expect(result[3]).toBe('Civil');
    expect(result[4]).toBe('Chemical');
    expect(result[5]).toBe('Aerospace');
    expect(result[6]).toBe('Biomedical');
    expect(result[7]).toBe('Environmental');
    expect(result[8]).toBe('Industrial');
    expect(result[9]).toBe('Materials');
  });

  it('should return consistent results on multiple calls', async () => {
    const result1 = await getEngineeringDisciplines();
    const result2 = await getEngineeringDisciplines();

    // Results should be identical
    expect(result1).toEqual(result2);
    expect(result1.length).toBe(result2.length);
    
    // Verify each element matches
    result1.forEach((discipline, index) => {
      expect(result2[index]).toBe(discipline);
    });
  });

  it('should return valid EngineeringDiscipline types', async () => {
    const result = await getEngineeringDisciplines();

    // Each result should be a string matching the EngineeringDiscipline type
    result.forEach(discipline => {
      expect(typeof discipline).toBe('string');
      expect(discipline.length).toBeGreaterThan(0);
    });
  });

  it('should not return duplicate disciplines', async () => {
    const result = await getEngineeringDisciplines();

    // Convert to Set and compare lengths to check for duplicates
    const uniqueDisciplines = new Set(result);
    expect(uniqueDisciplines.size).toBe(result.length);
  });
});

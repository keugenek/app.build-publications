import { type EngineeringDiscipline } from '../schema';

export const getEngineeringDisciplines = async (): Promise<EngineeringDiscipline[]> => {
  try {
    // Return all available engineering disciplines as defined in the schema
    // This provides a consistent source of truth for frontend dropdown lists
    const disciplines: EngineeringDiscipline[] = [
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
    
    return disciplines;
  } catch (error) {
    console.error('Failed to get engineering disciplines:', error);
    throw error;
  }
};

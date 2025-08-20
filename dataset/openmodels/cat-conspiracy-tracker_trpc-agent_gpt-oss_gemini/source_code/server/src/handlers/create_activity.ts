import { type CreateActivityInput, type Activity } from '../schema';

// Stub implementation for creating an activity. Real implementation would insert into DB.
export const createActivity = async (input: CreateActivityInput): Promise<Activity> => {
  return {
    id: 0,
    cat_id: input.cat_id,
    description: input.description,
    suspicion_score: input.suspicion_score,
    activity_date: input.activity_date,
    created_at: new Date()
  } as Activity;
};

import { type LoginInput, type User } from '../schema';

/**
 * Placeholder handler for user login.
 * In a real implementation this would verify the password hash and return the user.
 */
export const loginUser = async (input: LoginInput): Promise<User> => {
  // Dummy implementation – returns a mock user.
  return {
    id: 1,
    email: input.email,
    created_at: new Date(),
  } as User;
};

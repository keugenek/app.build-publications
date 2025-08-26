import { type RegisterUserInput, type User } from '../schema';

export const registerUser = async (input: RegisterUserInput): Promise<User> => {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is registering a new user in the database.
    return Promise.resolve({
        id: 0, // Placeholder ID
        email: input.email,
        name: input.name,
        created_at: new Date()
    } as User);
};

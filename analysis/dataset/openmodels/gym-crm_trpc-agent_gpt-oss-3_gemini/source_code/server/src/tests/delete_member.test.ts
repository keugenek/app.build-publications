import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { db } from '../db';
import { membersTable, classesTable, reservationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createDB, resetDB } from '../helpers';
import { deleteMember } from '../handlers/delete_member';
import { type CreateMemberInput, type CreateClassInput } from '../schema';

// Helper to create a member
const createMember = async (input: CreateMemberInput) => {
  const result = await db
    .insert(membersTable)
    .values({ name: input.name, email: input.email })
    .returning()
    .execute();
  return result[0];
};

// Helper to create a class
const createClass = async (input: CreateClassInput) => {
  const result = await db
    .insert(classesTable)
    .values({
      name: input.name,
      description: input.description ?? null,
      capacity: input.capacity,
      instructor: input.instructor,
      scheduled_at: input.scheduled_at,
    })
    .returning()
    .execute();
  return result[0];
};

describe('deleteMember handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('deletes a member and returns its data', async () => {
    const member = await createMember({ name: 'John Doe', email: 'john@example.com' });
    const result = await deleteMember(member.id);
    expect(result.id).toBe(member.id);
    expect(result.name).toBe(member.name);
    expect(result.email).toBe(member.email);
    // created_at should be a Date instance
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('removes the member from the database', async () => {
    const member = await createMember({ name: 'Jane', email: 'jane@example.com' });
    await deleteMember(member.id);
    const found = await db.select().from(membersTable).where(eq(membersTable.id, member.id)).execute();
    expect(found).toHaveLength(0);
  });

  it('cascades delete to reservations', async () => {
    // Create a class and a member, then a reservation linking them
    const classRecord = await createClass({
      name: 'Yoga',
      description: null,
      capacity: 10,
      instructor: 'Alice',
      scheduled_at: new Date(),
    });
    const member = await createMember({ name: 'Bob', email: 'bob@example.com' });
    // Insert reservation
    await db
      .insert(reservationsTable)
      .values({ class_id: classRecord.id, member_id: member.id })
      .execute();

    // Ensure reservation exists
    const pre = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.member_id, member.id))
      .execute();
    expect(pre).toHaveLength(1);

    // Delete member
    await deleteMember(member.id);

    // Reservation should be gone
    const post = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.member_id, member.id))
      .execute();
    expect(post).toHaveLength(0);
  });
});

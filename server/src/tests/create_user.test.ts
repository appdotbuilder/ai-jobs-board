
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  company_name: 'Test Company'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.company_name).toEqual('Test Company');
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Should be hashed
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].company_name).toEqual('Test Company');
    expect(users[0].password_hash).toBeDefined();
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should hash the password', async () => {
    const result = await createUser(testInput);

    // Password should be hashed, not plain text
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash.length).toBeGreaterThan(20); // Hashed passwords are longer

    // Verify password can be verified with Bun's password utility
    const isValid = await Bun.password.verify('password123', result.password_hash);
    expect(isValid).toBe(true);
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same email
    const duplicateInput: CreateUserInput = {
      email: 'test@example.com', // Same email
      password: 'different123',
      company_name: 'Different Company'
    };

    // Should throw error due to unique constraint
    expect(() => createUser(duplicateInput)).toThrow();
  });

  it('should create users with different emails successfully', async () => {
    const firstUser = await createUser(testInput);

    const secondInput: CreateUserInput = {
      email: 'different@example.com',
      password: 'password456',
      company_name: 'Another Company'
    };

    const secondUser = await createUser(secondInput);

    expect(firstUser.id).not.toEqual(secondUser.id);
    expect(firstUser.email).toEqual('test@example.com');
    expect(secondUser.email).toEqual('different@example.com');
  });
});

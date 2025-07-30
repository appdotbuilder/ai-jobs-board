
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate user with correct credentials', async () => {
    // Create test user with hashed password
    const hashedPassword = await Bun.password.hash('testpassword123');
    
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: hashedPassword,
        company_name: 'Test Company'
      })
      .execute();

    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: 'testpassword123'
    };

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('test@example.com');
    expect(result!.company_name).toEqual('Test Company');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.password_hash).toEqual(hashedPassword);
  });

  it('should return null for non-existent email', async () => {
    const loginInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'anypassword'
    };

    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });

  it('should return null for incorrect password', async () => {
    // Create test user
    const hashedPassword = await Bun.password.hash('correctpassword');
    
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: hashedPassword,
        company_name: 'Test Company'
      })
      .execute();

    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });

  it('should handle multiple users and authenticate the correct one', async () => {
    // Create multiple test users
    const password1 = await Bun.password.hash('password1');
    const password2 = await Bun.password.hash('password2');
    
    await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          password_hash: password1,
          company_name: 'Company 1'
        },
        {
          email: 'user2@example.com',
          password_hash: password2,
          company_name: 'Company 2'
        }
      ])
      .execute();

    const loginInput: LoginInput = {
      email: 'user2@example.com',
      password: 'password2'
    };

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('user2@example.com');
    expect(result!.company_name).toEqual('Company 2');
  });

  it('should handle case-sensitive email matching', async () => {
    // Create test user with lowercase email
    const hashedPassword = await Bun.password.hash('testpassword');
    
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: hashedPassword,
        company_name: 'Test Company'
      })
      .execute();

    // Try to login with uppercase email
    const loginInput: LoginInput = {
      email: 'TEST@EXAMPLE.COM',
      password: 'testpassword'
    };

    const result = await loginUser(loginInput);

    // Should return null since email matching is case-sensitive
    expect(result).toBeNull();
  });
});

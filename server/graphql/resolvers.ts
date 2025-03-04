import { storage } from '../storage';
import { summarizeText } from '../summarize';
import { comparePasswords, hashPassword } from '../auth';
import type { Context } from './context';
import type { User, Summary } from '@shared/schema';

type LoginInput = {
  username: string;
  password: string;
};

type RegisterInput = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
};

type UpdateProfileInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  currentPassword: string;
  newPassword?: string;
};

type SummarizeInput = {
  originalText: string;
  language: string;
};

export const resolvers = {
  Query: {
    me: (_: unknown, __: unknown, { req }: Context): User | null => {
      if (!req.isAuthenticated()) {
        return null;
      }
      return req.user;
    },
    summaries: async (_: unknown, __: unknown, { req }: Context): Promise<Summary[]> => {
      if (!req.isAuthenticated()) {
        throw new Error('Not authenticated');
      }
      return storage.getUserSummaries(req.user.id);
    },
  },
  Mutation: {
    login: async (_: unknown, { input }: { input: LoginInput }, { req }: Context): Promise<{ user: User }> => {
      const { username, password } = input;
      const user = await storage.getUserByUsername(username);

      if (!user || !(await comparePasswords(password, user.password))) {
        throw new Error('Invalid username or password');
      }

      return new Promise((resolve, reject) => {
        req.login(user, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve({ user });
          }
        });
      });
    },
    register: async (_: unknown, { input }: { input: RegisterInput }, { req }: Context): Promise<{ user: User }> => {
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      const user = await storage.createUser({
        ...input,
        password: await hashPassword(input.password),
      });

      return new Promise((resolve, reject) => {
        req.login(user, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve({ user });
          }
        });
      });
    },
    logout: (_: unknown, __: unknown, { req }: Context): Promise<boolean> => {
      return new Promise((resolve) => {
        req.logout(() => {
          resolve(true);
        });
      });
    },
    summarize: async (_: unknown, { input }: { input: SummarizeInput }, { req }: Context): Promise<Summary> => {
      if (!req.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const summary = await summarizeText(input.originalText, input.language);
      return storage.createSummary(req.user.id, {
        ...input,
        summary,
      });
    },
    updateProfile: async (_: unknown, { input }: { input: UpdateProfileInput }, { req }: Context): Promise<User> => {
      if (!req.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const user = await storage.getUser(req.user.id);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      if (!(await comparePasswords(input.currentPassword, user.password))) {
        throw new Error('Current password is incorrect');
      }

      const updates: Partial<User> = {};
      if (input.firstName) updates.firstName = input.firstName;
      if (input.lastName) updates.lastName = input.lastName;
      if (input.email) updates.email = input.email;
      if (input.newPassword) {
        updates.password = await hashPassword(input.newPassword);
      }

      return storage.updateUser(user.id, updates);
    },
    deleteAccount: async (_: unknown, { password }: { password: string }, { req }: Context): Promise<boolean> => {
      if (!req.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const user = await storage.getUser(req.user.id);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      if (!(await comparePasswords(password, user.password))) {
        throw new Error('Password is incorrect');
      }

      await storage.deleteUser(user.id);
      return new Promise((resolve) => {
        req.logout(() => {
          resolve(true);
        });
      });
    },
    deleteSummary: async (_: unknown, { id }: { id: number }, { req }: Context): Promise<boolean> => {
      if (!req.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      return storage.deleteSummary(id, req.user.id);
    },
  },
};
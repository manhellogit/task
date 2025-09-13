import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { success, error } from '../utils/response';
import { v4 as uuidv4 } from 'uuid';
import { DocumentModel } from '../models/Document';

export class UserController {
  // NEW: Login/Register with email (main authentication method)
  async loginWithEmail(req: Request, res: Response) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return error(res, 'Email is required', 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return error(res, 'Invalid email format', 400);
      }

      const normalizedEmail = email.toLowerCase().trim();
      const username = normalizedEmail.split('@')[0];
      const clientId = hashCode(normalizedEmail);

      // Find existing user or create new one
      let user = await UserModel.findOne({ email: normalizedEmail });
      
      if (!user) {
        // Create new user
        user = await UserModel.create({
          userId: uuidv4(),
          email: normalizedEmail,
          username,
          clientId,
          lastActiveAt: new Date(),
          documentsAccessed: [],
          preferences: {
            theme: 'light',
            fontSize: 14
          }
        });
        console.log('✅ Created new user:', normalizedEmail);
      } else {
        // Update existing user's last active time
        user.lastActiveAt = new Date();
        await user.save();
        console.log('✅ User logged in:', normalizedEmail);
      }

      return success(res, {
        user: {
          email: user.email,
          username: user.username,
          clientId: user.clientId,
          userId: user.userId,
          lastActiveAt: user.lastActiveAt,
          preferences: user.preferences || { theme: 'light', fontSize: 14 }
        }
      }, 'Login successful');
      
    } catch (err) {
      console.error('❌ Login error:', err);
      return error(res, 'Failed to login', 500);
    }
  }

  // NEW: Get user profile by email
  async getUserProfile(req: Request, res: Response) {
    try {
      const { email } = req.params;
      
      const user = await UserModel.findOne({ email: email.toLowerCase() });
      if (!user) {
        return error(res, 'User not found', 404);
      }

      // Update last active time
      user.lastActiveAt = new Date();
      await user.save();

      return success(res, {
        user: {
          email: user.email,
          username: user.username,
          clientId: user.clientId,
          userId: user.userId,
          lastActiveAt: user.lastActiveAt,
          documentsAccessed: user.documentsAccessed || [],
          preferences: user.preferences || { theme: 'light', fontSize: 14 }
        }
      }, 'User profile fetched');
      
    } catch (err) {
      console.error('❌ Error fetching user profile:', err);
      return error(res, 'Failed to fetch user profile', 500);
    }
  }

  // NEW: Update user preferences
  async updateUserPreferences(req: Request, res: Response) {
    try {
      const { email } = req.params;
      const { preferences } = req.body;
      
      const user = await UserModel.findOneAndUpdate(
        { email: email.toLowerCase() },
        { 
          preferences,
          lastActiveAt: new Date()
        },
        { new: true }
      );

      if (!user) {
        return error(res, 'User not found', 404);
      }

      return success(res, { 
        preferences: user.preferences 
      }, 'Preferences updated');
      
    } catch (err) {
      console.error('❌ Error updating preferences:', err);
      return error(res, 'Failed to update preferences', 500);
    }
  }

  // NEW: Track document access
  async trackDocumentAccess(req: Request, res: Response) {
    try {
      const { email, documentId } = req.body;
      
      if (!email || !documentId) {
        return error(res, 'Email and documentId are required', 400);
      }

      await UserModel.updateOne(
        { email: email.toLowerCase() },
        { 
          $addToSet: { documentsAccessed: documentId },
          lastActiveAt: new Date()
        }
      );

      return success(res, {}, 'Document access tracked');
      
    } catch (err) {
      console.error('❌ Error tracking document access:', err);
      return error(res, 'Failed to track document access', 500);
    }
  }

  // EXISTING: Create new user (keep for compatibility)
  async createUser(req: Request, res: Response) {
    try {
      const { username } = req.body;
      
      const existingUser = await UserModel.findOne({ username });
      if (existingUser) {
        return error(res, 'User already exists', 409);
      }

      const newUser = await UserModel.create({
        userId: uuidv4(),
        username
      });

      return success(res, {
        userId: newUser.userId,
        username: newUser.username
      }, 'User created successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(msg);
      return error(res, 'Failed to create user', 500);
    }
  }

  // EXISTING: Get user by ID (keep for compatibility)
  async getUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      const user = await UserModel.findOne({ userId });
      if (!user) {
        return error(res, 'User not found', 404);
      }

      return success(res, {
        userId: user.userId,
        username: user.username
      }, 'User fetched successfully');
    } catch (err) {
      return error(res, 'Failed to fetch user', 500);
    }
  }

  // EXISTING: Get user documents (keep for compatibility)
  async getUserDocuments(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const user = await UserModel.findOne({ userId }).lean();
      if (!user) {
        return error(res, 'User not found', 404);
      }

      const documentIds: string[] = Array.isArray((user as any).documentIds) ? (user as any).documentIds : [];

      const documents = await DocumentModel.find({ documentId: { $in: documentIds } })
        .select('documentId name')
        .lean();

      return success(res, {
        userId: (user as any).userId,
        documents: documents.map(d => ({ id: d.documentId, name: d.name }))
      }, 'User documents fetched successfully');
    } catch (err) {
      return error(res, 'Failed to fetch user documents', 500);
    }
  }
}

// Helper function for consistent clientId generation
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { success, error } from '../utils/response';
import { v4 as uuidv4 } from 'uuid';
import { DocumentModel } from '../models/Document';

export class UserController {
  // Create new user
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

  // Get user by ID
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

  // Get a user's documents (IDs and names)
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


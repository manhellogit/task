import { Request, Response } from 'express';
import { DocumentModel } from '../models/Document';
import { StepModel } from '../models/Step';
import { success, error } from '../utils/response';
import { v4 as uuidv4 } from 'uuid';
import { UserModel } from '../models/User';

export class DocumentController {
  // Create new document
  async createDocument(req: Request, res: Response) {
    try {
      const { name = 'Untitled Document', userId } = req.body;
      
      if (!userId) {
        return error(res, 'UserId is required', 400);
      }

      // Generate IDs
      const documentId = uuidv4();

      // Check user exists
      const user = await UserModel.findOne({ userId });
      if (!user) {
        return error(res, 'User not found', 404);
      }

      // Create document entry in DB
      const doc = await DocumentModel.create({
        documentId,
        name,
        currentVersion: 0,
        createdBy: userId
      });

      // Append documentId to user's documentIds (no duplicates)
      await UserModel.updateOne(
        { userId },
        { $addToSet: { documentIds: documentId } }
      );

      // Room creation is handled by socket layer; respond with details
      return success(res, {
        documentId: doc.documentId,
        roomId: doc.documentId,
        name: doc.name
      }, 'Document created successfully');
    } catch (err) {
      return error(res, 'Failed to create document', 500);
    }
  }

  // Get document steps since version
  async getStepsSince(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { version = 0, userId } = req.query as { version?: any; userId?: string };

      // Check document exists
      const document = await DocumentModel.findOne({ documentId: id });
      if (!document) {
        return error(res, 'Document not found', 404);
      }

      // Optional: Check user access (if userId provided, ensure user has access)
      if (userId) {
        const user = await UserModel.findOne({ userId }).lean();
        const hasAccess = user && Array.isArray((user as any).documentIds)
          ? (user as any).documentIds.includes(id)
          : false;
        if (!hasAccess && document.createdBy !== userId) {
          return error(res, 'Access denied', 403);
        }
      }

      const fromVersion = Number.parseInt(String(version), 10) || 0;

      // Get all steps since the specified version, ascending by version
      const steps = await StepModel.find({
        documentId: id,
        version: { $gt: fromVersion }
      })
      .sort({ version: 1 })
      .select('clientId version stepData')
      .lean();

      return success(res, {
        documentId: id,
        fromVersion,
        steps
      }, 'Steps fetched successfully');

    } catch (err) {
      return error(res, 'Failed to fetch steps', 500);
    }
  }

  // Delete document
  async deleteDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      const document = await DocumentModel.findOne({ documentId: id });
      
      if (!document) {
        return error(res, 'Document not found', 404);
      }

      // Only creator can delete
      if (document.createdBy !== userId) {
        return error(res, 'Only document creator can delete', 403);
      }

      await DocumentModel.deleteOne({ documentId: id });
      await StepModel.deleteMany({ documentId: id });

      // Delete documentId entry in user collection as well
      await UserModel.updateMany(
        { documentIds: id },
        { $pull: { documentIds: id } }
      );

      return success(res, {
        documentId: id
      }, 'Document deleted successfully');
    } catch (err) {
      return error(res, 'Failed to delete document', 500);
    }
  }
}

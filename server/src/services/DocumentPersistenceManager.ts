import { SingleDocumentModel, ISingleDocument } from '../models/SingleDocument';
import { StepModel } from '../models/Step';
import { UserModel } from '../models/User';

export class DocumentPersistenceManager {
  private static GLOBAL_DOC_ID = 'global-document';

  async getOrCreateGlobalDocument(): Promise<ISingleDocument> {
    let doc = await SingleDocumentModel.findOne({ 
      documentId: DocumentPersistenceManager.GLOBAL_DOC_ID 
    });

    if (!doc) {
      console.log('📄 Creating new global document...');
      doc = await SingleDocumentModel.create({
        documentId: DocumentPersistenceManager.GLOBAL_DOC_ID,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Welcome to the collaborative editor! Start typing...'
                }
              ]
            }
          ]
        },
        version: 0,
        collaborators: [],
        steps: []
      });
    }

    return doc;
  }

  async addCollaborator(userEmail: string): Promise<void> {
    await SingleDocumentModel.updateOne(
      { documentId: DocumentPersistenceManager.GLOBAL_DOC_ID },
      { 
        $addToSet: { collaborators: userEmail },
        lastModifiedAt: new Date()
      }
    );

    await UserModel.updateOne(
      { email: userEmail },
      { 
        $addToSet: { documentsAccessed: DocumentPersistenceManager.GLOBAL_DOC_ID },
        lastActiveAt: new Date()
      }
    );
  }

  async applyStepToDocument(stepData: {
    step: any;
    clientId: number;
    userEmail: string;
  }): Promise<{ success: boolean; newVersion?: number; error?: string }> {
    try {
      const doc = await this.getOrCreateGlobalDocument();
      const newVersion = doc.version + 1;

      const newStep = {
        version: newVersion,
        step: stepData.step,
        clientId: stepData.clientId,
        timestamp: new Date()
      };

      await SingleDocumentModel.updateOne(
        { documentId: DocumentPersistenceManager.GLOBAL_DOC_ID },
        {
          $inc: { version: 1 },
          $push: { 
            steps: {
              $each: [newStep],
              $slice: -100
            }
          },
          lastModifiedAt: new Date(),
          lastModifiedBy: stepData.userEmail
        }
      );

      await StepModel.create({
        documentId: DocumentPersistenceManager.GLOBAL_DOC_ID,
        version: newVersion,
        step: stepData.step,
        clientId: stepData.clientId,
        timestamp: new Date()
      });

      return { success: true, newVersion };

    } catch (error) {
      console.error('❌ Error applying step:', error);
      return { success: false, error: 'Failed to apply step' };
    }
  }

  async getCurrentDocumentState(): Promise<{
    content: any;
    version: number;
    steps: any[];
    collaborators: string[];
  }> {
    const doc = await this.getOrCreateGlobalDocument();
    
    return {
      content: doc.content,
      version: doc.version,
      steps: doc.steps || [],
      collaborators: doc.collaborators || []
    };
  }

  async reconstructDocumentContent(): Promise<any> {
    try {
      const doc = await this.getOrCreateGlobalDocument();
      return doc.content;
    } catch (error) {
      console.error('❌ Error reconstructing document:', error);
      return null;
    }
  }

  async saveCurrentContent(content: any, userEmail: string): Promise<void> {
    await SingleDocumentModel.updateOne(
      { documentId: DocumentPersistenceManager.GLOBAL_DOC_ID },
      {
        content: content,
        lastModifiedAt: new Date(),
        lastModifiedBy: userEmail
      }
    );
  }

  async getCollaboratorsList(): Promise<string[]> {
    const doc = await this.getOrCreateGlobalDocument();
    return doc.collaborators || [];
  }
}

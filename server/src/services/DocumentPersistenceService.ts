import cron from 'node-cron';
import { DocumentFileManager } from './DocumentFileManager';
import { StepModel } from '../models/Step';
import { DocumentModel } from '../models/Document';

// Simple step interface
export interface DocumentStep {
    clientId: string;
    version: number;
    step: any; // The actual step data (can be any format)
    timestamp: Date;
    applied?: boolean;
}
  
// Simple document file interface
export interface DocumentFile {
    documentId: string;
    currentVersion: number;
    steps: DocumentStep[];
    lastUpdated: Date;
    clients: Set<string>;
}
  

export class DocumentPersistenceService {
    constructor(private fileManager: DocumentFileManager) {}
  
    initializeCronJob(): void {
      // Run every 10 seconds for persistence
      cron.schedule('*/10 * * * * *', async () => {
        await this.persistDocuments();
      });
  
      // Run every 5 minutes to clear inactive documents from memory
      cron.schedule('*/5 * * * *', async () => {
        await this.clearInactiveDocuments();
      });
  
      console.log('⏰ Document persistence cron job initialized (every 10 seconds)');
      console.log('⏰ Memory cleanup cron job initialized (every 5 minutes)');
    }
  
    private async persistDocuments(): Promise<void> {
      try {
        const documentsToSave = await this.fileManager.getDocumentsNeedingPersistence(10);
        
        for (const docFile of documentsToSave) {
          await this.persistDocument(docFile);
        }
  
        // Log memory stats periodically
        if (documentsToSave.length > 0) {
          const stats = this.fileManager.getMemoryStats();
          console.log(`📊 Memory: ${stats.totalDocuments} docs, ${stats.totalSteps} steps, ${stats.totalActiveClients} clients`);
        }
      } catch (error) {
        console.error('❌ Error in persistence cron job:', error);
      }
    }
  
    private async persistDocument(docFile: DocumentFile): Promise<void> {
      try {
        const { documentId, currentVersion } = docFile;
        
        // Get only unpersisted steps
        const unpersistedSteps = await this.fileManager.getUnpersistedSteps(documentId);
        
        if (unpersistedSteps.length === 0) {
          console.log(`📝 No unpersisted steps for document ${documentId}`);
          return;
        }
        
        // Save unpersisted steps to MongoDB
        const stepDocs = unpersistedSteps.map(step => ({
          documentId,
          clientId: step.clientId,
          version: step.version,
          stepData: step.step,
          timestamp: step.timestamp,
          applied: step.applied
        }));
  
        await StepModel.insertMany(stepDocs, { ordered: false });
        console.log(`💾 Persisted ${stepDocs.length} new steps for document ${documentId}`);
  
        // Update document version in MongoDB
        await DocumentModel.updateOne(
          { documentId },
          { 
            $set: { 
              currentVersion,
              lastModified: new Date(),
            }
          },
          { upsert: true }
        );
  
        // Mark steps as persisted
        const persistedVersions = unpersistedSteps.map(step => step.version);
        await this.fileManager.markStepsAsPersisted(documentId, persistedVersions);
  
        // Clear old persisted steps from memory (keep recent 100 steps)
        await this.fileManager.clearPersistedSteps(documentId, 100);
        
        console.log(`📄 Updated document ${documentId} to version ${currentVersion}`);
        
      } catch (error) {
        console.error(`❌ Error persisting document ${docFile.documentId}:`, error);
      }
    }
  
    private async clearInactiveDocuments(): Promise<void> {
      try {
        // Clear documents that have been inactive for 30 minutes
        const clearedDocuments = await this.fileManager.clearInactiveDocuments(30);
        
        if (clearedDocuments.length > 0) {
          console.log(`🧹 Cleared ${clearedDocuments.length} inactive documents from memory`);
        }
      } catch (error) {
        console.error('❌ Error in memory cleanup:', error);
      }
    }
  
    // Manual cleanup method for testing or admin use
    async forceCleanup(documentId?: string): Promise<void> {
      if (documentId) {
        await this.fileManager.removeDocumentFromMemory(documentId);
      } else {
        await this.clearInactiveDocuments();
      }
    }
  }
  
interface DocumentStep {
    clientId: string;
    version: number;
    step: any;
    timestamp: Date;
    applied?: boolean;
    persisted?: boolean;
  }
  
  interface StepApplicationResult {
    success: boolean;
    newVersion?: number;
    appliedStep?: any;
    error?: string;
    currentVersion?: number;
  }
  
  interface DocumentState {
    documentId: string;
    currentVersion: number;
    content: any;
    lastUpdated: Date;
  }
  
  interface DocumentFile {
    documentId: string;
    currentVersion: number;
    steps: DocumentStep[];
    lastUpdated: Date;
    clients: Set<string>;
    content: any; // Store actual document content
  }
  
  export class DocumentFileManager {
    private documents: Map<string, DocumentFile> = new Map();
  
    async createDocumentFile(documentId: string): Promise<void> {
      if (!this.documents.has(documentId)) {
        this.documents.set(documentId, {
          documentId,
          currentVersion: 1,
          steps: [],
          lastUpdated: new Date(),
          clients: new Set(),
          content: null // Initialize with empty content
        });
        console.log(`📁 Created in-memory file for document: ${documentId}`);
      }
    }

    // Mark steps as persisted
  async markStepsAsPersisted(documentId: string, versions: number[]): Promise<void> {
    const docFile = this.documents.get(documentId);
    if (docFile) {
      docFile.steps.forEach(step => {
        if (versions.includes(step.version)) {
          step.persisted = true;
        }
      });
      console.log(`✅ Marked ${versions.length} steps as persisted for document ${documentId}`);
    }
  }

    // Get only unpersisted steps
    async getUnpersistedSteps(documentId: string): Promise<DocumentStep[]> {
        const docFile = this.documents.get(documentId);
        return docFile ? docFile.steps.filter(step => !step.persisted) : [];
    }

    // Enhanced method to get documents needing persistence
    

    async clearPersistedSteps(documentId: string, keepRecentCount: number = 100): Promise<void> {
        const docFile = this.documents.get(documentId);
        if (docFile) {
          const originalLength = docFile.steps.length;
          
          // Sort steps by version (newest first)
          const sortedSteps = [...docFile.steps].sort((a, b) => b.version - a.version);
          
          // Keep recent steps and unpersisted steps
          const stepsToKeep = sortedSteps.filter((step, index) => {
            return index < keepRecentCount || !step.persisted;
          });
          
          docFile.steps = stepsToKeep.sort((a, b) => a.version - b.version);
          
          const clearedCount = originalLength - docFile.steps.length;
          console.log(`🧹 Cleared ${clearedCount} persisted steps for document ${documentId}`);
        }
    }
  
    async applyStep(documentId: string, stepData: DocumentStep): Promise<StepApplicationResult> {
      const docFile = this.documents.get(documentId);
      
      if (!docFile) {
        await this.createDocumentFile(documentId);
        return this.applyStep(documentId, stepData);
      }
  
      // Version conflict check
      if (stepData.version != docFile.currentVersion) {

        return {
          success: false,
          error: 'Version conflict',
          currentVersion: docFile.currentVersion
        };
      }
  
      try {
        // Apply the step to document content
        const newVersion = docFile.currentVersion + 1;
        const appliedStep = this.processStep(docFile.content, stepData.step);
        
        // Update document content with the applied step
        docFile.content = appliedStep.newContent || docFile.content;
        
        // Add step to history
        const stepToStore: DocumentStep = {
          ...stepData,
          version: newVersion,
          applied: true
        };
        
        docFile.steps.push(stepToStore);
        docFile.currentVersion = newVersion;
        docFile.lastUpdated = new Date();
        
        console.log(`📝 Applied step to document ${documentId}, new version: ${newVersion}`);
        
        return {
          success: true,
          newVersion,
          appliedStep: stepData.step
        };
        
      } catch (error) {
        console.error(`❌ Error applying step to document ${documentId}:`, error);
        return {
          success: false,
          error: 'Failed to process step',
          currentVersion: docFile.currentVersion
        };
      }
    }
  
    private processStep(currentContent: any, step: any): { newContent: any } {
      // This is where you'd implement your step application logic
      // For now, this is a simple implementation
      // You might want to integrate with ProseMirror transforms or similar
      
      if (!currentContent) {
        currentContent = { type: 'doc', content: [] };
      }
      
      // Example step processing (customize based on your editor)
      if (step.stepType === 'replace') {
        // Handle replace operations
        return { newContent: { ...currentContent, ...step.slice } };
      } else if (step.stepType === 'insert') {
        // Handle insert operations
        return { newContent: this.applyInsert(currentContent, step) };
      } else if (step.stepType === 'delete') {
        // Handle delete operations
        return { newContent: this.applyDelete(currentContent, step) };
      }
      
      // Default: return current content unchanged
      return { newContent: currentContent };
    }
  
    private applyInsert(content: any, step: any): any {
      // Implement insert logic based on your editor's format
      // This is a placeholder implementation
      return content;
    }
  
    private applyDelete(content: any, step: any): any {
      // Implement delete logic based on your editor's format
      // This is a placeholder implementation
      return content;
    }
  
    async getDocumentSteps(documentId: string): Promise<DocumentStep[]> {
      const docFile = this.documents.get(documentId);
      return docFile ? docFile.steps : [];
    }
  
    async getCurrentVersion(documentId: string): Promise<number> {
      const docFile = this.documents.get(documentId);
      return docFile ? docFile.currentVersion : 0;
    }
  
    async getDocumentState(documentId: string): Promise<DocumentState> {
      const docFile = this.documents.get(documentId);
      
      if (!docFile) {
        await this.createDocumentFile(documentId);
        return this.getDocumentState(documentId);
      }
      
      return {
        documentId: docFile.documentId,
        currentVersion: docFile.currentVersion,
        content: docFile.content,
        lastUpdated: docFile.lastUpdated
      };
    }
  
    async updateDocumentVersion(documentId: string, version: number): Promise<void> {
      const docFile = this.documents.get(documentId);
      if (docFile) {
        docFile.currentVersion = version;
        docFile.lastUpdated = new Date();
      }
    }
  
    async addClient(documentId: string, clientId: string): Promise<void> {
      const docFile = this.documents.get(documentId);
      if (docFile) {
        docFile.clients.add(clientId);
        console.log(`👤 Client ${clientId} added to document ${documentId}`);
      }
    }
  
    async removeClient(documentId: string, clientId: string): Promise<void> {
      const docFile = this.documents.get(documentId);
      if (docFile) {
        docFile.clients.delete(clientId);
        console.log(`👤 Client ${clientId} removed from document ${documentId}`);
      }
    }
  
    async getConnectedClients(documentId: string): Promise<string[]> {
      const docFile = this.documents.get(documentId);
      return docFile ? Array.from(docFile.clients) : [];
    }
  
    async getDocumentFile(documentId: string): Promise<DocumentFile | undefined> {
      return this.documents.get(documentId);
    }
  
    async getAllDocuments(): Promise<DocumentFile[]> {
      return Array.from(this.documents.values());
    }
  
    async getDocumentsNeedingPersistence(olderThanSeconds: number = 10): Promise<DocumentFile[]> {
            const cutoffTime = new Date(Date.now() - (olderThanSeconds * 1000));
            return Array.from(this.documents.values()).filter(doc => {
            const hasUnpersistedSteps = doc.steps.some(step => !step.persisted);
            return hasUnpersistedSteps && doc.lastUpdated <= cutoffTime;
        });
    }
  
    async updateDocumentContent(documentId: string, content: any): Promise<void> {
      const docFile = this.documents.get(documentId);
      if (docFile) {
        docFile.content = content;
        docFile.lastUpdated = new Date();
      }
    }
  
    // Get document statistics
    async getDocumentStats(documentId: string) {
      const docFile = this.documents.get(documentId);
      if (!docFile) return null;
  
      return {
        documentId,
        currentVersion: docFile.currentVersion,
        totalSteps: docFile.steps.length,
        connectedClients: docFile.clients.size,
        lastUpdated: docFile.lastUpdated,
        clientIds: Array.from(docFile.clients)
      };
    }

    // Clear entire documents from memory (not just steps)
  async clearInactiveDocuments(inactiveForMinutes: number = 30): Promise<string[]> {
    const cutoffTime = new Date(Date.now() - (inactiveForMinutes * 60 * 1000));
    const clearedDocuments: string[] = [];

    for (const [documentId, docFile] of this.documents.entries()) {
      // Only clear if document has no active clients and hasn't been updated recently
      if (docFile.clients.size === 0 && docFile.lastUpdated <= cutoffTime) {
        this.documents.delete(documentId);
        clearedDocuments.push(documentId);
        console.log(`🗑️ Cleared inactive document from memory: ${documentId}`);
      }
    }

    return clearedDocuments;
  }

  // Force remove a document from memory (use carefully)
  async removeDocumentFromMemory(documentId: string): Promise<boolean> {
    const existed = this.documents.has(documentId);
    if (existed) {
      this.documents.delete(documentId);
      console.log(`🗑️ Force removed document from memory: ${documentId}`);
    }
    return existed;
  }

  // Get documents that can be safely cleared
  async getDocumentsReadyForClearing(inactiveForMinutes: number = 30): Promise<DocumentFile[]> {
    const cutoffTime = new Date(Date.now() - (inactiveForMinutes * 60 * 1000));
    return Array.from(this.documents.values()).filter(doc => 
      doc.clients.size === 0 && doc.lastUpdated <= cutoffTime
    );
  }

  // Get memory usage statistics
  getMemoryStats() {
    const totalDocuments = this.documents.size;
    let totalSteps = 0;
    let totalClients = 0;

    for (const docFile of this.documents.values()) {
      totalSteps += docFile.steps.length;
      totalClients += docFile.clients.size;
    }

    return {
      totalDocuments,
      totalSteps,
      totalActiveClients: totalClients,
      averageStepsPerDocument: totalDocuments > 0 ? Math.round(totalSteps / totalDocuments) : 0
    };
  }
  }
  
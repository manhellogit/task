import { Server, Socket } from 'socket.io';
import { UserModel } from '../models/User';
import { DocumentFileManager } from '../services/DocumentFileManager';
import { DocumentModel } from '../models/Document';
import { StepModel } from '../models/Step';

export class CollabSocket {
  // Long polling implementation - MOVED TO TOP
  private longPollingClients = new Map<string, { socket: Socket, version: number, timestamp: number }[]>();

  constructor(
    private io: Server,
    private fileManager: DocumentFileManager
  ) {}

  initialize(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);

      // Handle pullUpdates with better long polling
      socket.on('pullUpdates', async (data: any) => {
        try {
          const { docId, version } = data;
          console.log(`📥 Pull updates for ${docId} from version ${version}`);

          // Add client to document (for tracking)
          await this.fileManager.addClient(docId, socket.id);
          
          // Ensure document exists in memory
          await this.fileManager.createDocumentFile(docId);
          
          // Get document state
          const documentState = await this.fileManager.getDocumentState(docId);
          const allSteps = await this.fileManager.getDocumentSteps(docId);
          
          // Filter steps since the requested version
          const stepsSince = allSteps.filter(step => step.version > version);
          
          // Convert steps to frontend format
          const formattedSteps = stepsSince.map(step => ({
            ...step.step,
            clientID: step.clientId
          }));

          if (formattedSteps.length > 0) {
            // Send steps immediately
            socket.emit('pullUpdateResponse', {
              steps: formattedSteps,
              version: documentState.currentVersion,
              users: (await this.fileManager.getConnectedClients(docId)).length
            });
          } else {
            // Set up long polling for this client
            this.setupLongPolling(socket, docId, version, documentState.currentVersion);
          }

        } catch (error) {
          console.error('❌ Error in pullUpdates:', error);
          socket.emit('pullUpdateResponse', { error: 'Failed to pull updates' });
        }
      });

      // Handle pushUpdates (from frontend)
      socket.on('pushUpdates', async (data: any) => {
        try {
          const { docId, version, steps, clientID } = data;
          console.log(`📤 Push ${steps.length} steps for ${docId} from version ${version} by client ${clientID}`);

          // Ensure document exists
          await this.fileManager.createDocumentFile(docId);
          
          // Get current document state
          const documentState = await this.fileManager.getDocumentState(docId);
          console.log(`📊 Server version: ${documentState.currentVersion}, Client version: ${version}`);

          // Check version match
          if (version !== documentState.currentVersion) {
            console.log(`❌ Version mismatch in push: server ${documentState.currentVersion}, client ${version}`);
            socket.emit('pushUpdateResponse', {
              error: 'Invalid version',
              expectedVersion: documentState.currentVersion
            });
            return;
          }

          // Apply each step
          let currentVersion = version;
          const appliedSteps = [];

          for (const stepData of steps) {
            const result = await this.fileManager.applyStep(docId, {
              clientId: clientID,
              version: currentVersion,
              step: stepData,
              timestamp: new Date()
            });

            if (result.success) {
              currentVersion = result.newVersion!;
              appliedSteps.push(stepData);
              console.log(`✅ Applied step ${appliedSteps.length}/${steps.length}, version now: ${currentVersion}`);
            } else {
              console.log(`❌ Failed to apply step: ${result.error}`);
              socket.emit('pushUpdateResponse', {
                error: result.error || 'Failed to apply step',
                expectedVersion: result.currentVersion
              });
              return;
            }
          }

          // All steps applied successfully
          console.log(`🎉 All ${steps.length} steps applied successfully, final version: ${currentVersion}`);
          socket.emit('pushUpdateResponse', {
            version: currentVersion
          });

          // Broadcast steps to other clients
          socket.to(docId).emit('steps', {
            steps: appliedSteps,
            version: currentVersion,
            clientID: clientID
          });

          // Notify any long polling clients
          this.notifyLongPollingClients(docId, appliedSteps, currentVersion, clientID);

        } catch (error) {
          console.error('❌ Error in pushUpdates:', error);
          socket.emit('pushUpdateResponse', {
            error: 'Failed to push updates'
          });
        }
      });

      // Keep existing join-document for compatibility
      socket.on('join-document', async (data: string) => {
        try {
          const parsedData = JSON.parse(data);
          const { documentId, clientId, userId } = parsedData;
          
          await socket.join(documentId);
          await this.fileManager.createDocumentFile(documentId);
          await this.fileManager.addClient(documentId, clientId);
          
          // Store client info on socket
          (socket.data as any).clientId = clientId;
          (socket.data as any).documentId = documentId;

          const documentState = await this.fileManager.getDocumentState(documentId);
          const documentSteps = await this.fileManager.getDocumentSteps(documentId);

          socket.emit('joined-document', {
            documentId,
            clientId,
            userId,
            documentState,
            steps: documentSteps,
            currentVersion: documentState.currentVersion
          });
          
          console.log(`📄 Client ${clientId} joined document ${documentId}`);
          
        } catch (error) {
          console.error('❌ Error joining document:', error);
          socket.emit('error', { message: 'Failed to join document' });
        }
      });

      socket.on('disconnect', async () => {
        const clientId = (socket.data as any).clientId;
        const documentId = (socket.data as any).documentId;
        
        if (clientId && documentId) {
          await this.fileManager.removeClient(documentId, clientId);
          socket.to(documentId).emit('client-left', { clientId });
        }

        // Clean up from long polling
        this.cleanupLongPollingClient(socket);
        
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });
  }

  // FIXED: Improved long polling setup
  private setupLongPolling(socket: Socket, docId: string, clientVersion: number, serverVersion: number) {
    if (!this.longPollingClients.has(docId)) {
      this.longPollingClients.set(docId, []);
    }
    
    const clientData = { socket, version: clientVersion, timestamp: Date.now() };
    this.longPollingClients.get(docId)!.push(clientData);

    // Timeout after 30 seconds (reduced from 60)
    setTimeout(() => {
      const clients = this.longPollingClients.get(docId) || [];
      const index = clients.findIndex(client => client.socket === socket);
      if (index > -1) {
        clients.splice(index, 1);
        // Send empty response to continue polling
        socket.emit('pullUpdateResponse', {
          steps: [],
          version: serverVersion,
          users: 0
        });
      }
    }, 30000);
  }

  private async notifyLongPollingClients(docId: string, steps: any[], version: number, clientID: string) {
    const clients = this.longPollingClients.get(docId);
    if (!clients) return;

    const connectedClients = await this.fileManager.getConnectedClients(docId);

    // Notify all waiting clients
    for (const client of clients) {
      client.socket.emit('pullUpdateResponse', {
        steps: steps.map(step => ({ ...step, clientID })),
        version: version,
        users: connectedClients.length
      });
    }

    // Clear the waiting clients
    this.longPollingClients.set(docId, []);
  }

  private cleanupLongPollingClient(socket: Socket) {
    // Remove this socket from all long polling lists
    for (const [docId, clients] of this.longPollingClients.entries()) {
      const filteredClients = clients.filter(client => client.socket !== socket);
      this.longPollingClients.set(docId, filteredClients);
    }
  }
}

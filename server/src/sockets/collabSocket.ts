import { Server, Socket } from 'socket.io';
import { UserModel } from '../models/User';
import { DocumentFileManager } from '../services/DocumentFileManager';

export class CollabSocket {
  constructor(
    private io: Server,
    private fileManager: DocumentFileManager
  ) {}

  initialize(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🟢 Client connected: ${socket.id}`);

      socket.on('join-document', async (data: string) => {
        try {
          const parsedData = JSON.parse(data);
          const { documentId, clientId, userId } = parsedData;

          console.log("data: ", data, "type: ", typeof parsedData);
          
          await socket.join(documentId);
          
          // Create in-memory file for document if it doesn't exist
          await this.fileManager.createDocumentFile(documentId);
          
          // Add client to document
          await this.fileManager.addClient(documentId, clientId);
          
          // Remember clientId and documentId on the socket for cleanup
          (socket.data as any).clientId = clientId;
          (socket.data as any).documentId = documentId;

          // Add documentId to user's document list (no-op if already present)
          if (clientId && userId) {
            await UserModel.updateOne(
              { userId: userId },
              { $addToSet: { documentIds: documentId } },
              { upsert: false }
            );
          }
          
          const documentState = await this.fileManager.getDocumentState(documentId);
          const documentSteps = await this.fileManager.getDocumentSteps(documentId);

          // Emit initial state with document content and steps
          socket.emit('joined-document', {
            documentId,
            clientId,
            userId,
            documentState,
            steps: documentSteps,
            currentVersion: documentState.currentVersion
          });
          
          socket.to(documentId).emit('client-joined', {
            clientId,
            userId
          });
          
          console.log(`📄 Client ${clientId} joined document ${documentId}`);
          
        } catch (error) {
          console.error('❌ Error joining document:', error);
          socket.emit('error', { message: 'Failed to join document' });
        }
      });

      // { "documentId" : "bc95d37c-aa5f-4e8c-b8c1-2201729b9441", 
      //   "clientId" : "client-bwerrerf", 
      //   "version" : "1",
      //   "step": {
      //       "type": "add",
      //       "data": "added this string in the doc"
      //   } 
      //   } 

      const handleSubmitStep = async (payload: any) => {
        try {
          const parsedData = JSON.parse(payload);

          const documentId = parsedData.documentId || parsedData.roomId;
          const clientId = parsedData.clientId || parsedData.userId;
          const version = parsedData.version;
          const step = parsedData.step;

          console.log(`✍️ Received step from ${clientId} at version ${version}`);

          // Apply step using file manager
          const result = await this.fileManager.applyStep(documentId, {
            clientId,
            version,
            step,
            timestamp: new Date()
          });

          console.log("result:", result);

          // { "documentId" : "bc95d37c-aa5f-4e8c-b8c1-2201729b9441", 
          //   "clientId" : "client-bwerrerf", 
          //      "version" : "2",
          //      "step": {
          //          "type": "replace",
          //          "data": "replace this string in the doc"
          //      } 
          //      } 

          if (result.success) {
            // Broadcast to all other clients in the room
            socket.to(documentId).emit('new-step', {
              version: result.newVersion,
              step: result.appliedStep,
              clientId,
              userId: clientId
            });

            // Confirm to sender
            socket.emit('step-accepted', {
              success: true,
              newVersion: result.newVersion
            });

            console.log(`✅ Applied step, new version: ${result.newVersion}`);
          } else {
            socket.emit('step-rejected', {
              success: false,
              error: result.error || 'Failed to apply step',
              currentVersion: result.currentVersion
            });
          }
        } catch (error) {
          console.error('❌ Error applying step:', error);
          socket.emit('error', { message: 'Failed to apply step' });
        }
      };

      socket.on('submit-step', handleSubmitStep);

      socket.on('disconnect', async () => {
        const clientId = (socket.data as any).clientId;
        const documentId = (socket.data as any).documentId;
        
        if (clientId && documentId) {
          await this.fileManager.removeClient(documentId, clientId);
          
          socket.to(documentId).emit('client-left', {
            clientId
          });
        }
        
        console.log(`🔴 Client disconnected: ${socket.id}`);
      });
    });
  }
}

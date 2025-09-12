import type { StepData, DocumentState } from '../types/collab';

export class ProseMirrorCollabClient {
  private socket: any;
  private documentId: string;
  private clientID: string;
  private onStepsCallback: ((steps: StepData) => void) | null = null;
  private onDocumentStateCallback: ((state: DocumentState) => void) | null = null;
  private onVersionMismatchCallback: (() => void) | null = null;

  constructor(socket: any, documentId: string = 'default-document') {
    this.socket = socket;
    this.documentId = documentId;
    this.clientID = this.generateClientID();
    this.setupListeners();
  }

  private generateClientID(): string {
    return 'client-' + Math.random().toString(36).substr(2, 9);
  }

  private setupListeners() {
    this.socket.on('steps', (data: StepData) => {
      if (this.onStepsCallback) {
        this.onStepsCallback(data);
      }
    });

    this.socket.on('steps_accepted', (data: { version: number, clientID: string }) => {
      console.log('Steps accepted, version:', data.version);
    });

    this.socket.on('document_state', (data: DocumentState) => {
      if (this.onDocumentStateCallback) {
        this.onDocumentStateCallback(data);
      }
    });

    this.socket.on('steps_error', (data: { expectedVersion: number, receivedVersion: number }) => {
      console.error('Steps version mismatch', data);
      // Call the mismatch callback instead of directly requesting
      if (this.onVersionMismatchCallback) {
        this.onVersionMismatchCallback();
      }
    });
  }

  joinDocument() {
    this.socket.emit('join_document', {
      documentId: this.documentId,
      clientID: this.clientID,
    });
  }

  sendSteps(version: number, steps: any[]) {
    this.socket.emit('send_steps', {
      documentId: this.documentId,
      version,
      steps,
      clientID: this.clientID,
    });
  }

  requestDocumentState() {
    this.socket.emit('get_document', {
      documentId: this.documentId,
      clientID: this.clientID,
    });
  }

  onSteps(callback: (steps: StepData) => void) {
    this.onStepsCallback = callback;
  }

  onDocumentState(callback: (state: DocumentState) => void) {
    this.onDocumentStateCallback = callback;
  }

  onVersionMismatch(callback: () => void) {
    this.onVersionMismatchCallback = callback;
  }

  getClientID(): string {
    return this.clientID;
  }

  disconnect() {
    this.socket.off('steps');
    this.socket.off('document_state');
    this.socket.off('steps_error');
    this.socket.off('steps_accepted');
  }
}

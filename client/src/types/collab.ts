export interface StepData {
  steps: any[];
  version: number;
  clientID: string;
}

export interface DocumentState {
  version: number;
  doc: any;
  steps: any[];
  clientIDs: string[];
}

export interface CollaborationMessage {
  type: 'steps' | 'document_state' | 'selection_update';
  data: any;
}
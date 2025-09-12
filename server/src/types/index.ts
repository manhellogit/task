import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Step } from 'prosemirror-transform';

export interface ApplyStepsResult {
success: boolean;
newVersion?: number;
appliedSteps?: object[];
currentVersion?: number;
stepsSince?: object[];
needsFullSync?: boolean; // New field
}

export interface DocumentState {
id: string;
version: number;
doc: any;
steps: any[];
stepClientIDs: string[];
activeClients: Set<string>;
lastModified: Date;
}
  
export interface CollabStep {
  stepJSON: object;
  clientID: string;
  version: number;
  timestamp: Date;
}
  
export interface SubmitStepsPayload {
documentId: string;
clientId: string;
version: number;
steps: object[];
}
  
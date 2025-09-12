import mongoose, { Schema, Document } from 'mongoose';

export interface IStep extends Document {
  documentId: string;
  version: number;
  stepData: object;
  clientId: string;
  createdAt: Date;
  appliedAt: Date;
}

const stepSchema = new Schema({
  documentId: { 
    type: String, 
    required: true,
    index: true 
  },
  version: { 
    type: Number, 
    required: true 
  },
  stepData: { 
    type: Schema.Types.Mixed,
    required: true 
  },
  clientId: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound indexes for efficient queries
stepSchema.index({ documentId: 1, version: 1 });

export const StepModel = mongoose.model<IStep>('Step', stepSchema);

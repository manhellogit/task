import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  documentId: string;
  name: string;
  currentVersion: number;
  createdBy: string; // userId who created it
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
}

const documentSchema = new Schema({
  documentId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  name: { 
    type: String, 
    required: true,
    default: 'Untitled Document'
  },
  currentVersion: { 
    type: Number, 
    default: 0 
  },
  createdBy: { 
    type: String, 
    required: true,
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  lastSyncAt: { 
    type: Date 
  }
});

documentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);

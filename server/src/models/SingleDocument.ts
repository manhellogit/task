import mongoose, { Schema, Document } from 'mongoose';

export interface ISingleDocument extends Document {
  documentId: string;
  content: any;
  version: number;
  lastModifiedAt: Date;
  lastModifiedBy: string;
  collaborators: string[];
  steps: any[];
  createdAt: Date;
  updatedAt: Date;
}

const singleDocumentSchema = new Schema({
  documentId: { 
    type: String, 
    required: true, 
    default: 'global-document',
    unique: true
  },
  content: { 
    type: Schema.Types.Mixed,
    required: true,
    default: {
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
    }
  },
  version: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  lastModifiedAt: { 
    type: Date, 
    default: Date.now 
  },
  lastModifiedBy: { 
    type: String,
    default: 'system'
  },
  collaborators: [{
    type: String,
    index: true
  }],
  steps: [{
    version: Number,
    step: Schema.Types.Mixed,
    clientId: Number,
    timestamp: Date
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

singleDocumentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const SingleDocumentModel = mongoose.model<ISingleDocument>('SingleDocument', singleDocumentSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  email?: string; // NEW: Add email field
  username: string;
  clientId?: number; // NEW: Add clientId field
  lastActiveAt?: Date; // NEW: Track last activity
  documentsAccessed?: string[]; // NEW: Track document access
  preferences?: { // NEW: User preferences
    theme?: string;
    fontSize?: number;
  };
  documentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema({
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  email: { // NEW: Email field
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined but ensure uniqueness when present
    lowercase: true,
    trim: true,
    index: true
  },
  username: { 
    type: String, 
    required: true,
    trim: true
  },
  clientId: { // NEW: Client ID for collaboration
    type: Number,
    unique: true,
    sparse: true
  },
  lastActiveAt: { // NEW: Last activity tracking
    type: Date,
    default: Date.now
  },
  documentsAccessed: { // NEW: Documents accessed by user
    type: [String],
    default: []
  },
  preferences: { // NEW: User preferences
    theme: { type: String, default: 'light' },
    fontSize: { type: Number, default: 14 }
  },
  documentIds: {
    type: [String],
    default: [],
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const UserModel = mongoose.model<IUser>('User', userSchema);

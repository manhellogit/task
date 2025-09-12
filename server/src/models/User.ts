import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  username: string;
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
  username: { 
    type: String, 
    required: true,
    trim: true
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

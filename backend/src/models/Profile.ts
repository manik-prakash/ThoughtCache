import { model, Schema, Document, Types } from 'mongoose';

export interface IProfile extends Document {
  user_id: Types.ObjectId;
  display_name: string | null;
  avatar_url: string | null;
  theme: 'light' | 'dark';
  created_at: Date;
  updated_at: Date;
}

const profileSchema = new Schema<IProfile>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    display_name: {
      type: String,
      default: null,
    },
    avatar_url: {
      type: String,
      default: null,
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export const Profile = model<IProfile>('Profile', profileSchema);


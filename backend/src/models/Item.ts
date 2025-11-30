import { model, Schema, Document, Types } from 'mongoose';

export interface IItem extends Document {
  user_id: Types.ObjectId;
  title: string;
  content: string;
  type: 'thought' | 'link' | 'bookmark' | 'clip';
  source_url: string | null;
  source_metadata: Record<string, unknown>;
  is_starred: boolean;
  is_public: boolean;
  share_slug: string | null;
  created_at: Date;
  updated_at: Date;
}

const itemSchema = new Schema<IItem>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['thought', 'link', 'bookmark', 'clip'],
      required: true,
    },
    source_url: {
      type: String,
      default: null,
    },
    source_metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    is_starred: {
      type: Boolean,
      default: false,
    },
    is_public: {
      type: Boolean,
      default: false,
    },
    share_slug: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export const Item = model<IItem>('Item', itemSchema);


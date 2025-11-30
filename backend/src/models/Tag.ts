import { model, Schema, Document, Types } from 'mongoose';

export interface ITag extends Document {
  user_id: Types.ObjectId;
  name: string;
  color: string | null;
  created_at: Date;
}

const tagSchema = new Schema<ITag>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);



export const Tag = model<ITag>('Tag', tagSchema);


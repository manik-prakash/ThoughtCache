import { model, Schema, Document, Types } from 'mongoose';

export interface IItemTag extends Document {
  item_id: Types.ObjectId;
  tag_id: Types.ObjectId;
}

const itemTagSchema = new Schema<IItemTag>(
  {
    item_id: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    tag_id: {
      type: Schema.Types.ObjectId,
      ref: 'Tag',
      required: true,
    },
  },
  {
    timestamps: false,
  }
);



itemTagSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await model('ItemTag').deleteMany({ item_id: doc.item_id });
  }
});

export const ItemTag = model<IItemTag>('ItemTag', itemTagSchema);


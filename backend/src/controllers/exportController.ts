import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Item } from '../models/Item';
import { Tag } from '../models/Tag';
import { ItemTag } from '../models/ItemTag';
import mongoose from 'mongoose';

export const exportData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    // Get all items
    const items = await Item.find({ user_id: userId });

    // Get all tags
    const tags = await Tag.find({ user_id: userId });

    // Get tags for each item
    const itemsWithTags = await Promise.all(
      items.map(async (item) => {
        const itemTags = await ItemTag.find({ item_id: item._id });
        const tagIds = itemTags.map((it) => it.tag_id);
        const itemTagData = await Tag.find({ _id: { $in: tagIds } });

        return {
          id: (item._id as any).toString(),
          user_id: item.user_id.toString(),
          title: item.title,
          content: item.content,
          type: item.type,
          source_url: item.source_url,
          source_metadata: item.source_metadata,
          is_starred: item.is_starred,
          is_public: item.is_public,
          share_slug: item.share_slug,
          created_at: item.created_at.toISOString(),
          updated_at: item.updated_at.toISOString(),
          tags: itemTagData.map((tag) => ({
            id: (tag._id as any).toString(),
            name: tag.name,
            color: tag.color,
          })),
        };
      })
    );

    res.json({
      items: itemsWithTags,
      tags: tags.map((tag) => ({
        id: (tag._id as any).toString(),
        user_id: tag.user_id.toString(),
        name: tag.name,
        color: tag.color,
        created_at: tag.created_at.toISOString(),
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to export data', message: error.message });
  }
};


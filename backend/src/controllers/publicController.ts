import { Request, Response } from 'express';
import { Item } from '../models/Item';
import { ItemTag } from '../models/ItemTag';
import { Tag } from '../models/Tag';

export const getSharedItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const item = await Item.findOne({ share_slug: slug, is_public: true });
    if (!item) {
      res.status(404).json({ error: 'Shared item not found' });
      return;
    }

    const itemTags = await ItemTag.find({ item_id: item._id });
    const tagIds = itemTags.map((it) => it.tag_id);
    const tags = await Tag.find({ _id: { $in: tagIds } });

    res.json({
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
      tags: tags.map((tag) => ({
        id: (tag._id as any).toString(),
        name: tag.name,
        color: tag.color,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch shared item', message: error.message });
  }
};


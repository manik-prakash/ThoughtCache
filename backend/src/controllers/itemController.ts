import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Item } from '../models/Item';
import { ItemTag } from '../models/ItemTag';
import { Tag } from '../models/Tag';
import { generateSlug, ensureUniqueSlug } from '../utils/slug';
import mongoose from 'mongoose';

export const listItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, type } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    let query: any = { user_id: userId };

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await Item.find(query).sort({ created_at: -1 });

    const itemsWithTags = await Promise.all(
      items.map(async (item) => {
        const itemTags = await ItemTag.find({ item_id: item._id });
        const tagIds = itemTags.map((it) => it.tag_id);
        const tags = await Tag.find({ _id: { $in: tagIds } });

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
          tags: tags.map((tag) => ({
            id: (tag._id as any).toString(),
            name: tag.name,
            color: tag.color,
          })),
        };
      })
    );

    res.json(itemsWithTags);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch items', message: error.message });
  }
};

export const getItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const item = await Item.findOne({ _id: id, user_id: userId });
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
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
    res.status(500).json({ error: 'Failed to fetch item', message: error.message });
  }
};

export const createItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, type, source_url, is_public, share_slug, tag_ids } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    let finalShareSlug = share_slug || null;
    if (is_public && !finalShareSlug) {
      finalShareSlug = generateSlug(title);
      finalShareSlug = await ensureUniqueSlug(finalShareSlug);
    } else if (is_public && finalShareSlug) {
      finalShareSlug = await ensureUniqueSlug(finalShareSlug);
    }

    const item = new Item({
      user_id: userId,
      title,
      content: content || '',
      type,
      source_url: source_url || null,
      is_public: is_public || false,
      share_slug: finalShareSlug,
    });

    await item.save();

    if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
      const itemTags = tag_ids.map((tagId: string) => ({
        item_id: item._id,
        tag_id: tagId,
      }));
      await ItemTag.insertMany(itemTags);
    }

    const itemTags = await ItemTag.find({ item_id: item._id });
    const tagIds = itemTags.map((it) => it.tag_id);
    const tags = await Tag.find({ _id: { $in: tagIds } });

    res.status(201).json({
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
    res.status(500).json({ error: 'Failed to create item', message: error.message });
  }
};

export const updateItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const { title, content, type, source_url, is_public, share_slug, tag_ids } = req.body;

    const item = await Item.findOne({ _id: id, user_id: userId });
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const wasPublic = item.is_public;
    const isBecomingPublic = is_public === true && !wasPublic;

    if (title !== undefined) item.title = title;
    if (content !== undefined) item.content = content;
    if (type !== undefined) item.type = type;
    if (source_url !== undefined) item.source_url = source_url;
    if (is_public !== undefined) item.is_public = is_public;

    if (is_public && (isBecomingPublic || !item.share_slug)) {
      const slugToUse = share_slug || generateSlug(item.title);
      item.share_slug = await ensureUniqueSlug(slugToUse, id);
    } else if (is_public && share_slug && share_slug !== item.share_slug) {
      item.share_slug = await ensureUniqueSlug(share_slug, id);
    } else if (!is_public) {
      item.share_slug = null;
    }

    await item.save();

    if (tag_ids !== undefined) {
      await ItemTag.deleteMany({ item_id: item._id });
      if (Array.isArray(tag_ids) && tag_ids.length > 0) {
        const itemTags = tag_ids.map((tagId: string) => ({
          item_id: item._id,
          tag_id: tagId,
        }));
        await ItemTag.insertMany(itemTags);
      }
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
    res.status(500).json({ error: 'Failed to update item', message: error.message });
  }
};

export const deleteItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const item = await Item.findOneAndDelete({ _id: id, user_id: userId });
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    await ItemTag.deleteMany({ item_id: id });

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete item', message: error.message });
  }
};

export const toggleStar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const item = await Item.findOne({ _id: id, user_id: userId });
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    item.is_starred = !item.is_starred;
    await item.save();

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
    res.status(500).json({ error: 'Failed to toggle star', message: error.message });
  }
};


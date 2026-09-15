import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Item } from '../models/Item';
import { ItemTag } from '../models/ItemTag';
import { Tag } from '../models/Tag';
import * as ragClient from '../utils/ragClient';
import mongoose from 'mongoose';

interface GraphTag {
  id: string;
  name: string;
  color: string | null;
}

interface GraphNode {
  id: string;
  title: string;
  type: string;
  is_starred: boolean;
  tags: GraphTag[];
}

interface GraphEdge {
  source: string;
  target: string;
  kind: 'tag' | 'semantic';
  shared_tags: GraphTag[];
  score?: number;
}

const pairKey = (a: string, b: string): string => (a < b ? `${a}::${b}` : `${b}::${a}`);

export const getGraph = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const items = await Item.find({ user_id: userId });
    const itemIds = items.map((item) => item._id);

    const itemTags = await ItemTag.find({ item_id: { $in: itemIds } });
    const tagIds = [...new Set(itemTags.map((it) => it.tag_id.toString()))];
    const tags = await Tag.find({ _id: { $in: tagIds } });
    const tagById = new Map(tags.map((tag) => [(tag._id as any).toString(), tag]));

    const tagsByItem = new Map<string, GraphTag[]>();
    const itemsByTag = new Map<string, string[]>();
    for (const it of itemTags) {
      const itemId = it.item_id.toString();
      const tagId = it.tag_id.toString();
      const tag = tagById.get(tagId);
      if (!tag) continue;

      const graphTag: GraphTag = { id: tagId, name: tag.name, color: tag.color };
      if (!tagsByItem.has(itemId)) tagsByItem.set(itemId, []);
      tagsByItem.get(itemId)!.push(graphTag);

      if (!itemsByTag.has(tagId)) itemsByTag.set(tagId, []);
      itemsByTag.get(tagId)!.push(itemId);
    }

    const nodes: GraphNode[] = items.map((item) => ({
      id: (item._id as any).toString(),
      title: item.title,
      type: item.type,
      is_starred: item.is_starred,
      tags: tagsByItem.get((item._id as any).toString()) || [],
    }));
    const itemIdSet = new Set(nodes.map((n) => n.id));

    const edgeByPair = new Map<string, GraphEdge>();

    for (const [tagId, memberIds] of itemsByTag) {
      const tag = tagById.get(tagId)!;
      const graphTag: GraphTag = { id: tagId, name: tag.name, color: tag.color };
      for (let i = 0; i < memberIds.length; i++) {
        for (let j = i + 1; j < memberIds.length; j++) {
          const key = pairKey(memberIds[i], memberIds[j]);
          let edge = edgeByPair.get(key);
          if (!edge) {
            edge = { source: memberIds[i], target: memberIds[j], kind: 'tag', shared_tags: [] };
            edgeByPair.set(key, edge);
          }
          edge.shared_tags.push(graphTag);
        }
      }
    }

    const similarPairs = await ragClient.getSimilarItemPairs(req.user!.id);
    for (const pair of similarPairs) {
      if (!itemIdSet.has(pair.item_id_a) || !itemIdSet.has(pair.item_id_b)) continue;
      const key = pairKey(pair.item_id_a, pair.item_id_b);
      const existing = edgeByPair.get(key);
      if (existing) {
        existing.score = pair.score;
      } else {
        edgeByPair.set(key, {
          source: pair.item_id_a,
          target: pair.item_id_b,
          kind: 'semantic',
          shared_tags: [],
          score: pair.score,
        });
      }
    }

    res.json({ nodes, edges: Array.from(edgeByPair.values()) });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to build graph', message: error.message });
  }
};

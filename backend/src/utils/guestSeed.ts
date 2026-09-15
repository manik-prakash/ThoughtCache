import crypto from 'crypto';
import { Types } from 'mongoose';
import { Item } from '../models/Item';
import { Tag } from '../models/Tag';
import { ItemTag } from '../models/ItemTag';
import * as ragClient from './ragClient';

export function generateGuestCredentials(): { email: string; password: string } {
  const id = crypto.randomUUID();
  return {
    email: `guest-${id}@guest.thoughtcache.local`,
    password: crypto.randomBytes(24).toString('hex'),
  };
}

const GUEST_TAGS = [
  { name: 'Ideas', color: '#22c55e' },
  { name: 'Reading', color: '#f59e0b' },
  { name: 'Productivity', color: '#0acffe' },
  { name: 'Work', color: '#ec4899' },
] as const;

interface GuestItemSeed {
  title: string;
  content: string;
  type: 'thought' | 'link' | 'bookmark' | 'clip';
  source_url?: string;
  tagNames: string[];
  is_starred?: boolean;
}

const GUEST_ITEMS: GuestItemSeed[] = [
  {
    title: 'Idea: weekly review ritual',
    content:
      'Every Friday, spend 15 minutes reviewing what I captured this week — star the best ones, tag the rest, archive the noise.',
    type: 'thought',
    tagNames: ['Ideas', 'Productivity'],
    is_starred: true,
  },
  {
    title: 'Building a Second Brain (the concept)',
    content: 'The original framework behind PARA and capturing knowledge instead of losing it in your head.',
    type: 'link',
    source_url: 'https://www.buildingasecondbrain.com/',
    tagNames: ['Reading', 'Ideas'],
  },
  {
    title: 'Markdown cheatsheet',
    content: 'Handy reference whenever I forget the syntax for tables or footnotes.',
    type: 'bookmark',
    source_url: 'https://www.markdownguide.org/cheat-sheet/',
    tagNames: ['Reading'],
  },
  {
    title: 'Quote on note-taking',
    content: '"The palest ink is better than the best memory." — Chinese proverb',
    type: 'clip',
    tagNames: ['Ideas'],
    is_starred: true,
  },
  {
    title: 'Refactor the onboarding flow',
    content:
      'New users bounce before reaching the aha-moment. Try showing a pre-filled example item instead of a blank state.',
    type: 'thought',
    tagNames: ['Work', 'Productivity'],
  },
  {
    title: 'Spaced repetition, explained',
    content: 'Why reviewing notes on an increasing interval beats cramming.',
    type: 'link',
    source_url: 'https://en.wikipedia.org/wiki/Spaced_repetition',
    tagNames: ['Reading'],
  },
];

export async function seedGuestContent(userId: Types.ObjectId): Promise<void> {
  const tagDocs = await Tag.insertMany(
    GUEST_TAGS.map((t) => ({ user_id: userId, name: t.name, color: t.color }))
  );
  const tagIdByName = new Map<string, Types.ObjectId>(
    tagDocs.map((t) => [t.name, t._id as any])
  );

  for (const seed of GUEST_ITEMS) {
    const item = new Item({
      user_id: userId,
      title: seed.title,
      content: seed.content,
      type: seed.type,
      source_url: seed.source_url ?? null,
      is_starred: seed.is_starred ?? false,
    });
    await item.save();

    const tagIds = seed.tagNames
      .map((name) => tagIdByName.get(name))
      .filter((id): id is Types.ObjectId => id !== undefined);
    if (tagIds.length > 0) {
      await ItemTag.insertMany(tagIds.map((tag_id) => ({ item_id: item._id, tag_id })));
    }

    ragClient
      .ingestItem({
        id: (item._id as any).toString(),
        user_id: userId.toString(),
        title: item.title,
        content: item.content,
      })
      .catch(() => {});
  }
}

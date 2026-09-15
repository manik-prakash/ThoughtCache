import User from '../models/User';
import { Profile } from '../models/Profile';
import { Item } from '../models/Item';
import { Tag } from '../models/Tag';
import { ItemTag } from '../models/ItemTag';
import * as ragClient from './ragClient';

const GUEST_MAX_AGE_MS = Number(process.env.GUEST_MAX_AGE_MS) || 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = Number(process.env.GUEST_CLEANUP_INTERVAL_MS) || 60 * 60 * 1000;

export async function cleanupExpiredGuests(): Promise<{ deletedUsers: number; deletedItems: number }> {
  const cutoff = new Date(Date.now() - GUEST_MAX_AGE_MS);
  const expiredUsers = await User.find({ is_guest: true, createdAt: { $lt: cutoff } }).select('_id');
  if (expiredUsers.length === 0) return { deletedUsers: 0, deletedItems: 0 };

  const userIds = expiredUsers.map((u) => u._id);
  const items = await Item.find({ user_id: { $in: userIds } }).select('_id');
  const itemIds = items.map((i) => i._id as any);

  await ItemTag.deleteMany({ item_id: { $in: itemIds } });
  await Item.deleteMany({ user_id: { $in: userIds } });
  await Tag.deleteMany({ user_id: { $in: userIds } });
  await Profile.deleteMany({ user_id: { $in: userIds } });
  await User.deleteMany({ _id: { $in: userIds } });

  await Promise.all(itemIds.map((id) => ragClient.deleteItemChunks(id.toString())));

  console.log(`[guestCleanup] removed ${userIds.length} guest users, ${itemIds.length} items`);
  return { deletedUsers: userIds.length, deletedItems: itemIds.length };
}

export function startGuestCleanupJob(): NodeJS.Timeout {
  cleanupExpiredGuests().catch((err) => console.error('[guestCleanup] initial run failed:', err));
  return setInterval(() => {
    cleanupExpiredGuests().catch((err) => console.error('[guestCleanup] run failed:', err));
  }, CLEANUP_INTERVAL_MS);
}

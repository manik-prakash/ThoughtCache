import { Item } from '../models/Item';

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') 
    .replace(/[\s_-]+/g, '-') 
    .replace(/^-+|-+$/g, ''); 
}

export async function ensureUniqueSlug(
  slug: string,
  excludeId?: string
): Promise<string> {
  let finalSlug = slug;
  let counter = 1;

  while (true) {
    const existingItem = await Item.findOne({
      share_slug: finalSlug,
      ...(excludeId && { _id: { $ne: excludeId } }),
    });

    if (!existingItem) {
      return finalSlug;
    }

    finalSlug = `${slug}-${counter}`;
    counter++;
  }
}


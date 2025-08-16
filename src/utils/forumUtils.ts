
export interface ForumPostFlat {
  id: string;
  parent_post_id?: string | null;
  // Allow both Dutch and English fields
  titel?: string | null;
  title?: string | null;
  inhoud?: string | null;
  content?: string | null;
  [key: string]: any;
}

export interface ForumPostNested extends ForumPostFlat {
  replies: ForumPostNested[];
}

/**
 * Organizes a flat list of posts into a nested tree based on parent_post_id.
 * Children are attached to their parents; root posts are those without parent_post_id.
 */
export function organizePosts(posts: ForumPostFlat[]): ForumPostNested[] {
  const postMap = new Map<string, ForumPostNested>();
  const roots: ForumPostNested[] = [];

  posts.forEach((p) => {
    postMap.set(p.id, { ...p, replies: [] });
  });

  posts.forEach((p) => {
    const current = postMap.get(p.id)!;
    if (p.parent_post_id) {
      const parent = postMap.get(p.parent_post_id);
      if (parent) {
        parent.replies.push(current);
      } else {
        // Orphaned reply without known parent -> treat as root to avoid losing content
        roots.push(current);
      }
    } else {
      roots.push(current);
    }
  });

  return roots;
}

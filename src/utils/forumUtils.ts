
export interface ForumPostFlat {
  id: string;
  parent_post_id?: string | null;
  // Allow both Dutch and English fields
  titel?: string | null;
  title?: string | null;
  inhoud?: string | null;
  content?: string | null;
  created_at: string;
  thread_id?: string;
  [key: string]: any;
}

export interface ForumPostNested extends ForumPostFlat {
  replies: ForumPostNested[];
}

/**
 * Organizes a flat list of posts into a nested tree based on parent_post_id.
 * Children are attached to their parents; root posts are those without parent_post_id.
 * Enhanced with better orphan handling and sorting.
 */
export function organizePosts(posts: ForumPostFlat[]): ForumPostNested[] {
  if (!posts || posts.length === 0) return [];

  const postMap = new Map<string, ForumPostNested>();
  const roots: ForumPostNested[] = [];
  const orphans: ForumPostNested[] = [];

  // First pass: create all post objects
  posts.forEach((p) => {
    postMap.set(p.id, { ...p, replies: [] });
  });

  // Second pass: organize hierarchy
  posts.forEach((p) => {
    const current = postMap.get(p.id)!;
    
    if (p.parent_post_id) {
      const parent = postMap.get(p.parent_post_id);
      if (parent) {
        parent.replies.push(current);
      } else {
        // Orphaned reply - treat as root but mark for potential cleanup
        console.warn(`Orphaned post found: ${p.id} references non-existent parent ${p.parent_post_id}`);
        orphans.push(current);
      }
    } else {
      roots.push(current);
    }
  });

  // Sort replies by creation date (oldest first for chronological order)
  const sortReplies = (post: ForumPostNested) => {
    if (post.replies.length > 0) {
      post.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      post.replies.forEach(sortReplies);
    }
  };

  // Apply sorting to all posts
  [...roots, ...orphans].forEach(sortReplies);

  // Sort root posts by creation date (newest first for main thread view)
  const allRoots = [...roots, ...orphans];
  allRoots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return allRoots;
}

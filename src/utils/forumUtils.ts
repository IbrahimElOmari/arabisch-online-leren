export interface ForumPostFlat {
  id: string;
  // Zorg dat deze velden aanwezig zijn zodat het compatibel is met ForumState.ForumPost
  thread_id: string;
  author_id: string;

  parent_post_id?: string | null;

  // Toestaan van zowel Nederlands als Engels
  titel?: string | null;
  title?: string | null;
  inhoud?: string | null;

  // Store verwacht content als string
  content: string;

  created_at: string;

  // Extra velden (zoals author, counts, enz.) mogen blijven bestaan
  [key: string]: any;
}

export interface ForumPostNested extends ForumPostFlat {
  replies: ForumPostNested[];
}

/**
 * Normalizes a post object to ensure consistent field names and safe content access.
 * Handles both Dutch (inhoud/titel) and English (content/title) schemas.
 */
export function normalizePost(post: any): ForumPostFlat {
  const id = post.id != null ? String(post.id) : '';
  const parentIdRaw = post.parent_post_id;
  const parentId =
    parentIdRaw === undefined || parentIdRaw === null || parentIdRaw === ''
      ? null
      : String(parentIdRaw);

  // Prioritize English fields, fallback to Dutch
  const safeContent = post.content ?? post.inhoud ?? '';
  const safeTitle = post.title ?? post.titel ?? null;

  return {
    ...post,
    id,
    parent_post_id: parentId,
    content: safeContent,
    title: safeTitle,
    // Keep both for compatibility
    inhoud: safeContent,
    titel: safeTitle,
  } as ForumPostFlat;
}

/**
 * Organizes a flat list of posts into a nested tree based on parent_post_id.
 * Children are attached to their parents; root posts are those without parent_post_id.
 * Enhanced with better orphan handling, sorting, and ID normalization.
 */
export function organizePosts(posts: ForumPostFlat[]): ForumPostNested[] {
  if (!posts || posts.length === 0) return [];

  console.log('organizePosts: Processing', posts.length, 'posts');

  // Normalize all posts first
  const normalized = posts.map(normalizePost);

  const postMap = new Map<string, ForumPostNested>();
  const roots: ForumPostNested[] = [];
  const orphans: ForumPostNested[] = [];

  // First pass: create all post objects
  normalized.forEach((p) => {
    postMap.set(p.id, { ...p, replies: [] });
  });

  // Second pass: organize hierarchy
  normalized.forEach((p) => {
    const current = postMap.get(p.id)!;

    // Guard against self-parent loops
    if (p.parent_post_id && p.parent_post_id === p.id) {
      console.warn(`Self-parent post detected: ${p.id}. Treating as root.`);
      roots.push(current);
      return;
    }

    if (p.parent_post_id) {
      const parent = postMap.get(p.parent_post_id);
      if (parent) {
        parent.replies.push(current);
      } else {
        // Orphaned reply - treat as root but mark it
        console.warn(
          `Orphaned post found: ${p.id} references non-existent parent ${p.parent_post_id}`
        );
        orphans.push(current);
      }
    } else {
      roots.push(current);
    }
  });

  console.log('organizePosts: Found', orphans.length, 'orphaned posts');
  console.log('organizePosts: Created', roots.length, 'root posts');

  // Sort replies by creation date (oldest first for chronological order)
  const sortReplies = (post: ForumPostNested) => {
    if (post.replies.length > 0) {
      post.replies.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      post.replies.forEach(sortReplies);
    }
  };

  // Apply sorting to all posts
  [...roots, ...orphans].forEach(sortReplies);

  // Sort root posts by creation date (newest first for main thread view)
  const allRoots = [...roots, ...orphans];
  allRoots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  console.log('organizePosts: Returning', allRoots.length, 'total root posts (including orphans)');

  return allRoots;
}

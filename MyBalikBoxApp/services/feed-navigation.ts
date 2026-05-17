let pendingScrollToPostId: string | null = null;

/** Navigate to feed tab, then consume to scroll to this post. */
export function setPendingFeedScrollPostId(postId: string): void {
  pendingScrollToPostId = postId;
}

export function consumePendingFeedScrollPostId(): string | null {
  const id = pendingScrollToPostId;
  pendingScrollToPostId = null;
  return id;
}

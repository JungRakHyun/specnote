import { getCollection, type CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'>;

export async function getPublishedPosts(): Promise<PostEntry[]> {
  const allPosts = await getCollection('posts', ({ data }) => !data.draft);
  return allPosts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
}

export function estimateReadingTime(body: string | undefined): number {
  if (!body) return 3;
  // 한국어 + 영어 혼합 텍스트 기준 분당 약 500자(공백 제외) 계산
  const plain = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`[\]()-]/g, ' ')
    .replace(/\s+/g, '');
  const minutes = Math.ceil(plain.length / 500);
  return Math.max(2, minutes);
}

export function formatDateKo(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function getRelatedPosts(
  current: PostEntry,
  allPosts: PostEntry[],
  limit = 3
): PostEntry[] {
  const currentTags = new Set(current.data.tags.map((t) => t.toLowerCase()));

  return allPosts
    .filter((p) => p.id !== current.id)
    .map((p) => {
      let score = 0;
      if (p.data.category === current.data.category) score += 3;
      for (const tag of p.data.tags) {
        if (currentTags.has(tag.toLowerCase())) score += 2;
      }
      return { post: p, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf()
    )
    .slice(0, limit)
    .map((item) => item.post);
}

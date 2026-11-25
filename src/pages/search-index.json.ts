import type { APIRoute } from 'astro';
import { getCategoryMeta } from '../config/site';
import { formatDateKo, getPublishedPosts } from '../utils/posts';
import { withBase } from '../utils/url';

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const payload = posts.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    url: withBase(`/posts/${post.id}/`),
    category: post.data.category,
    categoryLabel: getCategoryMeta(post.data.category).label,
    tags: post.data.tags,
    date: formatDateKo(post.data.pubDate),
  }));

  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};

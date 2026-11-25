import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../config/site';
import { getPublishedPosts } from '../utils/posts';
import { withBase } from '../utils/url';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: `${SITE.name} (${SITE.koName})`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: withBase(`/posts/${post.id}/`),
      categories: [post.data.category, ...post.data.tags],
    })),
    customData: `<language>ko-kr</language>`,
  });
}

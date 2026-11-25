import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().min(10).max(90),
    description: z.string().min(40).max(170),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(['ai-tools', 'dev-coding', 'tech-gear', 'automation', 'apps']),
    tags: z.array(z.string()).min(2).max(8),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    author: z.string().default('스펙노트 편집부'),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    // 제휴 마케팅 공정위 문구 자동 표시용
    affiliateType: z.enum(['none', 'coupang', 'general']).default('none'),
    // 구글 검색 리치 스니펫(FAQPage JSON-LD) 및 아코디언 자동 생성용
    faqs: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        })
      )
      .optional(),
    // 핵심 요약(TL;DR) 3줄 카드
    tldr: z.array(z.string()).optional(),
  }),
});

export const collections = { posts };

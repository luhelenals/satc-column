import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Post } from '../../../types/post';
import ShareButton from '../../../components/ShareButton';

async function PostDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;

  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  const post: Post | null = data;

  if (!post) {
    notFound();
  }

  return (
    <div className="p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#8a1c50] mb-2">
        <span>
          {new Date(post.created_at).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <ShareButton label="Share This Story" />
      </div>

      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2b1d26] mb-3">
        {post.title}
      </h1>

      <div className="bg-[#fff5fa] border-l-4 border-[#ff7eb3] p-3 mb-5 text-[13px] italic text-[#5c233f]">
        {post.summary}
      </div>

      {post.cover_image && (
        <img
          src={post.cover_image}
          alt={post.title}
          className="w-full max-h-96 object-cover border-2 border-[#d68fb0] p-1 bg-white mb-6"
        />
      )}

      <div
        className="column-prose"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <div className="mt-8 pt-4 border-t border-dashed border-[#d68fb0] flex flex-wrap items-center justify-between gap-3">
        <ShareButton label="Copy Story Link" />
        <Link href="/archive" className="y2k-btn">
          See All Other Stories &rarr;
        </Link>
      </div>
    </div>
  );
}

export default function SinglePostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <article className="y2k-window">
      <div className="y2k-titlebar">
        <span>★ reading_column.html</span>
        <Link href="/archive" className="underline text-[#0033cc] text-[11px]">
          &laquo; All Stories
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="p-8 text-center font-mono text-xs text-[#8a1c50]">
            loading story... ⏳
          </div>
        }
      >
        <PostDetailContent params={params} />
      </Suspense>
    </article>
  );
}
import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { Post } from '../../types/post';
import ShareButton from '../../components/ShareButton';

async function ArchiveListContent() {
  await connection();

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  const allPosts: Post[] = posts || [];

  if (allPosts.length === 0) {
    return (
      <p className="text-center py-6 text-[#6b2146]">
        No published stories in the archive yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-dashed divide-[#d68fb0]">
      {allPosts.map((post) => (
        <article
          key={post.id}
          className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 justify-between items-start"
        >
          <div className="flex-1">
            <div className="text-[11px] font-mono text-[#8a1c50] mb-1">
              {new Date(post.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>

            <Link
              href={`/post/${post.slug}`}
              className="font-serif text-xl font-bold text-[#0033cc] hover:underline block mb-1.5"
            >
              {post.title}
            </Link>

            <p className="text-[13px] text-[#3d2934] leading-relaxed mb-2">
              {post.summary}
            </p>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-1.5 py-0.5 bg-[#fff0f7] border border-[#e3a8c5] text-[#8a1c50]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex sm:flex-col items-end gap-2 shrink-0">
            <Link href={`/post/${post.slug}`} className="y2k-btn">
              Read Column
            </Link>
            <ShareButton path={`/post/${post.slug}`} label="Share" />
          </div>
        </article>
      ))}
    </div>
  );
}

export default function ArchivePage() {
  return (
    <section className="y2k-window">
      <div className="y2k-titlebar">
        <span>★ column_archive // all published stories</span>
        <Link href="/" className="underline text-[#0033cc] text-[11px]">
          &laquo; Back to Home
        </Link>
      </div>

      <div className="p-4 sm:p-6">
        <Suspense
          fallback={
            <div className="py-6 text-center font-mono text-xs text-[#8a1c50]">
              fetching column archive... ⏳
            </div>
          }
        >
          <ArchiveListContent />
        </Suspense>
      </div>
    </section>
  );
}
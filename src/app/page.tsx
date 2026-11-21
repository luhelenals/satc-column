import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { Post } from '../types/post';
import BioBox from '../components/BioBox';
import ShareButton from '../components/ShareButton';

async function LatestStoryContent() {
  await connection();

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1);

  const latestPost: Post | undefined = posts?.[0];

  if (!latestPost) {
    return (
      <div className="p-8 text-center">
        <p className="font-serif text-lg text-[#6b2146] mb-4">
          No columns published yet! Log in to write your first piece.
        </p>
        <Link href="/admin" className="y2k-btn y2k-btn-pink">
          Go to Admin Writer
        </Link>
      </div>
    );
  }

  return (
    <article className="p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#8a1c50] mb-2">
        <span>
          Published:{' '}
          {new Date(latestPost.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <ShareButton
          path={`/post/${latestPost.slug}`}
          label="Share Story"
        />
      </div>

      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2b1d26] mb-3">
        {latestPost.title}
      </h2>

      <div className="bg-[#fff5fa] border-l-4 border-[#ff7eb3] p-3 mb-5 text-[13px] italic text-[#5c233f]">
        {latestPost.summary}
      </div>

      {latestPost.cover_image && (
        <img
          src={latestPost.cover_image}
          alt={latestPost.title}
          className="w-full max-h-96 object-cover border-2 border-[#d68fb0] p-1 bg-white mb-6"
        />
      )}

      <div
        className="column-prose"
        dangerouslySetInnerHTML={{ __html: latestPost.content }}
      />

      <div className="mt-8 pt-4 border-t border-dashed border-[#d68fb0] flex flex-wrap items-center justify-between gap-3">
        <ShareButton
          path={`/post/${latestPost.slug}`}
          label="Copy Story Link"
        />
        <Link href="/archive" className="y2k-btn y2k-btn-pink">
          Read All Previous Columns &rarr;
        </Link>
      </div>
    </article>
  );
}

export default function HomePage() {
  return (
    <div>
      <section className="y2k-window">
        <div className="y2k-titlebar">
          <span>★ latest_column.doc</span>
          <Link href="/archive" className="underline text-[#0033cc] text-[11px]">
            See All Stories &raquo;
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="p-8 text-center font-mono text-xs text-[#8a1c50]">
              loading latest column... ⏳
            </div>
          }
        >
          <LatestStoryContent />
        </Suspense>
      </section>
    </div>
  );
}
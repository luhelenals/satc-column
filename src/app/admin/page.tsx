'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Post, PostStatus } from '../../types/post';
import RichTextEditor from '../../components/RichTextEditor';
import {
  LogOut,
  Plus,
  Edit3,
  Archive,
  RotateCcw,
  Send,
  Save,
  Sparkles,
  PenLine,
} from 'lucide-react';

interface ColumnIdea {
  title: string;
  summary: string;
  promptQuestion: string;
  culturalHook: string;
  tags: string[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default function AdminPage() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Login Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Posts List & Filter
  const [posts, setPosts] = useState<Post[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | PostStatus>('all');

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [content, setContent] = useState('<p>I couldn&apos;t help but wonder...</p>');
  const [saving, setSaving] = useState(false);

  // AI Brainstorm State
  const [vibeFilter, setVibeFilter] = useState('');
  const [ideas, setIdeas] = useState<ColumnIdea[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionEmail(session?.user?.email ?? null);
      setLoadingAuth(false);
      if (session) fetchAllPosts();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email ?? null);
      if (session) fetchAllPosts();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setAuthError(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionEmail(null);
  };

  const generateIdeas = async () => {
    setLoadingIdeas(true);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vibe: vibeFilter }),
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          `A rota /api/ideas retornou status ${res.status} (verifique se src/app/api/ideas/route.ts existe e reinicie o servidor).`
        );
      }

      if (!res.ok) throw new Error(data.error || 'Erro ao buscar ideias');
      setIdeas(data.ideas || []);
    } catch (err: unknown) {
      alert(
        'Erro ao gerar sugestões: ' +
          (err instanceof Error ? err.message : 'Erro desconhecido')
      );
    } finally {
      setLoadingIdeas(false);
    }
  };

  const useIdeaInEditor = (idea: ColumnIdea) => {
    setEditingId(null);
    setTitle(idea.title);
    setSummary(idea.summary);
    setTagsInput(idea.tags.join(', '));
    setCoverImage('');
    setContent(
      `<blockquote><strong>Gancho (${idea.culturalHook}):</strong> ${idea.promptQuestion}</blockquote><p>Eu não pude deixar de me perguntar...</p>`
    );
    setIsEditing(true);
  };

  const startNewPost = () => {
    setEditingId(null);
    setTitle('');
    setSummary('');
    setTagsInput('');
    setCoverImage('');
    setContent('<p>I couldn&apos;t help but wonder...</p>');
    setIsEditing(true);
  };

  const startEditPost = (post: Post) => {
    setEditingId(post.id);
    setTitle(post.title);
    setSummary(post.summary);
    setTagsInput(post.tags?.join(', ') || '');
    setCoverImage(post.cover_image || '');
    setContent(post.content);
    setIsEditing(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const fileName = `cover-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('column-images')
      .upload(fileName, file);
    if (error) {
      alert('Upload failed: ' + error.message);
      return;
    }
    const { data } = supabase.storage.from('column-images').getPublicUrl(fileName);
    setCoverImage(data.publicUrl);
  };

  const savePost = async (targetStatus: PostStatus) => {
    if (!title.trim() || !summary.trim()) {
      alert('Please fill in both a Title and a Brief Summary.');
      return;
    }

    setSaving(true);
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      summary: summary.trim(),
      content,
      cover_image: coverImage || null,
      tags: parsedTags,
      status: targetStatus,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase
        .from('posts')
        .update(payload)
        .eq('id', editingId);
      if (error) alert(error.message);
    } else {
      const uniqueSlug = `${slugify(title)}-${Date.now().toString().slice(-4)}`;
      const { error } = await supabase
        .from('posts')
        .insert([{ ...payload, slug: uniqueSlug }]);
      if (error) alert(error.message);
    }

    setSaving(false);
    setIsEditing(false);
    fetchAllPosts();
  };

  const toggleArchive = async (post: Post) => {
    const nextStatus: PostStatus =
      post.status === 'archived' ? 'published' : 'archived';
    await supabase
      .from('posts')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', post.id);
    fetchAllPosts();
  };

  if (loadingAuth) {
    return (
      <div className="y2k-window p-6 text-center font-mono">
        Loading security terminal...
      </div>
    );
  }

  /* 1. LOGIN SCREEN */
  if (!sessionEmail) {
    return (
      <div className="y2k-window max-w-md mx-auto">
        <div className="y2k-titlebar">
          <span>🔒 admin_login.exe</span>
        </div>
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <p className="text-xs text-[#5c233f]">
            Restricted area. Enter your columnist credentials to write, edit, or
            archive stories.
          </p>

          {authError && (
            <div className="bg-red-100 border border-red-400 text-red-700 p-2 text-xs">
              {authError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold mb-1">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-[#c97da3] p-2 bg-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-[#c97da3] p-2 bg-white text-sm"
            />
          </div>

          <button
            type="submit"
            className="y2k-btn y2k-btn-pink w-full justify-center py-2"
          >
            Log In
          </button>
        </form>
      </div>
    );
  }

  /* 2. EDITOR VIEW */
  if (isEditing) {
    return (
      <div className="y2k-window">
        <div className="y2k-titlebar">
          <span>✍️ {editingId ? 'edit_column.doc' : 'new_column.doc'}</span>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="underline text-[#0033cc] text-[11px]"
          >
            Cancel
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">Column Title *</label>
            <input
              type="text"
              placeholder="e.g., Are Dating Apps Making Us Forget How to Flirt?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-2 border-[#c97da3] p-2 font-serif text-lg bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Brief Summary (shown in feed &amp; archive) *
            </label>
            <textarea
              rows={2}
              placeholder="A punchy 1-2 sentence hook summarizing this week's column..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full border-2 border-[#c97da3] p-2 text-sm bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="girly, tech, politics, lgbt"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full border-2 border-[#c97da3] p-2 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                Optional Cover Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="text-xs"
              />
              {coverImage && (
                <div className="mt-1 flex items-center gap-2 text-[11px] text-green-700">
                  <span>Cover attached!</span>
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    className="underline text-red-600"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Column Body</label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>

          {/* Draft vs Publish Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => savePost('draft')}
              className="y2k-btn"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save as Draft'}</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => savePost('published')}
              className="y2k-btn y2k-btn-pink"
            >
              <Send className="w-4 h-4" />
              <span>{saving ? 'Publishing...' : 'Publish Column'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* 3. ADMIN DASHBOARD + GERADOR DE IDEIAS COM IA */
  const filteredPosts =
    filterTab === 'all' ? posts : posts.filter((p) => p.status === filterTab);

  return (
    <div className="space-y-5">
      {/* Caixa de Brainstorm com Gemini */}
      <section className="y2k-window">
        <div className="y2k-titlebar">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> brainstorm_ai.exe // inspiração semanal
          </span>
          <span className="text-[10px] font-mono">pop • livros • atualidades</span>
        </div>

        <div className="p-4 bg-[#fff5fa] space-y-3">
          <p className="text-xs text-[#5c233f]">
            Sem ideia para a coluna da semana? O Gemini pesquisa lançamentos de
            música pop, livros em alta e eventos atuais para sugerir ganchos
            estilo Carrie Bradshaw:
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Opcional: tema específico (ex: novo álbum pop, namoro, IA, livros sáficos...)"
              value={vibeFilter}
              onChange={(e) => setVibeFilter(e.target.value)}
              className="flex-1 border-2 border-[#c97da3] bg-white px-2.5 py-1.5 text-xs focus:outline-none"
            />
            <button
              type="button"
              disabled={loadingIdeas}
              onClick={generateIdeas}
              className="y2k-btn y2k-btn-pink shrink-0 justify-center"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loadingIdeas ? 'Pesquisando tendências...' : 'Sugerir Pautas'}</span>
            </button>
          </div>

          {ideas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {ideas.map((idea, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#d68fb0] p-3 flex flex-col justify-between shadow-[2px_2px_0px_rgba(201,125,163,0.25)]"
                >
                  <div>
                    <div className="text-[10px] font-mono text-[#9e225c] bg-[#ffe6f2] px-1.5 py-0.5 inline-block mb-1.5 border border-[#e3a8c5]">
                      📌 {idea.culturalHook}
                    </div>
                    <h3 className="font-serif font-bold text-sm text-[#2b1d26] mb-1">
                      {idea.title}
                    </h3>
                    <p className="text-[11px] text-[#4a3540] mb-2 leading-relaxed">
                      {idea.summary}
                    </p>
                    <p className="text-[11px] italic text-[#6b2146] bg-[#fff9fc] border-l-2 border-[#ff7eb3] pl-2 py-1 mb-2">
                      “{idea.promptQuestion}”
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-dashed border-[#f0c2d8]">
                    <div className="flex flex-wrap gap-1">
                      {idea.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[9px] font-mono text-[#8a1c50] bg-[#fff0f7] px-1 border border-[#e3a8c5]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => useIdeaInEditor(idea)}
                      className="y2k-btn !px-2 !py-1 text-[11px] shrink-0"
                    >
                      <PenLine className="w-3 h-3" />
                      <span>Escrever</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Gerenciador de Posts */}
      <section className="y2k-window">
        <div className="y2k-titlebar">
          <span>★ columnist_desk // logged in as {sessionEmail}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 text-[11px] underline text-[#4a1530]"
          >
            <LogOut className="w-3 h-3" /> Logout
          </button>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'published', 'draft', 'archived'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={`y2k-btn capitalize ${
                    filterTab === tab ? '!bg-[#ff9ec7]' : ''
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={startNewPost}
              className="y2k-btn y2k-btn-pink"
            >
              <Plus className="w-4 h-4" />
              <span>Write New Column</span>
            </button>
          </div>

          <div className="divide-y divide-dashed divide-[#d68fb0]">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.5 border ${
                        post.status === 'published'
                          ? 'bg-green-100 border-green-400 text-green-800'
                          : post.status === 'draft'
                          ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                          : 'bg-gray-200 border-gray-400 text-gray-700'
                      }`}
                    >
                      {post.status}
                    </span>
                    <span className="text-[11px] font-mono text-gray-500">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-serif font-bold text-base">{post.title}</div>
                  <div className="text-xs text-gray-600 line-clamp-1">
                    {post.summary}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEditPost(post)}
                    className="y2k-btn"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleArchive(post)}
                    className="y2k-btn"
                    title={
                      post.status === 'archived'
                        ? 'Restore to Published'
                        : 'Archive Story (hide without deleting)'
                    }
                  >
                    {post.status === 'archived' ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Unarchive</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}

            {filteredPosts.length === 0 && (
              <p className="text-center py-6 text-xs text-gray-500 font-mono">
                No stories found under &quot;{filterTab}&quot;.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
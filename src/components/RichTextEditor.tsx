'use client';

import React, { useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  ImagePlus,
  Link2,
  Undo,
  Redo,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'column-prose min-h-[340px] p-4 bg-white focus:outline-none border-t border-[#d68fb0]',
      },
    },
  });

  if (!editor) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('column-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('column-images')
        .getPublicUrl(fileName);

      editor.chain().focus().setImage({ src: data.publicUrl }).run();
    } catch (err: unknown) {
      alert(
        'Image upload failed: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="border-2 border-[#c97da3] bg-[#fff5fa]">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-[#ffe3f0]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`y2k-btn !px-2 !py-1 ${
            editor.isActive('heading', { level: 1 }) ? '!bg-[#ff9ec7]' : ''
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`y2k-btn !px-2 !py-1 ${
            editor.isActive('heading', { level: 2 }) ? '!bg-[#ff9ec7]' : ''
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`y2k-btn !px-2 !py-1 ${
            editor.isActive('bold') ? '!bg-[#ff9ec7]' : ''
          }`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`y2k-btn !px-2 !py-1 ${
            editor.isActive('italic') ? '!bg-[#ff9ec7]' : ''
          }`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`y2k-btn !px-2 !py-1 ${
            editor.isActive('bulletList') ? '!bg-[#ff9ec7]' : ''
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`y2k-btn !px-2 !py-1 ${
            editor.isActive('orderedList') ? '!bg-[#ff9ec7]' : ''
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`y2k-btn !px-2 !py-1 ${
            editor.isActive('blockquote') ? '!bg-[#ff9ec7]' : ''
          }`}
          title="Pull Quote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={addLink}
          className="y2k-btn !px-2 !py-1"
          title="Add Link"
        >
          <Link2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="y2k-btn !px-2 !py-1"
          title="Insert Photo"
        >
          <ImagePlus className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Add Photo'}</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            className="y2k-btn !px-2 !py-1"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            className="y2k-btn !px-2 !py-1"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Writing Surface */}
      <EditorContent editor={editor} />
    </div>
  );
}
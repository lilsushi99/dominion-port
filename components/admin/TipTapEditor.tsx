'use client';

// components/admin/TipTapEditor.tsx — TipTap Rich Text Editor for Papers with Media Nodes
import React, { useState } from 'react';
import { uploadMediaFile } from '@/lib/admin-upload';
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Minus,
  Undo,
  Redo,
  Trash2,
  Upload
} from 'lucide-react';
import { MediaRecord } from '@/backend/src/services/media.service';

// Custom TipTap React Node View for Image Media Node (storing mediaId)
function ImageMediaComponent(props: any) {
  const { node, updateAttributes, deleteNode } = props;
  const { mediaId, src, alt, caption } = node.attrs;

  return (
    <NodeViewWrapper className="my-6 block not-prose">
      <div className="relative group rounded-xl overflow-hidden border border-[#e4e3ea] bg-[#f6f5fa] p-2">
        <div className="relative aspect-video max-h-[380px] w-full bg-[#16151c] rounded-lg overflow-hidden flex items-center justify-center">
          {src ? (
            <img src={src} alt={alt || ''} className="w-full h-full object-contain" />
          ) : (
            <div className="text-[12px] text-[#86858f]">Media ID #{mediaId}</div>
          )}
          <button
            type="button"
            onClick={deleteNode}
            className="absolute top-2 right-2 p-1.5 bg-[#d92d4a] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete media block"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <div className="mt-2 px-1">
          <input
            type="text"
            placeholder="Add an italic figure caption (optional)..."
            value={caption || ''}
            onChange={(e) => updateAttributes({ caption: e.target.value })}
            className="w-full text-[13px] italic text-[#4a4955] bg-transparent border-b border-transparent focus:border-[#5b4be0] outline-none py-1 placeholder:italic placeholder:text-[#86858f]"
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// Custom TipTap React Node View for Video Media Node (storing mediaId)
function VideoMediaComponent(props: any) {
  const { node, updateAttributes, deleteNode } = props;
  const { mediaId, src, caption } = node.attrs;

  return (
    <NodeViewWrapper className="my-6 block not-prose">
      <div className="relative group rounded-xl overflow-hidden border border-[#e4e3ea] bg-[#f6f5fa] p-2">
        <div className="relative aspect-video max-h-[380px] w-full bg-[#16151c] rounded-lg overflow-hidden flex items-center justify-center">
          {src ? (
            <video src={src} controls className="w-full h-full object-contain" />
          ) : (
            <div className="text-[12px] text-[#86858f]">Video ID #{mediaId}</div>
          )}
          <button
            type="button"
            onClick={deleteNode}
            className="absolute top-2 right-2 p-1.5 bg-[#d92d4a] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete video block"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <div className="mt-2 px-1">
          <input
            type="text"
            placeholder="Add an italic video caption (optional)..."
            value={caption || ''}
            onChange={(e) => updateAttributes({ caption: e.target.value })}
            className="w-full text-[13px] italic text-[#4a4955] bg-transparent border-b border-transparent focus:border-[#5b4be0] outline-none py-1 placeholder:italic placeholder:text-[#86858f]"
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// Custom TipTap Node Definition: ImageMediaNode
const ImageMediaNode = Node.create({
  name: 'imageMediaNode',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      mediaId: {
        default: null,
        parseHTML: (element) => Number(element.getAttribute('data-media-id')),
        renderHTML: (attributes) => ({ 'data-media-id': attributes.mediaId }),
      },
      src: {
        default: null,
        parseHTML: (element) => {
          const img = element.querySelector?.('img');
          return img?.getAttribute('src') || element.getAttribute('data-src') || null;
        },
        renderHTML: (attributes) => ({ 'data-src': attributes.src }),
      },
      alt: {
        default: '',
        parseHTML: (element) => {
          const img = element.querySelector?.('img');
          return img?.getAttribute('alt') || element.getAttribute('data-alt') || '';
        },
        renderHTML: (attributes) => ({ 'data-alt': attributes.alt }),
      },
      caption: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-caption') || element.querySelector?.('figcaption')?.textContent || '',
        renderHTML: (attributes) => ({ 'data-caption': attributes.caption }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image-media"]',
        getAttrs: (element: HTMLElement | any) => {
          const img = element.querySelector?.('img');
          return {
            mediaId: Number(element.getAttribute?.('data-media-id')),
            src: img?.getAttribute?.('src') || element.getAttribute?.('data-src') || null,
            alt: img?.getAttribute?.('alt') || element.getAttribute?.('data-alt') || '',
            caption: element.querySelector?.('figcaption')?.textContent || element.getAttribute?.('data-caption') || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const mediaId = HTMLAttributes['data-media-id'] || HTMLAttributes.mediaId;
    const src = HTMLAttributes['data-src'] || HTMLAttributes.src || '';
    const alt = HTMLAttributes['data-alt'] || HTMLAttributes.alt || '';
    const caption = HTMLAttributes['data-caption'] || HTMLAttributes.caption;
    return [
      'figure',
      mergeAttributes({ 'data-type': 'image-media', 'data-media-id': mediaId, 'data-src': src, 'data-alt': alt, class: 'paper-media-figure my-8' }),
      ['img', { src, alt, class: 'w-full rounded-lg border border-[#222]' }],
      caption ? ['figcaption', { class: 'text-[13px] text-[#75746f] mt-2 italic text-center' }, caption] : '',
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageMediaComponent);
  },
});

// Custom TipTap Node Definition: VideoMediaNode
const VideoMediaNode = Node.create({
  name: 'videoMediaNode',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      mediaId: {
        default: null,
        parseHTML: (element) => Number(element.getAttribute('data-media-id')),
        renderHTML: (attributes) => ({ 'data-media-id': attributes.mediaId }),
      },
      src: {
        default: null,
        parseHTML: (element) => {
          const video = element.querySelector?.('video');
          return video?.getAttribute('src') || element.getAttribute('data-src') || null;
        },
        renderHTML: (attributes) => ({ 'data-src': attributes.src }),
      },
      caption: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-caption') || element.querySelector?.('figcaption')?.textContent || '',
        renderHTML: (attributes) => ({ 'data-caption': attributes.caption }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="video-media"]',
        getAttrs: (element: HTMLElement | any) => {
          const video = element.querySelector?.('video');
          return {
            mediaId: Number(element.getAttribute?.('data-media-id')),
            src: video?.getAttribute?.('src') || element.getAttribute?.('data-src') || null,
            caption: element.querySelector?.('figcaption')?.textContent || element.getAttribute?.('data-caption') || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const mediaId = HTMLAttributes['data-media-id'] || HTMLAttributes.mediaId;
    const src = HTMLAttributes['data-src'] || HTMLAttributes.src || '';
    const caption = HTMLAttributes['data-caption'] || HTMLAttributes.caption;
    return [
      'figure',
      mergeAttributes({ 'data-type': 'video-media', 'data-media-id': mediaId, 'data-src': src, class: 'paper-video-figure my-8' }),
      ['video', { src, controls: 'true', playsinline: 'true', class: 'w-full rounded-lg border border-[#222]' }],
      caption ? ['figcaption', { class: 'text-[13px] text-[#75746f] mt-2 italic text-center' }, caption] : '',
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoMediaComponent);
  },
});

interface TipTapEditorProps {
  initialJson?: any;
  initialHtml?: string;
  onChange: (json: any, html: string) => void;
  csrfToken: string;
}

export function TipTapEditor({ initialJson, initialHtml, onChange, csrfToken }: TipTapEditorProps) {
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerKind, setMediaPickerKind] = useState<'image' | 'video'>('image');
  const [mediaList, setMediaList] = useState<MediaRecord[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-[#d6d5cf] underline underline-offset-2',
        },
      }),
      Placeholder.configure({
        placeholder: 'Begin writing paper in depth. Headings, italic captions, quotes, and media blocks will save perfectly...',
      }),
      ImageMediaNode,
      VideoMediaNode,
    ],
    content: initialJson && Object.keys(initialJson).length > 0 ? initialJson : (initialHtml || '<p></p>'),
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[380px] p-6 text-[15px] leading-[1.75] text-[#16151c] focus:outline-none max-w-none prose prose-p:my-3 prose-headings:font-semibold prose-headings:text-[#16151c] prose-h2:text-[19px] prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-[16px] prose-h3:mt-6 prose-h3:mb-2 prose-blockquote:border-l-2 prose-blockquote:border-[#cfcdd8] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-[#4a4955] prose-a:text-[#5b4be0] prose-a:underline',
      },
    },
    immediatelyRender: false,
  });

  const openMediaPicker = async (kind: 'image' | 'video') => {
    setMediaPickerKind(kind);
    setMediaPickerOpen(true);
    setMediaLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/media?kind=${kind}&limit=40`);
      const json = await res.json();
      if (json.data) setMediaList(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setMediaLoading(false);
    }
  };

  const insertMedia = (media: MediaRecord) => {
    if (!editor) return;

    if (media.kind === 'video') {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'videoMediaNode',
          attrs: {
            mediaId: media.id,
            src: media.public_url,
            caption: '',
          },
        })
        .insertContent({ type: 'paragraph' })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'imageMediaNode',
          attrs: {
            mediaId: media.id,
            src: media.public_url,
            alt: media.alt || '',
            caption: '',
          },
        })
        .insertContent({ type: 'paragraph' })
        .run();
    }

    setMediaPickerOpen(false);
  };

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const media = await uploadMediaFile(file, { csrfToken, alt: file.name.split('.')[0] || '', purpose: 'paper' });
      insertMedia(media);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Upload failed.');
    }
  };

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) {
    return (
      <div className="p-8 text-center text-[13px] text-[#86858f] bg-[#f6f5fa] rounded-xl">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="border border-[#e4e3ea] rounded-2xl bg-[#fdfcff] overflow-hidden shadow-[0_1px_2px_rgba(22,21,28,0.04)]">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-[#f6f5fa] border-b border-[#e4e3ea] text-[#4a4955]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg text-[13px] transition-colors ${
            editor.isActive('bold') ? 'bg-[#e4e3ea] text-[#16151c] font-semibold' : 'hover:bg-[#e4e3ea]/60'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg text-[13px] transition-colors ${
            editor.isActive('italic') ? 'bg-[#e4e3ea] text-[#16151c] font-semibold' : 'hover:bg-[#e4e3ea]/60'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic size={15} />
        </button>

        <div className="w-[1px] h-4 bg-[#cfcdd8] mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg text-[13px] transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-[#e4e3ea] text-[#16151c] font-semibold' : 'hover:bg-[#e4e3ea]/60'
          }`}
          title="Heading 2"
        >
          <Heading2 size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg text-[13px] transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-[#e4e3ea] text-[#16151c] font-semibold' : 'hover:bg-[#e4e3ea]/60'
          }`}
          title="Heading 3"
        >
          <Heading3 size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg text-[13px] transition-colors ${
            editor.isActive('blockquote') ? 'bg-[#e4e3ea] text-[#16151c] font-semibold' : 'hover:bg-[#e4e3ea]/60'
          }`}
          title="Blockquote"
        >
          <Quote size={15} />
        </button>

        <div className="w-[1px] h-4 bg-[#cfcdd8] mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg text-[13px] transition-colors ${
            editor.isActive('bulletList') ? 'bg-[#e4e3ea] text-[#16151c] font-semibold' : 'hover:bg-[#e4e3ea]/60'
          }`}
          title="Bullet List"
        >
          <List size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg text-[13px] transition-colors ${
            editor.isActive('orderedList') ? 'bg-[#e4e3ea] text-[#16151c] font-semibold' : 'hover:bg-[#e4e3ea]/60'
          }`}
          title="Ordered List"
        >
          <ListOrdered size={15} />
        </button>

        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded-lg text-[13px] transition-colors ${
            editor.isActive('link') ? 'bg-[#e4e3ea] text-[#16151c] font-semibold' : 'hover:bg-[#e4e3ea]/60'
          }`}
          title="Hyperlink"
        >
          <LinkIcon size={15} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-lg text-[13px] hover:bg-[#e4e3ea]/60 transition-colors"
          title="Horizontal Rule"
        >
          <Minus size={15} />
        </button>

        <div className="w-[1px] h-4 bg-[#cfcdd8] mx-1" />

        {/* Media Inserts */}
        <button
          type="button"
          onClick={() => openMediaPicker('image')}
          className="px-2.5 py-1 rounded-lg text-[12px] font-medium bg-[#fdfcff] border border-[#e4e3ea] hover:bg-[#e4e3ea]/60 text-[#16151c] flex items-center gap-1.5 shadow-2xs"
          title="Insert Image (stores mediaId)"
        >
          <ImageIcon size={14} className="text-[#5b4be0]" />
          <span>Insert Image</span>
        </button>

        <button
          type="button"
          onClick={() => openMediaPicker('video')}
          className="px-2.5 py-1 rounded-lg text-[12px] font-medium bg-[#fdfcff] border border-[#e4e3ea] hover:bg-[#e4e3ea]/60 text-[#16151c] flex items-center gap-1.5 shadow-2xs"
          title="Insert Video (stores mediaId)"
        >
          <VideoIcon size={14} className="text-[#5b4be0]" />
          <span>Insert Video</span>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg text-[13px] hover:bg-[#e4e3ea]/60 disabled:opacity-30 transition-colors"
            title="Undo"
          >
            <Undo size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg text-[13px] hover:bg-[#e4e3ea]/60 disabled:opacity-30 transition-colors"
            title="Redo"
          >
            <Redo size={14} />
          </button>
        </div>
      </div>

      {/* Editor Content Surface */}
      <div className="p-2 sm:p-4">
        <EditorContent editor={editor} />
      </div>

      {/* Media Picker Modal */}
      {mediaPickerOpen && (
        <div className="fixed inset-0 z-50 bg-[#16151c]/40 flex items-center justify-center p-4">
          <div className="bg-[#fdfcff] rounded-2xl border border-[#e4e3ea] p-6 max-w-[680px] w-full shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#e4e3ea]">
              <div>
                <h3 className="text-[17px] font-semibold text-[#16151c]">
                  Select {mediaPickerKind === 'video' ? 'Video' : 'Image'} Asset
                </h3>
                <p className="text-[12px] text-[#86858f] mt-0.5">
                  Stored as a referencing <code>mediaId</code> node in the database.
                </p>
              </div>

              <label className="px-3 py-1.5 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white text-[12px] font-medium rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs">
                <Upload size={13} />
                <span>Upload file</span>
                <input type="file" onChange={handleQuickUpload} className="hidden" />
              </label>
            </div>

            <div className="py-4 overflow-y-auto flex-1">
              {mediaLoading ? (
                <div className="p-8 text-center text-[13px] text-[#86858f]">Loading assets...</div>
              ) : mediaList.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-[#86858f]">
                  No {mediaPickerKind}s found. Upload one to insert.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {mediaList.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => insertMedia(m)}
                      className="group p-2 bg-[#f6f5fa] rounded-xl border border-[#e4e3ea] hover:border-[#5b4be0] transition-all text-left flex flex-col"
                    >
                      <div className="aspect-video w-full bg-[#16151c] rounded-lg overflow-hidden flex items-center justify-center">
                        {m.kind === 'video' ? (
                          <video src={m.public_url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={m.public_url} alt={m.alt || ''} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="mt-2 text-[11px] font-medium text-[#16151c] truncate w-full" title={m.original_name}>
                        {m.original_name}
                      </div>
                      <div className="text-[10px] text-[#86858f]">Media #{m.id}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#e4e3ea] flex justify-end">
              <button
                type="button"
                onClick={() => setMediaPickerOpen(false)}
                className="px-4 py-2 text-[13px] font-medium text-[#4a4955] hover:bg-[#f6f5fa] rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

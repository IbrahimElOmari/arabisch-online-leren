import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Button } from '@/components/ui/button';
import { 
  Bold, Italic, List, ListOrdered, Quote, Code, 
  Heading1, Heading2, Image as ImageIcon, Link as LinkIcon,
  Table as TableIcon, Undo, Redo
} from 'lucide-react';
import { useState } from 'react';
import { MediaLibraryDialog } from './MediaLibraryDialog';

interface RichContentEditorProps {
  content?: any;
  onChange: (content: any) => void;
  editable?: boolean;
}

export const RichContentEditor = ({ content, onChange, editable = true }: RichContentEditorProps) => {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg'
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline'
        }
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const handleInsertImage = (url: string, alt: string) => {
    editor.chain().focus().setImage({ src: url, alt }).run();
    setShowMediaLibrary(false);
  };

  const handleInsertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const MenuButton = ({ 
    onClick, 
    isActive = false, 
    icon: Icon,
    label 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    icon: any;
    label: string;
  }) => (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={!editable}
      type="button"
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  if (!editable) {
    return (
      <div className="border rounded-lg p-4 bg-background">
        <EditorContent editor={editor} />
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
          label="Bold"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
          label="Italic"
        />
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          icon={Heading1}
          label="Heading 1"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          label="Heading 2"
        />
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={List}
          label="Bullet List"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
          label="Ordered List"
        />
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={Quote}
          label="Quote"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          icon={Code}
          label="Code Block"
        />
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <MenuButton
          onClick={() => setShowMediaLibrary(true)}
          icon={ImageIcon}
          label="Insert Image"
        />
        <MenuButton
          onClick={handleInsertLink}
          isActive={editor.isActive('link')}
          icon={LinkIcon}
          label="Insert Link"
        />
        <MenuButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
          icon={TableIcon}
          label="Insert Table"
        />
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          icon={Undo}
          label="Undo"
        />
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          icon={Redo}
          label="Redo"
        />
      </div>

      {/* Editor */}
      <div className="bg-background">
        <EditorContent editor={editor} />
      </div>

      {/* Media Library Dialog */}
      <MediaLibraryDialog
        open={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelectMedia={handleInsertImage}
      />
    </div>
  );
};

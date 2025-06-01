import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Image as ImageIcon,
  Link as LinkIcon,
  Save
} from 'lucide-react';

interface ArticleEditorProps {
  onSave?: () => void;
}

export default function ArticleEditor({ onSave }: ArticleEditorProps) {
  const [title, setTitle] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
    ],
    content: '<p>ここに記事の内容を入力してください...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  const saveArticleMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; thumbnail?: string }) => {
      const response = await apiRequest('POST', '/api/articles', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '記事を保存しました',
        description: '記事が正常に保存されました。',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      setTitle('');
      setThumbnail(null);
      setThumbnailPreview('');
      editor?.commands.setContent('<p>ここに記事の内容を入力してください...</p>');
      onSave?.();
    },
    onError: (error: any) => {
      toast({
        title: 'エラーが発生しました',
        description: error.message || '記事の保存に失敗しました。',
        variant: 'destructive',
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('画像のアップロードに失敗しました');
      return response.json();
    },
    onSuccess: (data) => {
      editor?.chain().focus().setImage({ src: data.url }).run();
    },
    onError: () => {
      toast({
        title: 'エラー',
        description: '画像のアップロードに失敗しました。',
        variant: 'destructive',
      });
    },
  });

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          title: 'ファイル形式エラー',
          description: 'JPG、PNG、WebP形式の画像のみアップロード可能です。',
          variant: 'destructive',
        });
        return;
      }
      
      setThumbnail(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        uploadImageMutation.mutate(file);
      }
    };
    input.click();
  };

  const addLink = () => {
    const url = window.prompt('リンクURLを入力してください:');
    if (url) {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: 'タイトルが必要です',
        description: '記事のタイトルを入力してください。',
        variant: 'destructive',
      });
      return;
    }

    const content = editor?.getHTML() || '';
    let thumbnailUrl = '';

    if (thumbnail) {
      try {
        const formData = new FormData();
        formData.append('image', thumbnail);
        const response = await fetch('/api/upload/thumbnail', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        thumbnailUrl = data.url;
      } catch (error) {
        toast({
          title: 'サムネイルアップロードエラー',
          description: 'サムネイル画像のアップロードに失敗しました。',
          variant: 'destructive',
        });
        return;
      }
    }

    saveArticleMutation.mutate({
      title,
      content,
      thumbnail: thumbnailUrl,
    });
  };

  if (!editor) {
    return <div>エディターを読み込み中...</div>;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>新規記事作成</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* タイトル入力 */}
        <div className="space-y-2">
          <Label htmlFor="title">記事タイトル</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="記事のタイトルを入力してください"
            className="text-lg font-semibold"
          />
        </div>

        {/* サムネイル画像 */}
        <div className="space-y-2">
          <Label htmlFor="thumbnail">サムネイル画像</Label>
          <div className="space-y-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleThumbnailChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {thumbnailPreview && (
              <div className="mt-2">
                <img 
                  src={thumbnailPreview} 
                  alt="サムネイルプレビュー" 
                  className="max-w-xs h-auto rounded-lg border"
                />
              </div>
            )}
          </div>
        </div>

        {/* エディターツールバー */}
        <div className="border-b pb-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={editor.isActive('bold') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('italic') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('bulletList') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('orderedList') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('blockquote') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImageUpload}
              disabled={uploadImageMutation.isPending}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLink}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-gray-300 mx-1" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* エディター */}
        <div className="border rounded-lg min-h-[400px]">
          <EditorContent editor={editor} />
        </div>

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={saveArticleMutation.isPending}
            className="min-w-[120px]"
          >
            {saveArticleMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                保存中...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                記事を保存
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
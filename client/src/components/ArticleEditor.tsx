import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
  Save,
  Eye,
  Code,
  Palette,
  ChevronUp,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';

interface ArticleEditorProps {
  onSave?: () => void;
}

export default function ArticleEditor({ onSave }: ArticleEditorProps) {
  const [title, setTitle] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [showStylePanel, setShowStylePanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle.configure({
        HTMLAttributes: {
          style: 'color: var(--color);',
        },
      }),
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
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
      Placeholder.configure({
        placeholder: 'ここに記事の内容を入力してください...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      if (!isHtmlMode) {
        setHtmlContent(editor.getHTML());
      }
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

  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // HTML モードから通常モードへ
      editor?.commands.setContent(htmlContent);
      setIsHtmlMode(false);
    } else {
      // 通常モードからHTML モードへ
      setHtmlContent(editor?.getHTML() || '');
      setIsHtmlMode(true);
    }
  };

  const handleHtmlContentChange = (value: string) => {
    setHtmlContent(value);
    if (isHtmlMode) {
      editor?.commands.setContent(value);
    }
  };

  const setTextColor = (color: string) => {
    editor?.chain().focus().setColor(color).run();
  };

  const setBackgroundColor = (color: string) => {
    editor?.chain().focus().setHighlight({ color }).run();
  };

  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', 
    '#008000', '#FFC0CB', '#A52A2A', '#808080', '#000080'
  ];

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: 'タイトルが必要です',
        description: '記事のタイトルを入力してください。',
        variant: 'destructive',
      });
      return;
    }

    const content = isHtmlMode ? htmlContent : editor?.getHTML() || '';
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

        {/* HTML編集モード切り替えとプレビューボタン */}
        <div className="flex justify-between items-center mb-4">
          <Button
            type="button"
            variant={isHtmlMode ? 'default' : 'outline'}
            onClick={toggleHtmlMode}
            className="flex items-center gap-2"
          >
            <Code className="h-4 w-4" />
            HTML編集モード
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            プレビュー
          </Button>
        </div>



        {/* エディター */}
        <div className="border rounded-lg min-h-[400px]">
          {isHtmlMode ? (
            <Textarea
              value={htmlContent}
              onChange={(e) => handleHtmlContentChange(e.target.value)}
              className="min-h-[400px] font-mono text-sm border-0 resize-none focus:ring-0"
              placeholder="<p>HTMLコードを直接編集できます...</p>"
            />
          ) : (
            <EditorContent editor={editor} />
          )}
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
                記事を公開
              </div>
            )}
          </Button>
        </div>

        {/* プレビューモーダル */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="preview-description">
            <DialogHeader>
              <DialogTitle>記事プレビュー</DialogTitle>
            </DialogHeader>
            <div id="preview-description" className="sr-only">
              記事の公開前プレビューを表示しています
            </div>
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold">{title || 'タイトルなし'}</h1>
                {thumbnailPreview && (
                  <img 
                    src={thumbnailPreview} 
                    alt="サムネイル" 
                    className="mt-4 max-w-full h-auto rounded-lg"
                  />
                )}
              </div>
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: isHtmlMode ? htmlContent : editor?.getHTML() || '' 
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* 文字装飾パネル（浮動） */}
        {!isHtmlMode && (
          <>
            {/* 文字装飾ボタン */}
            <Button
              type="button"
              className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 p-0"
              onClick={() => setShowStylePanel(!showStylePanel)}
            >
              <Palette className="h-6 w-6" />
            </Button>

            {/* 文字装飾パネル */}
            {showStylePanel && (
              <div className="fixed bottom-16 left-0 right-0 z-40 bg-white border-t shadow-lg p-4 h-[20vh] overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">文字装飾</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowStylePanel(false)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {/* 基本編集機能 */}
                    <div>
                      <Label className="text-xs font-medium mb-1 block">基本編集</Label>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          variant={editor?.isActive('bold') ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => editor?.chain().focus().toggleBold().run()}
                        >
                          <Bold className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant={editor?.isActive('italic') ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => editor?.chain().focus().toggleItalic().run()}
                        >
                          <Italic className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant={editor?.isActive('bulletList') ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        >
                          <List className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant={editor?.isActive('orderedList') ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        >
                          <ListOrdered className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant={editor?.isActive('blockquote') ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                        >
                          <Quote className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          onClick={handleImageUpload}
                          disabled={uploadImageMutation.isPending}
                        >
                          <ImageIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          onClick={addLink}
                        >
                          <LinkIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => editor?.chain().focus().undo().run()}
                          disabled={!editor?.can().undo()}
                        >
                          <Undo className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => editor?.chain().focus().redo().run()}
                          disabled={!editor?.can().redo()}
                        >
                          <Redo className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* 見出し */}
                      <div>
                        <Label className="text-xs font-medium mb-1 block">見出し</Label>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant={editor?.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                          >
                            <Heading1 className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant={editor?.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                          >
                            <Heading2 className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant={editor?.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                          >
                            <Heading3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* 文字色 */}
                      <div>
                        <Label className="text-xs font-medium mb-1 block">文字色</Label>
                        <div className="grid grid-cols-5 gap-1">
                          {colors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`w-5 h-5 rounded border-2 hover:border-gray-500 ${
                                color === '#FFFFFF' ? 'border-gray-500' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setTextColor(color)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* 背景色 */}
                      <div>
                        <Label className="text-xs font-medium mb-1 block">背景色</Label>
                        <div className="grid grid-cols-5 gap-1">
                          {colors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`w-5 h-5 rounded border-2 hover:border-gray-500 ${
                                color === '#FFFFFF' ? 'border-gray-500' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setBackgroundColor(color)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
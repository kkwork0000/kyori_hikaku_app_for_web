import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Contact } from "@shared/schema";

interface ContactListProps {
  isVisible: boolean;
}

interface ContactsResponse {
  contacts: Contact[];
  total: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'reviewed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'resolved':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '未対応';
    case 'reviewed':
      return '確認済み';
    case 'resolved':
      return '対応完了';
    default:
      return status;
  }
};

export default function ContactList({ isVisible }: ContactListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const limit = 10;

  // Get contacts list
  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['/api/admin/contacts', currentPage, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      const response = await apiRequest(`/api/admin/contacts?${params}`, 'GET');
      return response as ContactsResponse;
    },
    enabled: isVisible,
  });

  // Update contact status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest(`/api/admin/contacts/${id}/status`, 'PUT', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contacts'] });
      toast({
        title: "ステータス更新",
        description: "問い合わせステータスを更新しました。",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "ステータスの更新に失敗しました。",
        variant: "destructive",
      });
    },
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/contacts/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contacts'] });
      toast({
        title: "削除完了",
        description: "問い合わせを削除しました。",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "問い合わせの削除に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleStatusUpdate = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: number) => {
    if (confirm('この問い合わせを削除してもよろしいですか？')) {
      deleteContactMutation.mutate(id);
    }
  };

  const handleViewDetail = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDetailOpen(true);
  };

  const totalPages = Math.ceil((contactsData?.total || 0) / limit);

  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="flex gap-2">
            <Input
              placeholder="名前、メール、件名、問い合わせ番号で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : (
        <>
          <div className="space-y-3">
            {contactsData?.contacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {contact.inquiryNumber}
                        </span>
                        <Badge className={getStatusColor(contact.status)}>
                          {getStatusText(contact.status)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {contact.createdAt ? new Date(contact.createdAt).toLocaleString('ja-JP') : '未設定'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-semibold">名前:</span> {contact.name}
                        </div>
                        <div>
                          <span className="font-semibold">件名:</span> {contact.subject}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={contact.status}
                        onValueChange={(status) => handleStatusUpdate(contact.id, status)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">未対応</SelectItem>
                          <SelectItem value="reviewed">確認済み</SelectItem>
                          <SelectItem value="resolved">対応完了</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(contact)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-4 py-2 text-sm">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Contact Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>問い合わせ詳細</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold">問い合わせ番号:</label>
                  <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded inline-block">
                    {selectedContact.inquiryNumber}
                  </p>
                </div>
                <div>
                  <label className="font-semibold">ステータス:</label>
                  <Badge className={`ml-2 ${getStatusColor(selectedContact.status)}`}>
                    {getStatusText(selectedContact.status)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold">お名前:</label>
                  <p>{selectedContact.name}</p>
                </div>
                <div>
                  <label className="font-semibold">メールアドレス:</label>
                  <p>{selectedContact.email}</p>
                </div>
              </div>

              {selectedContact.phone && (
                <div>
                  <label className="font-semibold">電話番号:</label>
                  <p>{selectedContact.phone}</p>
                </div>
              )}

              <div>
                <label className="font-semibold">件名:</label>
                <p>{selectedContact.subject}</p>
              </div>

              <div>
                <label className="font-semibold">お問い合わせ内容:</label>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md mt-1">
                  <p className="whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <label className="font-semibold">受信日時:</label>
                  <p>{selectedContact.createdAt ? new Date(selectedContact.createdAt).toLocaleString('ja-JP') : '未設定'}</p>
                </div>
                <div>
                  <label className="font-semibold">更新日時:</label>
                  <p>{selectedContact.updatedAt ? new Date(selectedContact.updatedAt).toLocaleString('ja-JP') : '未設定'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
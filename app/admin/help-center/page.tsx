'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FAQ {
  id: string;
  question_en: string;
  question_tr: string;
  answer_en: string;
  answer_tr: string;
  category: string;
  order_index: number;
  is_published: boolean;
}

const FAQ_CATEGORIES = [
  'Getting Started',
  'Features',
  'Billing',
  'Technical',
  'Account',
  'General',
];

export default function HelpCenterAdminPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    question_en: '',
    question_tr: '',
    answer_en: '',
    answer_tr: '',
    category: 'General',
    order_index: 0,
    is_published: true,
  });

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('category', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setFormData({
      question_en: faq.question_en,
      question_tr: faq.question_tr,
      answer_en: faq.answer_en,
      answer_tr: faq.answer_tr,
      category: faq.category,
      order_index: faq.order_index,
      is_published: faq.is_published,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      question_en: '',
      question_tr: '',
      answer_en: '',
      answer_tr: '',
      category: 'General',
      order_index: 0,
      is_published: true,
    });
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        const { error } = await supabase
          .from('faqs')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('FAQ updated successfully');
      } else {
        const { error } = await supabase.from('faqs').insert(formData);

        if (error) throw error;
        toast.success('FAQ created successfully');
      }

      handleCancel();
      fetchFAQs();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast.error('Failed to save FAQ');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from('faqs').delete().eq('id', deleteId);

      if (error) throw error;

      toast.success('FAQ deleted successfully');
      fetchFAQs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Failed to delete FAQ');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Help Center Management</h1>
          <p className="text-muted-foreground">
            Manage FAQ questions and answers
          </p>
        </div>
      </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? 'Edit FAQ' : 'Create New FAQ'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Question (English)</Label>
                  <Input
                    value={formData.question_en}
                    onChange={(e) =>
                      setFormData({ ...formData, question_en: e.target.value })
                    }
                    placeholder="Enter question in English"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Question (Turkish)</Label>
                  <Input
                    value={formData.question_tr}
                    onChange={(e) =>
                      setFormData({ ...formData, question_tr: e.target.value })
                    }
                    placeholder="Soruyu Türkçe girin"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Answer (English)</Label>
                  <Textarea
                    value={formData.answer_en}
                    onChange={(e) =>
                      setFormData({ ...formData, answer_en: e.target.value })
                    }
                    placeholder="Enter answer in English"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Answer (Turkish)</Label>
                  <Textarea
                    value={formData.answer_tr}
                    onChange={(e) =>
                      setFormData({ ...formData, answer_tr: e.target.value })
                    }
                    placeholder="Cevabı Türkçe girin"
                    rows={4}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FAQ_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Order Index</Label>
                  <Input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order_index: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Published</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_published: checked })
                      }
                    />
                    <span className="text-sm">
                      {formData.is_published ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  {editingId ? 'Update' : 'Create'} FAQ
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All FAQs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : faqs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No FAQs yet. Create your first one above!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question (EN)</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faqs.map((faq) => (
                      <TableRow key={faq.id}>
                        <TableCell className="font-medium">
                          {faq.question_en}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{faq.category}</Badge>
                        </TableCell>
                        <TableCell>{faq.order_index}</TableCell>
                        <TableCell>
                          {faq.is_published ? (
                            <Badge>Published</Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(faq)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteId(faq.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <ConfirmDeleteDialog
            open={!!deleteId}
            onOpenChange={(open) => !open && setDeleteId(null)}
            onConfirm={handleDelete}
            title="Delete FAQ"
            description="Are you sure you want to delete this FAQ? This action cannot be undone."
          />
        </div>
  );
}

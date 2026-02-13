'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save, X, Edit, Trash2 } from 'lucide-react';
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

interface Testimonial {
  id: string;
  customer_name: string;
  company_name: string;
  position: string;
  review_en: string;
  review_tr: string;
  rating: number;
  logo_url: string;
  avatar_url: string;
  is_featured: boolean;
  order_index: number;
}

export default function TestimonialsAdminPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    company_name: '',
    position: '',
    review_en: '',
    review_tr: '',
    rating: 5,
    logo_url: '',
    avatar_url: '',
    is_featured: true,
    order_index: 0,
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_reviews')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setFormData({
      customer_name: testimonial.customer_name,
      company_name: testimonial.company_name,
      position: testimonial.position,
      review_en: testimonial.review_en,
      review_tr: testimonial.review_tr,
      rating: testimonial.rating,
      logo_url: testimonial.logo_url,
      avatar_url: testimonial.avatar_url,
      is_featured: testimonial.is_featured,
      order_index: testimonial.order_index,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      customer_name: '',
      company_name: '',
      position: '',
      review_en: '',
      review_tr: '',
      rating: 5,
      logo_url: '',
      avatar_url: '',
      is_featured: true,
      order_index: 0,
    });
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        const { error } = await supabase
          .from('customer_reviews')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Testimonial updated successfully');
      } else {
        const { error } = await supabase.from('customer_reviews').insert(formData);

        if (error) throw error;
        toast.success('Testimonial created successfully');
      }

      handleCancel();
      fetchTestimonials();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast.error('Failed to save testimonial');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('customer_reviews')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('Testimonial deleted successfully');
      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error('Failed to delete testimonial');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Testimonials Manager</h1>
          <p className="text-muted-foreground">
            Manage customer reviews and testimonials
          </p>
        </div>
      </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? 'Edit Testimonial' : 'Create New Testimonial'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_name: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    placeholder="CEO"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Review (English)</Label>
                  <Textarea
                    value={formData.review_en}
                    onChange={(e) =>
                      setFormData({ ...formData, review_en: e.target.value })
                    }
                    placeholder="Great product..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Review (Turkish)</Label>
                  <Textarea
                    value={formData.review_tr}
                    onChange={(e) =>
                      setFormData({ ...formData, review_tr: e.target.value })
                    }
                    placeholder="Harika ürün..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Rating (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={formData.rating}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rating: parseInt(e.target.value),
                      })
                    }
                  />
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
                  <Label>Featured</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_featured: checked })
                      }
                    />
                    <span className="text-sm">
                      {formData.is_featured ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Logo URL (optional)</Label>
                  <Input
                    value={formData.logo_url}
                    onChange={(e) =>
                      setFormData({ ...formData, logo_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Avatar URL (optional)</Label>
                  <Input
                    value={formData.avatar_url}
                    onChange={(e) =>
                      setFormData({ ...formData, avatar_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  {editingId ? 'Update' : 'Create'} Testimonial
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
              <CardTitle>All Testimonials</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : testimonials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No testimonials yet. Create your first one above!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testimonials.map((testimonial) => (
                      <TableRow key={testimonial.id}>
                        <TableCell className="font-medium">
                          {testimonial.customer_name}
                        </TableCell>
                        <TableCell>{testimonial.company_name}</TableCell>
                        <TableCell>
                          {'⭐'.repeat(testimonial.rating)}
                        </TableCell>
                        <TableCell>{testimonial.order_index}</TableCell>
                        <TableCell>
                          {testimonial.is_featured ? (
                            <Badge>Featured</Badge>
                          ) : (
                            <Badge variant="secondary">Hidden</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(testimonial)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteId(testimonial.id)}
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
            title="Delete Testimonial"
            description="Are you sure you want to delete this testimonial? This action cannot be undone."
          />
        </div>
  );
}

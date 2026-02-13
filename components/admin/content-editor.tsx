'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Loader2,
  Save,
  Search,
  Globe,
  FileText,
  Home,
  Mail,
  LayoutDashboard,
  Plus,
  Trash2,
  Settings,
  ShoppingBag,
  BarChart3,
  HelpCircle,
} from 'lucide-react';

interface ContentSection {
  id: string;
  section_key: string;
  category: string;
  label_en: string;
  label_tr: string;
  content_en: string;
  content_tr: string;
  content_type: string;
  order_index: number;
  is_active: boolean;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Home; label: string; color: string }> = {
  landing: { icon: Home, label: 'Landing Page', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  contact: { icon: Mail, label: 'Contact', color: 'bg-green-100 text-green-700 border-green-200' },
  dashboard: { icon: LayoutDashboard, label: 'Dashboard', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  features: { icon: BarChart3, label: 'Features', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  pricing: { icon: ShoppingBag, label: 'Pricing', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  help: { icon: HelpCircle, label: 'Help & Support', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  general: { icon: FileText, label: 'General', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  settings: { icon: Settings, label: 'Settings', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const DEFAULT_CATEGORY_CONFIG = {
  icon: FileText,
  label: 'Other',
  color: 'bg-gray-100 text-gray-700 border-gray-200',
};

interface NewSectionForm {
  section_key: string;
  category: string;
  label_en: string;
  label_tr: string;
  content_en: string;
  content_tr: string;
  content_type: 'text' | 'textarea' | 'richtext';
  order_index: number;
}

const EMPTY_FORM: NewSectionForm = {
  section_key: '',
  category: 'landing',
  label_en: '',
  label_tr: '',
  content_en: '',
  content_tr: '',
  content_type: 'text',
  order_index: 100,
};

export function ContentEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [editedSections, setEditedSections] = useState<Record<string, ContentSection>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSection, setNewSection] = useState<NewSectionForm>({ ...EMPTY_FORM });
  const [addingSection, setAddingSection] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_sections')
        .select('*')
        .order('category', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error: any) {
      console.error('Error fetching content sections:', error);
      toast.error('Failed to load content sections');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (sectionId: string, field: string, value: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    setEditedSections(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || section),
        [field]: value,
      },
    }));
  };

  const handleSave = async (sectionId: string) => {
    const editedSection = editedSections[sectionId];
    if (!editedSection) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('content_sections')
        .update({
          content_en: editedSection.content_en,
          content_tr: editedSection.content_tr,
        })
        .eq('id', sectionId);

      if (error) throw error;

      setSections(prev =>
        prev.map(s => (s.id === sectionId ? editedSection : s))
      );

      const { [sectionId]: _, ...rest } = editedSections;
      setEditedSections(rest);

      toast.success('Content saved successfully');
    } catch (error: any) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (Object.keys(editedSections).length === 0) {
      toast.info('No changes to save');
      return;
    }

    try {
      setSaving(true);
      const updates = Object.entries(editedSections).map(([id, section]) =>
        supabase
          .from('content_sections')
          .update({
            content_en: section.content_en,
            content_tr: section.content_tr,
          })
          .eq('id', id)
      );

      await Promise.all(updates);

      setSections(prev =>
        prev.map(s => editedSections[s.id] || s)
      );
      setEditedSections({});

      toast.success(`Saved ${updates.length} content sections`);
    } catch (error: any) {
      console.error('Error saving all content:', error);
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = async () => {
    if (!newSection.section_key || !newSection.label_en) {
      toast.error('Section key and English label are required');
      return;
    }

    const keyExists = sections.some(s => s.section_key === newSection.section_key);
    if (keyExists) {
      toast.error('A section with this key already exists');
      return;
    }

    try {
      setAddingSection(true);
      const { data, error } = await supabase
        .from('content_sections')
        .insert({
          section_key: newSection.section_key,
          category: newSection.category,
          label_en: newSection.label_en,
          label_tr: newSection.label_tr || newSection.label_en,
          content_en: newSection.content_en,
          content_tr: newSection.content_tr,
          content_type: newSection.content_type,
          order_index: newSection.order_index,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setSections(prev => [...prev, data]);
      setNewSection({ ...EMPTY_FORM });
      setShowAddDialog(false);
      setSelectedCategory(newSection.category);
      toast.success('Content section created');
    } catch (error: any) {
      console.error('Error adding content section:', error);
      toast.error('Failed to create content section');
    } finally {
      setAddingSection(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      const { error } = await supabase
        .from('content_sections')
        .update({ is_active: false })
        .eq('id', sectionId);

      if (error) throw error;

      setSections(prev => prev.filter(s => s.id !== sectionId));
      toast.success('Content section removed');
    } catch (error: any) {
      console.error('Error deleting content section:', error);
      toast.error('Failed to remove content section');
    }
  };

  const categories = Array.from(new Set(sections.map(s => s.category)));

  const filteredSections = sections.filter(section => {
    const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      section.label_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.label_tr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.section_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.content_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.content_tr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const hasUnsavedChanges = Object.keys(editedSections).length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#2ECC71]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Editor</CardTitle>
              <CardDescription>
                Edit text content on landing pages and throughout the application
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Content
              </Button>
              {hasUnsavedChanges && (
                <Button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="bg-[#2ECC71] hover:bg-[#27AE60] gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save All ({Object.keys(editedSections).length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search content by name, key, or text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              All
              <span className="ml-1 text-xs opacity-70">{sections.length}</span>
            </button>
            {categories.map(category => {
              const config = CATEGORY_CONFIG[category] || DEFAULT_CATEGORY_CONFIG;
              const Icon = config.icon;
              const count = sections.filter(s => s.category === category).length;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedCategory === category
                      ? 'bg-gray-900 text-white border-gray-900'
                      : `${config.color} hover:opacity-80`
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                  <span className="ml-1 text-xs opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px]">
        <div className="space-y-4 pr-4">
          {filteredSections.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg font-medium">No content sections found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Click "Add Content" to create a new section'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSections.map(section => {
              const edited = editedSections[section.id] || section;
              const hasChanges = !!editedSections[section.id];
              const catConfig = CATEGORY_CONFIG[section.category] || DEFAULT_CATEGORY_CONFIG;

              return (
                <Card key={section.id} className={hasChanges ? 'border-[#2ECC71] border-2' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">
                            {section.label_en}
                          </CardTitle>
                          <Badge variant="outline" className={`text-xs ${catConfig.color}`}>
                            {catConfig.label}
                          </Badge>
                          {hasChanges && (
                            <Badge className="bg-[#2ECC71]">Modified</Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs mt-1 font-mono">
                          {section.section_key}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {hasChanges && (
                          <Button
                            size="sm"
                            onClick={() => handleSave(section.id)}
                            disabled={saving}
                            className="bg-[#2ECC71] hover:bg-[#27AE60] gap-1"
                          >
                            <Save className="h-3 w-3" />
                            Save
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSection(section.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-medium text-gray-500">
                          <Globe className="h-3 w-3" />
                          English
                        </Label>
                        {section.content_type === 'textarea' || section.content_type === 'richtext' ? (
                          <Textarea
                            value={edited.content_en}
                            onChange={(e) =>
                              handleContentChange(section.id, 'content_en', e.target.value)
                            }
                            rows={4}
                            className="text-sm"
                          />
                        ) : (
                          <Input
                            value={edited.content_en}
                            onChange={(e) =>
                              handleContentChange(section.id, 'content_en', e.target.value)
                            }
                            className="text-sm"
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-medium text-gray-500">
                          <Globe className="h-3 w-3" />
                          Turkce
                        </Label>
                        {section.content_type === 'textarea' || section.content_type === 'richtext' ? (
                          <Textarea
                            value={edited.content_tr}
                            onChange={(e) =>
                              handleContentChange(section.id, 'content_tr', e.target.value)
                            }
                            rows={4}
                            className="text-sm"
                          />
                        ) : (
                          <Input
                            value={edited.content_tr}
                            onChange={(e) =>
                              handleContentChange(section.id, 'content_tr', e.target.value)
                            }
                            className="text-sm"
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Content Section</DialogTitle>
            <DialogDescription>
              Create a new editable content block for your site
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newSection.category}
                  onValueChange={(val) => setNewSection(p => ({ ...p, category: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select
                  value={newSection.content_type}
                  onValueChange={(val) => setNewSection(p => ({ ...p, content_type: val as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Short Text</SelectItem>
                    <SelectItem value="textarea">Long Text</SelectItem>
                    <SelectItem value="richtext">Rich Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Section Key</Label>
              <Input
                placeholder="e.g. landing_hero_title"
                value={newSection.section_key}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                  setNewSection(p => ({ ...p, section_key: val }));
                }}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-400">
                Unique identifier. Only lowercase, numbers, and underscores.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Label (EN)</Label>
                <Input
                  placeholder="e.g. Hero Title"
                  value={newSection.label_en}
                  onChange={(e) => setNewSection(p => ({ ...p, label_en: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Label (TR)</Label>
                <Input
                  placeholder="e.g. Hero Baslik"
                  value={newSection.label_tr}
                  onChange={(e) => setNewSection(p => ({ ...p, label_tr: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  Content (EN)
                </Label>
                {newSection.content_type === 'text' ? (
                  <Input
                    placeholder="English content..."
                    value={newSection.content_en}
                    onChange={(e) => setNewSection(p => ({ ...p, content_en: e.target.value }))}
                  />
                ) : (
                  <Textarea
                    placeholder="English content..."
                    value={newSection.content_en}
                    onChange={(e) => setNewSection(p => ({ ...p, content_en: e.target.value }))}
                    rows={3}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  Content (TR)
                </Label>
                {newSection.content_type === 'text' ? (
                  <Input
                    placeholder="Turkce icerik..."
                    value={newSection.content_tr}
                    onChange={(e) => setNewSection(p => ({ ...p, content_tr: e.target.value }))}
                  />
                ) : (
                  <Textarea
                    placeholder="Turkce icerik..."
                    value={newSection.content_tr}
                    onChange={(e) => setNewSection(p => ({ ...p, content_tr: e.target.value }))}
                    rows={3}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={newSection.order_index}
                onChange={(e) => setNewSection(p => ({ ...p, order_index: parseInt(e.target.value) || 0 }))}
                className="w-32"
              />
              <p className="text-xs text-gray-400">
                Lower numbers appear first within the category
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSection}
              disabled={addingSection || !newSection.section_key || !newSection.label_en}
              className="bg-[#2ECC71] hover:bg-[#27AE60] gap-2"
            >
              {addingSection ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

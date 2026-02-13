'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Loader2, FileEdit, Trash2, Plus, Palette, LogIn, LogOut } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
  id: string;
  user_id: string;
  action: 'create' | 'update' | 'delete' | 'style_change' | 'login' | 'logout';
  table_name?: string;
  record_id?: string;
  changes?: any;
  created_at: string;
  profiles?: {
    email: string;
    full_name?: string;
  };
}

const actionIcons = {
  create: Plus,
  update: FileEdit,
  delete: Trash2,
  style_change: Palette,
  login: LogIn,
  logout: LogOut,
};

const actionColors = {
  create: 'bg-green-500/10 text-green-500',
  update: 'bg-blue-500/10 text-blue-500',
  delete: 'bg-red-500/10 text-red-500',
  style_change: 'bg-purple-500/10 text-purple-500',
  login: 'bg-gray-500/10 text-gray-500',
  logout: 'bg-gray-500/10 text-gray-500',
};

export default function ActivityLogViewer() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'create' | 'update' | 'delete' | 'style_change'>('all');

  useEffect(() => {
    fetchLogs();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('activity_log_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
        },
        (payload) => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          *,
          profiles (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Fetch logs error:', error);
        throw error;
      }

      setLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      const errorMessage = error?.message || 'Failed to load activity logs';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(log => log.action === filter);

  const renderLogDetails = (log: ActivityLog) => {
    if (log.action === 'style_change' && log.changes) {
      const changes = log.changes;
      return (
        <div className="mt-2 text-xs text-muted-foreground space-y-1">
          {changes.before && changes.after && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium">Before:</span>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify(changes.before, null, 2)}
                </pre>
              </div>
              <div>
                <span className="font-medium">After:</span>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify(changes.after, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Log
        </CardTitle>
        <CardDescription>
          Track all changes and actions in your system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(value: any) => setFilter(value)} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All ({logs.length})</TabsTrigger>
            <TabsTrigger value="create">Created</TabsTrigger>
            <TabsTrigger value="update">Updated</TabsTrigger>
            <TabsTrigger value="delete">Deleted</TabsTrigger>
            <TabsTrigger value="style_change">Style Changes</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {filteredLogs.map((log) => {
                  const Icon = actionIcons[log.action];
                  const colorClass = actionColors[log.action];
                  const userName = log.profiles?.full_name || log.profiles?.email || 'Unknown User';

                  return (
                    <div
                      key={log.id}
                      className="flex gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {userName}
                              <Badge variant="outline" className="ml-2 text-xs">
                                {log.action.replace('_', ' ')}
                              </Badge>
                            </p>
                            {log.table_name && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {log.table_name}
                                {log.record_id && (
                                  <span className="text-xs ml-2">
                                    ID: {log.record_id.slice(0, 8)}...
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {renderLogDetails(log)}
                      </div>
                    </div>
                  );
                })}

                {filteredLogs.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No activity logs found
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useRouteGuard } from '@/hooks/use-route-guard'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  LifeBuoy,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Loader2
} from 'lucide-react'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  category: string
  priority: string
  status: string
  message: string
  resolution: string | null
  created_by: string
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export default function HelpdeskPage() {
  const { loading: authLoading } = useRouteGuard('admin')
  const { tenantId } = useTenant()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolution, setResolution] = useState('')

  useEffect(() => {
    if (tenantId) {
      fetchTickets()
    }
  }, [tenantId])

  useEffect(() => {
    let filtered = tickets

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.created_by.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredTickets(filtered)
  }, [tickets, statusFilter, searchQuery])

  async function fetchTickets() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
      setFilteredTickets(data || [])
    } catch (error: any) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  async function handleResolveTicket() {
    if (!selectedTicket || !resolution.trim()) {
      toast.error('Please provide a resolution')
      return
    }

    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: 'Resolved',
          resolution: resolution,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id)
        .eq('tenant_id', tenantId)

      if (error) throw error

      toast.success('Ticket resolved successfully')
      setResolveDialogOpen(false)
      setSelectedTicket(null)
      setResolution('')
      fetchTickets()
    } catch (error: any) {
      console.error('Error resolving ticket:', error)
      toast.error('Failed to resolve ticket')
    }
  }

  async function handleUpdateStatus(ticketId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .eq('tenant_id', tenantId)

      if (error) throw error

      toast.success('Ticket status updated')
      fetchTickets()
    } catch (error: any) {
      console.error('Error updating ticket:', error)
      toast.error('Failed to update ticket')
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'Open':
        return <Badge className="bg-blue-500">Open</Badge>
      case 'In Progress':
        return <Badge className="bg-yellow-500">In Progress</Badge>
      case 'Resolved':
        return <Badge className="bg-green-500">Resolved</Badge>
      case 'Closed':
        return <Badge variant="outline">Closed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  function getPriorityBadge(priority: string) {
    switch (priority) {
      case 'High':
        return <Badge variant="destructive">High</Badge>
      case 'Medium':
        return <Badge className="bg-orange-500">Medium</Badge>
      case 'Low':
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge>{priority}</Badge>
    }
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00D4AA]" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Helpdesk Management</h1>
            <p className="text-gray-500 mt-1">Manage and respond to support tickets</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <LifeBuoy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.open}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>View and manage all support requests</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="Open">Open</TabsTrigger>
                    <TabsTrigger value="In Progress">In Progress</TabsTrigger>
                    <TabsTrigger value="Resolved">Resolved</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tickets found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">
                        {ticket.ticket_number}
                      </TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ticket.category}</Badge>
                      </TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>{ticket.created_by}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(ticket)
                              setViewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(ticket)
                                setResolveDialogOpen(true)
                              }}
                              className="text-green-600"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ticket Details - {selectedTicket?.ticket_number}</DialogTitle>
            <DialogDescription>
              View ticket information and history
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Subject</Label>
                  <p className="font-medium">{selectedTicket.subject}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Category</Label>
                  <p><Badge variant="outline">{selectedTicket.category}</Badge></p>
                </div>
                <div>
                  <Label className="text-gray-500">Priority</Label>
                  <p>{getPriorityBadge(selectedTicket.priority)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedTicket.status)}
                    {selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed' && (
                      <Select
                        value={selectedTicket.status}
                        onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Resolved">Resolved</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Created By</Label>
                  <p>{selectedTicket.created_by}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Created At</Label>
                  <p>{format(new Date(selectedTicket.created_at), 'PPpp')}</p>
                </div>
              </div>

              <div>
                <Label className="text-gray-500">Message</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>
              </div>

              {selectedTicket.resolution && (
                <div>
                  <Label className="text-gray-500">Resolution</Label>
                  <div className="mt-2 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="whitespace-pre-wrap">{selectedTicket.resolution}</p>
                    {selectedTicket.resolved_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Resolved on {format(new Date(selectedTicket.resolved_at), 'PPpp')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Ticket</DialogTitle>
            <DialogDescription>
              Provide a resolution for ticket {selectedTicket?.ticket_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resolution">Resolution *</Label>
              <Textarea
                id="resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how the issue was resolved..."
                rows={6}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setResolveDialogOpen(false)
              setResolution('')
            }}>
              Cancel
            </Button>
            <Button onClick={handleResolveTicket} disabled={!resolution.trim()}>
              Resolve Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

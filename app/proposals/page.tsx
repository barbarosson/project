'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { FileText, Plus, Eye, TrendingUp, Clock, CheckCircle, XCircle, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/contexts/tenant-context'
import { EditProposalDialog } from '@/components/edit-proposal-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { toast } from 'sonner'

interface Proposal {
  id: string
  proposal_number: string
  customer_id: string
  title: string
  status: string
  total: number
  valid_until: string
  created_at: string
  customers: {
    name: string
  }
}

export default function ProposalsPage() {
  const router = useRouter()
  const { tenantId, loading: tenantLoading } = useTenant()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingProposal, setEditingProposal] = useState<any>(null)
  const [deletingProposal, setDeletingProposal] = useState<any>(null)

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchProposals()
    }
  }, [tenantId, tenantLoading])

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredProposals(proposals)
    } else {
      setFilteredProposals(proposals.filter(p => p.status === statusFilter))
    }
  }, [statusFilter, proposals])

  async function fetchProposals() {
    if (!tenantId) return

    try {
      const { data, error } = await supabase
        .from('proposals')
        .select(`
          *,
          customers (
            name
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setProposals(data || [])
      setFilteredProposals(data || [])
    } catch (error) {
      console.error('Error fetching proposals:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(proposalId: string) {
    if (!tenantId) return

    try {
      await supabase.from('proposal_line_items').delete().eq('proposal_id', proposalId)

      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', proposalId)
        .eq('tenant_id', tenantId)

      if (error) throw error

      toast.success('Proposal deleted successfully')
      fetchProposals()
    } catch (error: any) {
      console.error('Error deleting proposal:', error)
      toast.error(error.message || 'Failed to delete proposal')
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      case 'sent':
        return <Badge className="bg-blue-500">Sent</Badge>
      case 'accepted':
        return <Badge className="bg-green-500">Accepted</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const stats = {
    total: proposals.length,
    draft: proposals.filter(p => p.status === 'draft').length,
    sent: proposals.filter(p => p.status === 'sent').length,
    accepted: proposals.filter(p => p.status === 'accepted').length,
    rejected: proposals.filter(p => p.status === 'rejected').length,
    totalValue: proposals.reduce((sum, p) => sum + Number(p.total), 0),
    acceptedValue: proposals.filter(p => p.status === 'accepted').reduce((sum, p) => sum + Number(p.total), 0)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0A192F]">
              Sales Proposals
            </h1>
            <p className="text-[#475569] mt-1">
              Manage your sales pipeline and convert proposals to invoices
            </p>
          </div>
          <Link href="/proposals/new">
            <Button className="bg-[#0D1B2A] hover:bg-[#1a2d42] text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Proposal
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
              <FileText className="h-4 w-4 text-[#475569]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-[#475569] mt-1">
                ${stats.totalValue.toFixed(2)} total value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sent}</div>
              <p className="text-xs text-[#475569] mt-1">
                Awaiting response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.accepted}</div>
              <p className="text-xs text-[#475569] mt-1">
                ${stats.acceptedValue.toFixed(2)} won
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-sky-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total > 0 ? ((stats.accepted / stats.total) * 100).toFixed(0) : 0}%
              </div>
              <p className="text-xs text-[#475569] mt-1">
                Acceptance rate
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Proposals</CardTitle>
                <CardDescription>Track and manage your sales proposals</CardDescription>
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="all" className="data-[state=inactive]:text-[#0A192F]">All</TabsTrigger>
                  <TabsTrigger value="draft" className="data-[state=inactive]:text-[#0A192F]">Draft</TabsTrigger>
                  <TabsTrigger value="sent" className="data-[state=inactive]:text-[#0A192F]">Sent</TabsTrigger>
                  <TabsTrigger value="accepted" className="data-[state=inactive]:text-[#0A192F]">Accepted</TabsTrigger>
                  <TabsTrigger value="rejected" className="data-[state=inactive]:text-[#0A192F]">Rejected</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {loading || tenantLoading ? (
              <div className="text-center py-8 text-[#475569]">Loading...</div>
            ) : filteredProposals.length === 0 ? (
              <div className="text-center py-8 text-[#475569]">
                No proposals found. Create your first proposal to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proposal #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProposals.map((proposal) => (
                    <TableRow
                      key={proposal.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/proposals/${proposal.id}`)}
                    >
                      <TableCell className="font-medium">
                        {proposal.proposal_number}
                      </TableCell>
                      <TableCell>{proposal.customers.name}</TableCell>
                      <TableCell>{proposal.title}</TableCell>
                      <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${Number(proposal.total).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {proposal.valid_until
                          ? format(new Date(proposal.valid_until), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-[#475569]">
                        {format(new Date(proposal.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/proposals/${proposal.id}`)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingProposal(proposal)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingProposal(proposal)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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
      </div>

      <EditProposalDialog
        proposal={editingProposal}
        isOpen={!!editingProposal}
        onClose={() => setEditingProposal(null)}
        onSuccess={() => {
          fetchProposals()
          setEditingProposal(null)
        }}
      />

      <ConfirmDeleteDialog
        open={!!deletingProposal}
        onOpenChange={(open) => !open && setDeletingProposal(null)}
        onConfirm={() => {
          if (deletingProposal) {
            handleDelete(deletingProposal.id)
            setDeletingProposal(null)
          }
        }}
        title="Delete Proposal"
        description={`Are you sure you want to delete proposal ${deletingProposal?.proposal_number}? This action cannot be undone.`}
      />
    </DashboardLayout>
  )
}

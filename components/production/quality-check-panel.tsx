'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, Loader2, ShieldCheck, XCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface QualityCheckPanelProps {
  productionOrderId: string
  isTR: boolean
  readOnly?: boolean
}

export function QualityCheckPanel({ productionOrderId, isTR, readOnly }: QualityCheckPanelProps) {
  const [checks, setChecks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newCheck, setNewCheck] = useState({
    check_type: '',
    result: 'passed',
    checked_by: '',
    defect_count: '0',
    notes: '',
  })

  const fetchChecks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('production_quality_checks')
        .select('*')
        .eq('production_order_id', productionOrderId)
        .order('checked_at', { ascending: false })

      if (error) throw error
      setChecks(data || [])
    } catch (error) {
      console.error('Error fetching QC checks:', error)
    } finally {
      setLoading(false)
    }
  }, [productionOrderId])

  useEffect(() => {
    fetchChecks()
  }, [fetchChecks])

  async function handleAdd() {
    if (!newCheck.check_type.trim()) {
      toast.error(isTR ? 'Kontrol tipi zorunludur' : 'Check type is required')
      return
    }

    setAdding(true)
    try {
      const { error } = await supabase.from('production_quality_checks').insert({
        production_order_id: productionOrderId,
        check_type: newCheck.check_type,
        result: newCheck.result,
        checked_by: newCheck.checked_by,
        defect_count: Number(newCheck.defect_count) || 0,
        notes: newCheck.notes,
      })

      if (error) throw error
      toast.success(isTR ? 'Kalite kontrolu eklendi' : 'Quality check added')
      setNewCheck({ check_type: '', result: 'passed', checked_by: '', defect_count: '0', notes: '' })
      fetchChecks()
    } catch (error: any) {
      toast.error(error.message || 'Error')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('production_quality_checks')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success(isTR ? 'Kontrol silindi' : 'Check removed')
      fetchChecks()
    } catch (error: any) {
      toast.error(error.message || 'Error')
    }
  }

  const passedCount = checks.filter(c => c.result === 'passed').length
  const failedCount = checks.filter(c => c.result === 'failed').length
  const totalDefects = checks.reduce((sum, c) => sum + (c.defect_count || 0), 0)
  const passRate = checks.length > 0 ? Math.round((passedCount / checks.length) * 100) : 0

  function getResultBadge(result: string) {
    const map: Record<string, { class: string; icon: any }> = {
      passed: { class: 'bg-green-100 text-green-800', icon: ShieldCheck },
      failed: { class: 'bg-red-100 text-red-800', icon: XCircle },
      conditional: { class: 'bg-amber-100 text-amber-800', icon: AlertTriangle },
    }
    return map[result] || map.passed
  }

  function getResultLabel(result: string) {
    if (isTR) {
      const map: Record<string, string> = { passed: 'Gecti', failed: 'Kaldi', conditional: 'Kosullu' }
      return map[result] || result
    }
    return result.charAt(0).toUpperCase() + result.slice(1)
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">{isTR ? 'Toplam Kontrol' : 'Total Checks'}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xl font-bold">{checks.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">{isTR ? 'Gecme Orani' : 'Pass Rate'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${passRate >= 90 ? 'text-green-600' : passRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
              {passRate}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">{isTR ? 'Basarisiz' : 'Failed'}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xl font-bold text-red-600">{failedCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">{isTR ? 'Toplam Kusur' : 'Total Defects'}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xl font-bold">{totalDefects}</p></CardContent>
        </Card>
      </div>

      {!readOnly && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#7DD3FC]" />
              {isTR ? 'Kalite Kontrolu Ekle' : 'Add Quality Check'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Input
                placeholder={isTR ? 'Kontrol tipi (orn: Boyut, Agirlik)' : 'Check type (e.g., Dimension, Weight)'}
                value={newCheck.check_type}
                onChange={e => setNewCheck({ ...newCheck, check_type: e.target.value })}
              />
              <Select value={newCheck.result} onValueChange={v => setNewCheck({ ...newCheck, result: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="passed">{isTR ? 'Gecti' : 'Passed'}</SelectItem>
                  <SelectItem value="failed">{isTR ? 'Kaldi' : 'Failed'}</SelectItem>
                  <SelectItem value="conditional">{isTR ? 'Kosullu' : 'Conditional'}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder={isTR ? 'Kontrol eden' : 'Checked by'}
                value={newCheck.checked_by}
                onChange={e => setNewCheck({ ...newCheck, checked_by: e.target.value })}
              />
              <Input
                type="number"
                placeholder={isTR ? 'Kusur sayisi' : 'Defect count'}
                value={newCheck.defect_count}
                onChange={e => setNewCheck({ ...newCheck, defect_count: e.target.value })}
                min={0}
              />
              <Button onClick={handleAdd} disabled={adding} size="sm" className="bg-[#2ECC71] hover:bg-[#27AE60]">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> {isTR ? 'Ekle' : 'Add'}</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">{isTR ? 'Kontrol Tipi' : 'Check Type'}</TableHead>
              <TableHead className="font-semibold">{isTR ? 'Sonuc' : 'Result'}</TableHead>
              <TableHead className="font-semibold">{isTR ? 'Kontrol Eden' : 'Checked By'}</TableHead>
              <TableHead className="font-semibold text-right">{isTR ? 'Kusur' : 'Defects'}</TableHead>
              <TableHead className="font-semibold">{isTR ? 'Tarih' : 'Date'}</TableHead>
              <TableHead className="font-semibold">{isTR ? 'Notlar' : 'Notes'}</TableHead>
              {!readOnly && <TableHead className="w-[60px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {checks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 6 : 7} className="text-center py-8 text-gray-500">
                  {isTR ? 'Henuz kalite kontrolu yapilmadi' : 'No quality checks yet'}
                </TableCell>
              </TableRow>
            ) : (
              checks.map(check => {
                const badge = getResultBadge(check.result)
                const Icon = badge.icon
                return (
                  <TableRow key={check.id}>
                    <TableCell className="font-medium text-sm">{check.check_type}</TableCell>
                    <TableCell>
                      <Badge className={badge.class}>
                        <Icon className="h-3 w-3 mr-1" />
                        {getResultLabel(check.result)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{check.checked_by || '-'}</TableCell>
                    <TableCell className="text-right text-sm">
                      {check.defect_count > 0 ? (
                        <span className="text-red-600 font-medium">{check.defect_count}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {check.checked_at
                        ? new Date(check.checked_at).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{check.notes || '-'}</TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(check.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

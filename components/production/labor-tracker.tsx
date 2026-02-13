'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, Loader2, Users, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface LaborTrackerProps {
  productionOrderId: string
  isTR: boolean
  readOnly?: boolean
}

export function LaborTracker({ productionOrderId, isTR, readOnly }: LaborTrackerProps) {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newEntry, setNewEntry] = useState({
    worker_name: '',
    role: '',
    hours_worked: '',
    hourly_rate: '',
    work_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const fetchEntries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('production_labor_entries')
        .select('*')
        .eq('production_order_id', productionOrderId)
        .order('work_date', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching labor entries:', error)
    } finally {
      setLoading(false)
    }
  }, [productionOrderId])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  async function handleAdd() {
    if (!newEntry.worker_name.trim() || !newEntry.hours_worked) {
      toast.error(isTR ? 'Calisan adi ve calisma saati zorunludur' : 'Worker name and hours are required')
      return
    }

    setAdding(true)
    try {
      const { error } = await supabase.from('production_labor_entries').insert({
        production_order_id: productionOrderId,
        worker_name: newEntry.worker_name,
        role: newEntry.role,
        hours_worked: Number(newEntry.hours_worked),
        hourly_rate: Number(newEntry.hourly_rate) || 0,
        work_date: newEntry.work_date || null,
        notes: newEntry.notes,
      })

      if (error) throw error
      toast.success(isTR ? 'Iscilik kaydedildi' : 'Labor entry added')
      setNewEntry({ worker_name: '', role: '', hours_worked: '', hourly_rate: '', work_date: new Date().toISOString().split('T')[0], notes: '' })
      fetchEntries()
    } catch (error: any) {
      toast.error(error.message || 'Error')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('production_labor_entries')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success(isTR ? 'Kayit silindi' : 'Entry removed')
      fetchEntries()
    } catch (error: any) {
      toast.error(error.message || 'Error')
    }
  }

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours_worked), 0)
  const totalCost = entries.reduce((sum, e) => sum + (Number(e.hours_worked) * Number(e.hourly_rate)), 0)
  const avgHourlyRate = totalHours > 0 ? totalCost / totalHours : 0

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {isTR ? 'Toplam Saat' : 'Total Hours'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{totalHours.toFixed(1)} {isTR ? 'saat' : 'hrs'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {isTR ? 'Toplam Iscilik Maliyeti' : 'Total Labor Cost'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">{isTR ? 'Ortalama Saat Ucreti' : 'Avg Hourly Rate'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{avgHourlyRate.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</p>
          </CardContent>
        </Card>
      </div>

      {!readOnly && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-[#7DD3FC]" />
              {isTR ? 'Iscilik Kaydi Ekle' : 'Add Labor Entry'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <Input
                placeholder={isTR ? 'Calisan adi' : 'Worker name'}
                value={newEntry.worker_name}
                onChange={e => setNewEntry({ ...newEntry, worker_name: e.target.value })}
              />
              <Input
                placeholder={isTR ? 'Gorev' : 'Role'}
                value={newEntry.role}
                onChange={e => setNewEntry({ ...newEntry, role: e.target.value })}
              />
              <Input
                type="number"
                placeholder={isTR ? 'Saat' : 'Hours'}
                value={newEntry.hours_worked}
                onChange={e => setNewEntry({ ...newEntry, hours_worked: e.target.value })}
                min={0}
                step={0.5}
              />
              <Input
                type="number"
                placeholder={isTR ? 'Saat ucreti' : 'Hourly rate'}
                value={newEntry.hourly_rate}
                onChange={e => setNewEntry({ ...newEntry, hourly_rate: e.target.value })}
                min={0}
                step={0.01}
              />
              <Input
                type="date"
                value={newEntry.work_date}
                onChange={e => setNewEntry({ ...newEntry, work_date: e.target.value })}
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
              <TableHead className="font-semibold">{isTR ? 'Calisan' : 'Worker'}</TableHead>
              <TableHead className="font-semibold">{isTR ? 'Gorev' : 'Role'}</TableHead>
              <TableHead className="font-semibold">{isTR ? 'Tarih' : 'Date'}</TableHead>
              <TableHead className="font-semibold text-right">{isTR ? 'Saat' : 'Hours'}</TableHead>
              <TableHead className="font-semibold text-right">{isTR ? 'Saat Ucreti' : 'Hourly Rate'}</TableHead>
              <TableHead className="font-semibold text-right">{isTR ? 'Toplam' : 'Total'}</TableHead>
              {!readOnly && <TableHead className="w-[60px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 6 : 7} className="text-center py-8 text-gray-500">
                  {isTR ? 'Henuz iscilik kaydı yok' : 'No labor entries yet'}
                </TableCell>
              </TableRow>
            ) : (
              entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium text-sm">{entry.worker_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.role || '-'}</TableCell>
                  <TableCell className="text-sm">
                    {entry.work_date
                      ? new Date(entry.work_date).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right text-sm">{Number(entry.hours_worked).toFixed(1)}</TableCell>
                  <TableCell className="text-right text-sm">
                    {Number(entry.hourly_rate).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold">
                    {(Number(entry.hours_worked) * Number(entry.hourly_rate)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

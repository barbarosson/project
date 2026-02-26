'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

interface TurkishProvince {
  id: string
  plate_code: string
  province_name: string
  region: string
}

interface TurkishProvinceSelectProps {
  value: string
  onValueChange: (value: string) => void
  allowCustom?: boolean
  placeholder?: string
  disabled?: boolean
}

export function TurkishProvinceSelect({
  value,
  onValueChange,
  allowCustom = true,
  placeholder = 'Select a province',
  disabled = false
}: TurkishProvinceSelectProps) {
  const [provinces, setProvinces] = useState<TurkishProvince[]>([])
  const [loading, setLoading] = useState(true)
  const [isCustom, setIsCustom] = useState(false)

  useEffect(() => {
    fetchProvinces()
  }, [])

  useEffect(() => {
    if (value && provinces.length > 0) {
      const isInList = provinces.some(p => p.province_name === value)
      setIsCustom(!isInList)
    }
  }, [value, provinces])

  async function fetchProvinces() {
    try {
      const { data, error } = await supabase
        .from('turkish_provinces')
        .select('*')
        .order('province_name')

      if (error) throw error
      setProvinces(data || [])
    } catch (error) {
      console.error('Error fetching provinces:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Select disabled={true}>
        <SelectTrigger>
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    )
  }

  if (isCustom && allowCustom) {
    return (
      <div className="space-y-2">
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Enter province name"
          readOnly={disabled}
        />
        {!disabled && (
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline"
            onClick={() => {
              setIsCustom(false)
              onValueChange('')
            }}
          >
            Select from list
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {provinces.map((province) => (
            <SelectItem key={province.id} value={province.province_name}>
              {province.plate_code} - {province.province_name} ({province.region})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {allowCustom && !disabled && (
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline"
          onClick={() => setIsCustom(true)}
        >
          Enter custom province
        </button>
      )}
    </div>
  )
}

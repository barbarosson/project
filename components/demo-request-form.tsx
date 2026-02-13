'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Send, CheckCircle2, Building2, Mail, Phone, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/language-context'

export function DemoRequestForm() {
  const { language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyName: '',
    phone: '',
    industry: '',
    message: ''
  })

  const industries = [
    { value: 'retail', label: language === 'tr' ? 'Perakende' : 'Retail' },
    { value: 'manufacturing', label: language === 'tr' ? 'İmalat' : 'Manufacturing' },
    { value: 'services', label: language === 'tr' ? 'Hizmetler' : 'Services' },
    { value: 'technology', label: language === 'tr' ? 'Teknoloji' : 'Technology' },
    { value: 'healthcare', label: language === 'tr' ? 'Sağlık' : 'Healthcare' },
    { value: 'education', label: language === 'tr' ? 'Eğitim' : 'Education' },
    { value: 'construction', label: language === 'tr' ? 'İnşaat' : 'Construction' },
    { value: 'logistics', label: language === 'tr' ? 'Lojistik' : 'Logistics' },
    { value: 'finance', label: language === 'tr' ? 'Finans' : 'Finance' },
    { value: 'other', label: language === 'tr' ? 'Diğer' : 'Other' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName || !formData.email || !formData.companyName) {
      toast.error(language === 'tr' ? 'Lütfen zorunlu alanları doldurun' : 'Please fill in required fields')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('demo_requests')
        .insert([
          {
            full_name: formData.fullName,
            email: formData.email,
            company_name: formData.companyName,
            phone: formData.phone || null,
            industry: formData.industry || null,
            message: formData.message || null,
            status: 'pending'
          }
        ])

      if (error) {
        if (error.code === '23505') {
          toast.error(
            language === 'tr'
              ? 'Bu e-posta adresiyle zaten bir demo talebi mevcut'
              : 'A demo request with this email already exists'
          )
        } else {
          throw error
        }
        return
      }

      // Send email notification to info@modulus.app
      console.log('Sending email notification...');
      const emailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-demo-request-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            companyName: formData.companyName,
            phone: formData.phone,
            industry: formData.industry,
            message: formData.message,
          }),
        }
      );

      const emailData = await emailResponse.json();
      console.log('Email API Response Status:', emailResponse.status);
      console.log('Email API Response Data:', emailData);

      if (!emailResponse.ok) {
        console.error('Email notification failed:', emailData);
        toast.error(
          language === 'tr'
            ? 'Demo talebi kaydedildi ancak email gönderilemedi. Yönetici tarafından kontrol edileceği için endişelenmeyin!'
            : 'Demo request saved but email notification failed. Our team will still review it!'
        );
      } else {
        console.log('Email sent successfully! Email ID:', emailData.id);
        toast.success(
          language === 'tr'
            ? 'Demo talebiniz başarıyla gönderildi! En kısa sürede size dönüş yapacağız.'
            : 'Demo request submitted successfully! We will get back to you soon.'
        );
      }

      setSubmitted(true)

      setFormData({
        fullName: '',
        email: '',
        companyName: '',
        phone: '',
        industry: '',
        message: ''
      })
    } catch (error: any) {
      console.error('Error submitting demo request:', error)
      toast.error(
        language === 'tr'
          ? 'Bir hata oluştu. Lütfen tekrar deneyin.'
          : 'An error occurred. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="border-2 border-[#00D4AA] bg-gradient-to-br from-white to-green-50" id="demo-request">
        <CardContent className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#00D4AA] rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {language === 'tr' ? 'Talebiniz Alındı!' : 'Request Received!'}
          </h3>
          <p className="text-gray-600 mb-6">
            {language === 'tr'
              ? 'Demo hesap talebinizi aldık. Ekibimiz talebinizi değerlendirecek ve en kısa sürede size geri dönüş yapacak. Onaylandığında, örnek verilerle dolu demo hesabınız hazır olacak!'
              : 'We received your demo account request. Our team will review it and get back to you soon. Once approved, your demo account with sample data will be ready!'}
          </p>
          <Button
            onClick={() => setSubmitted(false)}
            variant="outline"
            className="border-[#00D4AA] text-[#00D4AA]"
          >
            {language === 'tr' ? 'Yeni Talep Gönder' : 'Submit Another Request'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2" id="demo-request">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-[#00D4AA] to-[#00B894] rounded-full flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-3xl">
          {language === 'tr' ? 'Demo Hesap Talebi' : 'Request Demo Account'}
        </CardTitle>
        <CardDescription className="text-base mt-2">
          {language === 'tr'
            ? 'Formu doldurun, talebiniz onaylandığında 10\'ar adet örnek veriyle dolu bir demo hesap oluşturacağız'
            : "Fill out the form and we'll create a demo account with 10 sample records once approved"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                {language === 'tr' ? 'Ad Soyad' : 'Full Name'} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder={language === 'tr' ? 'Adınız Soyadınız' : 'Your full name'}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                {language === 'tr' ? 'E-posta' : 'Email'} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@sirket.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                {language === 'tr' ? 'Şirket Adı' : 'Company Name'} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="companyName"
                  type="text"
                  placeholder={language === 'tr' ? 'Şirket Adı' : 'Company Name'}
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                {language === 'tr' ? 'Telefon' : 'Phone'}
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+90 5XX XXX XX XX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">
              {language === 'tr' ? 'Sektör' : 'Industry'}
            </Label>
            <Select
              value={formData.industry}
              onValueChange={(value) => setFormData({ ...formData, industry: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={language === 'tr' ? 'Sektör seçin' : 'Select industry'} />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry.value} value={industry.value}>
                    {industry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              {language === 'tr' ? 'Mesajınız (Opsiyonel)' : 'Your Message (Optional)'}
            </Label>
            <Textarea
              id="message"
              placeholder={
                language === 'tr'
                  ? 'İhtiyaçlarınız veya sorularınız hakkında bilgi verin...'
                  : 'Tell us about your needs or questions...'
              }
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <p className="text-sm text-green-800 font-medium">
              {language === 'tr' ? '✨ Demo Hesabınızda:' : '✨ Your Demo Account Includes:'}
            </p>
            <ul className="text-sm text-green-700 space-y-1 ml-4">
              <li>• {language === 'tr' ? '10 Örnek Müşteri' : '10 Sample Customers'}</li>
              <li>• {language === 'tr' ? '10 Örnek Ürün' : '10 Sample Products'}</li>
              <li>• {language === 'tr' ? '10 Örnek Fatura' : '10 Sample Invoices'}</li>
              <li>• {language === 'tr' ? '10 Örnek Gider' : '10 Sample Expenses'}</li>
              <li>• {language === 'tr' ? '10 Örnek Teklif' : '10 Sample Proposals'}</li>
              <li>• {language === 'tr' ? 'Ve daha fazlası...' : 'And more...'}</li>
            </ul>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#00D4AA] to-[#00B894] hover:from-[#00B894] hover:to-[#00997a] text-white"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {language === 'tr' ? 'Gönderiliyor...' : 'Sending...'}
              </div>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {language === 'tr' ? 'Demo Talebi Gönder' : 'Submit Demo Request'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

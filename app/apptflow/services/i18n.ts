// Self-contained i18n dictionary for the AppointFlow Services admin page.
// Mirrors the 9 languages supported by the WhatsApp bot (lib/apptflow/i18n.ts)
// so the merchant can configure services/pricing in the same language as
// their customers see.

export type UiLocale = 'en' | 'tr' | 'es' | 'de' | 'fr' | 'pt' | 'ar' | 'it' | 'ru'

export const UI_LOCALES: Array<{ code: UiLocale; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
  { code: 'it', label: 'Italiano' },
  { code: 'ru', label: 'Русский' },
]

export interface Strings {
  page_title: string
  page_subtitle: string
  language_label: string

  loading: string
  sign_in_required: string

  account_heading: string
  account_email: string
  account_full_name: string
  account_member_since: string
  account_business_name: string
  account_vertical: string
  account_timezone: string
  account_default_locale: string
  account_default_currency: string
  account_tenant_status: string

  subscription_heading: string
  subscription_no_plan: string
  subscription_current_plan: string
  subscription_status: string
  status_trialing: string
  status_active: string
  status_past_due: string
  status_cancelled: string
  status_paused: string
  status_unpaid: string
  subscription_trial_ends: string
  subscription_renews_at: string
  subscription_will_cancel: string
  subscription_auto_renew: string
  subscription_included_appointments: string
  subscription_included_messages: string

  billing_manage: string
  billing_update_payment: string
  billing_open_portal: string
  billing_renew_now: string
  billing_change_plan: string
  billing_monthly: string
  billing_yearly: string
  billing_per_month: string
  billing_per_year: string
  billing_upgrade_to: string
  billing_start_subscription: string
  billing_redirecting: string
  billing_portal_unavailable: string

  services_heading: string
  services_intro: string
  quick_start_title: string
  quick_start_intro: string
  template_barber: string
  template_salon: string
  template_dental: string
  template_psychiatrist: string

  new_service: string
  no_services: string
  edit: string
  delete: string
  cancel: string
  create: string
  save: string
  delete_confirm: string
  inactive_badge: string
  windows_count_suffix: string

  form_name: string
  form_category: string
  form_category_placeholder: string
  form_description: string
  form_sort_order: string
  form_duration_min: string
  form_buffer_min: string
  form_price: string
  form_currency: string
  form_active: string

  weekly_availability: string
  weekly_availability_hint: string
  window_closed: string
  window_add: string

  general_business_hours: string
  general_business_hours_hint: string
  save_hours: string

  weekdays: [string, string, string, string, string, string, string] // Sun..Sat

  toast_service_created: string
  toast_service_saved: string
  toast_service_deleted: string
  toast_hours_saved: string
  toast_template_seeded: (n: number, key: string) => string
  toast_save_failed: string
  toast_delete_failed: string
  toast_services_load_failed: string
}

const en: Strings = {
  page_title: 'AppointFlow',
  page_subtitle: 'Manage your services, pricing and weekly availability. Everything you save here is what the bot offers on WhatsApp.',
  language_label: 'Language',

  loading: 'Loading…',
  sign_in_required: 'Please sign in to manage your services.',

  account_heading: 'Account',
  account_email: 'Email',
  account_full_name: 'Full name',
  account_member_since: 'Member since',
  account_business_name: 'Business name',
  account_vertical: 'Vertical',
  account_timezone: 'Timezone',
  account_default_locale: 'Default language',
  account_default_currency: 'Default currency',
  account_tenant_status: 'Tenant status',

  subscription_heading: 'Subscription & plan',
  subscription_no_plan: 'You do not have an active subscription yet. Pick a plan below to activate AppointFlow.',
  subscription_current_plan: 'Current plan',
  subscription_status: 'Status',
  status_trialing: 'Trial',
  status_active: 'Active',
  status_past_due: 'Past due',
  status_cancelled: 'Cancelled',
  status_paused: 'Paused',
  status_unpaid: 'Unpaid',
  subscription_trial_ends: 'Trial ends',
  subscription_renews_at: 'Renews on',
  subscription_will_cancel: 'Your plan will end at the current period. Click Renew now to keep the service.',
  subscription_auto_renew: 'Auto-renews — you will be charged on the renewal date.',
  subscription_included_appointments: 'Included appointments / month',
  subscription_included_messages: 'Included WhatsApp messages / month',

  billing_manage: 'Manage billing',
  billing_update_payment: 'Update payment method',
  billing_open_portal: 'Open customer portal',
  billing_renew_now: 'Renew now',
  billing_change_plan: 'Change plan',
  billing_monthly: 'Monthly',
  billing_yearly: 'Yearly',
  billing_per_month: '/month',
  billing_per_year: '/year',
  billing_upgrade_to: 'Upgrade to',
  billing_start_subscription: 'Start subscription',
  billing_redirecting: 'Redirecting to secure checkout…',
  billing_portal_unavailable: 'Customer portal is not available yet. Please contact support.',

  services_heading: 'Services',
  services_intro: 'Each service has a duration, price and (optionally) weekly hours when it can be booked. If windows are empty, the general business hours below are used.',
  quick_start_title: 'Quick-start templates',
  quick_start_intro: 'No services yet. Pick a template to get going in seconds — you can tweak everything afterwards.',
  template_barber: 'Barber',
  template_salon: 'Salon',
  template_dental: 'Dental',
  template_psychiatrist: 'Psychiatrist',

  new_service: '+ New service',
  no_services: 'No services yet.',
  edit: 'Edit',
  delete: 'Delete',
  cancel: 'Cancel',
  create: 'Create',
  save: 'Save',
  delete_confirm: 'Delete this service? This cannot be undone.',
  inactive_badge: '(inactive)',
  windows_count_suffix: 'windows',

  form_name: 'Name',
  form_category: 'Category',
  form_category_placeholder: 'hair, beard, combo…',
  form_description: 'Description',
  form_sort_order: 'Sort order',
  form_duration_min: 'Duration (min)',
  form_buffer_min: 'Buffer after (min)',
  form_price: 'Price',
  form_currency: 'Currency',
  form_active: 'Active (bot offers this service)',

  weekly_availability: 'Weekly availability',
  weekly_availability_hint: 'Leave empty to use your general business hours below.',
  window_closed: 'closed',
  window_add: '+ add',

  general_business_hours: 'General business hours',
  general_business_hours_hint: 'Used as default when a service has no specific windows set.',
  save_hours: 'Save hours',

  weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

  toast_service_created: 'Service created',
  toast_service_saved: 'Service saved',
  toast_service_deleted: 'Service deleted',
  toast_hours_saved: 'Business hours saved',
  toast_template_seeded: (n, key) => `Seeded ${n} services for ${key}`,
  toast_save_failed: 'Save failed',
  toast_delete_failed: 'Delete failed',
  toast_services_load_failed: 'Could not load services',
}

const tr: Strings = {
  page_title: 'AppointFlow',
  page_subtitle: 'Hizmetlerini, fiyatlarını ve haftalık çalışma saatlerini yönet. Burada kaydettiğin her şey WhatsApp botunun müşterilere sunduklarıdır.',
  language_label: 'Dil',

  loading: 'Yükleniyor…',
  sign_in_required: 'Hizmetlerinizi yönetmek için giriş yapın.',

  account_heading: 'Hesap',
  account_email: 'E-posta',
  account_full_name: 'Ad Soyad',
  account_member_since: 'Üyelik tarihi',
  account_business_name: 'İşletme adı',
  account_vertical: 'Sektör',
  account_timezone: 'Zaman dilimi',
  account_default_locale: 'Varsayılan dil',
  account_default_currency: 'Varsayılan para birimi',
  account_tenant_status: 'Tenant durumu',

  subscription_heading: 'Abonelik ve paket',
  subscription_no_plan: 'Henüz aktif bir aboneliğin yok. AppointFlow\'u başlatmak için aşağıdan bir paket seç.',
  subscription_current_plan: 'Mevcut paket',
  subscription_status: 'Durum',
  status_trialing: 'Deneme',
  status_active: 'Aktif',
  status_past_due: 'Gecikmiş ödeme',
  status_cancelled: 'İptal edildi',
  status_paused: 'Duraklatıldı',
  status_unpaid: 'Ödenmemiş',
  subscription_trial_ends: 'Deneme bitişi',
  subscription_renews_at: 'Yenilenme',
  subscription_will_cancel: 'Paketin bu dönem sonunda bitecek. Hizmete devam etmek için Şimdi yenile butonuna bas.',
  subscription_auto_renew: 'Otomatik yenilenir — yenilenme tarihinde ücret alınır.',
  subscription_included_appointments: 'Aylık dahil randevu',
  subscription_included_messages: 'Aylık dahil WhatsApp mesajı',

  billing_manage: 'Faturayı yönet',
  billing_update_payment: 'Ödeme yöntemini güncelle',
  billing_open_portal: 'Müşteri panelini aç',
  billing_renew_now: 'Şimdi yenile',
  billing_change_plan: 'Paket değiştir',
  billing_monthly: 'Aylık',
  billing_yearly: 'Yıllık',
  billing_per_month: '/ay',
  billing_per_year: '/yıl',
  billing_upgrade_to: 'Yükselt:',
  billing_start_subscription: 'Aboneliği başlat',
  billing_redirecting: 'Güvenli ödeme sayfasına yönlendiriliyor…',
  billing_portal_unavailable: 'Müşteri paneli henüz hazır değil. Lütfen destekle iletişime geç.',

  services_heading: 'Hizmetler',
  services_intro: 'Her hizmetin bir süresi, fiyatı ve (isteğe bağlı) haftalık rezerve edilebileceği saatleri vardır. Saatler boşsa aşağıdaki genel çalışma saatleri kullanılır.',
  quick_start_title: 'Hızlı başlangıç şablonları',
  quick_start_intro: 'Henüz hizmet yok. Saniyeler içinde başlamak için bir şablon seç — sonra her şeyi düzenleyebilirsin.',
  template_barber: 'Berber',
  template_salon: 'Kuaför',
  template_dental: 'Diş Hekimi',
  template_psychiatrist: 'Psikiyatr',

  new_service: '+ Yeni hizmet',
  no_services: 'Henüz hizmet yok.',
  edit: 'Düzenle',
  delete: 'Sil',
  cancel: 'İptal',
  create: 'Oluştur',
  save: 'Kaydet',
  delete_confirm: 'Bu hizmet silinsin mi? Geri alınamaz.',
  inactive_badge: '(pasif)',
  windows_count_suffix: 'zaman aralığı',

  form_name: 'Ad',
  form_category: 'Kategori',
  form_category_placeholder: 'saç, sakal, kombo…',
  form_description: 'Açıklama',
  form_sort_order: 'Sıralama',
  form_duration_min: 'Süre (dk)',
  form_buffer_min: 'Sonrası boşluk (dk)',
  form_price: 'Fiyat',
  form_currency: 'Para birimi',
  form_active: 'Aktif (bot bu hizmeti sunar)',

  weekly_availability: 'Haftalık uygunluk',
  weekly_availability_hint: 'Boş bırakırsan aşağıdaki genel çalışma saatleri kullanılır.',
  window_closed: 'kapalı',
  window_add: '+ ekle',

  general_business_hours: 'Genel çalışma saatleri',
  general_business_hours_hint: 'Bir hizmetin kendi saatleri yoksa bu saatler kullanılır.',
  save_hours: 'Saatleri kaydet',

  weekdays: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],

  toast_service_created: 'Hizmet oluşturuldu',
  toast_service_saved: 'Hizmet kaydedildi',
  toast_service_deleted: 'Hizmet silindi',
  toast_hours_saved: 'Çalışma saatleri kaydedildi',
  toast_template_seeded: (n, key) => `${key} için ${n} hizmet eklendi`,
  toast_save_failed: 'Kaydedilemedi',
  toast_delete_failed: 'Silinemedi',
  toast_services_load_failed: 'Hizmetler yüklenemedi',
}

const es: Strings = {
  page_title: 'AppointFlow',
  page_subtitle: 'Gestiona tus servicios, precios y disponibilidad semanal. Todo lo que guardes aquí es lo que el bot ofrece en WhatsApp.',
  language_label: 'Idioma',

  loading: 'Cargando…',
  sign_in_required: 'Inicia sesión para administrar tus servicios.',

  account_heading: 'Cuenta',
  account_email: 'Correo',
  account_full_name: 'Nombre completo',
  account_member_since: 'Miembro desde',
  account_business_name: 'Nombre del negocio',
  account_vertical: 'Sector',
  account_timezone: 'Zona horaria',
  account_default_locale: 'Idioma por defecto',
  account_default_currency: 'Moneda por defecto',
  account_tenant_status: 'Estado de la cuenta',

  subscription_heading: 'Suscripción y plan',
  subscription_no_plan: 'Aún no tienes una suscripción activa. Elige un plan para activar AppointFlow.',
  subscription_current_plan: 'Plan actual',
  subscription_status: 'Estado',
  status_trialing: 'Prueba',
  status_active: 'Activa',
  status_past_due: 'Pago atrasado',
  status_cancelled: 'Cancelada',
  status_paused: 'En pausa',
  status_unpaid: 'Sin pagar',
  subscription_trial_ends: 'Fin de prueba',
  subscription_renews_at: 'Se renueva',
  subscription_will_cancel: 'Tu plan terminará al final del periodo actual. Pulsa Renovar ahora para mantener el servicio.',
  subscription_auto_renew: 'Se renueva automáticamente en la fecha de renovación.',
  subscription_included_appointments: 'Citas incluidas / mes',
  subscription_included_messages: 'Mensajes WhatsApp incluidos / mes',

  billing_manage: 'Gestionar facturación',
  billing_update_payment: 'Actualizar método de pago',
  billing_open_portal: 'Abrir portal del cliente',
  billing_renew_now: 'Renovar ahora',
  billing_change_plan: 'Cambiar plan',
  billing_monthly: 'Mensual',
  billing_yearly: 'Anual',
  billing_per_month: '/mes',
  billing_per_year: '/año',
  billing_upgrade_to: 'Cambiar a',
  billing_start_subscription: 'Empezar suscripción',
  billing_redirecting: 'Redirigiendo al pago seguro…',
  billing_portal_unavailable: 'El portal del cliente aún no está disponible. Contacta con soporte.',

  services_heading: 'Servicios',
  services_intro: 'Cada servicio tiene duración, precio y (opcional) horas semanales en las que se puede reservar. Si las horas están vacías, se usa el horario general de abajo.',
  quick_start_title: 'Plantillas rápidas',
  quick_start_intro: 'Aún no hay servicios. Elige una plantilla para empezar en segundos — podrás ajustarlo todo después.',
  template_barber: 'Barbería',
  template_salon: 'Peluquería',
  template_dental: 'Dental',
  template_psychiatrist: 'Psiquiatra',

  new_service: '+ Nuevo servicio',
  no_services: 'Aún no hay servicios.',
  edit: 'Editar',
  delete: 'Eliminar',
  cancel: 'Cancelar',
  create: 'Crear',
  save: 'Guardar',
  delete_confirm: '¿Eliminar este servicio? No se puede deshacer.',
  inactive_badge: '(inactivo)',
  windows_count_suffix: 'franjas',

  form_name: 'Nombre',
  form_category: 'Categoría',
  form_category_placeholder: 'cabello, barba, combo…',
  form_description: 'Descripción',
  form_sort_order: 'Orden',
  form_duration_min: 'Duración (min)',
  form_buffer_min: 'Margen posterior (min)',
  form_price: 'Precio',
  form_currency: 'Moneda',
  form_active: 'Activo (el bot ofrece este servicio)',

  weekly_availability: 'Disponibilidad semanal',
  weekly_availability_hint: 'Déjalo vacío para usar el horario general.',
  window_closed: 'cerrado',
  window_add: '+ añadir',

  general_business_hours: 'Horario general',
  general_business_hours_hint: 'Se usa cuando un servicio no tiene horas propias.',
  save_hours: 'Guardar horario',

  weekdays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],

  toast_service_created: 'Servicio creado',
  toast_service_saved: 'Servicio guardado',
  toast_service_deleted: 'Servicio eliminado',
  toast_hours_saved: 'Horario guardado',
  toast_template_seeded: (n, key) => `${n} servicios añadidos para ${key}`,
  toast_save_failed: 'No se pudo guardar',
  toast_delete_failed: 'No se pudo eliminar',
  toast_services_load_failed: 'No se pudieron cargar los servicios',
}

const de: Strings = {
  page_title: 'AppointFlow',
  page_subtitle: 'Verwalte deine Dienste, Preise und wöchentliche Verfügbarkeit. Alles, was du hier speicherst, bietet der Bot auf WhatsApp an.',
  language_label: 'Sprache',

  loading: 'Lädt…',
  sign_in_required: 'Bitte melde dich an, um deine Dienste zu verwalten.',

  account_heading: 'Konto',
  account_email: 'E-Mail',
  account_full_name: 'Vollständiger Name',
  account_member_since: 'Mitglied seit',
  account_business_name: 'Geschäftsname',
  account_vertical: 'Branche',
  account_timezone: 'Zeitzone',
  account_default_locale: 'Standardsprache',
  account_default_currency: 'Standardwährung',
  account_tenant_status: 'Tenant-Status',

  subscription_heading: 'Abonnement & Plan',
  subscription_no_plan: 'Du hast noch kein aktives Abo. Wähle unten einen Plan, um AppointFlow zu aktivieren.',
  subscription_current_plan: 'Aktueller Plan',
  subscription_status: 'Status',
  status_trialing: 'Testzeitraum',
  status_active: 'Aktiv',
  status_past_due: 'Überfällig',
  status_cancelled: 'Gekündigt',
  status_paused: 'Pausiert',
  status_unpaid: 'Unbezahlt',
  subscription_trial_ends: 'Test endet',
  subscription_renews_at: 'Verlängert am',
  subscription_will_cancel: 'Dein Plan endet am Ende der aktuellen Periode. Klicke auf Jetzt verlängern, um den Service zu behalten.',
  subscription_auto_renew: 'Verlängert sich automatisch am Verlängerungsdatum.',
  subscription_included_appointments: 'Enthaltene Termine / Monat',
  subscription_included_messages: 'Enthaltene WhatsApp-Nachrichten / Monat',

  billing_manage: 'Abrechnung verwalten',
  billing_update_payment: 'Zahlungsmethode aktualisieren',
  billing_open_portal: 'Kundenportal öffnen',
  billing_renew_now: 'Jetzt verlängern',
  billing_change_plan: 'Plan ändern',
  billing_monthly: 'Monatlich',
  billing_yearly: 'Jährlich',
  billing_per_month: '/Monat',
  billing_per_year: '/Jahr',
  billing_upgrade_to: 'Upgrade auf',
  billing_start_subscription: 'Abo starten',
  billing_redirecting: 'Weiterleitung zum sicheren Checkout…',
  billing_portal_unavailable: 'Kundenportal ist noch nicht verfügbar. Bitte kontaktiere den Support.',

  services_heading: 'Dienste',
  services_intro: 'Jeder Dienst hat eine Dauer, einen Preis und (optional) wöchentliche Buchungszeiten. Wenn keine Zeiten gesetzt sind, gelten die allgemeinen Geschäftszeiten unten.',
  quick_start_title: 'Schnellstart-Vorlagen',
  quick_start_intro: 'Noch keine Dienste. Wähle eine Vorlage, um in Sekunden zu starten — du kannst alles danach anpassen.',
  template_barber: 'Barbier',
  template_salon: 'Friseursalon',
  template_dental: 'Zahnarzt',
  template_psychiatrist: 'Psychiater',

  new_service: '+ Neuer Dienst',
  no_services: 'Noch keine Dienste.',
  edit: 'Bearbeiten',
  delete: 'Löschen',
  cancel: 'Abbrechen',
  create: 'Erstellen',
  save: 'Speichern',
  delete_confirm: 'Diesen Dienst löschen? Dies kann nicht rückgängig gemacht werden.',
  inactive_badge: '(inaktiv)',
  windows_count_suffix: 'Zeitfenster',

  form_name: 'Name',
  form_category: 'Kategorie',
  form_category_placeholder: 'haare, bart, kombi…',
  form_description: 'Beschreibung',
  form_sort_order: 'Reihenfolge',
  form_duration_min: 'Dauer (Min)',
  form_buffer_min: 'Puffer danach (Min)',
  form_price: 'Preis',
  form_currency: 'Währung',
  form_active: 'Aktiv (Bot bietet diesen Dienst an)',

  weekly_availability: 'Wöchentliche Verfügbarkeit',
  weekly_availability_hint: 'Leer lassen, um die allgemeinen Geschäftszeiten zu verwenden.',
  window_closed: 'geschlossen',
  window_add: '+ hinzufügen',

  general_business_hours: 'Allgemeine Geschäftszeiten',
  general_business_hours_hint: 'Werden verwendet, wenn ein Dienst keine eigenen Zeiten hat.',
  save_hours: 'Zeiten speichern',

  weekdays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],

  toast_service_created: 'Dienst erstellt',
  toast_service_saved: 'Dienst gespeichert',
  toast_service_deleted: 'Dienst gelöscht',
  toast_hours_saved: 'Geschäftszeiten gespeichert',
  toast_template_seeded: (n, key) => `${n} Dienste für ${key} hinzugefügt`,
  toast_save_failed: 'Speichern fehlgeschlagen',
  toast_delete_failed: 'Löschen fehlgeschlagen',
  toast_services_load_failed: 'Dienste konnten nicht geladen werden',
}

const fr: Strings = {
  page_title: 'AppointFlow',
  page_subtitle: 'Gérez vos services, prix et disponibilités hebdomadaires. Tout ce que vous sauvegardez ici est ce que le bot propose sur WhatsApp.',
  language_label: 'Langue',

  loading: 'Chargement…',
  sign_in_required: 'Connectez-vous pour gérer vos services.',

  account_heading: 'Compte',
  account_email: 'E-mail',
  account_full_name: 'Nom complet',
  account_member_since: 'Membre depuis',
  account_business_name: 'Nom de l’entreprise',
  account_vertical: 'Secteur',
  account_timezone: 'Fuseau horaire',
  account_default_locale: 'Langue par défaut',
  account_default_currency: 'Devise par défaut',
  account_tenant_status: 'Statut du tenant',

  subscription_heading: 'Abonnement & plan',
  subscription_no_plan: 'Vous n’avez pas encore d’abonnement actif. Choisissez un plan pour activer AppointFlow.',
  subscription_current_plan: 'Plan actuel',
  subscription_status: 'Statut',
  status_trialing: 'Essai',
  status_active: 'Actif',
  status_past_due: 'Retard de paiement',
  status_cancelled: 'Annulé',
  status_paused: 'En pause',
  status_unpaid: 'Impayé',
  subscription_trial_ends: 'Fin de l’essai',
  subscription_renews_at: 'Renouvellement',
  subscription_will_cancel: 'Votre plan se terminera à la fin de la période. Cliquez sur Renouveler pour garder le service.',
  subscription_auto_renew: 'Renouvellement automatique à la date de renouvellement.',
  subscription_included_appointments: 'Rendez-vous inclus / mois',
  subscription_included_messages: 'Messages WhatsApp inclus / mois',

  billing_manage: 'Gérer la facturation',
  billing_update_payment: 'Mettre à jour le moyen de paiement',
  billing_open_portal: 'Ouvrir l’espace client',
  billing_renew_now: 'Renouveler maintenant',
  billing_change_plan: 'Changer de plan',
  billing_monthly: 'Mensuel',
  billing_yearly: 'Annuel',
  billing_per_month: '/mois',
  billing_per_year: '/an',
  billing_upgrade_to: 'Passer à',
  billing_start_subscription: 'Démarrer l’abonnement',
  billing_redirecting: 'Redirection vers le paiement sécurisé…',
  billing_portal_unavailable: 'L’espace client n’est pas encore disponible. Contactez le support.',

  services_heading: 'Services',
  services_intro: 'Chaque service a une durée, un prix et (optionnel) des heures hebdomadaires réservables. Si vides, les horaires d’ouverture généraux sont utilisés.',
  quick_start_title: 'Modèles de démarrage',
  quick_start_intro: 'Aucun service. Choisissez un modèle pour démarrer en quelques secondes — vous pourrez tout modifier ensuite.',
  template_barber: 'Barbier',
  template_salon: 'Salon de coiffure',
  template_dental: 'Dentiste',
  template_psychiatrist: 'Psychiatre',

  new_service: '+ Nouveau service',
  no_services: 'Aucun service.',
  edit: 'Modifier',
  delete: 'Supprimer',
  cancel: 'Annuler',
  create: 'Créer',
  save: 'Enregistrer',
  delete_confirm: 'Supprimer ce service ? Irréversible.',
  inactive_badge: '(inactif)',
  windows_count_suffix: 'créneaux',

  form_name: 'Nom',
  form_category: 'Catégorie',
  form_category_placeholder: 'cheveux, barbe, combo…',
  form_description: 'Description',
  form_sort_order: 'Ordre',
  form_duration_min: 'Durée (min)',
  form_buffer_min: 'Marge après (min)',
  form_price: 'Prix',
  form_currency: 'Devise',
  form_active: 'Actif (le bot propose ce service)',

  weekly_availability: 'Disponibilité hebdomadaire',
  weekly_availability_hint: 'Laisser vide pour utiliser les horaires généraux ci-dessous.',
  window_closed: 'fermé',
  window_add: '+ ajouter',

  general_business_hours: 'Horaires d’ouverture',
  general_business_hours_hint: 'Utilisés si un service n’a pas ses propres horaires.',
  save_hours: 'Enregistrer les horaires',

  weekdays: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],

  toast_service_created: 'Service créé',
  toast_service_saved: 'Service enregistré',
  toast_service_deleted: 'Service supprimé',
  toast_hours_saved: 'Horaires enregistrés',
  toast_template_seeded: (n, key) => `${n} services ajoutés pour ${key}`,
  toast_save_failed: 'Échec de l’enregistrement',
  toast_delete_failed: 'Échec de la suppression',
  toast_services_load_failed: 'Impossible de charger les services',
}

const pt: Strings = {
  page_title: 'AppointFlow',
  page_subtitle: 'Gere os seus serviços, preços e disponibilidade semanal. Tudo o que guardar aqui é o que o bot oferece no WhatsApp.',
  language_label: 'Idioma',

  loading: 'A carregar…',
  sign_in_required: 'Inicie sessão para gerir os seus serviços.',

  account_heading: 'Conta',
  account_email: 'E-mail',
  account_full_name: 'Nome completo',
  account_member_since: 'Membro desde',
  account_business_name: 'Nome da empresa',
  account_vertical: 'Setor',
  account_timezone: 'Fuso horário',
  account_default_locale: 'Idioma padrão',
  account_default_currency: 'Moeda padrão',
  account_tenant_status: 'Estado da conta',

  subscription_heading: 'Subscrição e plano',
  subscription_no_plan: 'Ainda não tem uma subscrição ativa. Escolha um plano para ativar o AppointFlow.',
  subscription_current_plan: 'Plano atual',
  subscription_status: 'Estado',
  status_trialing: 'Avaliação',
  status_active: 'Ativa',
  status_past_due: 'Em atraso',
  status_cancelled: 'Cancelada',
  status_paused: 'Pausada',
  status_unpaid: 'Não paga',
  subscription_trial_ends: 'Fim da avaliação',
  subscription_renews_at: 'Renova em',
  subscription_will_cancel: 'O seu plano terminará no fim do período. Clique em Renovar agora para manter o serviço.',
  subscription_auto_renew: 'Renovação automática na data de renovação.',
  subscription_included_appointments: 'Marcações incluídas / mês',
  subscription_included_messages: 'Mensagens WhatsApp incluídas / mês',

  billing_manage: 'Gerir faturação',
  billing_update_payment: 'Atualizar método de pagamento',
  billing_open_portal: 'Abrir portal do cliente',
  billing_renew_now: 'Renovar agora',
  billing_change_plan: 'Mudar de plano',
  billing_monthly: 'Mensal',
  billing_yearly: 'Anual',
  billing_per_month: '/mês',
  billing_per_year: '/ano',
  billing_upgrade_to: 'Mudar para',
  billing_start_subscription: 'Iniciar subscrição',
  billing_redirecting: 'A redirecionar para o pagamento seguro…',
  billing_portal_unavailable: 'Portal do cliente ainda não disponível. Contacte o suporte.',

  services_heading: 'Serviços',
  services_intro: 'Cada serviço tem duração, preço e (opcional) horas semanais reserváveis. Se vazio, são usadas as horas gerais.',
  quick_start_title: 'Modelos iniciais',
  quick_start_intro: 'Sem serviços. Escolha um modelo para começar em segundos — pode ajustar tudo depois.',
  template_barber: 'Barbearia',
  template_salon: 'Cabeleireiro',
  template_dental: 'Dentista',
  template_psychiatrist: 'Psiquiatra',

  new_service: '+ Novo serviço',
  no_services: 'Sem serviços.',
  edit: 'Editar',
  delete: 'Eliminar',
  cancel: 'Cancelar',
  create: 'Criar',
  save: 'Guardar',
  delete_confirm: 'Eliminar este serviço? Não pode ser desfeito.',
  inactive_badge: '(inativo)',
  windows_count_suffix: 'intervalos',

  form_name: 'Nome',
  form_category: 'Categoria',
  form_category_placeholder: 'cabelo, barba, combo…',
  form_description: 'Descrição',
  form_sort_order: 'Ordem',
  form_duration_min: 'Duração (min)',
  form_buffer_min: 'Margem após (min)',
  form_price: 'Preço',
  form_currency: 'Moeda',
  form_active: 'Ativo (o bot oferece este serviço)',

  weekly_availability: 'Disponibilidade semanal',
  weekly_availability_hint: 'Deixe vazio para usar as horas gerais.',
  window_closed: 'fechado',
  window_add: '+ adicionar',

  general_business_hours: 'Horas de funcionamento',
  general_business_hours_hint: 'Usadas quando um serviço não tem horas próprias.',
  save_hours: 'Guardar horas',

  weekdays: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],

  toast_service_created: 'Serviço criado',
  toast_service_saved: 'Serviço guardado',
  toast_service_deleted: 'Serviço eliminado',
  toast_hours_saved: 'Horas guardadas',
  toast_template_seeded: (n, key) => `${n} serviços adicionados para ${key}`,
  toast_save_failed: 'Falha ao guardar',
  toast_delete_failed: 'Falha ao eliminar',
  toast_services_load_failed: 'Não foi possível carregar os serviços',
}

const ar: Strings = {
  page_title: 'AppointFlow',
  page_subtitle: 'أدر خدماتك وأسعارك وتوفرك الأسبوعي. كل ما تحفظه هنا هو ما يعرضه البوت على واتساب.',
  language_label: 'اللغة',

  loading: 'جارٍ التحميل…',
  sign_in_required: 'يرجى تسجيل الدخول لإدارة خدماتك.',

  account_heading: 'الحساب',
  account_email: 'البريد الإلكتروني',
  account_full_name: 'الاسم الكامل',
  account_member_since: 'عضو منذ',
  account_business_name: 'اسم النشاط',
  account_vertical: 'القطاع',
  account_timezone: 'المنطقة الزمنية',
  account_default_locale: 'اللغة الافتراضية',
  account_default_currency: 'العملة الافتراضية',
  account_tenant_status: 'حالة الحساب',

  subscription_heading: 'الاشتراك والخطة',
  subscription_no_plan: 'لا يوجد اشتراك نشط بعد. اختر خطة لتفعيل AppointFlow.',
  subscription_current_plan: 'الخطة الحالية',
  subscription_status: 'الحالة',
  status_trialing: 'تجربة',
  status_active: 'نشطة',
  status_past_due: 'متأخرة الدفع',
  status_cancelled: 'ملغاة',
  status_paused: 'موقوفة',
  status_unpaid: 'غير مدفوعة',
  subscription_trial_ends: 'نهاية التجربة',
  subscription_renews_at: 'تاريخ التجديد',
  subscription_will_cancel: 'ستنتهي خطتك في نهاية الفترة الحالية. اضغط "جدد الآن" للحفاظ على الخدمة.',
  subscription_auto_renew: 'تجديد تلقائي في تاريخ التجديد.',
  subscription_included_appointments: 'مواعيد مشمولة / شهر',
  subscription_included_messages: 'رسائل واتساب مشمولة / شهر',

  billing_manage: 'إدارة الفوترة',
  billing_update_payment: 'تحديث طريقة الدفع',
  billing_open_portal: 'فتح بوابة العميل',
  billing_renew_now: 'جدد الآن',
  billing_change_plan: 'تغيير الخطة',
  billing_monthly: 'شهري',
  billing_yearly: 'سنوي',
  billing_per_month: '/شهر',
  billing_per_year: '/سنة',
  billing_upgrade_to: 'الترقية إلى',
  billing_start_subscription: 'ابدأ الاشتراك',
  billing_redirecting: 'جارٍ تحويلك إلى الدفع الآمن…',
  billing_portal_unavailable: 'بوابة العميل غير متاحة بعد. تواصل مع الدعم.',

  services_heading: 'الخدمات',
  services_intro: 'لكل خدمة مدة وسعر وساعات أسبوعية اختيارية للحجز. إذا كانت فارغة، تُستخدم ساعات العمل العامة.',
  quick_start_title: 'قوالب البدء السريع',
  quick_start_intro: 'لا توجد خدمات. اختر قالبًا لتبدأ في ثوانٍ — يمكنك تعديل كل شيء لاحقًا.',
  template_barber: 'حلاق',
  template_salon: 'صالون',
  template_dental: 'طبيب أسنان',
  template_psychiatrist: 'طبيب نفسي',

  new_service: '+ خدمة جديدة',
  no_services: 'لا توجد خدمات.',
  edit: 'تعديل',
  delete: 'حذف',
  cancel: 'إلغاء',
  create: 'إنشاء',
  save: 'حفظ',
  delete_confirm: 'هل تريد حذف هذه الخدمة؟ لا يمكن التراجع.',
  inactive_badge: '(غير نشط)',
  windows_count_suffix: 'فترات',

  form_name: 'الاسم',
  form_category: 'الفئة',
  form_category_placeholder: 'شعر، لحية، باقة…',
  form_description: 'الوصف',
  form_sort_order: 'الترتيب',
  form_duration_min: 'المدة (دقيقة)',
  form_buffer_min: 'فاصل بعدها (دقيقة)',
  form_price: 'السعر',
  form_currency: 'العملة',
  form_active: 'نشط (البوت يعرض هذه الخدمة)',

  weekly_availability: 'التوفر الأسبوعي',
  weekly_availability_hint: 'اتركه فارغًا لاستخدام ساعات العمل العامة.',
  window_closed: 'مغلق',
  window_add: '+ إضافة',

  general_business_hours: 'ساعات العمل العامة',
  general_business_hours_hint: 'تُستخدم إذا لم يكن للخدمة ساعات خاصة.',
  save_hours: 'حفظ الساعات',

  weekdays: ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'],

  toast_service_created: 'تم إنشاء الخدمة',
  toast_service_saved: 'تم حفظ الخدمة',
  toast_service_deleted: 'تم حذف الخدمة',
  toast_hours_saved: 'تم حفظ ساعات العمل',
  toast_template_seeded: (n, key) => `تمت إضافة ${n} خدمات لـ ${key}`,
  toast_save_failed: 'فشل الحفظ',
  toast_delete_failed: 'فشل الحذف',
  toast_services_load_failed: 'تعذر تحميل الخدمات',
}

const it: Strings = {
  page_title: 'AppointFlow',
  page_subtitle: 'Gestisci servizi, prezzi e disponibilità settimanale. Tutto ciò che salvi qui è quello che il bot propone su WhatsApp.',
  language_label: 'Lingua',

  loading: 'Caricamento…',
  sign_in_required: 'Accedi per gestire i tuoi servizi.',

  account_heading: 'Account',
  account_email: 'E-mail',
  account_full_name: 'Nome completo',
  account_member_since: 'Membro dal',
  account_business_name: 'Nome attività',
  account_vertical: 'Settore',
  account_timezone: 'Fuso orario',
  account_default_locale: 'Lingua predefinita',
  account_default_currency: 'Valuta predefinita',
  account_tenant_status: 'Stato account',

  subscription_heading: 'Abbonamento e piano',
  subscription_no_plan: 'Non hai ancora un abbonamento attivo. Scegli un piano per attivare AppointFlow.',
  subscription_current_plan: 'Piano attuale',
  subscription_status: 'Stato',
  status_trialing: 'Prova',
  status_active: 'Attivo',
  status_past_due: 'Scaduto',
  status_cancelled: 'Annullato',
  status_paused: 'In pausa',
  status_unpaid: 'Non pagato',
  subscription_trial_ends: 'Fine prova',
  subscription_renews_at: 'Rinnovo',
  subscription_will_cancel: 'Il piano terminerà alla fine del periodo. Clicca Rinnova ora per mantenere il servizio.',
  subscription_auto_renew: 'Rinnovo automatico alla data di rinnovo.',
  subscription_included_appointments: 'Appuntamenti inclusi / mese',
  subscription_included_messages: 'Messaggi WhatsApp inclusi / mese',

  billing_manage: 'Gestisci fatturazione',
  billing_update_payment: 'Aggiorna metodo di pagamento',
  billing_open_portal: 'Apri portale cliente',
  billing_renew_now: 'Rinnova ora',
  billing_change_plan: 'Cambia piano',
  billing_monthly: 'Mensile',
  billing_yearly: 'Annuale',
  billing_per_month: '/mese',
  billing_per_year: '/anno',
  billing_upgrade_to: 'Passa a',
  billing_start_subscription: 'Avvia abbonamento',
  billing_redirecting: 'Reindirizzamento al pagamento sicuro…',
  billing_portal_unavailable: 'Portale cliente non ancora disponibile. Contatta il supporto.',

  services_heading: 'Servizi',
  services_intro: 'Ogni servizio ha durata, prezzo e (opzionale) orari settimanali prenotabili. Se vuoti, si usano gli orari generali.',
  quick_start_title: 'Modelli rapidi',
  quick_start_intro: 'Nessun servizio. Scegli un modello per iniziare in pochi secondi — puoi modificare tutto dopo.',
  template_barber: 'Barbiere',
  template_salon: 'Parrucchiere',
  template_dental: 'Dentista',
  template_psychiatrist: 'Psichiatra',

  new_service: '+ Nuovo servizio',
  no_services: 'Nessun servizio.',
  edit: 'Modifica',
  delete: 'Elimina',
  cancel: 'Annulla',
  create: 'Crea',
  save: 'Salva',
  delete_confirm: 'Eliminare questo servizio? Non è reversibile.',
  inactive_badge: '(inattivo)',
  windows_count_suffix: 'fasce',

  form_name: 'Nome',
  form_category: 'Categoria',
  form_category_placeholder: 'capelli, barba, combo…',
  form_description: 'Descrizione',
  form_sort_order: 'Ordine',
  form_duration_min: 'Durata (min)',
  form_buffer_min: 'Margine dopo (min)',
  form_price: 'Prezzo',
  form_currency: 'Valuta',
  form_active: 'Attivo (il bot offre questo servizio)',

  weekly_availability: 'Disponibilità settimanale',
  weekly_availability_hint: 'Lascia vuoto per usare gli orari generali.',
  window_closed: 'chiuso',
  window_add: '+ aggiungi',

  general_business_hours: 'Orari di apertura',
  general_business_hours_hint: 'Usati se un servizio non ha orari propri.',
  save_hours: 'Salva orari',

  weekdays: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],

  toast_service_created: 'Servizio creato',
  toast_service_saved: 'Servizio salvato',
  toast_service_deleted: 'Servizio eliminato',
  toast_hours_saved: 'Orari salvati',
  toast_template_seeded: (n, key) => `${n} servizi aggiunti per ${key}`,
  toast_save_failed: 'Salvataggio fallito',
  toast_delete_failed: 'Eliminazione fallita',
  toast_services_load_failed: 'Impossibile caricare i servizi',
}

const ru: Strings = {
  page_title: 'AppointFlow',
  page_subtitle: 'Управляйте услугами, ценами и расписанием. Всё, что вы сохраните здесь, бот предложит в WhatsApp.',
  language_label: 'Язык',

  loading: 'Загрузка…',
  sign_in_required: 'Войдите, чтобы управлять услугами.',

  account_heading: 'Аккаунт',
  account_email: 'Эл. почта',
  account_full_name: 'Имя',
  account_member_since: 'С нами с',
  account_business_name: 'Название компании',
  account_vertical: 'Сфера',
  account_timezone: 'Часовой пояс',
  account_default_locale: 'Язык по умолчанию',
  account_default_currency: 'Валюта по умолчанию',
  account_tenant_status: 'Статус аккаунта',

  subscription_heading: 'Подписка и тариф',
  subscription_no_plan: 'Активной подписки пока нет. Выберите тариф, чтобы запустить AppointFlow.',
  subscription_current_plan: 'Текущий тариф',
  subscription_status: 'Статус',
  status_trialing: 'Пробный',
  status_active: 'Активна',
  status_past_due: 'Просрочена',
  status_cancelled: 'Отменена',
  status_paused: 'Приостановлена',
  status_unpaid: 'Не оплачена',
  subscription_trial_ends: 'Конец пробного периода',
  subscription_renews_at: 'Продление',
  subscription_will_cancel: 'Подписка закончится в конце периода. Нажмите "Продлить сейчас", чтобы сохранить сервис.',
  subscription_auto_renew: 'Автопродление в дату продления.',
  subscription_included_appointments: 'Встреч в тарифе / мес',
  subscription_included_messages: 'Сообщений WhatsApp / мес',

  billing_manage: 'Управление оплатой',
  billing_update_payment: 'Обновить способ оплаты',
  billing_open_portal: 'Открыть кабинет',
  billing_renew_now: 'Продлить сейчас',
  billing_change_plan: 'Сменить тариф',
  billing_monthly: 'Ежемесячно',
  billing_yearly: 'Ежегодно',
  billing_per_month: '/мес',
  billing_per_year: '/год',
  billing_upgrade_to: 'Перейти на',
  billing_start_subscription: 'Начать подписку',
  billing_redirecting: 'Перенаправление на безопасную оплату…',
  billing_portal_unavailable: 'Кабинет ещё недоступен. Обратитесь в поддержку.',

  services_heading: 'Услуги',
  services_intro: 'У каждой услуги своя длительность, цена и (опционально) недельные часы бронирования. Если пусто — используются общие рабочие часы.',
  quick_start_title: 'Шаблоны быстрого старта',
  quick_start_intro: 'Услуг пока нет. Выберите шаблон, чтобы начать за секунды — всё можно изменить позже.',
  template_barber: 'Барбер',
  template_salon: 'Салон',
  template_dental: 'Стоматолог',
  template_psychiatrist: 'Психиатр',

  new_service: '+ Новая услуга',
  no_services: 'Услуг пока нет.',
  edit: 'Изменить',
  delete: 'Удалить',
  cancel: 'Отмена',
  create: 'Создать',
  save: 'Сохранить',
  delete_confirm: 'Удалить услугу? Отменить нельзя.',
  inactive_badge: '(неактивна)',
  windows_count_suffix: 'интервалов',

  form_name: 'Название',
  form_category: 'Категория',
  form_category_placeholder: 'волосы, борода, комбо…',
  form_description: 'Описание',
  form_sort_order: 'Порядок',
  form_duration_min: 'Длительность (мин)',
  form_buffer_min: 'Интервал после (мин)',
  form_price: 'Цена',
  form_currency: 'Валюта',
  form_active: 'Активна (бот предлагает услугу)',

  weekly_availability: 'Недельное расписание',
  weekly_availability_hint: 'Оставьте пустым, чтобы использовать общие рабочие часы.',
  window_closed: 'закрыто',
  window_add: '+ добавить',

  general_business_hours: 'Общие рабочие часы',
  general_business_hours_hint: 'Используются, если у услуги нет своих часов.',
  save_hours: 'Сохранить часы',

  weekdays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],

  toast_service_created: 'Услуга создана',
  toast_service_saved: 'Услуга сохранена',
  toast_service_deleted: 'Услуга удалена',
  toast_hours_saved: 'Рабочие часы сохранены',
  toast_template_seeded: (n, key) => `Добавлено ${n} услуг для ${key}`,
  toast_save_failed: 'Не удалось сохранить',
  toast_delete_failed: 'Не удалось удалить',
  toast_services_load_failed: 'Не удалось загрузить услуги',
}

export const DICT: Record<UiLocale, Strings> = { en, tr, es, de, fr, pt, ar, it, ru }

export function detectInitialLocale(): UiLocale {
  if (typeof window === 'undefined') return 'en'
  const fromStorage = window.localStorage.getItem('apptflow_ui_lang')
  if (fromStorage && fromStorage in DICT) return fromStorage as UiLocale
  const fromGlobal = window.localStorage.getItem('language')
  if (fromGlobal && fromGlobal in DICT) return fromGlobal as UiLocale
  const nav = (navigator.language ?? 'en').slice(0, 2).toLowerCase()
  return nav in DICT ? (nav as UiLocale) : 'en'
}

export function persistLocale(code: UiLocale) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('apptflow_ui_lang', code)
  }
}

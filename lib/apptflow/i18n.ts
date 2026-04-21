import type { LocaleCode } from './types'

// Message catalog. Every outbound customer-facing string the agent
// produces goes through `t()` so it renders in the tenant's locale.
// Keep keys stable — they are referenced from the orchestrator and
// from WhatsApp template definitions.
type MessageKey =
  | 'greeting'
  | 'ask_service'
  | 'ask_time'
  | 'ask_time_on_day'
  | 'no_slots_on_day'
  | 'specific_time_available'
  | 'specific_time_taken'
  | 'appointment_lookup_found'
  | 'appointment_lookup_none'
  | 'booking_confirmed'
  | 'booking_reminder_24h'
  | 'booking_reminder_2h'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'fallback'
  | 'consent_request'
  | 'campaign_offer'
  | 'payment_failed'
  | 'trial_ending'

type Catalog = Record<MessageKey, string>

const CATALOGS: Record<LocaleCode, Catalog> = {
  en: {
    greeting: 'Hi {name}! I can book, reschedule or cancel your appointment. What do you need?',
    ask_service: 'Which service would you like to book?',
    ask_time: 'When works for you? You can say a day and time, or pick one of these: {slots}.',
    ask_time_on_day: 'Open times on {day}: {slots}. Reply with a number to book.',
    no_slots_on_day: 'We are fully booked on {day}. Closest open times: {slots}. Reply with a number to book.',
    specific_time_available: '{day} at {time} is available. Reply YES to confirm.',
    specific_time_taken: '{day} at {time} is not available. Closest open times: {slots}. Reply with a number to book.',
    appointment_lookup_found: 'Your upcoming {service} appointment is on {when}.',
    appointment_lookup_none: 'I cannot find an upcoming appointment for you right now.',
    booking_confirmed: 'You are booked for {service} on {when}. We will remind you before.',
    booking_reminder_24h: 'Reminder: {service} tomorrow at {time}. Reply YES to confirm, RESCHEDULE to change, CANCEL to cancel.',
    booking_reminder_2h: 'See you in 2 hours for your {service} at {time}. Reply CANCEL if you cannot make it.',
    booking_cancelled: 'Your {service} on {when} has been cancelled.',
    booking_rescheduled: 'Your {service} is now on {when}.',
    fallback: 'Sorry, I did not catch that. You can book, reschedule or cancel — just say the word.',
    consent_request: 'May we send you occasional offers via WhatsApp? Reply YES to opt in, NO to skip.',
    campaign_offer: 'Hi {name}! {offer}. Reply BOOK to grab a slot.',
    payment_failed: 'Your last payment for {business} did not go through. Please update your card to avoid service interruption: {url}',
    trial_ending: 'Your {business} trial ends in {days} days. Choose a plan here: {url}',
  },
  tr: {
    greeting: 'Merhaba {name}! Randevu alabilir, erteleyebilir veya iptal edebilirim. Ne yapmak istersiniz?',
    ask_service: 'Hangi hizmet için randevu istersiniz?',
    ask_time: 'Sizin için uygun zaman nedir? Bir gün ve saat söyleyebilir ya da şunlardan birini seçebilirsiniz: {slots}.',
    ask_time_on_day: '{day} için uygun saatler: {slots}. Randevu almak için bir numara yazabilirsiniz.',
    no_slots_on_day: '{day} günü müsaitliğimiz yok. En yakın boş zamanlar: {slots}. Randevu için bir numara yazabilirsiniz.',
    specific_time_available: '{day} {time} saati uygun. Onaylamak için EVET yazın.',
    specific_time_taken: '{day} {time} saati dolu. En yakın boş zamanlar: {slots}. Randevu için bir numara yazabilirsiniz.',
    appointment_lookup_found: 'Yaklaşan {service} randevunuz {when}.',
    appointment_lookup_none: 'Sizin için yaklaşan bir randevu bulamadım.',
    booking_confirmed: '{service} randevunuz {when} için alındı. Öncesinde hatırlatacağız.',
    booking_reminder_24h: 'Hatırlatma: Yarın {time} {service} randevunuz var. Onaylamak için EVET, değiştirmek için ERTELE, iptal için İPTAL yazın.',
    booking_reminder_2h: '2 saat sonra {time} {service} randevunuz var. Gelemeyecekseniz İPTAL yazın.',
    booking_cancelled: '{when} tarihindeki {service} randevunuz iptal edildi.',
    booking_rescheduled: '{service} randevunuz {when} olarak güncellendi.',
    fallback: 'Anlayamadım. Randevu alabilir, erteleyebilir veya iptal edebilirsiniz.',
    consent_request: 'WhatsApp üzerinden ara sıra kampanya mesajı göndermemize izin verir misiniz? EVET veya HAYIR yazın.',
    campaign_offer: 'Merhaba {name}! {offer}. Randevu için RANDEVU yazın.',
    payment_failed: '{business} için son ödemeniz başarısız oldu. Hizmet kesintisi olmaması için kartınızı güncelleyin: {url}',
    trial_ending: '{business} deneme süreniz {days} gün içinde bitiyor. Plan seçmek için: {url}',
  },
  es: {
    greeting: '¡Hola {name}! Puedo reservar, reprogramar o cancelar tu cita. ¿Qué necesitas?',
    ask_service: '¿Qué servicio te gustaría reservar?',
    ask_time: '¿Cuándo te viene bien? Puedes decir un día y hora o elegir: {slots}.',
    ask_time_on_day: 'Horarios libres el {day}: {slots}. Responde con un número para reservar.',
    no_slots_on_day: 'Estamos completos el {day}. Horarios libres más cercanos: {slots}. Responde con un número para reservar.',
    specific_time_available: 'El {day} a las {time} está disponible. Responde SÍ para confirmar.',
    specific_time_taken: 'El {day} a las {time} no está disponible. Horarios libres más cercanos: {slots}. Responde con un número para reservar.',
    appointment_lookup_found: 'Tu próxima cita de {service} es el {when}.',
    appointment_lookup_none: 'No encuentro una cita próxima para ti en este momento.',
    booking_confirmed: 'Tu cita de {service} está reservada para {when}. Te recordaremos antes.',
    booking_reminder_24h: 'Recordatorio: mañana a las {time} tienes {service}. Responde SÍ para confirmar, CAMBIAR para reprogramar, CANCELAR para cancelar.',
    booking_reminder_2h: 'Nos vemos en 2 horas para tu {service} a las {time}. Responde CANCELAR si no puedes.',
    booking_cancelled: 'Tu cita de {service} del {when} ha sido cancelada.',
    booking_rescheduled: 'Tu cita de {service} se movió al {when}.',
    fallback: 'No entendí. Puedes reservar, reprogramar o cancelar.',
    consent_request: '¿Podemos enviarte ofertas ocasionales por WhatsApp? Responde SÍ o NO.',
    campaign_offer: '¡Hola {name}! {offer}. Responde RESERVAR para tomar un horario.',
    payment_failed: 'Tu último pago a {business} falló. Actualiza tu tarjeta para no perder el servicio: {url}',
    trial_ending: 'Tu prueba de {business} termina en {days} días. Elige un plan: {url}',
  },
  de: {
    greeting: 'Hallo {name}! Ich kann Termine buchen, verschieben oder absagen. Was brauchst du?',
    ask_service: 'Welche Dienstleistung möchtest du buchen?',
    ask_time: 'Wann passt es dir? Nenn einen Tag und eine Uhrzeit oder wähle: {slots}.',
    ask_time_on_day: 'Freie Zeiten am {day}: {slots}. Antworte mit einer Nummer zum Buchen.',
    no_slots_on_day: 'Am {day} sind wir ausgebucht. Nächste freie Zeiten: {slots}. Antworte mit einer Nummer zum Buchen.',
    specific_time_available: '{day} um {time} ist frei. Antworte JA zum Bestätigen.',
    specific_time_taken: '{day} um {time} ist belegt. Nächste freie Zeiten: {slots}. Antworte mit einer Nummer zum Buchen.',
    appointment_lookup_found: 'Dein nächster {service}-Termin ist am {when}.',
    appointment_lookup_none: 'Ich finde gerade keinen bevorstehenden Termin für dich.',
    booking_confirmed: 'Dein Termin für {service} am {when} steht. Wir erinnern dich vorher.',
    booking_reminder_24h: 'Erinnerung: Morgen um {time} {service}. Antworte JA zum Bestätigen, VERSCHIEBEN oder ABSAGEN.',
    booking_reminder_2h: 'In 2 Stunden {service} um {time}. Antworte ABSAGEN, falls es nicht klappt.',
    booking_cancelled: 'Dein {service}-Termin am {when} wurde storniert.',
    booking_rescheduled: 'Dein {service}-Termin ist jetzt am {when}.',
    fallback: 'Ich habe das nicht verstanden. Buchen, verschieben oder absagen?',
    consent_request: 'Dürfen wir dir gelegentlich Angebote per WhatsApp senden? JA oder NEIN.',
    campaign_offer: 'Hallo {name}! {offer}. Antworte BUCHEN.',
    payment_failed: 'Deine letzte Zahlung an {business} ist fehlgeschlagen. Karte aktualisieren: {url}',
    trial_ending: 'Deine {business}-Testphase endet in {days} Tagen. Plan wählen: {url}',
  },
  fr: {
    greeting: 'Bonjour {name}! Je peux réserver, déplacer ou annuler votre rendez-vous. Que souhaitez-vous ?',
    ask_service: 'Quel service voulez-vous réserver ?',
    ask_time: 'Quand ça vous arrange ? Dites un jour et une heure ou choisissez : {slots}.',
    ask_time_on_day: 'Créneaux libres {day} : {slots}. Répondez avec un numéro pour réserver.',
    no_slots_on_day: 'Nous sommes complets {day}. Prochains créneaux libres : {slots}. Répondez avec un numéro pour réserver.',
    specific_time_available: '{day} à {time} est disponible. Répondez OUI pour confirmer.',
    specific_time_taken: '{day} à {time} n\'est pas disponible. Prochains créneaux libres : {slots}. Répondez avec un numéro pour réserver.',
    appointment_lookup_found: 'Votre prochain rendez-vous {service} est le {when}.',
    appointment_lookup_none: 'Je ne trouve pas de rendez-vous à venir pour vous.',
    booking_confirmed: 'Votre RDV {service} le {when} est réservé. Nous vous rappellerons.',
    booking_reminder_24h: 'Rappel : demain à {time} {service}. Répondez OUI, REPORTER ou ANNULER.',
    booking_reminder_2h: 'Dans 2 heures {service} à {time}. Répondez ANNULER si besoin.',
    booking_cancelled: 'Votre {service} du {when} a été annulé.',
    booking_rescheduled: 'Votre {service} est maintenant le {when}.',
    fallback: 'Je n\'ai pas compris. Réserver, reporter ou annuler ?',
    consent_request: 'Pouvons-nous vous envoyer des offres par WhatsApp ? OUI ou NON.',
    campaign_offer: 'Bonjour {name}! {offer}. Répondez RÉSERVER.',
    payment_failed: 'Votre dernier paiement à {business} a échoué. Mettre à jour votre carte : {url}',
    trial_ending: 'Votre essai {business} se termine dans {days} jours. Choisir un plan : {url}',
  },
  pt: {
    greeting: 'Olá {name}! Posso marcar, remarcar ou cancelar o agendamento. Como posso ajudar?',
    ask_service: 'Qual serviço deseja agendar?',
    ask_time: 'Quando é bom para você? Diga um dia e hora ou escolha: {slots}.',
    ask_time_on_day: 'Horários livres em {day}: {slots}. Responda com um número para agendar.',
    no_slots_on_day: 'Estamos lotados em {day}. Horários livres mais próximos: {slots}. Responda com um número para agendar.',
    specific_time_available: '{day} às {time} está disponível. Responda SIM para confirmar.',
    specific_time_taken: '{day} às {time} não está disponível. Horários livres mais próximos: {slots}. Responda com um número para agendar.',
    appointment_lookup_found: 'Seu próximo agendamento de {service} é em {when}.',
    appointment_lookup_none: 'Não encontrei um agendamento futuro para você agora.',
    booking_confirmed: 'Seu {service} está marcado para {when}. Avisaremos antes.',
    booking_reminder_24h: 'Lembrete: amanhã às {time} {service}. Responda SIM, REMARCAR ou CANCELAR.',
    booking_reminder_2h: 'Em 2 horas {service} às {time}. Responda CANCELAR se não puder.',
    booking_cancelled: 'Seu {service} de {when} foi cancelado.',
    booking_rescheduled: 'Seu {service} agora é em {when}.',
    fallback: 'Não entendi. Agendar, remarcar ou cancelar?',
    consent_request: 'Podemos enviar ofertas pelo WhatsApp? Responda SIM ou NÃO.',
    campaign_offer: 'Olá {name}! {offer}. Responda AGENDAR.',
    payment_failed: 'Seu pagamento em {business} falhou. Atualize seu cartão: {url}',
    trial_ending: 'Sua avaliação {business} termina em {days} dias. Escolha um plano: {url}',
  },
  ar: {
    greeting: 'مرحبًا {name}! يمكنني حجز موعدك أو تعديله أو إلغاؤه. ماذا تريد؟',
    ask_service: 'أي خدمة تود الحجز لها؟',
    ask_time: 'متى يناسبك؟ اذكر اليوم والوقت أو اختر: {slots}.',
    ask_time_on_day: 'المواعيد المتاحة يوم {day}: {slots}. رد برقم للحجز.',
    no_slots_on_day: 'يوم {day} مكتمل. أقرب المواعيد المتاحة: {slots}. رد برقم للحجز.',
    specific_time_available: '{day} الساعة {time} متاح. رد نعم للتأكيد.',
    specific_time_taken: '{day} الساعة {time} غير متاح. أقرب المواعيد: {slots}. رد برقم للحجز.',
    appointment_lookup_found: 'موعدك القادم لـ {service} هو {when}.',
    appointment_lookup_none: 'لا أجد موعدًا قادمًا لك الآن.',
    booking_confirmed: 'تم حجز {service} يوم {when}. سنذكّرك قبل الموعد.',
    booking_reminder_24h: 'تذكير: غدًا الساعة {time} {service}. رد نعم للتأكيد، تغيير لإعادة الجدولة، إلغاء للإلغاء.',
    booking_reminder_2h: 'بعد ساعتين {service} الساعة {time}. رد إلغاء إذا لم تتمكن.',
    booking_cancelled: 'تم إلغاء {service} في {when}.',
    booking_rescheduled: 'أصبح موعد {service} في {when}.',
    fallback: 'لم أفهم. حجز، تعديل أم إلغاء؟',
    consent_request: 'هل يمكننا إرسال عروض عبر واتساب؟ رد نعم أو لا.',
    campaign_offer: 'مرحبا {name}! {offer}. رد حجز.',
    payment_failed: 'فشل آخر دفع لـ {business}. حدّث بطاقتك: {url}',
    trial_ending: 'تنتهي تجربة {business} خلال {days} يومًا. اختر باقة: {url}',
  },
  it: {
    greeting: 'Ciao {name}! Posso prenotare, spostare o annullare il tuo appuntamento. Cosa serve?',
    ask_service: 'Quale servizio vuoi prenotare?',
    ask_time: 'Quando ti va bene? Dimmi un giorno e un orario o scegli: {slots}.',
    ask_time_on_day: 'Orari liberi il {day}: {slots}. Rispondi con un numero per prenotare.',
    no_slots_on_day: 'Siamo al completo il {day}. Orari liberi più vicini: {slots}. Rispondi con un numero per prenotare.',
    specific_time_available: 'Il {day} alle {time} è libero. Rispondi SÌ per confermare.',
    specific_time_taken: 'Il {day} alle {time} è occupato. Orari liberi più vicini: {slots}. Rispondi con un numero per prenotare.',
    appointment_lookup_found: 'Il tuo prossimo appuntamento per {service} è il {when}.',
    appointment_lookup_none: 'Non trovo un appuntamento imminente per te in questo momento.',
    booking_confirmed: 'Il tuo {service} è prenotato per il {when}. Ti ricorderemo prima.',
    booking_reminder_24h: 'Promemoria: domani alle {time} {service}. Rispondi SÌ, SPOSTA o ANNULLA.',
    booking_reminder_2h: 'Tra 2 ore {service} alle {time}. Rispondi ANNULLA se non puoi.',
    booking_cancelled: 'Il tuo {service} del {when} è stato annullato.',
    booking_rescheduled: 'Il tuo {service} è ora il {when}.',
    fallback: 'Non ho capito. Prenotare, spostare o annullare?',
    consent_request: 'Possiamo inviarti offerte via WhatsApp? Rispondi SÌ o NO.',
    campaign_offer: 'Ciao {name}! {offer}. Rispondi PRENOTA.',
    payment_failed: 'L\'ultimo pagamento a {business} è fallito. Aggiorna la carta: {url}',
    trial_ending: 'La prova {business} scade tra {days} giorni. Scegli un piano: {url}',
  },
  ru: {
    greeting: 'Привет, {name}! Могу записать, перенести или отменить встречу. Что нужно?',
    ask_service: 'Какую услугу записать?',
    ask_time: 'Когда удобно? Назовите день и время или выберите: {slots}.',
    ask_time_on_day: 'Свободное время {day}: {slots}. Ответьте номером, чтобы записаться.',
    no_slots_on_day: '{day} всё занято. Ближайшее свободное время: {slots}. Ответьте номером, чтобы записаться.',
    specific_time_available: '{day} в {time} свободно. Ответьте ДА для подтверждения.',
    specific_time_taken: '{day} в {time} занято. Ближайшее свободное: {slots}. Ответьте номером, чтобы записаться.',
    appointment_lookup_found: 'Ваша ближайшая запись на {service}: {when}.',
    appointment_lookup_none: 'Сейчас не вижу для вас ближайшей записи.',
    booking_confirmed: '{service} записан на {when}. Напомним заранее.',
    booking_reminder_24h: 'Напоминание: завтра в {time} {service}. Ответьте ДА, ПЕРЕНЕСТИ или ОТМЕНА.',
    booking_reminder_2h: 'Через 2 часа {service} в {time}. Ответьте ОТМЕНА, если не сможете.',
    booking_cancelled: 'Ваша запись {service} на {when} отменена.',
    booking_rescheduled: 'Ваш {service} теперь на {when}.',
    fallback: 'Не понял. Записать, перенести или отменить?',
    consent_request: 'Можем присылать предложения в WhatsApp? Ответьте ДА или НЕТ.',
    campaign_offer: 'Привет, {name}! {offer}. Ответьте ЗАПИСЬ.',
    payment_failed: 'Последний платеж {business} не прошел. Обновите карту: {url}',
    trial_ending: 'Пробный период {business} заканчивается через {days} дн. Выберите план: {url}',
  },
}

export function t(
  locale: LocaleCode | string | null | undefined,
  key: MessageKey,
  vars: Record<string, string | number> = {},
): string {
  const code = (locale && locale in CATALOGS ? locale : 'en') as LocaleCode
  const template = CATALOGS[code][key] ?? CATALOGS.en[key]
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
  )
}

export function supportedLocales(): LocaleCode[] {
  return Object.keys(CATALOGS) as LocaleCode[]
}

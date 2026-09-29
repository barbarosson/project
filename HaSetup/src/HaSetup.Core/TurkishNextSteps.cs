namespace HaSetup.Core;

/// <summary>
/// Turkish onboarding copy shown after HA is reachable.
/// </summary>
public static class TurkishNextSteps
{
    public const string Title = "Sonraki adımlar (Home Assistant)";

    public static string Body { get; } =
        """
        1) Tarayıcıda http://localhost:8123 adresinde yönetim hesabı oluşturun.
        2) Konum / dil / birim ayarlarını tamamlayın (Türkiye / İstanbul önerilir).
        3) İlk entegrasyonları ekleyin: Ayarlar → Cihazlar ve hizmetler → Entegrasyon ekle
           (ör. Google Cast, Shelly, Tuya — hesap gerekir).
        4) Telefonunuzdan aynı Wi‑Fi’de http://<PC-IP>:8123 ile erişebilirsiniz
           (Windows Güvenlik Duvarı uyarısı çıkarsa “İzin ver” deyin).
        5) Zigbee USB stick, add-on mağazası ve bulut tüneli bu MVP kapsamında yoktur.

        Yapılandırma kalıcıdır: Docker volume “smart-home-ha-config”.
        """;
}

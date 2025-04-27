// Bu dosya, kullanıcı var olmayan bir URL'e erişmeye çalıştığında gösterilir
// + işareti Expo Router'da özel sayfalar için kullanılır

// Gerekli kütüphaneleri içeri aktarıyoruz
import { Link, Stack } from 'expo-router'; // Expo Router navigasyon özellikleri
import { StyleSheet } from 'react-native'; // Stil tanımlamak için

// Özel tema bileşenlerini içeri aktarıyoruz
import { ThemedText } from '@/components/ThemedText'; // Temaya uygun metin bileşeni
import { ThemedView } from '@/components/ThemedView'; // Temaya uygun görünüm bileşeni

// NotFoundScreen bileşeni, sayfa bulunamadığında gösterilir
export default function NotFoundScreen() {
  return (
    <>
      {/* Stack navigator için ekran başlığını ayarlıyoruz*/}
      <Stack.Screen options={{ title: 'Oops!' }} />
      
      {/* Ana container - temalı görünüm kullanıyoruz*/}
      <ThemedView style={styles.container}>
        {/* Hata mesajı */}
        <ThemedText type="title">This screen doesn't exist.</ThemedText>
        
        {/* Ana sayfaya dönmek için bağlantı */}
        <Link href="/" style={styles.link}>
          {/* Bağlantı metni */}
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

// Bileşenlerin stillerini tanımlıyoruz
const styles = StyleSheet.create({
  container: {
    flex: 1, // Tüm kullanılabilir alanı kapla
    alignItems: 'center', // İçeriği yatay eksende ortala
    justifyContent: 'center', // İçeriği dikey eksende ortala
    padding: 20, // Her taraftan 20 birim iç boşluk
  },
  link: {
    marginTop: 15, // Üstten 15 birim dış boşluk
    paddingVertical: 15, // Dikeyde 15 birim iç boşluk (tıklama alanını genişletir)
  },
});

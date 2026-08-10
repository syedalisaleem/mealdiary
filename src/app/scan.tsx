import { File, Directory, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

import { Btn, HeaderBar, Screen } from '@/components/ui';
import { analyzeFoodPhoto } from '@/lib/ai';
import { mealTypeForTime, todayKey } from '@/lib/dates';
import { getApiKey, loadAIConfig } from '@/lib/storage';
import { Entry, FoodEstimate, MealType } from '@/lib/types';
import { useTheme } from '@/theme';

interface Photo {
  uri: string;
  base64: string;
  mime: string;
}

export default function ScanScreen() {
  const { colors } = useTheme();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [status, setStatus] = useState<'idle' | 'picking' | 'analyzing'>('idle');
  const [error, setError] = useState<string | null>(null);

  const pick = async (camera: boolean) => {
    setStatus('picking');
    setError(null);
    try {
      if (camera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setError('Camera permission denied. You can still pick a photo from your library.');
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality: 0.7,
        exif: false,
      };
      const result = camera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const src = new File(asset.uri);
      const base64 = await src.base64();
      if (!base64) throw new Error('Could not read the image.');
      const mime = src.extension?.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';
      setPhoto({ uri: asset.uri, base64, mime });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the photo.');
    } finally {
      setStatus('idle');
    }
  };

  const persistPhoto = async (uri: string, id: string): Promise<string> => {
    try {
      const dir = new Directory(Paths.document, 'mealphotos');
      if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
      const ext = new File(uri).extension || '.jpg';
      const dest = new File(dir, `${id}${ext}`);
      if (!dest.exists) await new File(uri).copy(dest);
      return dest.uri;
    } catch {
      return uri;
    }
  };

  const toEditor = (data: Partial<Entry>) => {
    const mealType = (data.mealType as MealType) ?? mealTypeForTime(new Date());
    router.replace({
      pathname: '/entry-edit',
      params: {
        mode: 'new',
        dateKey: todayKey(),
        mealType,
        data: JSON.stringify({
          name: data.name ?? '',
          serving: data.serving ?? '',
          calories: data.calories ?? 0,
          protein: data.protein ?? 0,
          carbs: data.carbs ?? 0,
          fat: data.fat ?? 0,
          source: data.source ?? 'manual',
          photoUri: data.photoUri ?? '',
        }),
      },
    });
  };

  const analyze = async () => {
    if (!photo) return;
    setStatus('analyzing');
    setError(null);
    try {
      const apiKey = await getApiKey();
      if (!apiKey.trim()) {
        setStatus('idle');
        Alert.alert('No API key yet', 'Add your AI provider key in Settings to enable photo analysis. You can still log this meal manually.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log manually', onPress: () => toEditor({}) },
          { text: 'Open Settings', onPress: () => router.replace('/(tabs)/settings') },
        ]);
        return;
      }
      const cfg = await loadAIConfig();
      const estimate: FoodEstimate = await analyzeFoodPhoto(photo.base64, photo.mime, cfg, apiKey);
      const id = `p${Date.now().toString(36)}`;
      const photoUri = await persistPhoto(photo.uri, id);
      toEditor({ ...estimate, photoUri, source: 'ai' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === 'NO_KEY') {
        setError('No API key configured. Add one in Settings to use photo analysis.');
      } else if (msg === 'NOT_FOOD') {
        setError('The image does not look like food. Try another photo or log manually.');
      } else {
        setError(msg);
      }
      setStatus('idle');
    }
  };

  const manual = async () => {
    let photoUri = photo?.uri ?? '';
    if (photo) {
      photoUri = await persistPhoto(photo.uri, `p${Date.now().toString(36)}`);
    }
    toEditor({ photoUri });
  };

  return (
    <View style={{ flex: 1 }}>
      <HeaderBar title="Scan a meal" onClose={() => router.back()} />
      <Screen scroll={false}>
        {!photo ? (
          <View style={styles.hero}>
            <Text style={styles.heroIcon}>📷</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Photo → calories</Text>
            <Text style={[styles.heroSub, { color: colors.sub }]}>
              Take a photo of your meal for a quick AI estimate of calories, protein, carbs and fat. You can fix
              anything afterwards. The photo is only sent to your configured AI provider.
            </Text>
            <Btn label="Take a photo" onPress={() => pick(true)} loading={status === 'picking'} style={{ alignSelf: 'stretch' }} />
            <Btn label="Choose from library" variant="secondary" onPress={() => pick(false)} loading={status === 'picking'} style={{ alignSelf: 'stretch' }} />
            {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
          </View>
        ) : (
          <View style={styles.previewWrap}>
            <Image source={{ uri: photo.uri }} style={styles.preview} />
            <Text style={[styles.previewHint, { color: colors.faint }]}>Review the photo, then analyze or log manually.</Text>
            {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
            <Btn label={status === 'analyzing' ? 'Analyzing…' : '🔍 Analyze with AI'} onPress={analyze} loading={status === 'analyzing'} />
            {status === 'analyzing' && (
              <Text style={[styles.analyzingNote, { color: colors.sub }]}>
                Sending the photo to the AI provider. This can take up to a minute…
              </Text>
            )}
            <Btn label="✏️ Enter manually" variant="secondary" onPress={manual} />
            <Btn label="Retake / choose another" variant="ghost" onPress={() => { setPhoto(null); setError(null); }} />
          </View>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 8 },
  heroIcon: { fontSize: 56 },
  heroTitle: { fontSize: 24, fontWeight: '800' },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 8 },
  previewWrap: { flex: 1, gap: 12 },
  preview: { width: '100%', aspectRatio: 1, borderRadius: 16 },
  previewHint: { fontSize: 12.5, textAlign: 'center' },
  error: { fontSize: 13.5, fontWeight: '600', textAlign: 'center' },
  analyzingNote: { fontSize: 12.5, textAlign: 'center' },
});

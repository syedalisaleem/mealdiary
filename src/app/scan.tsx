import { File, Directory, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

import { Btn, HeaderBar, Icon, Screen } from '@/components/ui';
import { showRewardedAd } from '@/lib/ads';
import { analyzeFoodPhoto } from '@/lib/ai';
import { consumeScanCredit, earnAdCredit, getRemainingScans } from '@/lib/credits';
import { TIER_INFO, getCurrentTier } from '@/lib/subscriptions';
import { mealTypeForTime, todayKey } from '@/lib/dates';
import { Entry, FoodEstimate, MealType } from '@/lib/types';
import { font, radius, space, useTheme } from '@/theme';

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
  const [credits, setCredits] = useState<number | null>(null);
  const [tierLabel, setTierLabel] = useState<string | null>(null);

  useEffect(() => {
    getRemainingScans().then(setCredits);
    getCurrentTier().then((t) => setTierLabel(TIER_INFO[t].label));
  }, []);

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
      // Bound memory: full-res camera photos (30-50MP) can OOM the app when decoded
      // for the preview or base64-encoded, which restarts the process to the home
      // tab. Resize to a max 1280px longest edge before doing anything else.
      const resized = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      const src = new File(resized.uri);
      const base64 = await src.base64();
      if (!base64) throw new Error('Could not read the image.');
      setPhoto({ uri: resized.uri, base64, mime: 'image/jpeg' });
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
      if (!(await consumeScanCredit())) {
        const watch = await new Promise<boolean>((res) => {
          Alert.alert('Out of free scans', 'Watch a short ad to unlock one extra AI scan today, or log this meal manually.', [
            { text: 'Log manually', style: 'cancel', onPress: () => res(false) },
            { text: 'Watch ad', onPress: () => res(true) },
          ]);
        });
        if (!watch) {
          setError('No scans left today. Log this meal manually below, or upgrade in Settings.');
          return;
        }
        const ok = await showRewardedAd();
        if (!ok) {
          setError(
            'The ad could not be shown (no ad available for this account yet). Log manually below, or upgrade in Settings.'
          );
          return;
        }
        const earned = await earnAdCredit();
        if (!earned) {
          setError('You have reached the daily ad limit. Upgrade in Settings for more scans.');
          return;
        }
        await consumeScanCredit();
        setCredits(await getRemainingScans());
      }
      const estimate: FoodEstimate = await analyzeFoodPhoto(photo.base64, photo.mime);
      const id = `p${Date.now().toString(36)}`;
      const photoUri = await persistPhoto(photo.uri, id);
      toEditor({ ...estimate, photoUri, source: 'ai' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === 'NOT_FOOD') {
        setError('The image does not look like food. Try another photo or log manually.');
      } else if (msg.includes('failed to fetch') || msg.includes('Network request failed') || msg.includes('abort')) {
        setError('Could not reach the AI service. Check your connection and try again.');
      } else {
        setError(msg);
      }
    } finally {
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
            <View style={[styles.heroIconWrap, { backgroundColor: colors.accentSoft }]}>
              <Icon name="camera-outline" size={44} color={colors.accent} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Photo → calories</Text>
            <Text style={[styles.heroSub, { color: colors.sub }]}>
              Take a photo of your meal for a quick AI estimate of calories, protein, carbs and fat. You can fix
              anything afterwards. The photo is sent to Google Gemini for analysis.
            </Text>
            <Btn label="Take a photo" icon="camera" onPress={() => pick(true)} loading={status === 'picking'} style={{ alignSelf: 'stretch' }} />
            <Btn label="Choose from library" icon="images-outline" variant="secondary" onPress={() => pick(false)} loading={status === 'picking'} style={{ alignSelf: 'stretch' }} />
            {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
          </View>
        ) : (
          <View style={styles.previewWrap}>
            <Image source={{ uri: photo.uri }} style={styles.preview} />
            <Text style={[styles.previewHint, { color: colors.faint }]}>Review the photo, then analyze or log manually.</Text>
            {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
            <Btn
              label={status === 'analyzing' ? 'Analyzing…' : 'Analyze with AI'}
              icon="sparkles"
              onPress={analyze}
              loading={status === 'analyzing'}
            />
            {tierLabel && (
              <Text style={[styles.analyzingNote, { color: colors.faint }]}>
                {credits === null
                  ? `${tierLabel} plan — unlimited AI scans`
                  : `${credits} scan${credits === 1 ? '' : 's'} left today — watch a short ad for another`}
              </Text>
            )}
            {status === 'analyzing' && (
              <Text style={[styles.analyzingNote, { color: colors.sub }]}>
                Sending the photo to Gemini. This can take up to a minute…
              </Text>
            )}
            <Btn label="Enter manually" icon="create-outline" variant="secondary" onPress={manual} />
            <Btn label="Retake / choose another" icon="refresh" variant="ghost" onPress={() => { setPhoto(null); setError(null); }} />
          </View>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: space.sm },
  heroIconWrap: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroTitle: { fontSize: font.h2, fontWeight: '800', letterSpacing: -0.4 },
  heroSub: { fontSize: font.body, textAlign: 'center', lineHeight: 21, marginBottom: space.sm, maxWidth: 320 },
  previewWrap: { flex: 1, gap: space.md },
  preview: { width: '100%', aspectRatio: 1, borderRadius: radius.xl },
  previewHint: { fontSize: 12.5, textAlign: 'center' },
  error: { fontSize: 13.5, fontWeight: '600', textAlign: 'center' },
  analyzingNote: { fontSize: 12.5, textAlign: 'center' },
});
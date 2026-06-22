// Guided two-shot capture: face (front cam) then body (rear cam). Silhouette
// overlay guides framing to prevent bad photos at source -> fewer /scan retakes.
// Per shot: capture -> preview -> retake/confirm. Both done -> onComplete.
import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';

type Step = 'face' | 'body';
type Props = { onComplete: (faceUri: string, bodyUri: string) => void; onCancel: () => void };

const GUIDE: Record<Step, { facing: CameraType; prompt: string; shape: 'oval' | 'frame' }> = {
  face: { facing: 'front', prompt: 'Center your face in the oval', shape: 'oval' },
  body: { facing: 'back', prompt: 'Fit your full body in the frame', shape: 'frame' },
};

export default function CaptureFlow({ onComplete, onCancel }: Props) {
  const [perm, requestPerm] = useCameraPermissions();
  const [step, setStep] = useState<Step>('face');
  const [faceUri, setFaceUri] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const cam = useRef<CameraView>(null);

  if (!perm) return <View style={styles.c} />;
  if (!perm.granted) {
    return (
      <View style={[styles.c, styles.center]}>
        <Text style={styles.prompt}>Camera access is needed to scan you.</Text>
        <Pressable style={styles.btn} onPress={requestPerm}><Text style={styles.btnT}>Allow camera</Text></Pressable>
        <Pressable onPress={onCancel}><Text style={styles.link}>Cancel</Text></Pressable>
      </View>
    );
  }

  const g = GUIDE[step];

  async function capture() {
    const shot = await cam.current?.takePictureAsync({ quality: 0.8 });
    if (shot?.uri) setPreview(shot.uri);
  }

  function confirm() {
    if (!preview) return;
    if (step === 'face') { setFaceUri(preview); setPreview(null); setStep('body'); }
    else { onComplete(faceUri!, preview); }
  }

  // Preview: retake or confirm the just-captured shot.
  if (preview) {
    return (
      <View style={styles.c}>
        <Image source={{ uri: preview }} style={styles.fill} resizeMode="cover" />
        <View style={styles.controls}>
          <Pressable style={styles.btnGhost} onPress={() => setPreview(null)}><Text style={styles.btnGhostT}>Retake</Text></Pressable>
          <Pressable style={styles.btn} onPress={confirm}><Text style={styles.btnT}>{step === 'face' ? 'Next' : 'Done'}</Text></Pressable>
        </View>
      </View>
    );
  }

  // Live camera with overlay guide.
  return (
    <View style={styles.c}>
      <CameraView ref={cam} style={styles.fill} facing={g.facing} />
      <View style={styles.overlay} pointerEvents="none">
        <View style={g.shape === 'oval' ? styles.oval : styles.frame} />
        <Text style={styles.prompt}>{g.prompt}</Text>
      </View>
      <View style={styles.controls}>
        <Pressable onPress={onCancel}><Text style={styles.link}>Cancel</Text></Pressable>
        <Pressable style={styles.shutter} onPress={capture} />
        <Text style={styles.stepDot}>{step === 'face' ? '1 / 2' : '2 / 2'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  fill: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 24 },
  oval: { width: 220, height: 290, borderRadius: 145, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' },
  frame: { width: 240, height: 440, borderRadius: 20, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' },
  prompt: { color: '#fff', fontSize: 16, fontWeight: '600', textShadowColor: '#000', textShadowRadius: 4 },
  controls: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  shutter: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)' },
  stepDot: { color: '#fff', fontWeight: '700' },
  btn: { backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 36, borderRadius: 28 },
  btnT: { color: '#111', fontWeight: '700' },
  btnGhost: { borderWidth: 1, borderColor: '#fff', paddingVertical: 14, paddingHorizontal: 36, borderRadius: 28 },
  btnGhostT: { color: '#fff', fontWeight: '700' },
  link: { color: '#fff', fontWeight: '600' },
});

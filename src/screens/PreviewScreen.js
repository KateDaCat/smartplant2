// src/screens/PreviewScreen.js
import React, { useState } from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import ScannerOverlay from '../screens/components/ScannerOverlay'; 

// const API_BASE = 'http://localhost:3000';
// const API_BASE = 'http://10.0.2.2:3000';
const API_BASE = 'http://192.168.0.112:3000';
const LOW_CONFIDENCE_THRESHOLD = 60;

export default function PreviewScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const { uri, source, exif } = route.params ?? {};
  const [loading, setLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [askedLocation, setAskedLocation] = useState(false);

  if (!uri) {
    return (
      <SafeAreaView style={s.center}>
        <Text>No image to preview.</Text>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.btn}>
          <Text style={s.btnTxt}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const onDone = async () => {
    setLoading(true);
    try {
      let lat = null;
      let lon = null;

      // Try to get device GPS if user allows
      try {
        if (!askedLocation) {
          setAskedLocation(true);
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
          setGpsCoords({ latitude: lat, longitude: lon });
        } else {
          console.log('[location] permission denied, falling back');
        }
      } catch (err) {
        console.log('[location] error getting coordinates', err);
      }

      // Fallback to EXIF GPS if device GPS is not available
      if ((lat == null || lon == null) && exif?.GPSLatitude && exif?.GPSLongitude) {
        const exifLat = Number(exif.GPSLatitude);
        const exifLon = Number(exif.GPSLongitude);
        if (Number.isFinite(exifLat) && Number.isFinite(exifLon)) {
          lat = exifLat;
          lon = exifLon;
        }
      }

      console.log('[preview] final coords before sending:', lat, lon);

      // Build form data
      const form = new FormData();
      form.append('image', {
        uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      });

      // send coordinates only if we actually have them
      if (
        lat != null &&
        lon != null &&
        Number.isFinite(lat) &&
        Number.isFinite(lon)
      ) {
        form.append('location_latitude', String(lat));
        form.append('location_longitude', String(lon));
      }

      if (exif?.DateTime) {
        form.append('notes', `Captured: ${exif.DateTime}`);
      }

      // temp hardcoded user for testing
      form.append('user_id', '1');
      
      console.log('[scan] posting to', `${API_BASE}/scan`);
      const res = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Prediction failed');
      }

      setLoading(false);

      nav.navigate('Result', {
        photo: { uri },
        result: data,
      });
    } catch (e) {
      console.log('[scan] error', e);
      Alert.alert('Scan failed', 'Could not analyze the photo. Please try again.');
      setLoading(false);
    }
  };

  return (
    // SafeAreaView keeps header clear of the notch/camera
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      {/* background image */}
      <Image source={{ uri }} style={s.img} resizeMode="contain" />

      {/* overlay layer (header + meta) */}
      <View style={s.overlay}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.topBtn}>
            <Text style={s.topTxt}>Back</Text>
          </TouchableOpacity>

        <Text style={s.topTitle}>Preview</Text>

          <TouchableOpacity onPress={onDone} style={[s.topBtn, s.doneBtn]}>
            <Text style={s.doneTxt}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={s.meta}>
          <Text style={s.metaTxt}>Source: {source || 'unknown'}</Text>
          {gpsCoords && (
            <Text style={s.metaTxt}>
              GPS: {gpsCoords.latitude.toFixed(5)}, {gpsCoords.longitude.toFixed(5)}
            </Text>
          )}
          {!gpsCoords && exif?.GPSLatitude && exif?.GPSLongitude && (
            <Text style={s.metaTxt}>
              EXIF GPS: {exif.GPSLatitude} , {exif.GPSLongitude}
            </Text>
          )}
        </View>
      </View>

      {loading && <ScannerOverlay label="Scanning plant…" />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },

  // image behind everything
  img: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },

  // header & footer overlay
  overlay: { flex: 1, justifyContent: 'space-between' },

  // header bar (no manual marginTop now; SafeAreaView handles it)
  topBar: {
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBtn: { padding: 8 },
  topTxt: { color: '#9ad3a5', fontWeight: '700' },
  topTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  doneBtn: { backgroundColor: '#6DAF7A', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  doneTxt: { color: '#fff', fontWeight: '800' },

  meta: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 12 },
  metaTxt: { color: '#fff' },

  btn: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#6DAF7A', borderRadius: 8 },
  btnTxt: { color: '#fff', fontWeight: '700' },
});

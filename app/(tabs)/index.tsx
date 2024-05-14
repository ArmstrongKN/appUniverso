import { useEffect, useState } from 'react';
import { Image, StyleSheet, Platform, FlatList, TouchableOpacity } from 'react-native';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage, fire } from "../../firebaseConfig";
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import * as ImagePicker from "expo-image-picker";

export default function HomeScreen() {

  const [img, setImg] = useState("");
  const [file, setFile] = useState("");

  useEffect(() => {
      const unsubscribe = onSnapshot(collection(fire, "universo"), (snapshot) => {
          snapshot.docChanges().forEach((change) => {
              if (change.type === "added") {
                  setFile((prevFiles) => [...prevFiles, change.doc.data()]);
              }
          });
      });
      return () => unsubscribe();
  }, []);

  async function uploadImage(uri, fileType) {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, "");
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
          "state_changed",
          () => {
              getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
                  await saveRecord(fileType, downloadURL, new Date().toISOString());
                  setImg("");
              });
          }
      )
  }

    async function saveRecord(fileType, url, createdAt) {
        try {
            const docRef = await addDoc(collection, (fire, "universo"), {
                fileType,
                url,
                createdAt,
            })
        } catch (e) {
            console.log(e);
        }
    }

  async function pickImage() {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImg(result.assets[0].uri);
      await uploadImage(result.assets[0].uri, "image");
    }
  };

  return (
    
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title"> Minhas Fotos Lindas!</ThemedText>
        <HelloWave />

        <FlatList
        data={file}
        keyExtractor={(item) => item.url}
        renderItem={({ item }) => {
          if (item.fileType === "img") {
            return (
              <Image
                source={{ uri: item.url }}
                style={styles.fotos}
              />
            )
          }
        }}
        numColumns={2}
      />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>

          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({ ios: 'cmd + d', android: 'cmd + m' })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>
          Tap the Explore tab to learn more about what's included in this starter app.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          When you're ready, run{' '}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
      <TouchableOpacity onPress={pickImage} style={styles.imgpick}>
        <ThemedText> Imagens </ThemedText>
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  fotos:{
      width: 200,
      height: 200
  },
  imgpick:{
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20
  }
});

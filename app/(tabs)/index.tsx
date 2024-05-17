import { useEffect, useState } from 'react';
import { Image, StyleSheet, Platform, FlatList, TouchableOpacity  } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage, fire } from "../../firebaseConfig";
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import * as ImagePicker from "expo-image-picker";

export default function HomeScreen() {

  const [image, setImage] = useState([]);
    const [files, setFiles] = useState([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(fire, "files"), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    setFiles((prevFiles) => [...prevFiles, change.doc.data()]);
                }
            });
        });

        return () => unsubscribe();
    }, []);

    async function uploadImage(uri, fileType) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, new Date().toISOString());
        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on(
            "state_changed",
            null,
            (error) => {
                console.error(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                await saveRecord(fileType, downloadURL, new Date().toISOString());
                setImage("");
            }
        );
    }

    async function saveRecord(fileType, url, createdAt) {
        try {
            await addDoc(collection(fire, "files"), {
                fileType,
                url,
                createdAt,
            });
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
            const { uri } = result.assets[0];
            setImage(uri);
            await uploadImage(uri, "image");
        }
    }

    return (

      <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/retratos/glx.png')}
          style={styles.reactLogo}
        />
      }>

        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 8, height: '100%', width: '100%' }}>

        <ThemedText type="title"> Bem-Vindo </ThemedText>
                <ThemedText type="defaultSemiBold" style={{ textAlign: 'center' }}>
                    Arquivos Enviados
                </ThemedText>
                <FlatList
                    data={files}
                    keyExtractor={(item) => item.url}
                    renderItem={({ item }) => {
                        if (item.fileType === "image") {
                            return (
                                <Image
                                    source={{ uri: item.url }}
                                    style={{ width: 150, height: 150, borderRadius: 20, margin: 5 }}
                                />
                            );
                        }
                        return null;
                    }}
                    numColumns={1}
                />
                <TouchableOpacity
                    onPress={pickImage}
                    style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 20, padding: 50, backgroundColor: 'lightblue', marginTop: 10 }}
                >
                    <ThemedText>Selecionar Imagens</ThemedText>
                </TouchableOpacity>
        </ThemedView>

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
    height: 250,
    width: 415,
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

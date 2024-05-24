import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { fire, storage } from '../../firebaseConfig'; // Certifique-se de importar sua configuração do Firebase
import ParallaxScrollView from '@/components/ParallaxScrollView';

export default function HomeScreen() {
    const [image, setImage] = useState("");
    const [files, setFiles] = useState([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(fire, "universo"), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    setFiles((prevFiles) => [...prevFiles, { id: change.doc.id, ...change.doc.data() }]);
                }
                if (change.type === "modified") {
                    setFiles((prevFiles) =>
                        prevFiles.map((file) =>
                            file.id === change.doc.id ? { id: change.doc.id, ...change.doc.data() } : file
                        )
                    );
                }
                if (change.type === "removed") {
                    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== change.doc.id));
                }
            });
        });
        return () => unsubscribe();
    }, []);

    async function uploadImage(uri, fileType, id = null) {
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
                if (id) {
                    await updateRecord(fileType, downloadURL, id);
                } else {
                    await saveRecord(fileType, downloadURL, new Date().toISOString());
                }
                setImage("");
            }
        );
    }

    async function saveRecord(fileType, url, createdAt) {
        try {
            await addDoc(collection(fire, "universo"), {
                fileType,
                url,
                createdAt,
            });
        } catch (e) {
            console.log(e);
        }
    }

    async function updateRecord(fileType, url, id) {
        try {
            await updateDoc(doc(fire, "universo", id), {
                fileType,
                url,
                updatedAt: new Date().toISOString(),
            });
        } catch (e) {
            console.log(e);
        }
    }

    async function deleteRecord(id, url) {
        try {
            await deleteDoc(doc(fire, "universo", id));
            const storageRef = ref(storage, url);
            await deleteObject(storageRef);
        } catch (e) {
            console.log(e);
        }
    }

    async function pickImage(updateId = null) {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        console.log(result);
        if (!result.canceled) {
            setImage(result.assets[0].uri);
            await uploadImage(result.assets[0].uri, "img", updateId);
        }
    }

    function confirmDelete(id, url) {
        Alert.alert(
            "Confirmação",
            "Tem certeza que deseja deletar esta imagem?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Deletar", onPress: () => deleteRecord(id, url) }
            ]
        );
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

            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 8, height: '100%', width: '100%' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Bem-Vindo</Text>
                <Text style={{ textAlign: 'center', fontSize: 16 }}>Arquivos Enviados</Text>
            </View>
            <FlatList
                data={files}
                keyExtractor={(item) => item.url}
                renderItem={({ item }) => {
                    if (item.fileType === "img") {
                        return (
                            <View>
                                <Image
                                    source={{ uri: item.url }}
                                    style={{ width: 150, height: 150, borderRadius: 20, margin: 5 }}
                                />
                                <TouchableOpacity onPress={() => pickImage(item.id)}>
                                    <Text>Atualizar Imagem</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => confirmDelete(item.id, item.url)}>
                                    <Text>Deletar Imagem</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    }
                }}
                numColumns={2}
            />
            <TouchableOpacity
                onPress={pickImage}
                style={{ justifyContent: 'center', alignItems: 'center', borderRadius: 20, padding: 50, backgroundColor: 'lightblue', marginTop: 10 }}
            >
                <Text>Subir Imagens</Text>
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
        height: 250,
        width: 415,
        bottom: 0,
        left: 0,
        position: 'absolute',
    },
    fotos: {
        width: 200,
        height: 200
    },
    imgpick: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 20
    }
});
import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Image, Alert, StyleSheet, GestureResponderEvent } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { fire, storage } from '../../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface File {
    id: string;
    fileType: string;
    url: string;
    createdAt: string;
    updatedAt?: string;
}

export default function HomeScreen() {
    const [image, setImage] = useState<string>("");
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(fire, "universo"), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    setFiles((prevFiles) => [...prevFiles, { id: change.doc.id, ...change.doc.data() } as File]);
                }
            });
        });
        return () => unsubscribe();
    }, []);

    async function uploadImage(uri: string, fileType: string, id: string | null = null): Promise<void> {
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

    async function saveRecord(fileType: string, url: string, createdAt: string): Promise<void> {
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

    async function updateRecord(fileType: string, url: string, id: string): Promise<void> {
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

    async function pickImage(updateId: string | null = null): Promise<void> {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        console.log(result);
        if (!result.canceled && result.assets) {
            setImage(result.assets[0].uri);
            await uploadImage(result.assets[0].uri, "img", updateId);
        }
    }

    const handlePickImage = (event: GestureResponderEvent) => {
        pickImage();
    };

    return (

        <SafeAreaView>

            <ThemedView>
                <ThemedText style={styles.texto}>Bem-Vindo</ThemedText>
                <ThemedText style={styles.texto}>Arquivos Enviados</ThemedText>
            </ThemedView>

            <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage}>
                <ThemedText style={styles.texto}>Subir Imagens</ThemedText>
            </TouchableOpacity>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    texto: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        height: '100%',
        width: '100%'
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold'
    },
    subHeaderText: {
        textAlign: 'center',
        fontSize: 16
    },
    itemContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        margin: 5
    },
    image: {
        width: 150,
        height: 150,
        borderRadius: 20
    },
    uploadButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        padding: 50,
        backgroundColor: 'lightblue',
        marginTop: 10
    }
});

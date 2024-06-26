import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, StyleSheet, GestureResponderEvent } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { fire, storage } from '../../firebaseConfig';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation } from "@react-navigation/native";

interface File {
    id: string;
    nome: string;
    numeroLuas: string;
    fileType: string;
    url: string;
    createdAt: string;
    updatedAt?: string;
}

export default function HomeScreen({}) {
    const [image, setImage] = useState<string>("");
    const [files, setFiles] = useState<File[]>([]);
    const navigation = useNavigation();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(fire, "universo"), (snapshot) => {
            setFiles((prevFiles) => {
                const newFiles = [...prevFiles];
                snapshot.docChanges().forEach((change) => {
                    const newFile = { id: change.doc.id, ...change.doc.data() } as File;
                    if (change.type === "added") {
                        const exists = newFiles.find((file) => file.id === newFile.id);
                        if (!exists) {
                            newFiles.push(newFile);
                        }
                    }
                    if (change.type === "modified") {
                        const index = newFiles.findIndex((file) => file.id === newFile.id);
                        if (index !== -1) {
                            newFiles[index] = newFile;
                        }
                    }
                    if (change.type === "removed") {
                        const index = newFiles.findIndex((file) => file.id === newFile.id);
                        if (index !== -1) {
                            newFiles.splice(index, 1);
                        }
                    }
                });
                return newFiles;
            });
        });
    
        return () => unsubscribe();
    }, []);
    

    async function uploadImage(uri: string, fileType: string, nome: string, numeroLuas: string, id: string | null = null): Promise<void> {
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
                    await updateRecord(id, nome, numeroLuas, fileType, downloadURL);
                } else {
                    await saveRecord(nome, numeroLuas, fileType, downloadURL, new Date().toISOString());
                }
                setImage("");
            }
        );
    }    

    async function saveRecord(nome: string, numeroLuas: string, fileType: string, url: string, createdAt: string): Promise<void> {
        try {
            await addDoc(collection(fire, "universo"), {
                nome,
                numeroLuas,
                fileType,
                url,
                createdAt,
            });
        } catch (e) {
            console.log(e);
        }
    }

    async function updateRecord(id: string, nome: string, numeroLuas: string, fileType: string, url: string): Promise<void> {
        try {
            await updateDoc(doc(fire, "universo", id), {
                nome,
                numeroLuas,
                fileType,
                url,
                updatedAt: new Date().toISOString(),
            });
        } catch (e) {
            console.log(e);
        }
    }

    async function deleteRecord(id: string, url: string): Promise<void> {
        try {
            await deleteDoc(doc(fire, "universo", id));
            const storageRef = ref(storage, url);
            await deleteObject(storageRef);
        } catch (e) {
            console.log(e);
        }
    }

    async function pickImage(nome: string, numeroLuas: string, updateId: string | null = null): Promise<void> {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        console.log(result);
        if (!result.canceled && result.assets) {
            setImage(result.assets[0].uri);
            await uploadImage(result.assets[0].uri, "img", nome, numeroLuas, updateId);
        }
    }
    

    function confirmDelete(id: string, url: string): void {
        Alert.alert(
            "Confirmação",
            "Tem certeza que deseja deletar esta imagem?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Deletar", onPress: () => deleteRecord(id, url) }
            ]
        );
    }

    const handlePickImage = (event: GestureResponderEvent) => {
        pickImage("");
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Seu Sistema Solar atual</Text>
            <Text style={styles.subHeaderText}>Explore o universo!</Text>
        </View>
    );

    const renderItem = ({ item }: { item: File }) => {
        if (item.fileType === "img") {
            return (
                <ThemedView>
                    <Image
                        source={{ uri: item.url }}
                        style={styles.image}
                    />
                    <Text>{item.nome}</Text>
                    <Text>{item.numeroLuas}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate("AlterarPlaneta", { id: item.id, nome: item.nome, numeroLuas: item.numeroLuas, url: item.url })}>
                        <Text>Nova atualização</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(item.id, item.url)}>
                        <Text>Deletar Imagem</Text>
                    </TouchableOpacity>
                </ThemedView>
            );
        }
        return null;
    };

    return (
        <FlatList
            data={files}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={2}
            ListHeaderComponent={renderHeader}
        />
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

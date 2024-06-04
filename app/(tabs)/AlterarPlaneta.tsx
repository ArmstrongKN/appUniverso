import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, StyleSheet, GestureResponderEvent } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { fire, storage } from '../../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation } from "@react-navigation/native";

import { NativeStackScreenProps } from '@react-navigation/native-stack';

interface File {
    id: string;
    nome: string;
    numeroLuas: number;
    fileType: string;
    url: string;
    createdAt: string;
    updatedAt?: string;
}

const AlterarPlaneta = ({}) => {

    const [nome, setNome] = useState<string>("");
    const [numeroLuas, setNumeroLuas] = useState<number>(0);
    const [image, setImage] = useState<string>("");
    const [files, setFiles] = useState<File[]>([]);
    const navigation = useNavigation();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(fire, "universo"), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    setFiles((prevFiles) => [...prevFiles, { id: change.doc.id, ...change.doc.data() } as File]);
                }
                if (change.type === "modified") {
                    setFiles((prevFiles) =>
                        prevFiles.map((file) =>
                            file.id === change.doc.id ? { id: change.doc.id, ...change.doc.data() } as File : file
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

    async function uploadImage(nome: string, numeroLuas: number, uri: string, fileType: string, id: string | null = null): Promise<void> {
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
                    await updateRecord(nome, numeroLuas, fileType, downloadURL, id);
                } else {
                    await saveRecord(nome, numeroLuas, fileType, downloadURL, new Date().toISOString());
                }
                setImage("");
            }
        );
    }

    async function saveRecord(nome: string, numeroLuas: number, fileType: string, url: string, createdAt: string): Promise<void> {
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

    async function updateRecord(nome: string, numeroLuas: number, fileType: string, url: string, id: string): Promise<void> {
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
            await uploadImage(result.assets[0].uri, "img", nome, numeroLuas, updateId);
        }
    }

    const handlePickImage = (event: GestureResponderEvent) => {
        pickImage();
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

                    {/* <ThemedView>
                        <TextInput style={styles.nome} placeholder="Nomeie o planeta" value={nome} onChangeText={setNome}/>
                        <TextInput style={styles.nome2}placeholder="N° de Luas" value={numeroLuas} onChangeText={setNumeroLuas}/>
                    </ThemedView> */}
                    
                    <TouchableOpacity onPress={() => pickImage(item.id)}>
                        <Text>Atualizar Imagem</Text>
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
    nome:{
        fontSize: 16,
        fontWeight: 'bold',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 20,
        marginLeft: 135
    },
    nome2:{
        fontSize: 16,
        fontWeight: 'bold',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 155
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

export default AlterarPlaneta;
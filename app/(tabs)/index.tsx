import React, { useState, useEffect } from 'react';
import { SafeAreaView, TouchableOpacity, StyleSheet, GestureResponderEvent, TextInput, ImageBackground } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { fire, storage } from '../../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface File {
    id: string;
    nome: string;
    numeroLuas: number;
    fileType: string;
    url: string;
    createdAt: string;
    updatedAt?: string;
}

export default function HomeScreen() {

    const [nome, setNome] = useState<string>("");
    const [numeroLuas, setNumeroLuas] = useState<number>(0);
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

    async function uploadImage(uri: string, fileType: string, nome: string, numeroLuas: number, id: string | null = null): Promise<void> {
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
                if (!id) {
                    await saveRecord(nome, numeroLuas, fileType, downloadURL, new Date().toISOString());
                }
                setImage("");
                setNome("");
                setNumeroLuas(0);
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
                createdAt
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
            quality: 1
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

    return (
        <SafeAreaView>
            <ThemedView>
                <ThemedText style={styles.texto}> Universe for you </ThemedText>
                <ThemedText style={styles.texto2}> Construa seus planetas do sistema </ThemedText>
            </ThemedView>

            <ThemedView>
                <TextInput style={styles.nome} placeholder="Nomeie o planeta" value={nome} onChangeText={setNome}/>
                <TextInput style={styles.nome2} placeholder="N° de Luas" value={numeroLuas} onChangeText={setNumeroLuas}/>
            </ThemedView>

            <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage}>
                <ThemedText style={styles.texto3}>Subir Imagens</ThemedText>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    texto: {
        fontSize: 24,
        fontWeight: 'bold',
        paddingTop: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: ' #132639',
        marginLeft: 132
        
    },
    texto2: {
        fontSize: 24,
        fontWeight: 'bold',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 10,
        marginLeft: 95
        
    },
    texto3: {
        fontSize: 24,
        fontWeight: 'bold',
        paddingTop: 10,
        justifyContent: 'center',
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

    headerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        height: '100%',
        width: '100%',
       
       
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        
    },
    subHeaderText: {
        textAlign: 'center',
        fontSize: 16
    },
    itemContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        margin: 5,
    },
    image: {
        width: 150,
        height: 150,
        borderRadius: 20,
    },
    uploadButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        padding: 40,
        backgroundColor: 'lightblue',
        marginTop: 10
    },
    input: {
        flex: 1,
        paddingLeft: 10,
        fontSize: 16,
        height: 40,
        fontFamily: 'Montserrat_400Regular',
        
    },

});

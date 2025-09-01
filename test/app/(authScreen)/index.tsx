import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../auth/supabaseClient';
import {router} from "expo-router"

const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(true);

    const handleAuth = async () => {
        setLoading(true);
        let authResult;
        if (isLoginMode) {
            authResult = await supabase.auth.signInWithPassword({ email, password });
        } else {
            authResult = await supabase.auth.signUp({ email, password });
        }
        setLoading(false);

        const { data, error } = authResult;
        if (error) {
            Alert.alert(isLoginMode ? "Sign In Failed" : "Sign Up Failed", error.message);
        } else if (isLoginMode && data.session) {
            try {
                // Save session in AsyncStorage
                await AsyncStorage.setItem("supabase_session", JSON.stringify(data.session));
                Alert.alert("Success!", "You are now logged in.");
                router.replace("/(tabs)")
            } catch (storageError) {
                Alert.alert("Error", "Failed to save session.");
            }
        } else {
            Alert.alert("Success!", "Please check your email to confirm your account.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{isLoginMode ? 'Welcome Back!' : 'Create an Account'}</Text>
            <Text style={styles.subtitle}>
                {isLoginMode ? 'Sign in to access your dashboard' : 'Sign up to start scanning'}
            </Text>
            
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#6b7280"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#6b7280"
            />

            <Pressable
                style={({ pressed }) => [
                    styles.button,
                    { opacity: pressed ? 0.7 : 1 }
                ]}
                onPress={handleAuth}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{isLoginMode ? 'Sign In' : 'Sign Up'}</Text>
            </Pressable>

            <Pressable onPress={() => setIsLoginMode(!isLoginMode)} style={styles.toggleButton}>
                <Text style={styles.toggleText}>
                    {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </Text>
            </Pressable>

            <Text style={styles.statusText}>{loading ? 'Loading...' : ''}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 32,
    },
    input: {
        width: '100%',
        maxWidth: 350,
        height: 50,
        padding: 12,
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        fontSize: 16,
        color: '#1f2937',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    button: {
        width: '100%',
        maxWidth: 350,
        paddingVertical: 16,
        borderRadius: 50,
        backgroundColor: '#4f46e5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
        marginTop: 8,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'center',
    },
    toggleButton: {
        marginTop: 24,
    },
    toggleText: {
        color: '#4f46e5',
        fontSize: 14,
        fontWeight: '600',
    },
    statusText: {
        marginTop: 24,
        fontSize: 14,
        color: '#6b7280',
    }
});

export default AuthScreen;

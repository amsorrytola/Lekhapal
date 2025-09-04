import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import App from './(tabs)/explore'
import { SafeAreaView } from 'react-native-safe-area-context'

const Upload = () => {

    const {section , id} = useLocalSearchParams()
    console.log("Upload - section:", section);
    console.log("Upload - id:", id);
  return (
    <SafeAreaView style={{flex: 1}}>
      <App prompt={section as string} id={id as string}/>
    </SafeAreaView>
  )
}

export default Upload

const styles = StyleSheet.create({})
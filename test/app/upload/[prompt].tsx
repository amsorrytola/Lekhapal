import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import App from '../(tabs)/explore'
import { SafeAreaView } from 'react-native-safe-area-context'

const Upload = () => {

    const {prompt} = useLocalSearchParams()
  return (
    <SafeAreaView style={{flex: 1}}>
      <App prompt={prompt as string}/>
    </SafeAreaView>
  )
}

export default Upload

const styles = StyleSheet.create({})
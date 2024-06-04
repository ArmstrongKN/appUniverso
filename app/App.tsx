import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AlterarPlaneta from "./(tabs)/AlterarPlaneta";

const Stack = createNativeStackNavigator();

const App: React.FC = () => {

    return (

        <NavigationContainer>
            <Stack.Navigator initialRouteName='AlterarPlaneta'>
                <Stack.Screen name='AlterarPlaneta' component={AlterarPlaneta}></Stack.Screen>
            </Stack.Navigator>
        </NavigationContainer>

    );

}
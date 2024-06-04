import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import alterarPlaneta from "./(tabs)/alterarPlaneta";

const Stack = createNativeStackNavigator();

const App: React.FC = () => {

    return (

        <NavigationContainer>
            <Stack.Navigator initialRouteName='alterarPlaneta'>
                <Stack.Screen name='alterarPlaneta' component={alterarPlaneta}></Stack.Screen>
            </Stack.Navigator>
        </NavigationContainer>

    );

}
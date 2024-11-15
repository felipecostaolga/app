import React, {useEffect} from 'react';
import {Router, Stack, Scene} from 'react-native-router-flux';
// import { NavigationContainer } from './components/navigation/navigation';
import PermissionManager from './tools/permissions';

import {HomeScreen} from './src/screens/HomeScreen';
import Variables from './variables.json';

globalThis.envs = Variables;
class App extends React.Component {
  useEffect() {
    const camera = PermissionManager.requestCameraPermission();
    const location = PermissionManager.requestLocationPermission();
    if (camera && location) {
      console.log('Permission granted');
    }
  }
  render() {
    // return <NavigationContainer />;
    return (
      <Router>
        <Scene key="root">
          <Scene
            key="home"
            component={HomeScreen}
            headerMode="none"
            hideNavBar={true}
          />
        </Scene>
      </Router>
    );
  }
}

export default App;

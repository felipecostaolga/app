import React from 'react';
import {
  StyleSheet,
  StatusBar,
  BackHandler,
  Platform,
  KeyboardAvoidingView,
  View,
  Linking,
} from 'react-native';

import OlgaFoodWebview from '../components/OlgaFoodWebview';
import {PushNotificationModal} from '../screens/modalPermission';
export class HomeScreen extends React.Component {
  state = {
    pullRefresh: true,
    url: globalThis.envs.url,
  };

  componentDidMount() {
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', () => true);
    }

    // Adicionar listener para deep links
    Linking.addEventListener('url', this.handleDeepLink);

    // Capturar deep link inicial (se o app foi aberto por um deep link)
    Linking.getInitialURL().then(url => {
      if (url) {
        this.handleDeepLink({url});
      }
    });
  }

  componentWillUnmount() {
    // Remover listener quando o componente for desmontado
    Linking.removeEventListener('url', this.handleDeepLink);
  }

  handleDeepLink = event => {
    const url = event.url;

    // Faça algo com a URL, por exemplo, atualizar o estado
    this.setState({url});
  };

  render() {
    return (
      <View style={{flex: 1}}>
        <KeyboardAvoidingView style={styles.container} behavior="padding">
          <StatusBar barStyle="default" backgroundColor={'#000'} />

          <OlgaFoodWebview
            ref={r => (this.webref = r)}
            source={{uri: this.state.url}}
            pullRefresh={this.state.pullRefresh}
          />
        </KeyboardAvoidingView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});

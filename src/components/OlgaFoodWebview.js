import React from 'react';
import {Platform, View, StyleSheet, Linking} from 'react-native';
import {WebView} from 'react-native-webview';
import {LoadingView} from './LoadingView';
import ErrorView from './ErrorView';
import OneSignalTools from '../../tools/oneSignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Variables from '../../variables.json';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
globalThis.envs = Variables;

const syncLocalStorageScript = `
  (function() {
    function sendLocalStorageToReactNative() {
      window.ReactNativeWebView.postMessage(JSON.stringify(localStorage));
    }

    window.addEventListener('storage', sendLocalStorageToReactNative);

    sendLocalStorageToReactNative();
  })();
`;

const pollingScript = `
  (function() {
    let lastLocalStorage = JSON.stringify(localStorage);
    setInterval(function() {
      const currentLocalStorage = JSON.stringify(localStorage);
      if (currentLocalStorage !== lastLocalStorage) {
        window.ReactNativeWebView.postMessage(currentLocalStorage);
        lastLocalStorage = currentLocalStorage;
      }
    }, 10000); // 10 segundos
  })();
`;

const MODAL_CLOSE_KEY = 'modalCloseDate';
const TWO_DAYS_IN_MS = 2 * 24 * 60 * 60 * 1000;

export default class OlgaFoodWebview extends React.Component {
  state = {
    visible: true,
    alias: null,
    hasMessageBeenHandled: false,
    showModal: false,
    isConected: false,
  };

  intervalID = null;

  constructor(props) {
    super(props);
    this.webView = React.createRef();
    this.onesignal = React.createRef();
    this.onMessage = this.onMessage.bind(this);
    this.renderError = this.renderError.bind(this);
    this.handleWebViewLoaded = this.handleWebViewLoaded.bind(this);
    this.onShouldStartLoadWithRequest =
      this.onShouldStartLoadWithRequest.bind(this);
    this.tokenVerify = this.tokenVerify.bind(this);
    this.hidenButtonDownloInApp = this.hidenButtonDownloInApp.bind(this);
    this.logout = this.logout.bind(this);
    this.getOlgaId = this.getOlgaId.bind(this);
    this.syncAsyncStorageWithWebView =
      this.syncAsyncStorageWithWebView.bind(this);
    this.onLoadEnd = this.onLoadEnd.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.checkModalVisibility = this.checkModalVisibility.bind(this);
  }

  onConectionVerify() {
    NetInfo.addEventListener(state => {
      this.setState({isConnected: state.isConnected}, () => {});
    });
    return this.state.isConnected;
  }

  async componentDidMount() {
    // Atualiza o estado e usa o valor do estado da conectividade diretamente

    this.webView.current.injectJavaScript(syncLocalStorageScript);
    this.webView.current.injectJavaScript(pollingScript);

    // Inicializa OneSignal
    this.onesignal.current.init();

    // Sincroniza o AsyncStorage com o WebView
    this.syncAsyncStorageWithWebView();

    // Verifica a visibilidade do modal
    await this.checkModalVisibility();
  }

  async checkModalVisibility() {
    const closeDate = await AsyncStorage.getItem(MODAL_CLOSE_KEY);
    // if (closeDate) {
    //   const closeTime = new Date(closeDate).getTime();
    //   const currentTime = new Date().getTime();
    //   if (currentTime - closeTime >= TWO_DAYS_IN_MS) {
    //     this.onesignal.current.showModal();
    //   }
    // } else {
    //   this.onesignal.current.showModal();
    // }
  }

  handleWebViewLoaded() {
    this.setState({visible: false});
  }

  onShouldStartLoadWithRequest(navState) {
    const domainRegex = /https?:\/\/(?:.*\.)?(?:olga\.tech|sites\.olga\.tech|estacaocampineira\.com\.br)(?:\/|$)/;
    if (domainRegex.test(navState.url)) {
      return true;
    } else {
      Linking.openURL(navState.url);
      return false;
    }
  }

  async tokenVerify(token) {
    const oldToken = await AsyncStorage.getItem('login');
    if (token !== undefined && token !== oldToken) {
      await AsyncStorage.setItem('login', token);
    } else {
      const tokenAsyncStorage = await AsyncStorage.getItem('login');
      const injectLocalStorage = `localStorage.setItem('accessToken', '${tokenAsyncStorage}')`;
      this.webView.current.injectJavaScript(injectLocalStorage);
    }
  }

  async hidenButtonDownloInApp() {
    await new Promise(resolve => setTimeout(resolve, 500));
    const injectLocalStorage = "localStorage.setItem('isApp', true)";
    this.webView.current.injectJavaScript(injectLocalStorage);
  }

  async logout() {
    await AsyncStorage.clear();
  }

  sleepCallback() {
    return new Promise(resolve => setTimeout(resolve, 30000));
  }

  async getOlgaId(token, phone, doc, customerId) {
    try {
      console.log('iniciando o getOlgaId');
      const response = await axios.get(
        `${globalThis.envs.olgaApi}benefits/standard/customers/infos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-customer-doc': doc,
            'x-customer-phone': phone,
          },
        },
      );
      const {id} = response.data.response.data;
      console.log('id', id, 'customerId', customerId);
      if (id && customerId) {
        this.setState({hasMessageBeenHandled: true});
        this.onesignal.current.setExternalIds(id, customerId);
      } else {
        await this.sleepCallback();
      }
    } catch (error) {
      console.error('Error fetching data with Axios:', error);
    }
  }

  async syncAsyncStorageWithWebView() {
    try {
      console.log('sincronizando assyncstorage com webview');
      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);
      stores.forEach(([key, value]) => {
        const injectScript = `localStorage.setItem('${key}', '${value}');`;
        this.webView.current.injectJavaScript(injectScript);
      });
    } catch (error) {
      console.error('Error syncing AsyncStorage with WebView:', error);
    }
  }

  async handleCloseModal() {
    const currentDate = new Date().toISOString();
    await AsyncStorage.setItem(MODAL_CLOSE_KEY, currentDate);
    this.setState({showModal: false});
    this.onesignal.current.hideModal();
  }

  onMessage(event) {
    try {
      console.log('iniciou o onmessage');
      if (event.nativeEvent.data === 'logout') {
        this.logout();
        return;
      }

      const rawMessage = event.nativeEvent.data;

      if (!rawMessage || this.state.hasMessageBeenHandled) {
        return;
      }

      const parsedMessage = JSON.parse(rawMessage);

      for (const [key, value] of Object.entries(parsedMessage)) {
        AsyncStorage.setItem(key, value);
      }

      const token = parsedMessage.accessToken;
      const alias = parsedMessage['of-brand'];
      if (token && alias) {
        const {olga_api_key} = JSON.parse(parsedMessage[alias]).keys;

        const {phone, extras, id} = JSON.parse(parsedMessage['of-customer']);

        this.getOlgaId(olga_api_key, phone, extras.doc, id);
        this.tokenVerify(token);
      }
    } catch (e) {
      console.log(e);
    }
  }

  renderError() {
    return <ErrorView onClick={() => this.webView.current.reload()} />;
  }

  onLoadEnd() {
    setTimeout(() => {
      this.setState({visible: false});
    }, 5000);
  }

  render() {
    return (
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          flex: 1,
          paddingTop: Platform.OS === 'ios' ? '10%' : '0%',
        }}>
        {this.onConectionVerify && (
          <>
            <WebView
              injectedJavaScriptBeforeContentLoadedForMainFrameOnly={false}
              injectedJavaScriptBeforeContentLoaded={`
           window.SharedWorker = undefined;
         `}
              cacheEnabled={false}
              renderLoading={() => <LoadingView />}
              ref={this.webView}
              domStorageEnabled={true}
              javaScriptEnabled={true}
              originWhitelist={['*']}
              useWebKit={true}
              contentMode="mobile"
              permiteInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={true}
              allowsInlineMediaPlayback={true}
              allowInlineMediaPlayback={true}
              bounces={true}
              onLoadStart={() => {
                this.hidenButtonDownloInApp();
                this.setState({visible: true});
              }}
              userAgent={'olgaapp'}
              onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
              onLoadEnd={this.onLoadEnd}
              onMessage={this.onMessage}
              style={{
                opacity: this.state.visible ? 0 : 1,
              }}
              renderError={this.renderError}
              {...this.props}
              onContentProcessDidTerminate={syntheticEvent => {
                const {nativeEvent} = syntheticEvent;
                this.webView.current.reload();
              }}
              injectedJavaScript={`
            (function() {
              // Simula permissões para a câmera
              if (!navigator.permissions) {
                navigator.permissions = {
                  query: function(params) {
                    return new Promise(function(resolve, reject) {
                      if (params.name === 'camera') {
                        resolve({ state: 'granted' });
                      } else {
                        reject();
                      }
                    });
                  }
                };
              }
        
              // Função para obter dados do localStorage
              function getLocalStorageData() {
                const keys = Object.keys(localStorage);
                let data = {};
                for (let key of keys) {
                  data[key] = localStorage.getItem(key);
                }
                window.ReactNativeWebView.postMessage(JSON.stringify(data));
              }
        
              // Função chamada quando há mudanças no localStorage
              function onLocalStorageChange(e) {
                getLocalStorageData();
              }
        
              // Adiciona o event listener para mudanças no localStorage
              window.addEventListener('storage', onLocalStorageChange);
        
              // Chama a função inicialmente para enviar os dados existentes do localStorage
              getLocalStorageData();
        
              // Pooling para enviar dados a cada 10 segundos
              setInterval(getLocalStorageData, 10000);
            })();
          `}
            />
            {this.state.visible && <LoadingView />}
          </>
        )}

        <OneSignalTools ref={this.onesignal} onClose={this.handleCloseModal} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});

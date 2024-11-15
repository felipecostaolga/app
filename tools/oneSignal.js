import React, {Component} from 'react';
import Axios from 'axios';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  Alert,
} from 'react-native';

import Modal from 'react-native-modal';
import {OneSignal, LogLevel} from 'react-native-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';

class OneSignalTools extends Component {
  state = {
    isModalVisible: false,
  };

  constructor(props) {
    super(props);
    this.oneSignalKey = globalThis.envs.OneSignalKey;
    this._isMounted = false;
  }

  async componentDidMount() {
    this._isMounted = true;
    await this.init();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  isTwoDaysPassed = dateString => {
    if (!dateString) {
      return true;
    }
    const date = new Date(dateString);
    const currentDate = new Date();

    const diffInMs = currentDate - date;

    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    return diffInDays >= 2;
  };

  async init() {
    try {
      console.log('rodo o método init', this.oneSignalKey);

      OneSignal.initialize(this.oneSignalKey);
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);

      const hasPermission = await OneSignal.Notifications.getPermissionAsync();
      const canRequestPermission =
        await OneSignal.Notifications.canRequestPermission();

      const tokenRequest = await OneSignal.User.getOnesignalId();

      console.log('tokenRequest', tokenRequest);

      OneSignal.Notifications.addEventListener('click', async event => {
        const notificationData = event.notification.additionalData;

        if (
          notificationData &&
          notificationData.track &&
          notificationData.track.trackingUrl
        ) {
          const storageCustomer = await AsyncStorage.getItem('olga-customer');
          const {phone} = JSON.parse(storageCustomer);
          const formattedPhone = phone.replace(/[^\d]/g, '');
          const url = `${notificationData.track.trackingUrl}?q=${formattedPhone}`;

          try {
            const response = await Axios.get(url);
          } catch (error) {
            console.error('Erro ao fazer a solicitação HTTP:', error);
          }
        } else {
          console.warn(
            'URL de rastreamento não encontrada nos dados adicionais da notificação.',
          );
        }
      });

      console.log(
        'abrir modal',
        hasPermission === false,
        canRequestPermission === true,
      );

      if (!hasPermission) {
        const lastModalClose = await AsyncStorage.getItem('MODAL_CLOSE_KEY');
        const verifyClickedModal = this.isTwoDaysPassed(lastModalClose);

        setTimeout(() => {
          console.log('entro no if do modal');
          if (verifyClickedModal) {
            this.showCustomPermissionModal();
          }
        }, 5000);
      }
    } catch (e) {
      console.log(e);
    }
  }

  showCustomPermissionModal() {
    if (this._isMounted) {
      this.setState({isModalVisible: true});
    }
  }

  handleModalClose = () => {
    if (this._isMounted) {
      const date = new Date();
      AsyncStorage.setItem('MODAL_CLOSE_KEY', date.toString());
      this.setState({isModalVisible: false});
    }
  };

  handleModalConfirm = () => {
    const doInit = Platform.select({
      android: () => {
        OneSignal.Notifications.requestPermission(true);
      },
      ios: () => {
        OneSignal.Notifications.requestPermission(true);
      },
      default: () => {},
    });
    doInit();
    if (this._isMounted) {
      this.setState({isModalVisible: false});
    }
  };

  async setExternalIds(externalId, customerId) {
    try {
      console.log('iniciou o método setExternalIds', externalId);
      if (externalId) {
        console.log('efetou o login no OneSignal');
        OneSignal.login(externalId.toString());
        const olgaId = externalId.toString();
        const customerIdStr = customerId.toString();
        const subbscriptionId =
          await OneSignal.User.pushSubscription.getIdAsync();
        console.log('##', subbscriptionId);

        // OneSignal.sendTags({
        //   olga_id: `olga_id_${olgaId}`,
        //   food_id: `food_${customerIdStr}`,
        // });
      }
    } catch (e) {
      console.log(e);
    }
  }

  render() {
    console.log(
      'Renderizando OneSignalTools, isModalVisible:',
      this.state.isModalVisible,
    );
    return (
      <View style={{flex: 0}}>
        <Modal
          isVisible={this.state.isModalVisible}
          backdropOpacity={0.5}
          style={styles.modalContainer}
          animationIn="slideInUp"
          animationOut="slideOutDown">
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={this.handleModalClose}
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>&times;</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.imagePlaceholder}>
              <Image
                source={{
                  uri: 'https://uploaddeimagens.com.br/images/004/801/413/full/image-logo.png',
                }}
                style={styles.image}
              />
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.title}>Receba notificações</Text>
              <Text style={styles.description}>
                Ative as notificações para receber benefícios incríveis, avisos
                de promoções e muito mais.
              </Text>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={this.handleModalConfirm}
                style={[styles.button, styles.permitirButton]}>
                <Text style={styles.buttonText}>Quero ativar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={this.handleModalClose}
                style={[styles.button, styles.agoraNaoButton]}>
                <Text style={[styles.buttonText, styles.agoraNaoButtonText]}>
                  Agora não
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '100%',
    maxWidth: 350,
    textAlign: 'center',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  closeButton: {
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#a0a0a0',
  },
  imagePlaceholder: {
    height: 240,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  modalBody: {
    padding: 20,
    paddingBottom: 25,
  },
  title: {
    fontSize: 16,
    color: '#404040',
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 0,
    marginBottom: 5,
    textAlign: 'center',
  },
  description: {
    color: '#666666',
    lineHeight: 20,
    textAlign: 'center',
    fontSize: 14,
    margin: 0,
  },
  modalFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
    padding: 20,
    paddingBottom: 25,
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 15,
    height: 40,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    width: '100%',
    cursor: 'pointer',
  },
  permitirButton: {
    backgroundColor: '#3d734a',
  },
  agoraNaoButton: {
    borderColor: 'transparent',
  },
  buttonText: {
    color: 'white',
  },
  agoraNaoButtonText: {
    color: '#3d734a',
  },
});

export default OneSignalTools;

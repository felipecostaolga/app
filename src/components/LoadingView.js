import React from 'react';
import {
  Dimensions,
  Image,
  View,
  StyleSheet,
  Modal,
  Text,
  Button,
  TouchableWithoutFeedback,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {Platform} from 'react-native';
import {check, PERMISSIONS, RESULTS} from 'react-native-permissions';
import DeviceInfo from 'react-native-device-info';
import {OneSignal} from 'react-native-onesignal';
import axios from 'axios';

const ScreenSizes = Dimensions.get('screen');

export class LoadingView extends React.Component {
  state = {
    isConnected: true,
    isLongPress: false,
    permissions: Platform.select({
      android: [
        PERMISSIONS.ANDROID.CAMERA,
        PERMISSIONS.ANDROID.RECORD_AUDIO,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
      ],
      ios: [
        PERMISSIONS.IOS.CAMERA,
        PERMISSIONS.IOS.MICROPHONE,
        PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        PERMISSIONS.IOS.PHOTO_LIBRARY,
        PERMISSIONS.IOS.NOTIFICATIONS,
      ],
    }),
  };

  componentDidMount() {
    this.unsubscribe = NetInfo.addEventListener(state => {
      this.setState({isConnected: state.isConnected});
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe();
  }

  async requestPermissions() {
    OneSignal.initialize(globalThis.envs.OneSignalKey);
    const infoOnesignal = {
      subscriptionId: await OneSignal.User.getOnesignalId(),
      pushToken: await OneSignal.User.pushSubscription.getTokenAsync(),
      permissionOnesignal: await OneSignal.Notifications.getPermissionAsync(),
    };
    const infoDevice = {
      aplication: DeviceInfo.getApplicationName(),
      build: DeviceInfo.getBuildNumber(),
      bundle: DeviceInfo.getBundleId(),
      deviceId: DeviceInfo.getDeviceId(),
      deviceType: DeviceInfo.getDeviceType(),
      deviceModel: DeviceInfo.getModel(),
      landscape: await DeviceInfo.isLandscape(),
    };
    let permissionResponse = {};
    const results = await Promise.all(
      this.state.permissions.map(permission => check(permission)),
    );

    const deniedPermissions = results.map((result, index) => {
      return (permissionResponse[this.state.permissions[index]] = result);
    });
    await axios.post('http://192.168.1.13:4010/customers/app/logger', {
      appName: infoDevice.aplication,
      permissionResponse,
      infoDevice,
      infoOnesignal,
    });
    console.log('chamou ##########');
    console.log('results', permissionResponse, infoDevice, infoOnesignal);
    return deniedPermissions;
  }

  handlePressIn = () => {
    this.setState({isLongPress: false});
    this.longPressTimeout = setTimeout(() => {
      this.setState({isLongPress: true});
      console.log('enviando log para o endpoint');
      this.requestPermissions();
    }, 3000);
  };

  handlePressOut = () => {
    clearTimeout(this.longPressTimeout);
  };

  render() {
    return !this.state.isConnected ? (
      <Modal
        transparent={true}
        animationType="slide"
        visible={!this.state.isConnected}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Você precisa estar conectado para uma melhor experiência.
            </Text>
            <Button
              title="Tentar novamente"
              onPress={() =>
                NetInfo.fetch().then(state =>
                  this.setState({isConnected: state.isConnected}),
                )
              }
            />
          </View>
        </View>
      </Modal>
    ) : (
      <TouchableWithoutFeedback
        onPressIn={this.handlePressIn}
        onPressOut={this.handlePressOut}>
        <View
          style={{
            position: 'absolute',
            top: -ScreenSizes.height * 0.1,
            left: 0,
            width: ScreenSizes.width,
            height: ScreenSizes.height + ScreenSizes.height * 0.1,
            backgroundColor: globalThis.envs.primaryColor,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
          }}>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Image
              source={require('../assets/icon.png')}
              resizeMethod="resize"
              style={{
                backgroundColor: globalThis.envs.primaryColor,
                width: ScreenSizes.width * 0.8,
                height: ScreenSizes.width * 0.8,
                resizeMode: 'contain',
              }}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});

import {Platform} from 'react-native';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';

class PermissionManager {
  static async requestCameraPermission() {
    const permission =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.CAMERA
        : PERMISSIONS.IOS.CAMERA;
    return await this._requestPermission(permission);
  }

  static async requestLocationPermission() {
    const permission =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
    return await this._requestPermission(permission);
  }

  static async _requestPermission(permission) {
    const result = await request(permission);
    return result === RESULTS.GRANTED;
  }
}

export default PermissionManager;

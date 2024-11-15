import AsyncStorage from '@react-native-async-storage/async-storage';

class AsyncStorageTools {
  constructor(key) {
    this.key = key;
  }

  async setItem(value) {
    try {
      await AsyncStorage.setItem(this.key, value);
    } catch (error) {
      console.log(error);
    }
  }
  async getItem() {
    try {
      const value = await AsyncStorage.getItem(this.key);
      if (value !== null) {
        return value;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async clear() {
    try {
      console.log('Clearing all items from AsyncStorage.');
      AsyncStorage.clear().then(() => console.log('Cleared'));
    } catch (error) {
      console.log(error);
    }
  }

  async getAllKeys() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys;
    } catch (error) {
      console.log(error);
    }
  }

  async multiGet() {
    try {
      const keys = await AsyncStorage.multiGet(keys);
      return keys;
    } catch (error) {
      console.log(error);
    }
  }

  async multiRemove() {
    try {
      await AsyncStorage.multiRemove(this.keys);
    } catch (error) {
      console.log(error);
    }
  }

  async multiSet() {
    try {
      await AsyncStorage.multiSet(this.keys);
    } catch (error) {
      console.log(error);
    }
  }

  async mergeItem(value) {
    try {
      await AsyncStorage.mergeItem(this.key, value);
    } catch (error) {
      console.log(error);
    }
  }

  async mergeMulti(value) {
    try {
      await AsyncStorage.mergeMulti(this.key, value);
    } catch (error) {
      console.log(error);
    }
  }

  async flushGetRequests() {
    try {
      await AsyncStorage.flushGetRequests();
    } catch (error) {
      console.log(error);
    }
  }
}

export default AsyncStorageTools;

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import Modal from 'react-native-modal';

const PushNotificationModal = ({isVisible, onClose, onConfirm}) => {
  return (
    <Modal
      isVisible={isVisible}
      backdropOpacity={0.5}
      style={styles.modalContainer}
      animationIn="slideInUp"
      animationOut="slideOutDown">
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
          <Text style={styles.title}>Permitir notificações</Text>
          <Text style={styles.description}>
            Ative as notificações para receber atualizações importantes em tempo
            real.
          </Text>
        </View>
        <View style={styles.modalFooter}>
          <TouchableOpacity
            onPress={onConfirm}
            style={[styles.button, styles.permitirButton]}>
            <Text style={styles.buttonText}>Permitir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.button, styles.agoraNaoButton]}>
            <Text style={[styles.buttonText, styles.agoraNaoButtonText]}>
              Agora não
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '100%',
    maxWidth: '100%',
    textAlign: 'center',
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingBottom: 20,
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

export default PushNotificationModal;

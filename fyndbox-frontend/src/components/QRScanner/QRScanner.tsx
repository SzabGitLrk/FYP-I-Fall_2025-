import { FC, useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader, VideoInputDevice } from '@zxing/browser';
import { Modal, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  ButtonContainer,
  QrContainer,
  QrOverlay,
  QrReaderContainer,
} from './QRScanner.styles';

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onCancel: () => void;
}

const QRScanner: FC<QRScannerProps> = ({ onScanSuccess, onCancel }) => {
  const [scanError, setScanError] = useState<string | null>(null);
  const [controls, setControls] = useState<any>(null);
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReader = useRef(new BrowserQRCodeReader());

  const stopCamera = () => {
    if (controls) {
      setTimeout(() => controls.stop(), 2000);
    }
  };

  useEffect(() => {
    const startScanning = async () => {
      try {
        const videoInputDevices: VideoInputDevice[] =
          await BrowserQRCodeReader.listVideoInputDevices();

        if (videoInputDevices.length === 0) {
          setScanError(t('qrCode.noCameraFound'));
          return;
        }

        const backCamera = videoInputDevices.find(
          (device) =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment'),
        );

        const selectedDeviceId = backCamera
          ? backCamera.deviceId
          : videoInputDevices[0].deviceId;

        // Initialize scanning
        const controlsInstance = await codeReader.current.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current!,
          (result, error) => {
            if (result) {
              stopCamera();
              onScanSuccess(result.getText());
            } else if (error && error.name !== 'NotFoundException2') {
              console.error('QR Scan Error:', error);
              setScanError(t('qrCode.error'));
            }
          },
        );

        setControls(controlsInstance);

        setTimeout(() => {
          setScanError(t('qrCode.noQrCodeFound'));
          setTimeout(() => {
            controlsInstance.stop();
            onCancel();
          }, 3000);
        }, 10000);
      } catch (error) {
        console.error('Error initializing QR scanner:', error);
        setScanError(t('qrCode.initializationError'));
      }
    };

    startScanning();

    return () => {
      stopCamera();
    };
  }, [onScanSuccess, t]);

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  return (
    <Modal open onClose={handleCancel} closeAfterTransition>
      <QrOverlay>
        <QrContainer>
          <Typography variant="h6" mb={2}>
            {t('qrCode.title')}
          </Typography>
          <QrReaderContainer>
            <video ref={videoRef} />
          </QrReaderContainer>
          {scanError && (
            <Typography variant="body2" color="error" mt={2}>
              {scanError}
            </Typography>
          )}
          <ButtonContainer onClick={handleCancel} variant="contained">
            {t('modal.cancel')}
          </ButtonContainer>
        </QrContainer>
      </QrOverlay>
    </Modal>
  );
};

export default QRScanner;

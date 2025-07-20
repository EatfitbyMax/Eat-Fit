
// Mock pour expo-barcode-scanner sur web
export const BarCodeScanner = {
  requestPermissionsAsync: () => Promise.resolve({ status: 'denied' }),
  Constants: {
    BarCodeType: {
      qr: 'qr',
      ean13: 'ean13',
      ean8: 'ean8',
      code128: 'code128',
      code39: 'code39',
      code93: 'code93',
      codabar: 'codabar',
      datamatrix: 'datamatrix',
      aztec: 'aztec',
      interleaved2of5: 'interleaved2of5',
      itf14: 'itf14',
      pdf417: 'pdf417',
      upc_a: 'upc_a',
      upc_e: 'upc_e',
      upc_ean: 'upc_ean'
    }
  }
};

export default BarCodeScanner;

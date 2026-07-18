import { computed } from "vue";
import { Capacitor } from "@capacitor/core";
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";

// Only meaningful inside the Capacitor app — on the web build the scan
// button that calls scanBarcode() should not be rendered at all.
export function useBarcodeScanner() {
  const isSupported = computed(() => Capacitor.isNativePlatform());

  async function scanBarcode(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) return null;

    const status = await BarcodeScanner.checkPermissions();
    let camera = status.camera;
    if (camera !== "granted" && camera !== "limited") {
      camera = (await BarcodeScanner.requestPermissions()).camera;
    }
    if (camera !== "granted" && camera !== "limited") return null;

    const { barcodes } = await BarcodeScanner.scan();
    const [first] = barcodes;
    return first?.rawValue || first?.displayValue || null;
  }

  return { isSupported, scanBarcode };
}

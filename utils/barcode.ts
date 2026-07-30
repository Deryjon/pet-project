import JsBarcode from "jsbarcode";

export type BarcodeFormat = "CODE128" | "EAN13" | "EAN8";

export function detectBarcodeFormat(value: string): BarcodeFormat {
  if (/^\d{13}$/.test(value) || /^\d{12}$/.test(value)) return "EAN13";
  if (/^\d{8}$/.test(value)) return "EAN8";
  return "CODE128";
}

/**
 * Renders a real, scannable barcode to an SVG markup string on the client.
 * JsBarcode needs a live SVG element to draw into, so we build one off-DOM,
 * render into it, then serialize — same pattern as utils/qrcode.ts's uqr use.
 *
 * The SVG below gets stretched to fill an arbitrary box via
 * preserveAspectRatio="none" (safe for the bars — a uniform horizontal scale
 * keeps every module's ratio intact) but that same stretch visibly garbles
 * JsBarcode's own digit text if displayValue is on. Callers that need the
 * human-readable number in a box that isn't the SVG's natural aspect ratio
 * (price tags) should pass displayValue: false and render the number as a
 * separate plain-HTML text element instead; callers with a fixed-aspect box
 * (receipts) can leave displayValue on.
 */
export function renderBarcodeSvg(
  value: string,
  options?: { format?: BarcodeFormat; height?: number; displayValue?: boolean },
): string {
  const trimmed = value.trim();
  if (!trimmed || typeof document === "undefined") return "";

  const format = options?.format ?? detectBarcodeFormat(trimmed);
  const displayValue = options?.displayValue ?? true;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  try {
    JsBarcode(svg, trimmed, {
      format,
      height: options?.height ?? 40,
      displayValue,
      margin: 0,
      background: "transparent",
      lineColor: "#000000",
    });
  } catch {
    // invalid value for the chosen symbology (e.g. bad EAN13 checksum) — fall
    // back to CODE128, which accepts arbitrary text
    try {
      JsBarcode(svg, trimmed, {
        format: "CODE128",
        height: options?.height ?? 40,
        displayValue,
        margin: 0,
        background: "transparent",
        lineColor: "#000000",
      });
    } catch {
      return "";
    }
  }

  // JsBarcode sizes the SVG to its own natural width (module width × number
  // of bars, unrelated to the mm box it will be dropped into) and a fixed
  // pixel height. Without a viewBox, CSS `max-width` shrinks width and height
  // together (aspect-ratio preserved), which for a wide barcode squeezed into
  // a narrow template box produced a barely-visible sliver. Adding a viewBox
  // and stretching to 100%/100% lets the caller's container dictate the
  // final box exactly; scaling all bars by the same horizontal factor keeps
  // the barcode scannable even when non-uniform vs. its natural aspect ratio.
  const naturalWidth = svg.getAttribute("width");
  const naturalHeight = svg.getAttribute("height");
  if (naturalWidth && naturalHeight) {
    svg.setAttribute("viewBox", `0 0 ${parseFloat(naturalWidth)} ${parseFloat(naturalHeight)}`);
  }
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("preserveAspectRatio", "none");

  return new XMLSerializer().serializeToString(svg);
}

import { renderSVG } from "uqr";

export function renderQrSvg(
  data: string,
  options?: { pixelSize?: number; blackColor?: string; whiteColor?: string },
): string {
  if (!data.trim()) return "";
  return renderSVG(data, {
    ecc: "M",
    border: 1,
    pixelSize: options?.pixelSize ?? 6,
    blackColor: options?.blackColor ?? "#000000",
    whiteColor: options?.whiteColor ?? "transparent",
  });
}

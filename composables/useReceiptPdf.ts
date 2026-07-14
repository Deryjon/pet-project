const PX_PER_MM = 96 / 25.4;

/**
 * Renders the actual printed receipt DOM (same node window.print() uses) to
 * a PDF, instead of a plain-text summary — same layout, fonts and width as
 * what comes out of the thermal printer. Page height is sized to the
 * receipt's own content height since it's a roll strip, not an A4 sheet.
 */
export async function downloadReceiptPdf(element: HTMLElement, number: string) {
  if (!import.meta.client) return;

  const html2pdf = (await import("html2pdf.js")).default;
  const widthMm = element.offsetWidth / PX_PER_MM;
  const heightMm = element.scrollHeight / PX_PER_MM;

  await html2pdf()
    .set({
      margin: 0,
      filename: `receipt-${number}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        ignoreElements: (el: Element) => el.classList.contains("no-print"),
        // The receipt is normally shown inside a scrollable modal (max-height +
        // overflow so long receipts scroll on screen). html2canvas clones the
        // document to render it, so before it paints, strip any overflow/height
        // clipping from every ancestor in that clone — otherwise a receipt
        // taller than the modal would get silently cut off in the PDF too,
        // same failure mode as print without the @media print override.
        onclone: (clonedDoc: Document) => {
          clonedDoc.querySelectorAll<HTMLElement>("*").forEach((el) => {
            el.style.overflow = "visible";
            el.style.maxHeight = "none";
          });
        },
      },
      jsPDF: { unit: "mm", format: [widthMm, heightMm], orientation: "portrait" },
    })
    .from(element)
    .save();
}

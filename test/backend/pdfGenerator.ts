// backend/pdfGenerator.ts
import { PDFDocument, rgb } from "pdf-lib";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import { decode, encode } from "base64-arraybuffer";

export async function generateSHGPdfTest(): Promise<string> {
  try {
    // Load template
    const asset = Asset.fromModule(require("../assets/static.pdf"));
    await asset.downloadAsync();

    const templateBase64 = await FileSystem.readAsStringAsync(asset.localUri!, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const templateBytes = decode(templateBase64);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // ✅ Get page size
    const { width, height } = firstPage.getSize();

    // ✅ Write text at top-left, top-center, and top-right
    firstPage.drawText("TOP LEFT", {
      x: 20,
      y: height - 30,
      size: 18,
      color: rgb(1, 0, 0),
    });

    firstPage.drawText("TOP CENTER", {
      x: width / 2 - 50,
      y: height - 30,
      size: 18,
      color: rgb(0, 0.5, 0),
    });

    firstPage.drawText("TOP RIGHT", {
      x: width - 120,
      y: height - 30,
      size: 18,
      color: rgb(0, 0, 1),
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const outputPath = FileSystem.documentDirectory + "test_SHG.pdf";

    await FileSystem.writeAsStringAsync(
      outputPath,
      encode(pdfBytes.buffer),
      { encoding: FileSystem.EncodingType.Base64 }
    );

    return outputPath;
  } catch (err) {
    console.error("PDF test generation error:", err);
    throw err;
  }
}

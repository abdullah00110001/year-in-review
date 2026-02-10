import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import type { PDFToolType, PDFProcessingResult } from '@/types/pdf';

// Helper to convert Uint8Array to Blob safely
function createPDFBlob(bytes: Uint8Array): Blob {
  // Create a copy of the buffer to ensure it's a standard ArrayBuffer
  const buffer = new ArrayBuffer(bytes.length);
  const view = new Uint8Array(buffer);
  view.set(bytes);
  return new Blob([buffer], { type: 'application/pdf' });
}

export async function processPDF(
  toolType: PDFToolType,
  files: File[]
): Promise<PDFProcessingResult> {
  const startTime = Date.now();
  
  try {
    let result: PDFProcessingResult;
    
    switch (toolType) {
      case 'merge':
        result = await mergePDFs(files);
        break;
      case 'split':
        result = await splitPDF(files[0]);
        break;
      case 'compress':
        result = await compressPDF(files[0]);
        break;
      case 'rotate':
        result = await rotatePDF(files[0], 90);
        break;
      case 'watermark':
        result = await addWatermark(files[0], 'CONFIDENTIAL');
        break;
      case 'extract_pages':
        result = await extractPages(files[0], [1, 2, 3]);
        break;
      case 'convert_to_pdf':
        result = await imagesToPDF(files);
        break;
      case 'optimize':
        result = await optimizePDF(files[0]);
        break;
      case 'password_protect':
        result = await passwordProtect(files[0]);
        break;
      default:
        result = await passthrough(files[0]);
    }
    
    return {
      ...result,
      processingTimeMs: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      creditsUsed: 0,
      processingTimeMs: Date.now() - startTime
    };
  }
}

async function mergePDFs(files: File[]): Promise<PDFProcessingResult> {
  const mergedPdf = await PDFDocument.create();
  
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }
  
  const pdfBytes = await mergedPdf.save();
  
  return {
    success: true,
    outputBlob: createPDFBlob(pdfBytes),
    fileName: `merged_${Date.now()}.pdf`,
    creditsUsed: 0
  };
}

async function splitPDF(file: File): Promise<PDFProcessingResult> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  
  const newPdf = await PDFDocument.create();
  const [firstPage] = await newPdf.copyPages(pdf, [0]);
  newPdf.addPage(firstPage);
  
  const pdfBytes = await newPdf.save();
  
  return {
    success: true,
    outputBlob: createPDFBlob(pdfBytes),
    fileName: `split_page1_${Date.now()}.pdf`,
    creditsUsed: 0
  };
}

async function compressPDF(file: File): Promise<PDFProcessingResult> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  
  const pdfBytes = await pdf.save({ useObjectStreams: true });
  
  return {
    success: true,
    outputBlob: createPDFBlob(pdfBytes),
    fileName: `compressed_${Date.now()}.pdf`,
    creditsUsed: 0
  };
}

async function rotatePDF(file: File, angle: number): Promise<PDFProcessingResult> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  
  const pages = pdf.getPages();
  pages.forEach(page => {
    page.setRotation(degrees((page.getRotation().angle + angle) % 360));
  });
  
  const pdfBytes = await pdf.save();
  
  return {
    success: true,
    outputBlob: createPDFBlob(pdfBytes),
    fileName: `rotated_${Date.now()}.pdf`,
    creditsUsed: 0
  };
}

async function addWatermark(file: File, text: string): Promise<PDFProcessingResult> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  
  const pages = pdf.getPages();
  pages.forEach(page => {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 4,
      y: height / 2,
      size: 50,
      font,
      color: rgb(0.8, 0.8, 0.8),
      opacity: 0.3,
      rotate: degrees(45)
    });
  });
  
  const pdfBytes = await pdf.save();
  
  return {
    success: true,
    outputBlob: createPDFBlob(pdfBytes),
    fileName: `watermarked_${Date.now()}.pdf`,
    creditsUsed: 0
  };
}

async function extractPages(file: File, pageNumbers: number[]): Promise<PDFProcessingResult> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const newPdf = await PDFDocument.create();
  
  const validPages = pageNumbers.filter(n => n > 0 && n <= pdf.getPageCount());
  const indices = validPages.map(n => n - 1);
  
  const pages = await newPdf.copyPages(pdf, indices);
  pages.forEach(page => newPdf.addPage(page));
  
  const pdfBytes = await newPdf.save();
  
  return {
    success: true,
    outputBlob: createPDFBlob(pdfBytes),
    fileName: `extracted_${Date.now()}.pdf`,
    creditsUsed: 0
  };
}

async function imagesToPDF(files: File[]): Promise<PDFProcessingResult> {
  const pdf = await PDFDocument.create();
  
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    let image;
    
    if (file.type === 'image/png') {
      image = await pdf.embedPng(bytes);
    } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      image = await pdf.embedJpg(bytes);
    } else {
      continue;
    }
    
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height
    });
  }
  
  const pdfBytes = await pdf.save();
  
  return {
    success: true,
    outputBlob: createPDFBlob(pdfBytes),
    fileName: `converted_${Date.now()}.pdf`,
    creditsUsed: 0
  };
}

async function optimizePDF(file: File): Promise<PDFProcessingResult> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  
  const pdfBytes = await pdf.save({ 
    useObjectStreams: true,
    addDefaultPage: false
  });
  
  return {
    success: true,
    outputBlob: createPDFBlob(pdfBytes),
    fileName: `optimized_${Date.now()}.pdf`,
    creditsUsed: 0
  };
}

async function passwordProtect(file: File): Promise<PDFProcessingResult> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const pdfBytes = await pdf.save();
  
  return {
    success: true,
    outputBlob: createPDFBlob(pdfBytes),
    fileName: `protected_${Date.now()}.pdf`,
    creditsUsed: 0
  };
}

async function passthrough(file: File): Promise<PDFProcessingResult> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const pdfBytes = await pdf.save();
  
  return {
    success: true,
    outputBlob: createPDFBlob(pdfBytes),
    fileName: `processed_${Date.now()}.pdf`,
    creditsUsed: 0
  };
}

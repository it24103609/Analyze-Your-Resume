import { NextResponse } from 'next/server';
import { summarizeSections, detectSections } from '@/lib/analyzer';

async function extractResumeText(file) {
  const originalName = file.name || 'resume';
  const ext = originalName.split('.').pop().toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (ext === 'pdf' || file.type === 'application/pdf') {
    // Dynamic import avoids ESM/CJS mismatch at build time
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);
    return { text: result.text || '', fileType: 'PDF' };
  }

  if (ext === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value || '', fileType: 'DOCX' };
  }

  if (ext === 'doc' || file.type === 'application/msword') {
    const WordExtractor = (await import('word-extractor')).default;
    const extractor = new WordExtractor();
    const doc = await extractor.extract(buffer);
    return { text: doc.getBody() || '', fileType: 'DOC' };
  }

  throw new Error('Unsupported file type. Please upload PDF, DOC, or DOCX.');
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const resumeFile = formData.get('resume');
    const jobDescription = formData.get('jobDescription');

    if (!resumeFile || !(resumeFile instanceof File)) {
      return NextResponse.json({ error: 'Please upload a resume file.' }, { status: 400 });
    }

    const jobDescriptionText = typeof jobDescription === 'string' ? jobDescription.trim() : '';

    const parsed = await extractResumeText(resumeFile);
    const result = summarizeSections(parsed.text, detectSections(parsed.text), jobDescriptionText);

    return NextResponse.json({
      ...result,
      fileName: resumeFile.name,
      fileType: parsed.fileType,
      fileSize: resumeFile.size,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze resume.' }, { status: 500 });
  }
}

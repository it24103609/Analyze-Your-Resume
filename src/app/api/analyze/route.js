import { NextResponse } from 'next/server';
const pdfParseLib = require('pdf-parse');
const pdfParse = pdfParseLib.default || pdfParseLib;
const mammoth = require('mammoth');
const WordExtractor = require('word-extractor');
import { summarizeSections, detectSections } from '@/lib/analyzer';
const path = require('path');

const extractor = new WordExtractor();

async function extractResumeText(file) {
  const originalName = file.name || 'resume';
  const extension = path.extname(originalName).toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (extension === '.pdf' || file.type === 'application/pdf') {
    const result = await pdfParse(buffer);
    return { text: result.text || '', fileType: 'PDF' };
  }

  if (extension === '.docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer: buffer });
    return { text: result.value || '', fileType: 'DOCX' };
  }

  if (extension === '.doc' || file.type === 'application/msword') {
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
    return NextResponse.json({ error: error.message || 'Failed to analyze resume.' }, { status: 400 });
  }
}

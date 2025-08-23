import { type Quiz, type Question } from '../schema';

export const exportQuizToPDF = async (quiz: Quiz, questions: Question[]): Promise<Buffer> => {
  try {
    // Create a minimal valid PDF content as a string
    const quizName = quiz.name.replace(/[()]/g, '');
    const dateString = quiz.created_at.toISOString().split('T')[0];
    
    let pdfTextContent = `Quiz: ${quizName}\n`;
    pdfTextContent += `Created: ${dateString}\n\n`;
    
    questions.forEach((question, index) => {
      const questionText = question.text.replace(/[()]/g, '');
      const answerText = question.answer.replace(/[()]/g, '');
      
      pdfTextContent += `Question ${index + 1}: ${questionText}\n`;
      pdfTextContent += `Answer: ${answerText}\n\n`;
    });
    
    // Create a minimal PDF structure
    const pdfString = `%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 100 >>\nstream\nBT/F1 12 Tf 72 720 Td (${pdfTextContent}) Tj ET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000015 00000 n \n0000000065 00000 n \n0000000120 00000 n \n0000000257 00000 n \n0000000340 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n420\n%%EOF`;
    
    // Convert to Buffer
    return Buffer.from(pdfString, 'binary');
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

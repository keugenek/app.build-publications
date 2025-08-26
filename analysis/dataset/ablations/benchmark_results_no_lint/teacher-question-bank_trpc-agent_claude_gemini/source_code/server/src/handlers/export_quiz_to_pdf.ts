import { db } from '../db';
import { quizzesTable, quizQuestionsTable, questionsTable } from '../db/schema';
import { type ExportQuizToPdfInput } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function exportQuizToPdf(input: ExportQuizToPdfInput): Promise<Buffer> {
  try {
    // Fetch the quiz with its questions ordered by order_index
    const quizResults = await db.select({
      quiz: quizzesTable,
      question: questionsTable,
      order_index: quizQuestionsTable.order_index
    })
      .from(quizzesTable)
      .innerJoin(quizQuestionsTable, eq(quizzesTable.id, quizQuestionsTable.quiz_id))
      .innerJoin(questionsTable, eq(quizQuestionsTable.question_id, questionsTable.id))
      .where(eq(quizzesTable.id, input.quiz_id))
      .orderBy(asc(quizQuestionsTable.order_index))
      .execute();

    if (quizResults.length === 0) {
      throw new Error(`Quiz with id ${input.quiz_id} not found`);
    }

    const quiz = quizResults[0].quiz;
    const questions = quizResults.map(result => result.question);

    // Generate PDF content as a simple text-based PDF
    let pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R`;

    // Add answer page reference if including answers
    if (input.include_answers) {
      pdfContent += ` 5 0 R`;
    }

    pdfContent += `]
/Count ${input.include_answers ? '2' : '1'}
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length `;

    // Build quiz content
    let pageContent = `BT
/F1 14 Tf
50 720 Td
(${quiz.title.replace(/[()\\]/g, '\\$&')}) Tj
0 -30 Td
/F1 12 Tf
(Total Questions: ${questions.length}) Tj
0 -20 Td
(Instructions: Answer all questions clearly. Show your work where applicable.) Tj
0 -30 Td
`;

    let yOffset = -30;
    questions.forEach((question, index) => {
      // Question number and text
      pageContent += `/F1 12 Tf
0 ${yOffset} Td
(${index + 1}. ${question.question_text.replace(/[()\\]/g, '\\$&')}) Tj
`;
      yOffset -= 40;
      
      // Add answer lines if not including answers
      if (!input.include_answers) {
        for (let i = 0; i < 3; i++) {
          pageContent += `0 ${yOffset} Td
(_________________________________) Tj
`;
          yOffset -= 15;
        }
      }
      yOffset -= 10; // Extra space between questions
    });

    pageContent += `ET`;

    const contentLength = Buffer.byteLength(pageContent, 'utf8');
    pdfContent += `${contentLength}
>>
stream
${pageContent}
endstream
endobj

`;

    // Add answer page if requested
    if (input.include_answers) {
      let answerPageContent = `BT
/F1 16 Tf
50 720 Td
(ANSWER KEY) Tj
0 -40 Td
/F1 12 Tf
`;

      let answerYOffset = -20;
      questions.forEach((question, index) => {
        answerPageContent += `0 ${answerYOffset} Td
(${index + 1}. ${question.answer_text.replace(/[()\\]/g, '\\$&')}) Tj
`;
        answerYOffset -= 30;
      });

      answerPageContent += `ET`;

      const answerContentLength = Buffer.byteLength(answerPageContent, 'utf8');
      
      pdfContent += `5 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 6 0 R
>>
endobj

6 0 obj
<<
/Length ${answerContentLength}
>>
stream
${answerPageContent}
endstream
endobj

`;
    }

    // Calculate cross-reference table
    const lines = pdfContent.split('\n');
    const xrefEntries: string[] = ['0000000000 65535 f '];
    let currentOffset = 0;
    let objCount = 1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^\d+ 0 obj$/)) {
        const paddedOffset = currentOffset.toString().padStart(10, '0');
        xrefEntries.push(`${paddedOffset} 00000 n `);
        objCount++;
      }
      currentOffset += Buffer.byteLength(lines[i] + '\n', 'utf8');
    }

    const xrefOffset = currentOffset;

    // Complete PDF with cross-reference table
    pdfContent += `xref
0 ${objCount}
${xrefEntries.join('\n')}

trailer
<<
/Size ${objCount}
/Root 1 0 R
>>
startxref
${xrefOffset}
%%EOF`;

    return Buffer.from(pdfContent, 'utf8');
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}

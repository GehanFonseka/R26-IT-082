import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const parseResume = async (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    let text = '';

    // Check file type
    if (filePath.endsWith('.pdf')) {
      const pdfData = await pdfParse(fileBuffer);
      text = pdfData.text;
    } else if (filePath.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      text = result.value;
    } else {
      throw new Error('Unsupported file format');
    }


    const extractedSkills = parseSkills(text);
    const extractedExperience = parseExperience(text);
    const extractedEducation = parseEducation(text);

    return {
      text,
      extractedSkills,
      extractedExperience,
      extractedEducation,
    };
  } catch (error) {
    console.error('Resume parsing error:', error);
    throw error;
  }
};


const parseSkills = (text) => {
  const commonSkills = [
    'javascript',
    'typescript',
    'python',
    'java',
    'cpp',
    'csharp',
    'php',
    'ruby',
    'go',
    'rust',
    'swift',
    'kotlin',
    'react',
    'angular',
    'vue',
    'nodejs',
    'express',
    'django',
    'flask',
    'spring',
    'fastapi',
    'mongodb',
    'mysql',
    'postgresql',
    'redis',
    'elasticsearch',
    'aws',
    'azure',
    'gcp',
    'docker',
    'kubernetes',
    'git',
    'ci/cd',
    'rest',
    'graphql',
    'websockets',
    'html',
    'css',
    'sass',
    'tailwind',
    'bootstrap',
    'webpack',
    'babel',
    'jest',
    'testing',
  ];

  const lowerText = text.toLowerCase();
  const foundSkills = commonSkills.filter(skill => lowerText.includes(skill));


  return [...new Set(foundSkills)];
};

const parseExperience = (text) => {

  const patterns = [
    /(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+)?experience/i,
    /experience:\s*(\d+)\+?\s*(?:years?|yrs?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] + ' years';
    }
  }

  return 'Not specified';
};

const parseEducation = (text) => {
  const educationPatterns = [
    /(?:bachelor|bsc|b\.s\.|b\.a\.|b\.e\.|btech|b\.tech)/i,
    /(?:master|msc|m\.s\.|m\.a\.|m\.e\.|mtech|m\.tech)/i,
    /(?:phd|doctorate|doctoral)/i,
    /(?:diploma|associate)/i,
  ];

  for (const pattern of educationPatterns) {
    if (pattern.test(text)) {
      return text.match(pattern)[0];
    }
  }

  return 'Not specified';
};

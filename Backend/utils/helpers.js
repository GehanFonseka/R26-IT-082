import jwt from 'jsonwebtoken';

export const validateEmail = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const parseJwt = (token) => {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch (error) {
    return null;
  }
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Parses resume file and extracts candidate details.
 * This is a mock implementation that simulates resume parsing.
 * In production, use libraries like pdf-parse, docx, or tesseract for real parsing.
 * @param {Buffer} fileBuffer - The uploaded resume file buffer.
 * @param {string} fileType - The type of the uploaded file (e.g., application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document).
 * @returns {Promise<Object>} - Parsed candidate details.
 */
export const parseResume = async (fileBuffer, fileType) => {
  try {
    // Mock resume parsing - extracts simulated data from buffer
    // In production, use real PDF/DOCX parsing libraries
    const resumeText = fileBuffer.toString('utf-8').substring(0, 1000);
    
    // Mock extracted data
    const parsedData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS', 'Docker'],
      experience: [
        {
          title: 'Senior Developer',
          company: 'Tech Company',
          duration: '2020 - Present',
          description: '3+ years of experience in full-stack development',
        },
      ],
      education: [
        {
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          institution: 'University Name',
          year: 2020,
        },
      ],
      summary: 'Experienced full-stack developer with expertise in modern web technologies',
      parsedDate: new Date(),
    };

    return parsedData;
  } catch (error) {
    throw new Error('Failed to parse resume: ' + error.message);
  }
};

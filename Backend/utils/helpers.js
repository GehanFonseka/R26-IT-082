import jwt from 'jsonwebtoken';

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets minimum requirements
 */
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Parse JWT token and extract payload
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const parseJwt = (token) => {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch (error) {
    return null;
  }
};

/**
 * Format date to locale string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format time to locale string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Async error handling middleware wrapper
 * @param {Function} fn - Express route handler
 * @returns {Function} Wrapped handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Parse resume file and extract candidate details
 * Note: This is a mock implementation. In production, use libraries like pdf-parse or docx
 * @param {Buffer} fileBuffer - Uploaded resume file buffer
 * @param {string} fileType - MIME type of uploaded file
 * @returns {Promise<Object>} Parsed candidate details
 * @throws {Error} If parsing fails
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

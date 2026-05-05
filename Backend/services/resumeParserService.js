import fs from 'fs';
import path from 'path';
import { parseResume as parseResumeUtil } from '../utils/helpers.js';
import CandidateProfile from '../models/CandidateProfile.js';

/**
 * Parses a resume file and extracts candidate details.
 * @param {Buffer} fileBuffer - The uploaded resume file buffer.
 * @param {string} fileType - The type of the uploaded file (e.g., PDF, DOCX).
 * @returns {Promise<Object>} - Parsed candidate details.
 */
async function parseResumeFile(fileBuffer, fileType) {
  try {
    const parsedData = await parseResumeUtil(fileBuffer, fileType);
    return parsedData;
  } catch (error) {
    throw new Error('Error parsing resume: ' + error.message);
  }
}

/**
 * Saves parsed resume data to the database.
 * @param {Object} parsedData - The parsed candidate details.
 * @returns {Promise<Object>} - The saved candidate profile.
 */
async function saveParsedDataToDB(parsedData) {
  try {
    const candidateProfile = new CandidateProfile(parsedData);
    await candidateProfile.save();
    return candidateProfile;
  } catch (error) {
    throw new Error('Error saving parsed data to database: ' + error.message);
  }
}

// Re-export parseResume for backward compatibility
export const parseResume = parseResumeUtil;
export {
  parseResumeFile,
  saveParsedDataToDB,
};

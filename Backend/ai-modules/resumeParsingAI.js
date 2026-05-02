/**
 * AI Module 1: Intelligent Resume Parsing & Skill Analysis
 * Features:
 * - Extracts structured data from resumes
 * - Identifies skills, experience, education with proficiency levels
 * - Calculates skill proficiency levels based on context
 * - NLP-based keyword extraction
 */

import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

// Comprehensive skill database with proficiency levels
const skillDatabase = {
  programming_languages: {
    javascript: { category: 'Programming Language', proficiency: 'advanced' },
    typescript: { category: 'Programming Language', proficiency: 'advanced' },
    python: { category: 'Programming Language', proficiency: 'advanced' },
    java: { category: 'Programming Language', proficiency: 'advanced' },
    cpp: { category: 'Programming Language', proficiency: 'advanced' },
    csharp: { category: 'Programming Language', proficiency: 'advanced' },
    php: { category: 'Programming Language', proficiency: 'advanced' },
    ruby: { category: 'Programming Language', proficiency: 'advanced' },
    go: { category: 'Programming Language', proficiency: 'advanced' },
    rust: { category: 'Programming Language', proficiency: 'advanced' },
    kotlin: { category: 'Programming Language', proficiency: 'advanced' },
    swift: { category: 'Programming Language', proficiency: 'advanced' },
  },
  frontend_frameworks: {
    react: { category: 'Frontend Framework', proficiency: 'advanced' },
    angular: { category: 'Frontend Framework', proficiency: 'advanced' },
    vue: { category: 'Frontend Framework', proficiency: 'advanced' },
    nextjs: { category: 'Frontend Framework', proficiency: 'advanced' },
    svelte: { category: 'Frontend Framework', proficiency: 'advanced' },
  },
  backend_frameworks: {
    nodejs: { category: 'Backend Framework', proficiency: 'advanced' },
    express: { category: 'Backend Framework', proficiency: 'advanced' },
    django: { category: 'Backend Framework', proficiency: 'advanced' },
    flask: { category: 'Backend Framework', proficiency: 'intermediate' },
    spring: { category: 'Backend Framework', proficiency: 'advanced' },
    fastapi: { category: 'Backend Framework', proficiency: 'advanced' },
    nestjs: { category: 'Backend Framework', proficiency: 'advanced' },
  },
  databases: {
    mongodb: { category: 'Database', proficiency: 'advanced' },
    mysql: { category: 'Database', proficiency: 'advanced' },
    postgresql: { category: 'Database', proficiency: 'advanced' },
    redis: { category: 'Database', proficiency: 'intermediate' },
    elasticsearch: { category: 'Database', proficiency: 'intermediate' },
    firebase: { category: 'Database', proficiency: 'intermediate' },
  },
  cloud_platforms: {
    aws: { category: 'Cloud Platform', proficiency: 'advanced' },
    azure: { category: 'Cloud Platform', proficiency: 'advanced' },
    gcp: { category: 'Cloud Platform', proficiency: 'intermediate' },
  },
  devops: {
    docker: { category: 'DevOps', proficiency: 'advanced' },
    kubernetes: { category: 'DevOps', proficiency: 'advanced' },
    'ci/cd': { category: 'DevOps', proficiency: 'advanced' },
    jenkins: { category: 'DevOps', proficiency: 'intermediate' },
    gitlab: { category: 'DevOps', proficiency: 'intermediate' },
    github: { category: 'DevOps', proficiency: 'advanced' },
  },
  tools_and_technologies: {
    git: { category: 'Tools', proficiency: 'advanced' },
    rest: { category: 'Tools', proficiency: 'advanced' },
    graphql: { category: 'Tools', proficiency: 'intermediate' },
    websockets: { category: 'Tools', proficiency: 'intermediate' },
    html: { category: 'Tools', proficiency: 'advanced' },
    css: { category: 'Tools', proficiency: 'advanced' },
    sass: { category: 'Tools', proficiency: 'intermediate' },
    tailwind: { category: 'Tools', proficiency: 'intermediate' },
    bootstrap: { category: 'Tools', proficiency: 'intermediate' },
  },
  testing: {
    jest: { category: 'Testing', proficiency: 'intermediate' },
    mocha: { category: 'Testing', proficiency: 'intermediate' },
    testing: { category: 'Testing', proficiency: 'intermediate' },
    selenium: { category: 'Testing', proficiency: 'intermediate' },
    pytest: { category: 'Testing', proficiency: 'intermediate' },
  },
  ai_ml: {
    tensorflow: { category: 'AI/ML', proficiency: 'advanced' },
    pytorch: { category: 'AI/ML', proficiency: 'advanced' },
    scikit_learn: { category: 'AI/ML', proficiency: 'intermediate' },
    keras: { category: 'AI/ML', proficiency: 'intermediate' },
    nlp: { category: 'AI/ML', proficiency: 'intermediate' },
    'machine learning': { category: 'AI/ML', proficiency: 'intermediate' },
  },
};

/**
 * Parse resume from file and extract structured information
 */
export const parseResumeFile = async (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    let text = '';

    // Extract text based on file type
    if (filePath.endsWith('.pdf')) {
      const pdfData = await pdfParse(fileBuffer);
      text = pdfData.text;
    } else if (filePath.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      text = result.value;
    } else {
      throw new Error('Unsupported file format. Please upload PDF or DOCX.');
    }

    // Extract structured data
    const extractedData = extractStructuredData(text);

    return {
      success: true,
      rawText: text,
      structuredData: extractedData,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Resume parsing error:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date(),
    };
  }
};

/**
 * Extract structured data from resume text
 */
const extractStructuredData = (text) => {
  return {
    skills: extractSkillsWithProficiency(text),
    experience: extractExperience(text),
    education: extractEducation(text),
    certifications: extractCertifications(text),
    projects: extractProjects(text),
    contactInfo: extractContactInfo(text),
    summary: extractSummary(text),
  };
};

/**
 * Extract skills with proficiency levels
 */
const extractSkillsWithProficiency = (text) => {
  const lowerText = text.toLowerCase();
  const extractedSkills = new Map();

  // Flatten all skills from skill database
  const allSkills = Object.values(skillDatabase).flatMap(category =>
    Object.keys(category)
  );

  // Find matching skills in text
  for (const skill of allSkills) {
    const skillLower = skill.toLowerCase();
    if (lowerText.includes(skillLower)) {
      const skillInfo = getSkillInfo(skill);

      // Determine proficiency level based on context
      const proficiency = determineProficiencyLevel(text, skill);

      extractedSkills.set(skill, {
        ...skillInfo,
        proficiency,
        mentioned_count: (lowerText.match(new RegExp(skillLower, 'g')) || []).length,
      });
    }
  }

  // Convert to array and sort by category
  return Array.from(extractedSkills.entries()).map(([skill, info]) => ({
    skill,
    ...info,
  })).sort((a, b) => {
    // Sort by proficiency (advanced first), then by category
    const proficiencyOrder = { advanced: 0, intermediate: 1, beginner: 2 };
    const profDiff = proficiencyOrder[a.proficiency] - proficiencyOrder[b.proficiency];
    return profDiff !== 0 ? profDiff : a.category.localeCompare(b.category);
  });
};

/**
 * Get skill information from database
 */
const getSkillInfo = (skill) => {
  for (const category of Object.values(skillDatabase)) {
    if (skill in category) {
      return category[skill];
    }
  }
  return { category: 'Other', proficiency: 'beginner' };
};

/**
 * Determine proficiency level based on context
 */
const determineProficiencyLevel = (text, skill) => {
  const lowerText = text.toLowerCase();
  const skillLower = skill.toLowerCase();

  // Keywords indicating proficiency level
  const advancedKeywords = ['expert', 'proficient', 'advanced', 'mastered', 'proficiency', 'extensive'];
  const intermediateKeywords = ['experienced', 'familiar', 'worked with', 'used'];
  const beginnerKeywords = ['learning', 'beginner', 'basic', 'knowledge of'];

  // Find context around skill mention
  const skillIndex = lowerText.indexOf(skillLower);
  if (skillIndex === -1) return 'beginner';

  const contextStart = Math.max(0, skillIndex - 100);
  const contextEnd = Math.min(lowerText.length, skillIndex + 100);
  const context = lowerText.substring(contextStart, contextEnd);

  // Check for proficiency indicators
  for (const keyword of advancedKeywords) {
    if (context.includes(keyword)) return 'advanced';
  }
  for (const keyword of intermediateKeywords) {
    if (context.includes(keyword)) return 'intermediate';
  }
  for (const keyword of beginnerKeywords) {
    if (context.includes(keyword)) return 'beginner';
  }

  // Default to intermediate if skill appears multiple times
  const mentions = (lowerText.match(new RegExp(skillLower, 'g')) || []).length;
  return mentions > 2 ? 'intermediate' : 'beginner';
};

/**
 * Extract experience information
 */
const extractExperience = (text) => {
  const patterns = [
    /(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+)?experience/i,
    /experience:\s*(\d+)\+?\s*(?:years?|yrs?)/i,
    /(\d+)\+?\s*(?:years?|yrs?)\s+in\s+(?:the\s+)?(?:field|industry)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        years: parseInt(match[1]),
        level: determineExperienceLevel(parseInt(match[1])),
        description: match[0],
      };
    }
  }

  return {
    years: 0,
    level: 'entry_level',
    description: 'Not specified',
  };
};

/**
 * Determine experience level
 */
const determineExperienceLevel = (years) => {
  if (years < 1) return 'entry_level';
  if (years < 3) return 'junior';
  if (years < 6) return 'mid_level';
  if (years < 10) return 'senior';
  return 'lead';
};

/**
 * Extract education information
 */
const extractEducation = (text) => {
  const educationPatterns = [
    { pattern: /(?:bachelor|bsc|b\.s\.|b\.a\.|b\.e\.|btech|b\.tech)/i, level: 'Bachelor' },
    { pattern: /(?:master|msc|m\.s\.|m\.a\.|m\.e\.|mtech|m\.tech)/i, level: 'Master' },
    { pattern: /(?:phd|doctorate|doctoral)/i, level: 'PhD' },
    { pattern: /(?:diploma|associate)/i, level: 'Diploma' },
  ];

  const foundEducation = [];
  for (const item of educationPatterns) {
    if (item.pattern.test(text)) {
      foundEducation.push({
        level: item.level,
        match: text.match(item.pattern)[0],
      });
    }
  }

  return foundEducation.length > 0 ? foundEducation : [{ level: 'Not specified', match: '' }];
};

/**
 * Extract certifications
 */
const extractCertifications = (text) => {
  const certPatterns = [
    /(?:aws|gcp|azure)\s+(?:certified|certification)/i,
    /(?:cissp|scrum|pmp|ica|cpa|cfa)/i,
    /certified\s+(?:developer|engineer|architect)/i,
  ];

  const certifications = [];
  for (const pattern of certPatterns) {
    const matches = text.match(new RegExp(pattern, 'g'));
    if (matches) {
      certifications.push(...matches.map(m => ({ certification: m })));
    }
  }

  return certifications;
};

/**
 * Extract projects
 */
const extractProjects = (text) => {
  const projectKeywords = ['project', 'built', 'developed', 'created', 'designed'];
  const projects = [];
  const sentences = text.split(/[.!?]/);

  for (const sentence of sentences) {
    if (projectKeywords.some(kw => sentence.toLowerCase().includes(kw))) {
      if (sentence.trim().length > 20) {
        projects.push({
          description: sentence.trim(),
        });
      }
    }
  }

  return projects.slice(0, 5); // Return top 5 projects
};

/**
 * Extract contact information
 */
const extractContactInfo = (text) => {
  const contactInfo = {};

  // Email
  const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  if (emailMatch) contactInfo.email = emailMatch[0];

  // Phone
  const phoneMatch = text.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) contactInfo.phone = phoneMatch[0];

  // LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w\-]+/i);
  if (linkedinMatch) contactInfo.linkedin = linkedinMatch[0];

  // GitHub
  const githubMatch = text.match(/github\.com\/[\w\-]+/i);
  if (githubMatch) contactInfo.github = githubMatch[0];

  return contactInfo;
};

/**
 * Extract professional summary
 */
const extractSummary = (text) => {
  const summaryKeywords = ['summary', 'objective', 'professional profile', 'about'];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (summaryKeywords.some(kw => line.includes(kw))) {
      // Get next 2-3 lines as summary
      const summary = lines.slice(i + 1, i + 3).join(' ').trim();
      if (summary.length > 50) {
        return summary.substring(0, 500);
      }
    }
  }

  // If no summary found, use first paragraph
  const firstParagraph = text.split('\n\n')[0];
  return firstParagraph.substring(0, 500);
};

/**
 * Calculate overall skill score (0-100)
 */
export const calculateSkillScore = (skills) => {
  if (!skills || skills.length === 0) return 0;

  const proficiencyWeights = { advanced: 3, intermediate: 2, beginner: 1 };
  const totalWeight = skills.reduce((sum, skill) => {
    return sum + (proficiencyWeights[skill.proficiency] || 1);
  }, 0);

  const maxPossibleWeight = skills.length * 3;
  return Math.round((totalWeight / maxPossibleWeight) * 100);
};

/**
 * Get skill recommendations based on current skills
 */
export const getSkillRecommendations = (currentSkills) => {
  const skillList = currentSkills.map(s => s.skill.toLowerCase());
  const recommendations = [];

  // If has JavaScript, recommend TypeScript
  if (skillList.includes('javascript') && !skillList.includes('typescript')) {
    recommendations.push({ skill: 'TypeScript', reason: 'Enhance JavaScript skills with type safety' });
  }

  // If has React, recommend Next.js
  if (skillList.includes('react') && !skillList.includes('nextjs')) {
    recommendations.push({ skill: 'Next.js', reason: 'Build full-stack applications with React' });
  }

  // If has Node.js, recommend Express
  if (skillList.includes('nodejs') && !skillList.includes('express')) {
    recommendations.push({ skill: 'Express', reason: 'Master backend framework for Node.js' });
  }

  // If has Docker, recommend Kubernetes
  if (skillList.includes('docker') && !skillList.includes('kubernetes')) {
    recommendations.push({ skill: 'Kubernetes', reason: 'Manage containerized applications at scale' });
  }

  // AI/ML recommendations
  if (!skillList.some(s => s.includes('python'))) {
    recommendations.push({ skill: 'Python', reason: 'Essential for AI/ML and data science' });
  }

  return recommendations.slice(0, 5);
};

export default {
  parseResumeFile,
  extractStructuredData,
  calculateSkillScore,
  getSkillRecommendations,
};

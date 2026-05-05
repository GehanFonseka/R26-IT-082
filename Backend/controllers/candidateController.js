import CandidateProfile from '../models/CandidateProfile.js';
import { parseResume } from '../services/resumeParserService.js';
import { parseResumeFile, calculateSkillScore, getSkillRecommendations } from '../ai-modules/resumeParsingAI.js';

export const createOrUpdateProfile = async (req, res) => {
  try {
    const { skills, education, experience, location, bio, phone, github, portfolio } = req.body;

    let profile = await CandidateProfile.findOne({ userId: req.userId });

    if (!profile) {
      profile = new CandidateProfile({ userId: req.userId });
    }

    // Update fields
    if (skills) profile.skills = Array.isArray(skills) ? skills : [skills];
    if (education) profile.education = education;
    if (experience) profile.experience = experience;
    if (location) profile.location = location;
    if (bio) profile.bio = bio;
    if (phone) profile.phone = phone;
    if (github) profile.github = github;
    if (portfolio) profile.portfolio = portfolio;

    // Handle file upload - Use AI Module 1 for intelligent parsing
    if (req.file) {
      profile.resumeFileName = req.file.filename;
      profile.resumeUrl = `/uploads/${req.file.filename}`;

      // Parse resume using AI Module 1 with advanced NLP
      try {
        const parsedResult = await parseResumeFile(req.file.path);
        
        if (parsedResult.success) {
          const structuredData = parsedResult.structuredData;
          
          // Extract and store structured resume data
          profile.parsedResume = {
            text: parsedResult.rawText,
            extractedSkills: structuredData.skills.map(s => s.skill),
            extractedExperience: structuredData.experience.description,
            extractedEducation: structuredData.education.map(e => e.level).join(', '),
            certifications: structuredData.certifications,
            projects: structuredData.projects,
            contactInfo: structuredData.contactInfo,
            summary: structuredData.summary,
          };
          
          // Auto-extract and enrich skills with proficiency levels
          const extractedSkills = structuredData.skills;
          if (extractedSkills && extractedSkills.length > 0 && !skills) {
            profile.skills = [...new Set([
              ...profile.skills, 
              ...extractedSkills.map(s => s.skill)
            ])];
          }
          
          // Auto-extract experience if not provided
          if (structuredData.experience.years > 0 && !experience) {
            profile.experience = structuredData.experience.years;
          }
          
          // Auto-extract education if not provided
          if (structuredData.education.length > 0 && !education) {
            profile.education = structuredData.education[0].level;
          }
          
          // Calculate skill score (0-100)
          profile.skillScore = calculateSkillScore(extractedSkills);
          
          // Get skill recommendations
          profile.skillRecommendations = getSkillRecommendations(extractedSkills);
          
          // Store detailed skill analysis
          profile.skillAnalysis = {
            totalSkills: extractedSkills.length,
            advancedSkills: extractedSkills.filter(s => s.proficiency === 'advanced').length,
            intermediateSkills: extractedSkills.filter(s => s.proficiency === 'intermediate').length,
            beginnerSkills: extractedSkills.filter(s => s.proficiency === 'beginner').length,
            skillsByCategory: extractedSkills.reduce((acc, skill) => {
              if (!acc[skill.category]) acc[skill.category] = [];
              acc[skill.category].push(skill);
              return acc;
            }, {}),
          };
        } else {
          console.error('Resume parsing failed:', parsedResult.error);
        }
      } catch (parseError) {
        console.error('Resume parsing error:', parseError);
      }
    }

    await profile.save();
    
    // Prepare response with enriched profile data
    const response = {
      message: 'Profile updated with AI-powered analysis',
      profile: {
        ...profile.toObject(),
        insights: profile.skillScore ? {
          skillScore: profile.skillScore,
          skillRecommendations: profile.skillRecommendations,
          experienceLevel: profile.experience < 2 ? 'Junior' : profile.experience < 5 ? 'Mid-level' : 'Senior',
        } : null,
      },
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Create/update profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(200).json({ profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfileById = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.params.userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(200).json({ profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let profile = await CandidateProfile.findOne({ userId: req.userId });
    if (!profile) {
      profile = new CandidateProfile({ userId: req.userId });
    }

    profile.resumeFileName = req.file.filename;
    profile.resumeUrl = `/uploads/${req.file.filename}`;

    // Parse resume
    const parsedData = await parseResume(req.file.path);
    profile.parsedResume = parsedData;

    await profile.save();
    res.status(200).json({ message: 'Resume uploaded and parsed', profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSkills = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await CandidateProfile.findOne({ userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Return skill analysis data with a default structure if not available
    const skillInsights = {
      skillScore: profile.skillScore || 0,
      experienceLevel: profile.experience < 2 ? 'entry' : profile.experience < 5 ? 'junior' : profile.experience < 10 ? 'mid' : profile.experience < 15 ? 'senior' : 'lead',
      skills: profile.skills?.map((skill) => ({
        skill,
        proficiencyLevel: 'intermediate',
        yearsOfExperience: profile.experience,
      })) || [],
      skillRecommendations: profile.skillRecommendations || [],
      skillAnalysis: profile.skillAnalysis || {
        programming_languages: [],
        frontend_frameworks: [],
        backend_frameworks: [],
        databases: [],
        cloud_platforms: [],
        devops: [],
        tools_and_technologies: [],
        testing: [],
      },
    };

    res.status(200).json(skillInsights);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ message: error.message });
  }
};

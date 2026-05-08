/**
 * Database seeding script for initial data population
 * Usage: npm run seed
 * WARNING: This script clears all existing data
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Vacancy = require('../models/Vacancy');
const CandidateProfile = require('../models/CandidateProfile');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/talent-acquisition';

/**
 * Seed database with sample data
 */
async function seedDatabase() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Vacancy.deleteMany({});
    console.log('Cleared existing data');

    // Create sample users
    const adminUser = new User({
      email: 'admin@example.com',
      password: 'securePassword123', // Change in production
      fullName: 'Admin User',
      role: 'admin',
      phone: '+1234567890',
      isActive: true,
    });

    const recruiterUser = new User({
      email: 'recruiter@example.com',
      password: 'securePassword123', // Change in production
      fullName: 'Recruiter User',
      role: 'recruiter',
      phone: '+1234567891',
      isActive: true,
    });

    const candidateUser = new User({
      email: 'candidate@example.com',
      password: 'securePassword123', // Change in production
      fullName: 'John Doe',
      role: 'candidate',
      phone: '+1234567892',
      isActive: true,
    });

    await User.insertMany([adminUser, recruiterUser, candidateUser]);
    console.log('Created sample users');

    // Create sample vacancies
    const vacancies = [
      {
        title: 'Senior Node.js Developer',
        description: 'Looking for experienced Node.js developer',
        requirements: ['5+ years experience', 'Node.js', 'TypeScript'],
        skills: ['Node.js', 'Express', 'MongoDB', 'TypeScript'],
        experience: 5,
        salary: { min: 80000, max: 120000, currency: 'USD' },
        location: 'San Francisco, CA',
        createdBy: recruiterUser._id,
        status: 'open',
      },
      {
        title: 'React Frontend Developer',
        description: 'Seeking React specialist for modern web app',
        requirements: ['3+ years React', 'TypeScript', 'CSS/Tailwind'],
        skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'],
        experience: 3,
        salary: { min: 70000, max: 100000, currency: 'USD' },
        location: 'New York, NY',
        createdBy: recruiterUser._id,
        status: 'open',
      },
    ];

    await Vacancy.insertMany(vacancies);
    console.log('Created sample job vacancies');

    console.log('\nDatabase seeding completed successfully');
    console.log('\nSample Credentials:');
    console.log('  Admin: admin@example.com / securePassword123');
    console.log('  Recruiter: recruiter@example.com / securePassword123');
    console.log('  Candidate: candidate@example.com / securePassword123');
    console.log('\nWARNING: Change credentials before production use');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

seedDatabase();

seedDatabase();

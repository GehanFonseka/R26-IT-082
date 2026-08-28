import User from '../models/User.js';
import Vacancy from '../models/Vacancy.js';
import Application from '../models/Application.js';

export const getRecruiterDashboard = async (req, res) => {
  try {
    const recruiterId = req.userId;

    // Get recruiter's jobs
    const jobs = await Vacancy.find({ createdBy: recruiterId });
    const totalApplications = await Application.countDocuments({
      jobId: { $in: jobs.map(j => j._id) },
    });
    const shortlisted = await Application.countDocuments({
      jobId: { $in: jobs.map(j => j._id) },
      status: 'shortlisted',
    });
    const hired = await Application.countDocuments({
      jobId: { $in: jobs.map(j => j._id) },
      status: 'hired',
    });

    res.status(200).json({
      totalJobs: jobs.length,
      totalApplications,
      shortlisted,
      hired,
      recentJobs: jobs.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalJobs = await Vacancy.countDocuments();
    const totalApplications = await Application.countDocuments();
    
    const roleCount = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const applicationStatus = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      totalUsers,
      totalJobs,
      totalApplications,
      roleCount,
      applicationStatus,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCandidateDashboard = async (req, res) => {
  try {
    const candidateId = req.userId;

    const applications = await Application.find({ candidateId });
    const applied = applications.length;
    const shortlisted = applications.filter(a => a.status === 'shortlisted').length;
    const interviews = applications.filter(a => a.status === 'interview').length;
    const offers = applications.filter(a => a.status === 'offered').length;

    res.status(200).json({
      applied,
      shortlisted,
      interviews,
      offers,
      recentApplications: applications.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

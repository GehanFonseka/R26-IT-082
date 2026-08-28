import Vacancy from '../models/Vacancy.js';

export const createJob = async (req, res) => {
  try {
    const { title, description, requiredSkills, experienceRequired, salaryMin, salaryMax, location, jobType } = req.body;

    if (!title || !description || !requiredSkills || !location) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const vacancy = new Vacancy({
      title,
      description,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [requiredSkills],
      experienceRequired,
      salaryMin,
      salaryMax,
      location,
      jobType,
      createdBy: req.userId,
    });

    await vacancy.save();
    res.status(201).json({ message: 'Job created successfully', vacancy });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, location, jobType } = req.query;
    const skip = (page - 1) * limit;

    const filter = { status: 'open' };
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (jobType) filter.jobType = jobType;

    const vacancies = await Vacancy.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const total = await Vacancy.countDocuments(filter);

    res.status(200).json({
      vacancies,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobById = async (req, res) => {
  try {
    const vacancy = await Vacancy.findById(req.params.id).populate('createdBy', 'name email');
    if (!vacancy) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(200).json({ vacancy });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const vacancy = await Vacancy.findById(req.params.id);
    if (!vacancy) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (vacancy.createdBy.toString() !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    const updatedVacancy = await Vacancy.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: 'Job updated', vacancy: updatedVacancy });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const vacancy = await Vacancy.findById(req.params.id);
    if (!vacancy) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (vacancy.createdBy.toString() !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await Vacancy.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

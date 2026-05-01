import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Input, Badge } from '../../components/common/Components';
import { Upload } from 'lucide-react';

export const CandidateProfile: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0101',
    location: 'San Francisco, CA',
    skills: ['React', 'TypeScript', 'Node.js', 'Python'],
    education: 'BS Computer Science',
    experience: 5,
  });

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill],
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill),
    });
  };

  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFile(file);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700"
        >
          ✓ Profile updated successfully!
        </motion.div>
      )}

      {/* Basic Info */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <Input name="fullName" value={formData.fullName} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <Input name="email" value={formData.email} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <Input name="phone" value={formData.phone} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <Input name="location" value={formData.location} onChange={handleChange} />
          </div>
        </div>
      </Card>

      {/* Education & Experience */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Education & Experience</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
            <Input name="education" value={formData.education} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
            <Input
              name="experience"
              type="number"
              value={formData.experience}
              onChange={handleChange}
            />
          </div>
        </div>
      </Card>

      {/* Skills */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Skills</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {formData.skills.map(skill => (
            <Badge key={skill} variant="success" className="flex items-center gap-2">
              {skill}
              <button onClick={() => handleRemoveSkill(skill)} className="hover:text-red-600">
                ✕
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            placeholder="Add a skill..."
            onKeyPress={e => e.key === 'Enter' && handleAddSkill()}
          />
          <Button onClick={handleAddSkill}>Add</Button>
        </div>
      </Card>

      {/* CV Upload */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Resume/CV</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-4">Drag and drop your CV here or click to select</p>
          <label className="inline-block">
            <input type="file" onChange={handleCVUpload} accept=".pdf,.doc,.docx" className="hidden" />
            <Button as="span" className="cursor-pointer">
              Choose File
            </Button>
          </label>
          {cvFile && <p className="mt-4 text-sm text-green-600">✓ {cvFile.name}</p>}
        </div>
      </Card>

      <Button onClick={handleSave} variant="primary" className="w-full md:w-auto">
        Save Changes
      </Button>
    </motion.div>
  );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Input } from '../../components/common/Components';
import { Save } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    siteName: 'TalentAI',
    siteUrl: 'https://talentai.com',
    emailFrom: 'noreply@talentai.com',
    maxCandidates: '1000',
    maxJobs: '500',
    sessionTimeout: '30',
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">System Settings</h1>

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700"
        >
          ✓ Settings updated successfully!
        </motion.div>
      )}

      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">General Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
            <Input name="siteName" value={settings.siteName} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Site URL</label>
            <Input name="siteUrl" value={settings.siteUrl} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
            <Input name="emailFrom" value={settings.emailFrom} onChange={handleChange} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Limits</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Candidates</label>
            <Input
              name="maxCandidates"
              type="number"
              value={settings.maxCandidates}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Jobs</label>
            <Input
              name="maxJobs"
              type="number"
              value={settings.maxJobs}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
            <Input
              name="sessionTimeout"
              type="number"
              value={settings.sessionTimeout}
              onChange={handleChange}
            />
          </div>
        </div>
      </Card>

      <Button onClick={handleSave} variant="primary" className="flex items-center gap-2">
        <Save size={20} />
        Save Settings
      </Button>
    </motion.div>
  );
};

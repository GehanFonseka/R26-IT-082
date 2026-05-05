import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SkillAnalysisCard } from '../../components/ai';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import aiService from '../../services/aiService';
import type { CandidateSkillInsights } from '../../services/aiService';

export const ProfileUpload: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [skillData, setSkillData] = useState<CandidateSkillInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || 
          selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please upload a PDF or DOCX file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await aiService.parseResume(file);
      setSkillData(data);
      setSuccess('Resume analyzed successfully!');
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to parse resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-gray-900">Your Profile</h1>
        <p className="text-gray-600 mt-2">Upload your resume for AI-powered skill analysis</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <div className="card space-y-4">
            <h3 className="text-lg font-semibold">Upload Resume</h3>

            {/* Drop Zone */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition cursor-pointer"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('border-blue-400');
              }}
              onDragLeave={(e) => e.currentTarget.classList.remove('border-blue-400')}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-blue-400');
                if (e.dataTransfer.files[0]) {
                  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(e.dataTransfer.files[0]);
                  input.files = dataTransfer.files;
                  handleFileSelect({
                    target: input,
                  } as any);
                }
              }}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-700">Drag and drop your resume</p>
              <p className="text-sm text-gray-500">or click to select</p>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="mt-4 inline-block">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Choose File
                </button>
              </label>
            </div>

            {/* File Info */}
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <p className="font-semibold text-blue-900">{file.name}</p>
                <p className="text-sm text-blue-700">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-50 rounded-lg border border-red-200 flex gap-2"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-green-50 rounded-lg border border-green-200 flex gap-2"
              >
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">{success}</p>
              </motion.div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Analyzing...' : 'Analyze Resume'}
            </button>
          </div>
        </motion.div>

        {/* Results Section */}
        {skillData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <SkillAnalysisCard data={skillData} isLoading={false} />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfileUpload;
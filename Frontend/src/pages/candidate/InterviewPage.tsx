import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Volume2, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import aiService from '../../services/aiService';
import interviewService from '../../services/interviewService';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'mcq' | 'video';
  timeLimit: number;
  options?: string[];
}

export const InterviewPage: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        const data = await interviewService.getInterview(interviewId!);
        setInterview(data);
        setQuestions(data.questions || []);
        setTimeRemaining(data.questions[0]?.timeLimit || 300);
      } catch (err: any) {
        setError(err.message || 'Failed to load interview');
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) fetchInterview();
  }, [interviewId]);

  useEffect(() => {
    if (timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  useEffect(() => {
    if (timeRemaining === 0 && questions.length > currentQuestionIdx + 1) {
      handleNext();
    }
  }, [timeRemaining]);

  const currentQuestion = questions[currentQuestionIdx];
  const isLastQuestion = currentQuestionIdx === questions.length - 1;

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setTimeRemaining(questions[currentQuestionIdx + 1]?.timeLimit || 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
      setTimeRemaining(questions[currentQuestionIdx - 1]?.timeLimit || 300);
    }
  };

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const submissionAnswers = questions.map((q, idx) => ({
        questionIndex: idx,
        answer: answers[idx] || '',
        type: q.type,
      }));

      await aiService.submitInterviewAnswers(interviewId!, submissionAnswers);
      navigate(`/candidate/interview-results/${interviewId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit interview');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Loader className="w-12 h-12 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interview: {interview?.jobTitle}</h1>
          <p className="text-gray-600 mt-1">
            Question {currentQuestionIdx + 1} of {questions.length}
          </p>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 card space-y-4"
        >
          <h3 className="font-semibold text-gray-800">Questions</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentQuestionIdx(idx);
                  setTimeRemaining(questions[idx]?.timeLimit || 300);
                }}
                className={`w-full p-3 rounded-lg text-left transition ${
                  idx === currentQuestionIdx
                    ? 'bg-blue-600 text-white'
                    : answers[idx]
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                <p className="font-semibold">Q{idx + 1}</p>
                <p className="text-xs mt-1">
                  {answers[idx] ? `${(answers[idx] || '').substring(0, 20)}...` : 'Not answered'}
                </p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Question Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          {currentQuestion && (
            <div className="card space-y-6">
              {/* Timer */}
              <div
                className={`flex items-center justify-between p-4 rounded-lg ${
                  timeRemaining < 60 ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock
                    className={`w-5 h-5 ${timeRemaining < 60 ? 'text-red-600' : 'text-blue-600'}`}
                  />
                  <span className="font-semibold">Time Remaining</span>
                </div>
                <span className="text-2xl font-bold">{formatTime(timeRemaining)}</span>
              </div>

              {/* Question */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentQuestion.text}</h2>
                <p className="text-sm text-gray-600">
                  Type: {currentQuestion.type === 'mcq' ? 'Multiple Choice' : currentQuestion.type === 'video' ? 'Video' : 'Text'}
                </p>
              </div>

              {/* Answer Input */}
              {currentQuestion.type === 'text' && (
                <textarea
                  value={answers[currentQuestionIdx] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {currentQuestion.type === 'mcq' && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, idx) => (
                    <label
                      key={idx}
                      className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition"
                    >
                      <input
                        type="radio"
                        name={`q${currentQuestionIdx}`}
                        value={option}
                        checked={answers[currentQuestionIdx] === option}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="ml-3 text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'video' && (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <Volume2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Click record to start your video response</p>
                  <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                    Start Recording
                  </button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIdx === 0}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition"
                >
                  ← Previous
                </button>

                {!isLastQuestion ? (
                  <button
                    onClick={handleNext}
                    className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2"
                  >
                    {submitting && <Loader className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Submitting...' : 'Submit Interview'}
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default InterviewPage;

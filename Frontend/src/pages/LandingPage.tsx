import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Brain, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import { Navbar } from '../components/common/Navbar';

export const LandingPage: React.FC = () => {
  const features = [
    {
      icon: <Brain size={32} />,
      title: 'AI Matching',
      description: 'Advanced algorithms match candidates with perfect job fit',
    },
    {
      icon: <Zap size={32} />,
      title: 'Interview AI',
      description: 'Intelligent interview process with real-time analysis',
    },
    {
      icon: <TrendingUp size={32} />,
      title: 'Risk Prediction',
      description: 'Predict hiring risks and improve candidate retention',
    },
  ];

  return (
    <>
      <Navbar />
      <div className="bg-gradient-to-b from-blue-50 to-white">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 py-20 sm:py-32 max-w-6xl mx-auto"
        >
          <div className="text-center">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6"
            >
              AI-Powered Talent <span className="text-primary">Acquisition System</span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            >
              Transform your hiring process with intelligent matching, automated interviews, and predictive analytics
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                Get Started
                <ArrowRight size={20} />
              </Link>
              <Link to="/register" className="btn-secondary">
                Create Account
              </Link>
            </motion.div>
          </div>

          {/* Hero Illustration */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-20 bg-gradient-primary rounded-2xl h-96 flex items-center justify-center"
          >
            <div className="text-center text-white">
              <Zap size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-xl opacity-75">Your AI Recruitment Hub</p>
            </div>
          </motion.div>
        </motion.section>

        {/* Features Section */}
        <section className="px-6 py-20 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Powerful Features</h2>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="card text-center"
                >
                  <div className="text-primary mb-4 flex justify-center">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-20 bg-gradient-primary">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Hiring?</h2>
            <p className="text-xl opacity-90 mb-8">
              Join hundreds of companies using AI to find their best talent
            </p>
            <Link to="/register" className="inline-block px-8 py-4 bg-white text-primary rounded-lg font-bold hover:bg-gray-100 transition">
              Start Free Trial
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

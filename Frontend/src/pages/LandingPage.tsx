import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Brain, TrendingUp, CheckCircle, ArrowRight, Users, Lightbulb, Shield, Award, BarChart3, Clock, Lock, Globe } from 'lucide-react';
import { Navbar } from '../components/common/Navbar';
import '../styles/forms.css';

export const LandingPage: React.FC = () => {
  const metrics = [
    { label: '40%', description: 'Faster Hiring Process', icon: <Clock size={28} /> },
    { label: '60%', description: 'Better Candidate Quality', icon: <Award size={28} /> },
    { label: '3.5x', description: 'Better ROI', icon: <BarChart3 size={28} /> },
    { label: '500+', description: 'Enterprise Clients', icon: <Globe size={28} /> },
  ];

  const features = [
    {
      icon: <Brain size={32} />,
      title: 'AI-Powered Matching',
      description: 'Advanced algorithms match candidates with perfect job fit',
      benefits: ['Neural network analysis', 'Skill gap detection', 'Cultural fit assessment']
    },
    {
      icon: <Zap size={32} />,
      title: 'Smart Interviews',
      description: 'Intelligent interview analysis with real-time feedback',
      benefits: ['Real-time transcription', 'Sentiment analysis', 'Bias detection']
    },
    {
      icon: <TrendingUp size={32} />,
      title: 'Risk Prediction',
      description: 'Predict hiring risks and improve retention',
      benefits: ['Churn prediction', 'Performance modeling', 'Retention analysis']
    },
    {
      icon: <Users size={32} />,
      title: 'Team Collaboration',
      description: 'Streamlined workflow for faster hiring decisions',
      benefits: ['Real-time feedback', 'Interview notes', 'Hiring workflows']
    },
    {
      icon: <Lightbulb size={32} />,
      title: 'Advanced Analytics',
      description: 'Real-time insights into hiring metrics',
      benefits: ['Pipeline analytics', 'Hiring velocity', 'Custom reports']
    },
    {
      icon: <Shield size={32} />,
      title: 'Enterprise Security',
      description: 'Bank-level security and compliance',
      benefits: ['SOC 2 Type II', 'GDPR compliant', 'Data encryption']
    },
  ];

  const caseStudies = [
    {
      company: 'TechCorp Industries',
      industry: 'Technology',
      initials: 'TC',
      results: { hiring_time: '45%', quality: '65%', savings: '$320K' },
      quote: 'TalentAI reduced our time-to-hire significantly while improving candidate quality.',
      author: 'Sarah Chen, VP Talent'
    },
    {
      company: 'FinanceFirst',
      industry: 'Financial Services',
      initials: 'FF',
      results: { hiring_time: '52%', quality: '58%', savings: '$850K' },
      quote: 'The AI matching engine helped us find hidden talent in our market.',
      author: 'James Wilson, Head of Recruitment'
    },
    {
      company: 'HealthPlus Network',
      industry: 'Healthcare',
      initials: 'HP',
      results: { hiring_time: '38%', quality: '72%', savings: '$520K' },
      quote: 'We now complete hires 40% faster while maintaining quality standards.',
      author: 'Dr. Emily Roberts, CEO'
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'HR Director',
      company: 'Tech Corp',
      text: 'TalentAI is a game-changer. Our hiring process is now 3x more efficient.',
      initials: 'SJ',
    },
    {
      name: 'Michael Chen',
      role: 'Chief People Officer',
      company: 'Digital Innovations',
      text: 'The AI matching is incredibly accurate. We reduced time-to-hire from 35 to 18 days.',
      initials: 'MC',
    },
    {
      name: 'Emma Davis',
      role: 'Recruitment Manager',
      company: 'StartUp Labs',
      text: 'Outstanding platform. The interview analysis saved us hundreds of hours.',
      initials: 'ED',
    },
  ];

  return (
    <div className="w-full bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-200 to-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center">
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold inline-block mb-6">
              Enterprise AI Recruiting Platform
            </span>
            <h1 className="mb-6 text-5xl sm:text-6xl font-bold text-gray-900">
              Recruit Smarter, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Not Harder</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto font-light">
              AI-powered talent acquisition for enterprise teams. Reduce time-to-hire by 50% and improve candidate quality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                Start Your Free Trial <ArrowRight size={20} />
              </Link>
              <button className="px-8 py-4 border-2 border-gray-300 text-gray-900 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all duration-300">
                Watch Demo
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-6">No credit card required • 14-day free trial • Enterprise support included</p>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {metrics.map((metric, idx) => (
              <div key={idx} className="text-center p-6 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                <div className="flex justify-center mb-4 text-blue-600">{metric.icon}</div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{metric.label}</div>
                <p className="text-gray-600">{metric.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">Powerful Features for Enterprise Teams</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto text-center mb-16">
            Everything you need to build a world-class recruiting operation
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="group bg-white rounded-lg p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:border-blue-200">
                <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">Results From Enterprise Clients</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto text-center mb-16">Real results from companies like yours</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {caseStudies.map((study, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                    {study.initials}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{study.company}</h3>
                    <p className="text-sm text-gray-600">{study.industry}</p>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between"><span className="text-gray-600">Time-to-hire</span><span className="text-2xl font-bold text-green-600">{study.results.hiring_time}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Quality</span><span className="text-2xl font-bold text-green-600">{study.results.quality}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Savings</span><span className="text-2xl font-bold text-green-600">{study.results.savings}</span></div>
                </div>
                <blockquote className="border-l-4 border-blue-600 pl-4">
                  <p className="text-gray-700 italic text-sm mb-2">"{study.quote}"</p>
                  <p className="text-sm font-semibold text-gray-900">{study.author}</p>
                </blockquote>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">Loved by Recruiting Teams</h2>
          <p className="text-xl text-gray-600 text-center mb-16">See what our customers have to say</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-lg p-8 border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-sm">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                    <p className="text-xs text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 text-center mb-16">Choose the plan that fits your needs</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: '$99', features: ['Up to 5 job posts', 'Basic AI matching', 'Email support'] },
              { name: 'Professional', price: '$299', features: ['Unlimited job posts', 'Advanced AI matching', 'Interview AI', 'Priority support'], highlighted: true },
              { name: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', '24/7 SLA'] },
            ].map((plan, idx) => (
              <div key={idx} className={`rounded-lg p-8 transition-all duration-300 ${plan.highlighted ? 'bg-white shadow-2xl ring-2 ring-blue-600 transform scale-105' : 'bg-gray-50 border border-gray-200'}`}>
                {plan.highlighted && <div className="mb-4 text-sm font-semibold text-blue-600 uppercase">Most Popular</div>}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-gray-600">/month</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-700 text-sm">
                      <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-2 rounded-lg font-semibold transition-all ${plan.highlighted ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>
                  {plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Enterprise Security & Compliance</h2>
              <p className="text-lg text-gray-600 mb-8">
                TalentAI meets the highest standards for data security and compliance.
              </p>
              <ul className="space-y-4">
                {['SOC 2 Type II Certified', 'GDPR & CCPA Compliant', 'End-to-End Encryption', '99.9% Uptime SLA', 'Multi-Region Data Centers', '24/7 Security Monitoring'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Lock size={20} className="text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-12">
              <div className="space-y-6">
                {[{icon: <Shield size={32} />, title: 'Security First', desc: 'Built from the ground up'}, {icon: <Lock size={32} />, title: 'Data Privacy', desc: 'Full GDPR compliance'}, {icon: <Globe size={32} />, title: 'Global Compliance', desc: 'Multi-region deployments'}].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="text-blue-600">{item.icon}</div>
                    <div>
                      <h3 className="font-bold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">Ready to Transform Your Recruiting?</h2>
          <p className="text-xl mb-8 opacity-95 max-w-2xl mx-auto">
            Join 500+ enterprise companies that are hiring smarter with TalentAI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2">
              Start Free Trial <ArrowRight size={20} />
            </Link>
            <button className="px-8 py-4 bg-white/20 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/30 transition-all duration-300">
              Schedule Demo
            </button>
          </div>
          <p className="text-sm opacity-90 mt-6">14-day free trial. No credit card required.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <span className="font-bold text-white">TalentAI</span>
              </div>
              <p className="text-sm text-gray-400">Enterprise AI recruiting platform for teams that refuse to compromise.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Terms</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>hello@talentai.com</li>
                <li>+1 (415) 555-0100</li>
                <li>San Francisco, CA</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
              <p className="text-gray-400">&copy; 2026 TalentAI. All rights reserved.</p>
              <div className="flex gap-6 mt-4 sm:mt-0">
                <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-white">LinkedIn</a>
                <a href="#" className="text-gray-400 hover:text-white">GitHub</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

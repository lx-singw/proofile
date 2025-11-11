"use client";

import Link from "next/link";
import { CheckCircle, Shield, Star, Zap, ArrowRight, Users, Award, TrendingUp, ChevronDown, Flame, MapPin, DollarSign, Clock, Briefcase, Trophy, Building2 } from "lucide-react";
import { useState } from "react";
import ProofileLogo from "@/components/branding/ProofileLogo";

export default function HomePage() {
  const [productOpen, setProductOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/home" className="flex flex-col">
                <ProofileLogo size={32} showWordmark={true} />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-10">Beyond resumes. Proven digital professional identities.</span>
              </Link>
              <nav className="hidden lg:flex items-center gap-1">
                {/* Product Dropdown */}
                <div className="relative" onMouseEnter={() => setProductOpen(true)} onMouseLeave={() => setProductOpen(false)}>
                  <button className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                    Product
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {productOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2">
                      <Link href="#verification" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">Verification</div>
                        <div className="text-xs text-gray-500">Multi-layer credential verification</div>
                      </Link>
                      <Link href="#ratings" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">Peer Ratings</div>
                        <div className="text-xs text-gray-500">Real feedback from colleagues</div>
                      </Link>
                      <Link href="#ai-matching" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">AI Matching</div>
                        <div className="text-xs text-gray-500">Smart opportunity discovery</div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Solutions Dropdown */}
                <div className="relative" onMouseEnter={() => setSolutionsOpen(true)} onMouseLeave={() => setSolutionsOpen(false)}>
                  <button className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                    Solutions
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {solutionsOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2">
                      <Link href="#talent" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">For Talent</div>
                        <div className="text-xs text-gray-500">Build your verified profile</div>
                      </Link>
                      <Link href="#recruiters" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">For Recruiters</div>
                        <div className="text-xs text-gray-500">Find verified candidates</div>
                      </Link>
                      <Link href="#enterprise" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">Enterprise</div>
                        <div className="text-xs text-gray-500">Team verification solutions</div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Explore Dropdown */}
                <div className="relative" onMouseEnter={() => setExploreOpen(true)} onMouseLeave={() => setExploreOpen(false)}>
                  <button className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                    Explore
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {exploreOpen && (
                    <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2">
                      <Link href="#trending-jobs" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-3">
                          <Flame className="w-5 h-5 text-orange-500" />
                          <div>
                            <div className="font-semibold mb-1">Trending Jobs</div>
                            <div className="text-xs text-gray-500">Hot opportunities from top companies</div>
                          </div>
                        </div>
                      </Link>
                      <Link href="#live-activity" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-5 h-5 text-green-500" />
                          <div>
                            <div className="font-semibold mb-1">Live Activity</div>
                            <div className="text-xs text-gray-500">Real-time platform updates</div>
                          </div>
                        </div>
                      </Link>
                      <Link href="#skills-leaderboard" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-3">
                          <Trophy className="w-5 h-5 text-yellow-500" />
                          <div>
                            <div className="font-semibold mb-1">Skills Leaderboard</div>
                            <div className="text-xs text-gray-500">Top rated skills this week</div>
                          </div>
                        </div>
                      </Link>
                      <Link href="#companies-hiring" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-blue-500" />
                          <div>
                            <div className="font-semibold mb-1">Companies Hiring</div>
                            <div className="text-xs text-gray-500">See who's actively recruiting</div>
                          </div>
                        </div>
                      </Link>
                      <Link href="#salary-insights" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-green-500" />
                          <div>
                            <div className="font-semibold mb-1">Salary Insights</div>
                            <div className="text-xs text-gray-500">Verified salary ranges by role</div>
                          </div>
                        </div>
                      </Link>
                      <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                        <Link href="/talent" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-purple-500" />
                            <div>
                              <div className="font-semibold mb-1">Browse Talent</div>
                              <div className="text-xs text-gray-500">Explore verified professionals</div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <Link href="#pricing" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                  Pricing
                </Link>

                {/* Resources Dropdown */}
                <div className="relative" onMouseEnter={() => setResourcesOpen(true)} onMouseLeave={() => setResourcesOpen(false)}>
                  <button className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                    Resources
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {resourcesOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2">
                      <Link href="#blog" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">Blog</div>
                        <div className="text-xs text-gray-500">Latest news and insights</div>
                      </Link>
                      <Link href="#docs" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">Documentation</div>
                        <div className="text-xs text-gray-500">Guides and tutorials</div>
                      </Link>
                      <Link href="#help" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="font-semibold mb-1">Help Center</div>
                        <div className="text-xs text-gray-500">Get support</div>
                      </Link>
                    </div>
                  )}
                </div>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 transition-colors">
                Sign in
              </Link>
              <Link href="/register" className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Inclusive Banner */}
      <section className="bg-green-600 dark:bg-green-700 py-3 border-b border-green-700 dark:border-green-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm sm:text-base text-white font-medium">
            For <span className="font-bold">students</span>, <span className="font-bold">graduates</span>, <span className="font-bold">apprentices</span>, <span className="font-bold">professionals</span>, <span className="font-bold">job seekers</span>, <span className="font-bold">career changers</span>, <span className="font-bold">remote workers</span>, <span className="font-bold">freelancers</span>, <span className="font-bold">recruiters</span>, and <span className="font-bold">everyone</span> building their future — Proofile is your platform.
          </p>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 mb-6">
                <Star className="w-4 h-4" />
                Trusted by 10,000+ professionals
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Verified Credentials.<br />
                Transparent Reputation.<br />
                Built on Trust.
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                A clean, modern platform where workers showcase real capabilities and employers find talent based on skills, not just keywords.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg">
                  Start for free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors border-2 border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700">
                  View demo
                </Link>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Free forever</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-2xl shadow-2xl flex items-center justify-center">
                <div className="text-white text-center">
                  <Shield className="w-32 h-32 mx-auto mb-4 opacity-90" />
                  <p className="text-2xl font-bold">Verified Profiles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-900 overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-300 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              The old way is broken
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Traditional hiring tools haven't kept up with how work has evolved
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="font-bold mb-2 text-gray-900 dark:text-white"><span className="text-red-500">❌</span> Static Resumes</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">PDFs that don't showcase real skills or capabilities</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="font-bold mb-2 text-gray-900 dark:text-white"><span className="text-red-500">❌</span> Cluttered Platforms</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Mixed with social content, hard to find quality talent</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="font-bold mb-2 text-gray-900 dark:text-white"><span className="text-red-500">❌</span> Skills Gap</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Skills-based hiring is growing but tools haven't caught up</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="font-bold mb-2 text-gray-900 dark:text-white"><span className="text-red-500">❌</span> Remote Challenges</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Remote work explosion needs better talent discovery</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-100 via-purple-100 to-blue-100 dark:from-gray-800 dark:to-gray-800 overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-blue-300 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Proofile is the solution
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              A clean, skills-focused professional platform built for modern work
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg border border-blue-200 dark:border-gray-700">
              <div className="text-green-500 font-bold text-2xl mb-3">✓</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Rich Skill Profiles
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Workers create dynamic profiles showcasing real capabilities, not just static text
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg border border-purple-200 dark:border-gray-700">
              <div className="text-green-500 font-bold text-2xl mb-3">✓</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Skills-Based Discovery
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Employers find talent based on actual skills and verified experience, not keywords
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg border border-blue-200 dark:border-gray-700">
              <div className="text-green-500 font-bold text-2xl mb-3">✓</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Zero Social Noise
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Clean, focused experience with no distractions—just professional value
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Jobs Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-500" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Trending Opportunities</h2>
            </div>
            <Link href="/jobs" className="text-sm font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1">
              View all jobs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Job Card 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:shadow-xl cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Senior React Developer</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Google</p>
                </div>
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  Hot
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>Remote</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <DollarSign className="w-4 h-4" />
                  <span>$150k - $200k</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>Posted 2h ago</span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">47 verified applicants</p>
              </div>
            </div>

            {/* Job Card 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all hover:shadow-xl cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">ML Engineer</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">OpenAI</p>
                </div>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded-full">
                  New
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>San Francisco</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <DollarSign className="w-4 h-4" />
                  <span>$180k - $250k</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>Posted 5h ago</span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">23 verified applicants</p>
              </div>
            </div>

            {/* Job Card 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:shadow-xl cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Product Designer</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Stripe</p>
                </div>
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  Hot
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>Remote / NYC</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <DollarSign className="w-4 h-4" />
                  <span>$130k - $180k</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>Posted 1d ago</span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">31 verified applicants</p>
              </div>
            </div>

            {/* Job Card 4 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all hover:shadow-xl cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">DevOps Engineer</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Netflix</p>
                </div>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded-full">
                  New
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>Los Angeles</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <DollarSign className="w-4 h-4" />
                  <span>$160k - $210k</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>Posted 3h ago</span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">18 verified applicants</p>
              </div>
            </div>

            {/* Job Card 5 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:shadow-xl cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Full Stack Developer</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Airbnb</p>
                </div>
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  Hot
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>Remote</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <DollarSign className="w-4 h-4" />
                  <span>$140k - $190k</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>Posted 6h ago</span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">52 verified applicants</p>
              </div>
            </div>

            {/* Job Card 6 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all hover:shadow-xl cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Backend Engineer</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Shopify</p>
                </div>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded-full">
                  New
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>Toronto / Remote</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <DollarSign className="w-4 h-4" />
                  <span>$120k - $170k</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>Posted 4h ago</span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">29 verified applicants</p>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg">
              Sign up to apply
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Live Activity Feed */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="relative">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Live Platform Activity</h2>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Sarah Chen</span> just got verified at <span className="font-semibold">Google</span>
                </p>
                <span className="ml-auto text-xs text-gray-500">2m ago</span>
              </div>
              <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <Star className="w-5 h-5 text-yellow-500" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Marcus Johnson</span> received 5-star rating from colleague
                </p>
                <span className="ml-auto text-xs text-gray-500">5m ago</span>
              </div>
              <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <Briefcase className="w-5 h-5 text-blue-500" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">TechCorp</span> posted <span className="font-semibold">Senior Developer</span> role
                </p>
                <span className="ml-auto text-xs text-gray-500">8m ago</span>
              </div>
              <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <Shield className="w-5 h-5 text-purple-500" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Alex Rivera</span> completed skills verification
                </p>
                <span className="ml-auto text-xs text-gray-500">12m ago</span>
              </div>
              <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <Users className="w-5 h-5 text-blue-500" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">3 new companies</span> joined Proofile
                </p>
                <span className="ml-auto text-xs text-gray-500">15m ago</span>
              </div>
              <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Emma Davis</span> verified work history at <span className="font-semibold">Microsoft</span>
                </p>
                <span className="ml-auto text-xs text-gray-500">18m ago</span>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Join <span className="font-bold text-green-600 dark:text-green-400">10,000+</span> professionals building verified profiles
            </p>
          </div>
        </div>
      </section>

      {/* Skills Leaderboard + Companies + Salary Insights */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Skills Leaderboard */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 shadow-lg border border-yellow-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top Rated Skills</h3>
                </div>
                <Link href="/skills" className="text-xs font-semibold text-green-600 hover:text-green-700 dark:text-green-400 flex items-center gap-1">
                  See all
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-yellow-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">#1</span>
                    <span className="font-bold text-gray-900 dark:text-white">React Development</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">127 verified professionals</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">4.8</span>
                    <span className="text-sm text-gray-500">avg rating</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-gray-500">#2</span>
                    <span className="font-bold text-gray-900 dark:text-white">Python/ML</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">98 verified professionals</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">4.9</span>
                    <span className="text-sm text-gray-500">avg rating</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-gray-500">#3</span>
                    <span className="font-bold text-gray-900 dark:text-white">Product Design</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">84 verified professionals</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">4.7</span>
                    <span className="text-sm text-gray-500">avg rating</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Companies Hiring */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 shadow-lg border border-blue-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Actively Hiring</h3>
                </div>
                <Link href="/companies" className="text-xs font-semibold text-green-600 hover:text-green-700 dark:text-green-400 flex items-center gap-1">
                  View all
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-blue-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        G
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Google</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">12 open roles</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        S
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Stripe</p>
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">8 open roles</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        A
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Airbnb</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">15 open roles</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        S
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Shopify</p>
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">6 open roles</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Salary Insights */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 shadow-lg border border-green-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-500" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Salary Insights</h3>
                </div>
                <Link href="/salaries" className="text-xs font-semibold text-green-600 hover:text-green-700 dark:text-green-400 flex items-center gap-1">
                  Explore
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-green-200 dark:border-gray-700">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">Senior Software Engineer</h4>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-500 mb-2">$140k - $220k</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Based on 234 verified profiles</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">Product Manager</h4>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-500 mb-2">$120k - $180k</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Based on 156 verified profiles</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">UX Designer</h4>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-500 mb-2">$100k - $150k</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Based on 89 verified profiles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to build trust
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Proofile combines verification, peer ratings, and AI matching to create the most trusted professional profiles.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-blue-200 dark:border-gray-700 hover:border-purple-300 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Multi-layer Verification
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Verify work history, education, and skills through multiple trusted sources. Every claim is backed by proof.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-blue-200 dark:border-gray-700 hover:border-purple-300 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center mb-6">
                <Star className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Peer-Rated Skills
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Get rated by colleagues who actually worked with you. Real feedback from real people who know your work.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-blue-200 dark:border-gray-700 hover:border-purple-300 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                AI-Powered Matching
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Our AI agents work 24/7 to find opportunities that match your verified skills and career goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Split Section - Talent vs Recruiter */}
      <section className="relative py-20 sm:py-32 bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 dark:from-black dark:to-gray-900 text-white overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-500 rounded-full blur-3xl"></div>
        </div>
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
        {/* Animated Dots */}
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-1/3 w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 right-1/4 w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Built for everyone
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Whether you're building your career or building your team, Proofile has you covered.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-8 border border-blue-500/30 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">For Talent</h3>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Build verified professional profile</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Get peer ratings from colleagues</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">AI-powered job matching</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Control your visibility</span>
                </li>
              </ul>
              <Link href="/register" className="block w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-center">
                Sign up free
              </Link>
            </div>
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-8 border border-blue-500/30 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-6">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">For Recruiters</h3>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Search verified talent pool</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">See real peer reviews</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">AI candidate matching</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Pay per hire model</span>
                </li>
              </ul>
              <Link href="/register" className="block w-full px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-center">
                Start recruiting
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">10,000+</div>
              <p className="text-lg text-gray-600 dark:text-gray-300">Verified Profiles</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">500+</div>
              <p className="text-lg text-gray-600 dark:text-gray-300">Trusted Companies</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">95%</div>
              <p className="text-lg text-gray-600 dark:text-gray-300">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-32 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 dark:from-blue-700 dark:via-purple-700 dark:to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to build your verified profile?
          </h2>
          <p className="text-xl text-blue-50 mb-8">
            Join thousands of professionals who trust Proofile with their career.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
              Get started free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-700 text-white font-semibold rounded-lg hover:bg-green-800 transition-colors border-2 border-white/20">
              Sign in
            </Link>
          </div>
          <p className="text-sm text-blue-50 mt-6">No credit card required • Free forever • 2 min setup</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-black dark:from-black dark:to-gray-950 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            © 2024 Proofile. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

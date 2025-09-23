"use client";
import React, { useEffect, useRef, useState } from 'react';
import { AnimationUtils, AnimationLibraries, cssAnimations } from '@/utils/animations';

export default function AnimationsDemo() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState('intro');
  const [isAnimating, setIsAnimating] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    // Add CSS animations to the document
    const style = document.createElement('style');
    style.textContent = cssAnimations;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const runAnimation = async (type: string) => {
    if (!demoRef.current || isAnimating) return;
    
    setIsAnimating(true);
    const elements = demoRef.current.querySelectorAll('.demo-element') as NodeListOf<HTMLElement>;
    
    try {
      switch (type) {
        case 'fadeIn':
          await AnimationUtils.stagger(Array.from(elements), (el) => AnimationUtils.fadeIn(el), 200);
          break;
        case 'slideIn':
          await AnimationUtils.stagger(Array.from(elements), (el) => AnimationUtils.slideIn(el, 'left'), 150);
          break;
        case 'scale':
          await AnimationUtils.stagger(Array.from(elements), (el) => AnimationUtils.scale(el, 0, 1), 100);
          break;
      }
    } finally {
      setIsAnimating(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const sections = [
    { id: 'intro', name: 'Introduction', icon: '🎬' },
    { id: 'libraries', name: 'Libraries', icon: '📚' },
    { id: 'demo', name: 'Live Demo', icon: '🎮' },
    { id: 'examples', name: 'Examples', icon: '💡' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-purple-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white animate-slide-in-left">
              🎬 Animation Libraries Showcase
            </h1>
            
            <nav className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 animate-slide-in-right">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeSection === section.id
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="flex items-center space-x-2">
                    <span>{section.icon}</span>
                    <span>{section.name}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeSection === 'intro' && <IntroSection />}
        {activeSection === 'libraries' && <LibrariesSection />}
        {activeSection === 'demo' && (
          <DemoSection 
            ref={demoRef} 
            runAnimation={runAnimation} 
            isAnimating={isAnimating} 
          />
        )}
        {activeSection === 'examples' && <ExamplesSection />}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 bg-gray-100 dark:bg-gray-800 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🚀 Enhanced with Animation Libraries
          </h3>
          <div className="flex justify-center space-x-8 text-sm text-gray-600 dark:text-gray-400">
            <a 
              href="https://motion.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-500 transition-colors duration-200 hover:scale-110 transform"
            >
              Motion.dev →
            </a>
            <a 
              href="https://animejs.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-purple-500 transition-colors duration-200 hover:scale-110 transform"
            >
              Anime.js →
            </a>
            <a 
              href="https://gsap.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-green-500 transition-colors duration-200 hover:scale-110 transform"
            >
              GSAP →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Introduction Section
function IntroSection() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Welcome to Animation Libraries Showcase
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Discover the power of modern web animations with three industry-leading libraries:
          Framer Motion, Anime.js, and GSAP.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {Object.entries(AnimationLibraries).map(([key, library], index) => (
          <div
            key={key}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-slide-in-up"
            style={{ animationDelay: `${index * 200}ms` }}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="text-2xl text-white font-bold">
                  {library.name.charAt(0)}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {library.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {library.description}
              </p>
              <a
                href={library.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Learn More
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Libraries Section
function LibrariesSection() {
  return (
    <div className="space-y-8 animate-fade-in">
      {Object.entries(AnimationLibraries).map(([key, library]) => (
        <div
          key={key}
          className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg animate-slide-in-left"
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center mr-4">
              <span className="text-xl text-white font-bold">
                {library.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {library.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {library.description}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Key Features
              </h4>
              <ul className="space-y-2">
                {library.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center text-gray-600 dark:text-gray-400"
                  >
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Getting Started
              </h4>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Installation:</p>
                  <code className="block p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                    {library.installation}
                  </code>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Basic Usage:</p>
                  <pre className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm overflow-x-auto">
                    <code>{library.basicUsage}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Demo Section
const DemoSection = React.forwardRef<
  HTMLDivElement, 
  { runAnimation: (type: string) => void; isAnimating: boolean }
>(({ runAnimation, isAnimating }, ref) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Live Animation Demo
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Click the buttons below to see different animation effects in action
        </p>
      </div>

      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={() => runAnimation('fadeIn')}
          disabled={isAnimating}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
        >
          Fade In
        </button>
        <button
          onClick={() => runAnimation('slideIn')}
          disabled={isAnimating}
          className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
        >
          Slide In
        </button>
        <button
          onClick={() => runAnimation('scale')}
          disabled={isAnimating}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
        >
          Scale
        </button>
      </div>

      <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="demo-element w-20 h-20 bg-gradient-to-r from-pink-400 to-red-500 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-lg shadow-lg"
          >
            {i}
          </div>
        ))}
      </div>
    </div>
  );
});

DemoSection.displayName = 'DemoSection';

// Examples Section
function ExamplesSection() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          CSS Animation Examples
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          These examples use pure CSS animations that are already working in this showcase
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Pulse', class: 'animate-pulse', color: 'bg-blue-500' },
          { name: 'Bounce', class: 'animate-bounce', color: 'bg-green-500' },
          { name: 'Float', class: 'animate-float', color: 'bg-purple-500' },
          { name: 'Rotate', class: 'animate-rotate', color: 'bg-yellow-500' },
          { name: 'Fade In', class: 'animate-fade-in', color: 'bg-pink-500' },
          { name: 'Slide In', class: 'animate-slide-in-left', color: 'bg-indigo-500' }
        ].map((example, index) => (
          <div
            key={example.name}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg text-center animate-slide-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {example.name}
            </h3>
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 ${example.color} rounded-lg ${example.class}`} />
            </div>
            <code className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              .{example.class}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}
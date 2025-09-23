// Animation utilities using CSS and basic JavaScript
// This serves as a foundation that can be enhanced with external libraries

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  iterations?: number | 'infinite';
}

export class AnimationUtils {
  // Fade in animation
  static fadeIn(element: HTMLElement, config: AnimationConfig = {}) {
    const {
      duration = 300,
      delay = 0,
      easing = 'ease-out'
    } = config;

    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ${easing} ${delay}ms`;
    
    // Trigger reflow
    element.offsetHeight;
    
    element.style.opacity = '1';
    
    return new Promise(resolve => {
      setTimeout(resolve, duration + delay);
    });
  }

  // Slide in from direction
  static slideIn(element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'left', config: AnimationConfig = {}) {
    const {
      duration = 300,
      delay = 0,
      easing = 'ease-out'
    } = config;

    const transforms = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(-100%)',
      down: 'translateY(100%)'
    };

    element.style.transform = transforms[direction];
    element.style.transition = `transform ${duration}ms ${easing} ${delay}ms`;
    
    // Trigger reflow
    element.offsetHeight;
    
    element.style.transform = 'translate(0, 0)';
    
    return new Promise(resolve => {
      setTimeout(resolve, duration + delay);
    });
  }

  // Scale animation
  static scale(element: HTMLElement, from: number = 0, to: number = 1, config: AnimationConfig = {}) {
    const {
      duration = 300,
      delay = 0,
      easing = 'ease-out'
    } = config;

    element.style.transform = `scale(${from})`;
    element.style.transition = `transform ${duration}ms ${easing} ${delay}ms`;
    
    // Trigger reflow
    element.offsetHeight;
    
    element.style.transform = `scale(${to})`;
    
    return new Promise(resolve => {
      setTimeout(resolve, duration + delay);
    });
  }

  // Stagger animation for multiple elements
  static stagger(elements: HTMLElement[], animationFn: (el: HTMLElement) => Promise<unknown>, delayBetween: number = 100): Promise<void[]> {
    return Promise.all(
      elements.map((el, index) => {
        return new Promise<void>(resolve => {
          setTimeout(async () => {
            await animationFn(el);
            resolve();
          }, index * delayBetween);
        });
      })
    );
  }

  // Pulse animation using CSS animations
  static pulse(element: HTMLElement, config: AnimationConfig = {}) {
    const {
      duration = 1000,
      iterations = 'infinite'
    } = config;

    element.style.animation = `pulse ${duration}ms ease-in-out ${iterations}`;
  }

  // Bounce animation
  static bounce(element: HTMLElement, config: AnimationConfig = {}) {
    const {
      duration = 1000,
      iterations = 'infinite'
    } = config;

    element.style.animation = `bounce ${duration}ms ease-in-out ${iterations}`;
  }

  // Custom keyframe animation
  static createKeyframeAnimation(name: string, keyframes: Record<string, Record<string, string>>) {
    const styleSheet = document.styleSheets[0];
    const keyframeRule = `
      @keyframes ${name} {
        ${Object.entries(keyframes).map(([percentage, styles]) => 
          `${percentage} { ${Object.entries(styles).map(([prop, value]) => `${prop}: ${value}`).join('; ')} }`
        ).join('\n')}
      }
    `;
    
    styleSheet.insertRule(keyframeRule, styleSheet.cssRules.length);
  }

  // Remove all animations from element
  static clearAnimations(element: HTMLElement) {
    element.style.animation = '';
    element.style.transition = '';
    element.style.transform = '';
  }
}

// Animation library references and documentation
export const AnimationLibraries = {
  framerMotion: {
    name: 'Framer Motion',
    description: 'A production-ready motion library for React',
    url: 'https://motion.dev/',
    features: [
      'Layout animations',
      'Gesture recognition',
      'SVG path animations',
      'Scroll-triggered animations',
      'Spring physics',
      'Drag and drop'
    ],
    installation: 'npm install framer-motion',
    basicUsage: `
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Hello World
</motion.div>
    `
  },
  
  animeJs: {
    name: 'Anime.js',
    description: 'A lightweight JavaScript animation library',
    url: 'https://animejs.com/',
    features: [
      'CSS properties animation',
      'SVG animations',
      'DOM attributes',
      'Timeline control',
      'Playback controls',
      'Easing functions'
    ],
    installation: 'npm install animejs',
    basicUsage: `
import anime from 'animejs';

anime({
  targets: '.element',
  translateX: 250,
  rotate: '1turn',
  duration: 800,
  easing: 'easeInOutQuad'
});
    `
  },
  
  gsap: {
    name: 'GSAP (GreenSock)',
    description: 'Professional-grade animation for the modern web',
    url: 'https://gsap.com/',
    features: [
      'High performance',
      'ScrollTrigger',
      'Morphing SVG',
      'Timeline sequencing',
      'Cross-browser compatibility',
      'Rich plugin ecosystem'
    ],
    installation: 'npm install gsap',
    basicUsage: `
import { gsap } from 'gsap';

gsap.to('.element', {
  duration: 2,
  x: 100,
  rotation: 360,
  ease: "power2.out"
});
    `
  }
};

// CSS animations that can be used immediately
export const cssAnimations = `
/* Add these animations to your CSS */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInLeft {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes slideInUp {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

@keyframes slideInDown {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
  40%, 43% { transform: translate3d(0,-20px,0); }
  70% { transform: translate3d(0,-10px,0); }
  90% { transform: translate3d(0,-4px,0); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Utility classes */
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
.animate-slide-in-left { animation: slideInLeft 0.5s ease-out; }
.animate-slide-in-right { animation: slideInRight 0.5s ease-out; }
.animate-slide-in-up { animation: slideInUp 0.5s ease-out; }
.animate-slide-in-down { animation: slideInDown 0.5s ease-out; }
.animate-pulse { animation: pulse 2s infinite; }
.animate-bounce { animation: bounce 1s infinite; }
.animate-shake { animation: shake 0.5s ease-in-out; }
.animate-rotate { animation: rotate 2s linear infinite; }
.animate-float { animation: float 3s ease-in-out infinite; }
`;

export default AnimationUtils;
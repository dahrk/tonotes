import React, { useEffect } from 'react';

interface AboutWindowProps {
  autoCloseDelay?: number;
}

const AboutWindow: React.FC<AboutWindowProps> = ({
  autoCloseDelay = 10000,
}) => {
  useEffect(() => {
    // Auto-close after specified delay
    const timer = setTimeout(() => {
      window.close();
    }, autoCloseDelay);

    return () => {
      clearTimeout(timer);
    };
  }, [autoCloseDelay]);

  return (
    <div className="about-app">
      <h1>📝 PostIt</h1>
      <div className="version">Version 1.0.0</div>
      <div className="description">
        Beautiful sticky notes for your desktop with rich text support, task
        management, and intelligent note linking.
      </div>
      <ul className="features">
        <li>✅ Markdown support with live preview</li>
        <li>📋 Todo lists with nested subtasks</li>
        <li>🏷️ Tag-based organization</li>
        <li>🔗 @-mention note linking</li>
        <li>💾 Auto-save functionality</li>
        <li>🎨 Color-coded notes</li>
      </ul>

      <style>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0;
          padding: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100vh;
          box-sizing: border-box;
        }

        .about-app {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          padding: 40px;
          box-sizing: border-box;
        }

        h1 { 
          margin: 0 0 10px 0; 
          font-size: 2em; 
          color: white;
        }

        .version { 
          opacity: 0.8; 
          margin-bottom: 20px; 
          color: white;
        }

        .description { 
          line-height: 1.6; 
          margin-bottom: 30px; 
          color: white;
          text-align: center;
        }

        .features { 
          text-align: left; 
          margin: 0 auto; 
          max-width: 280px; 
          padding: 0;
          list-style: none;
        }

        .features li { 
          margin: 5px 0; 
          color: white;
        }
      `}</style>
    </div>
  );
};

export default AboutWindow;

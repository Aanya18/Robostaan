import React from 'react';
import 'react-quill/dist/quill.snow.css';

interface QuillContentProps {
  content: string;
  className?: string;
}

const QuillContent: React.FC<QuillContentProps> = ({ content, className = '' }) => {
  return (
    <div
      className={`ql-editor-content ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        // Reset default styles that might interfere
        padding: '0',
        margin: '0',
        border: 'none',
        background: 'transparent',
        fontSize: 'inherit',
        lineHeight: 'inherit',
        fontFamily: 'inherit',
        color: 'inherit'
      }}
    />
  );
};

export default QuillContent;
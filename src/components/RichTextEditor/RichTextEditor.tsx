import React, { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your content here...'
}) => {
  const quillRef = useRef<ReactQuill>(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['code-block'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'code-block', 'color', 'background',
    'align', 'script'
  ];

  return (
    <div className="rich-text-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        // Remove inline style, rely on CSS for dark mode
      />
      <style>
        {`
        .ql-editor {
          min-height: 200px;
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          line-height: 1.6;
        }
        .ql-toolbar {
          border-top: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
        }
        .ql-container {
          border-bottom: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
        }
        .dark .ql-toolbar {
          background-color: #374151;
          border-color: #4B5563;
        }
        .dark .ql-container {
          background-color: #374151;
          border-color: #4B5563;
        }
        .dark .ql-editor {
          color: #f3f4f6;
          background-color: #374151;
        }
        .dark .ql-toolbar button,
        .dark .ql-toolbar .ql-picker-label,
        .dark .ql-toolbar .ql-picker-item {
          color: #f3f4f6 !important;
        }
        .dark .ql-toolbar .ql-stroke {
          stroke: #f3f4f6 !important;
        }
        .dark .ql-toolbar .ql-fill {
          fill: #f3f4f6 !important;
        }
      `}
      </style>
    </div>
  );
};

export default RichTextEditor;
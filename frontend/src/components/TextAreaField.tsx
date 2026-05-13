import React from 'react';

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

function TextAreaField({ label, className, ...props }: TextAreaFieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
      <textarea
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 ${className ?? ''}`}
        {...props}
      />
    </div>
  );
}

export default TextAreaField;

import React from 'react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

function FormField({ label, className, ...props }: FormFieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
      <input
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 ${className ?? ''}`}
        {...props}
      />
    </div>
  );
}

export default FormField;
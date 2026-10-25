import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function FormField({
  label,
  name,
  id,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  hint,
  required = false,
  placeholder = '',
  options = [],
  rows = 3,
  disabled = false,
  min,
  max,
  step,
  className = '',
  children,
  ...props
}) {
  const fieldId = id || name || `field-${Math.random().toString(36).substring(2, 7)}`;

  const baseInputStyles = `w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white transition duration-150 focus:outline-none ${
    error
      ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-slate-900 bg-rose-50/20'
      : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900'
  } disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-xs font-bold uppercase tracking-wider text-slate-700"
        >
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}

      {children ? (
        children
      ) : type === 'textarea' ? (
        <textarea
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          required={required}
          className={`${baseInputStyles} resize-y`}
          {...props}
        />
      ) : type === 'select' ? (
        <select
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={`${baseInputStyles} cursor-pointer`}
          {...props}
        >
          {options.map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          id={fieldId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          step={step}
          className={baseInputStyles}
          {...props}
        />
      )}

      {hint && !error && (
        <p className="text-xs text-slate-500 leading-normal">{hint}</p>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

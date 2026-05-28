import { render, screen } from '@testing-library/react';
import SelectField from './SelectField';

const options = [
  { value: 1, label: 'Alice' },
  { value: 2, label: 'Bob' },
];

describe('SelectField', () => {
  it('renders the label', () => {
    render(<SelectField label="Teacher" options={options} />);
    expect(screen.getByText('Teacher')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<SelectField label="Teacher" options={options} />);
    expect(screen.getByRole('option', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bob' })).toBeInTheDocument();
  });

  it('renders placeholder option when provided', () => {
    render(<SelectField label="Teacher" options={options} placeholder="Select a teacher" />);
    expect(screen.getByRole('option', { name: 'Select a teacher' })).toBeInTheDocument();
  });

  it('does not render placeholder option when omitted', () => {
    render(<SelectField label="Teacher" options={options} />);
    expect(screen.getAllByRole('option')).toHaveLength(options.length);
  });

  it('forwards html attributes to the select', () => {
    render(<SelectField label="Teacher" options={options} required />);
    expect(screen.getByRole('combobox')).toBeRequired();
  });

  it('applies custom className to the select', () => {
    render(<SelectField label="Teacher" options={options} className="my-class" />);
    expect(screen.getByRole('combobox')).toHaveClass('my-class');
  });
});

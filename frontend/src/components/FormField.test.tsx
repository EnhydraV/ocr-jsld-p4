import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormField from './FormField';

describe('FormField', () => {
  it('renders the label', () => {
    render(<FormField label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders an input element', () => {
    render(<FormField label="Email" type="text" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('forwards html attributes to the input', () => {
    render(<FormField label="Email" type="email" placeholder="Enter email" required />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'Enter email');
    expect(input).toBeRequired();
  });

  it('applies custom className to the input', () => {
    render(<FormField label="Name" className="my-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('my-class');
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<FormField label="Name" onChange={handleChange} />);
    await user.type(screen.getByRole('textbox'), 'hello');
    expect(handleChange).toHaveBeenCalled();
  });
});

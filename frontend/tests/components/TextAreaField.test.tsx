import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextAreaField from '../../src/components/TextAreaField';

describe('TextAreaField', () => {
  it('renders the label', () => {
    render(<TextAreaField label="Description" />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders a textarea element', () => {
    render(<TextAreaField label="Description" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('forwards html attributes to the textarea', () => {
    render(<TextAreaField label="Description" rows={6} placeholder="Enter description" required />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '6');
    expect(textarea).toHaveAttribute('placeholder', 'Enter description');
    expect(textarea).toBeRequired();
  });

  it('applies custom className to the textarea', () => {
    render(<TextAreaField label="Description" className="my-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('my-class');
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<TextAreaField label="Description" onChange={handleChange} />);
    await user.type(screen.getByRole('textbox'), 'hello');
    expect(handleChange).toHaveBeenCalled();
  });
});

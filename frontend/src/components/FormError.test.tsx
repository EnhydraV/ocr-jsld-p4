import { render, screen } from '@testing-library/react';
import FormError from './FormError';

describe('FormError', () => {
  it('renders nothing when message is undefined', () => {
    const { container } = render(<FormError />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when message is an empty string', () => {
    const { container } = render(<FormError message="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the error message', () => {
    render(<FormError message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});

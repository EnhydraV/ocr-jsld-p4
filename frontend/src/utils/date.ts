export const formatDate = (dateStr: string, options?: Intl.DateTimeFormatOptions): string =>
  new Date(dateStr).toLocaleDateString('en-US', options);

export const toInputDate = (dateStr: string): string =>
  new Date(dateStr).toISOString().split('T')[0];
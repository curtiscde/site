import { formatDateToRFC822 } from "./formatDateToRFC822";

describe('formatDateToRFC822', () => {
  it('should format date to RFC822', () => {
    const date = new Date('2021-01-01T00:00:00Z');
    const result = formatDateToRFC822(date);
    expect(result).toEqual('Fri, 01 Jan 2021 00:00:00 GMT');
  });
});

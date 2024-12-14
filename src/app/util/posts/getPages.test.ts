import { getPages } from './getPages';

describe('getPages', () => {
  it('should return all pages', () => {
    expect(getPages({ pageCount: 6 })).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('excludeFirstPage = should not return first page', () => {
    expect(getPages({ pageCount: 6, excludeFirstPage: true })).toEqual([2, 3, 4, 5, 6]);
  });
});

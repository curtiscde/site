import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'
import Pagination from './Pagination';

describe('Pagination', () => {
  describe('currentPage = first page', () => {
    beforeEach(() => render(<Pagination currentPage={1} pageCount={10} />));

    it('does not render a previous page link', () => {
      expect(screen.queryByRole('link', {
        name: '«',
      })).toBeNull();
    });

    it('does render a next page link', () => {
      expect(screen.getByRole('link', {
        name: '»',
      })).toBeInTheDocument();
    });
  });

  describe('currentPage = last page', () => {
    beforeEach(() => render(<Pagination currentPage={10} pageCount={10} />));

    it('does render a previous page link', () => {
      expect(screen.getByRole('link', {
        name: '«',
      })).toBeInTheDocument();
    });

    it('does not render a next page link', () => {
      expect(screen.queryByRole('link', {
        name: '»',
      })).toBeNull();
    });
  });

  describe('pageCount = 1', () => {
    beforeEach(() => render(<Pagination currentPage={1} pageCount={1} />));

    it('does not render pagination', () => {
      expect(screen.queryByTestId('pagination')).toBeNull();
    });
  });
});

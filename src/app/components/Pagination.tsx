import React from 'react';
import pager from 'split-page-numbers';

interface IPageLink {
  isCurrentPage?: boolean;
  pageNumber: number;
  getPagePath: (pageNumber: number) => string;
}
interface IPagination {
  currentPage: number;
  pageCount: number;
  tag?: string;
}

const getPagePathFactory = (tag: string | undefined) => (pageNumber: number): string => {
  const isFirstPage = pageNumber === 1;

  if (tag) {
    return isFirstPage ? `/tag/${tag}` : `/tag/${tag}/${pageNumber}`;
  }

  return isFirstPage ? '/' : `/posts/${pageNumber}`;
};

function PageLink({ pageNumber, isCurrentPage, getPagePath }: IPageLink) {
  return (
    isCurrentPage
      ? <a className="join-item btn btn-lg btn-active" href={getPagePath(pageNumber)}>{pageNumber}</a>
      : <a className="join-item btn btn-lg" href={getPagePath(pageNumber)}>{pageNumber}</a>
  );
}

PageLink.defaultProps = {
  isCurrentPage: false,
};

export default function Pagination({ currentPage, pageCount, tag }: IPagination) {
  if (pageCount === 1) return null;

  const isLastPage = currentPage === pageCount;
  const pages = pager(pageCount, currentPage - 1, {
    target: 4,
    neighbours: {
      edge: 1,
      current: 1,
    },
  });
  const getPagePath = getPagePathFactory(tag);

  return (
    <div className="join py-8 mx-auto">
      {currentPage > 1 && <a className="join-item btn btn-lg" href={getPagePath(currentPage - 1)}>«</a>}
      {pages.map((page) => (
        page.isNumber()
          ? (
            <PageLink
              key={page.key}
              pageNumber={page.asNumber().value + 1}
              isCurrentPage={page.isCurrent}
              getPagePath={getPagePath}
            />
          )
          : <button key={page.key} className="join-item btn btn-lg btn-disabled">...</button>
      ))}
      {!isLastPage && <a className="join-item btn btn-lg" href={getPagePath(currentPage + 1)}>Next</a>}
    </div>
  );
}

Pagination.defaultProps = {
  tag: undefined,
};

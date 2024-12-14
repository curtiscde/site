interface IGetPages {
  pageCount: number,
  excludeFirstPage?: boolean;
}

export function getPages({ pageCount, excludeFirstPage }: IGetPages): Array<number> {
  const pages = [];
  for (let i = 1; i <= pageCount; i += 1) {
    if (!excludeFirstPage || i > 1) {
      pages.push(i);
    }
  }
  return pages;
}

import Posts, { PostsProps } from './Posts';
import Pagination, { PaginationProps } from './Pagination';

export default function PostsWithPagination({ postsProps, paginationProps }: { postsProps: PostsProps, paginationProps: PaginationProps }) {
  return (
    <>
      <div className="grid grid-cols-12 gap-4 p-4 lg:p-0 mb-16">
        <div className="grid col-span-12 posts">
          <Posts {...postsProps} />
        </div>
        <div className="grid col-span-12">
          <Pagination {...paginationProps} />
        </div>
      </div>
    </>
  );

}

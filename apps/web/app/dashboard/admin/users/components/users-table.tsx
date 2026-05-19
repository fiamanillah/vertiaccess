'use client';

import * as React from 'react';
import { columns } from './columns';
import { DataTable } from '@/components/data-table';
import type { TUser } from './types';
import { adminService } from '@/services/admin.service';
import { toast } from 'sonner';

export default function UsersTable({
  searchQuery,
  sortQuery,
  sortOrder,
}: {
  searchQuery: string;
  sortQuery: string;
  sortOrder: 'asc' | 'desc';
}) {
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState<TUser[]>([]);
  const [totalRows, setTotalRows] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);

  React.useEffect(() => {
    let active = true;

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await adminService.listUsers({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          search: searchQuery || undefined,
          sort: sortQuery || undefined,
          sortOrder: sortOrder,
        });

        if (active && response.success) {
          setData(response.data);
          setTotalRows(response.meta.pagination.total);
          setTotalPages(response.meta.pagination.totalPages);
        }
      } catch (err: any) {
        if (active) {
          toast.error(err.message || 'Failed to load users');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      active = false;
    };
  }, [pagination.pageIndex, pagination.pageSize, searchQuery, sortQuery, sortOrder]);

  return (
    <DataTable
      columns={columns}
      data={data}
      totalRows={totalRows}
      totalPages={totalPages}
      pagination={pagination}
      onPaginationChange={setPagination}
      isLoading={isLoading}
    />
  );
}

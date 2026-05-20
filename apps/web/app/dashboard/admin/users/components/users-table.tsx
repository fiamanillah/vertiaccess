'use client';

import * as React from 'react';
import { getColumns } from './columns';
import { DataTable } from '@/components/data-table';
import type { TUser } from './types';
import { adminService } from '@/services/admin.service';
import { toast } from 'sonner';
import { UserDrawer } from './user-drawer';

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

  // Drawer states
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const fetchUsers = React.useCallback(async (active: { current: boolean }) => {
    setIsLoading(true);
    try {
      const response = await adminService.listUsers({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: searchQuery || undefined,
        sort: sortQuery || undefined,
        sortOrder: sortOrder,
      });

      if (active.current && response.success) {
        setData(response.data);
        setTotalRows(response.meta.pagination.total);
        setTotalPages(response.meta.pagination.totalPages);
      }
    } catch (err: any) {
      if (active.current) {
        toast.error(err.message || 'Failed to load users');
      }
    } finally {
      if (active.current) {
        setIsLoading(false);
      }
    }
  }, [pagination.pageIndex, pagination.pageSize, searchQuery, sortQuery, sortOrder]);

  React.useEffect(() => {
    const active = { current: true };
    fetchUsers(active);
    return () => {
      active.current = false;
    };
  }, [fetchUsers, refreshTrigger]);

  const handleManageUser = (user: TUser) => {
    setSelectedUserId(user.id);
    setDrawerOpen(true);
  };

  const handleActionComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const columns = React.useMemo(() => getColumns(handleManageUser), []);

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        totalRows={totalRows}
        totalPages={totalPages}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={isLoading}
        onRowClick={(row) => handleManageUser(row)}
      />

      <UserDrawer
        userId={selectedUserId}
        isOpen={drawerOpen}
        onOpenChange={setDrawerOpen}
        onActionComplete={handleActionComplete}
      />
    </>
  );
}

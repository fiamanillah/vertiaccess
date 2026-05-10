'use client';

import * as React from 'react';
import { columns } from './columns';
import { DataTable } from '@/components/data-table';
import type { TUser } from './types';

// Mock data generator
const generateMockUsers = (count: number): TUser[] => {
  const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana'];
  const lastNames = ['Doe', 'Smith', 'Johnson', 'Brown', 'Davis', 'Miller'];
  
  return Array.from({ length: count }, (_, i) => {
    const fName = firstNames[i % firstNames.length] || 'User';
    const lName = lastNames[i % lastNames.length] || `${i}`;
    
    return {
      id: `user-${i + 1}`,
      firstName: fName,
      lastName: lName,
      displayName: `${fName} ${lName}`,
      email: `${fName.toLowerCase()}${i}@example.com`,
      role: i % 10 === 0 ? 'admin' : 'user',
      status: ['active', 'pending_verification', 'suspended', 'inactive'][i % 4] as TUser['status'],
      avatarUrl: `https://i.pravatar.cc/150?u=user-${i}`,
      instagramUrl: i % 2 === 0 ? 'https://instagram.com/user' : undefined,
      bio: i % 3 === 0 ? 'Software Engineer with a passion for web development and open source projects. Always looking for new challenges.' : 'Regular user.',
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
};

const ALL_MOCK_USERS = generateMockUsers(100);

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
  const [isLoading, setIsLoading] = React.useState(false);

  // Filter and sort mock data
  const filteredData = React.useMemo(() => {
    let data = [...ALL_MOCK_USERS];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    data.sort((a, b) => {
      const valA = a[sortQuery as keyof TUser] || '';
      const valB = b[sortQuery as keyof TUser] || '';
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [searchQuery, sortQuery, sortOrder]);

  const totalRows = filteredData.length;
  const totalPages = Math.ceil(totalRows / pagination.pageSize);
  
  const paginatedData = React.useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    return filteredData.slice(start, start + pagination.pageSize);
  }, [filteredData, pagination]);

  // Simulate loading on pagination change
  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pagination, searchQuery, sortQuery, sortOrder]);

  return (
    <DataTable
      columns={columns}
      data={paginatedData}
      totalRows={totalRows}
      totalPages={totalPages}
      pagination={pagination}
      onPaginationChange={setPagination}
      isLoading={isLoading}
    />
  );
}

'use client';

import * as React from 'react';
import { DataTable } from '@/components/data-table';
import { getColumns } from './columns';
import { Ticket } from '@/app/dashboard/components/incident-report/types';

interface IncidentReportTableProps {
    data: Ticket[];
    isLoading: boolean;
    baseUrl: string;
    isAdmin?: boolean;
    searchQuery: string;
    sortQuery: string;
    sortOrder: 'asc' | 'desc';
}

export function IncidentReportTable({
    data: rawData,
    isLoading: isInitialLoading,
    baseUrl,
    isAdmin,
    searchQuery,
    sortQuery,
    sortOrder
}: IncidentReportTableProps) {
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
    const [isLoading, setIsLoading] = React.useState(false);

    const columns = React.useMemo(() => getColumns(baseUrl, isAdmin), [baseUrl, isAdmin]);

    // Filter and sort data
    const filteredData = React.useMemo(() => {
        let data = [...rawData];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(
                (t) =>
                    t.reference.toLowerCase().includes(q) ||
                    t.bookingRef.toLowerCase().includes(q) ||
                    t.category.toLowerCase().includes(q) ||
                    t.description.toLowerCase().includes(q)
            );
        }

        data.sort((a, b) => {
            const valA = (a[sortQuery as keyof Ticket] || '') as string | number;
            const valB = (b[sortQuery as keyof Ticket] || '') as string | number;
            
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [rawData, searchQuery, sortQuery, sortOrder]);

    const totalRows = filteredData.length;
    const totalPages = Math.ceil(totalRows / pagination.pageSize);
    
    const paginatedData = React.useMemo(() => {
        const start = pagination.pageIndex * pagination.pageSize;
        return filteredData.slice(start, start + pagination.pageSize);
    }, [filteredData, pagination]);

    // Simulate loading on changes
    React.useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 300);
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
            isLoading={isLoading || isInitialLoading}
        />
    );
}

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { ArrowDownNarrowWide, ArrowUpNarrowWide, Search } from 'lucide-react';
import UsersTable from './components/users-table';

export default function Page() {
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  const sortOptions = [
    { value: 'displayName', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'createdAt', label: 'Created At' },
    { value: 'role', label: 'Role' },
    { value: 'status', label: 'Status' },
  ];

  const handleSearch = () => setQuery(search);
  const handleSortOrder = () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor user accounts and their permissions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Select onValueChange={setSort} value={sort}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSortOrder} size="icon" variant="outline" title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}>
              {sortOrder === 'asc' ? <ArrowUpNarrowWide size={18} /> : <ArrowDownNarrowWide size={18} />}
            </Button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>

      <Card className="border-none shadow-none bg-transparent md:bg-card md:border md:shadow-sm">
        <CardHeader className="px-0 md:px-6">
          <CardTitle>Users</CardTitle>
          <CardDescription>
            A list of all users in the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 md:px-6">
          <UsersTable searchQuery={query} sortQuery={sort} sortOrder={sortOrder} />
        </CardContent>
      </Card>
    </div>
  );
}

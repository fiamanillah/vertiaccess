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
import { ArrowDownNarrowWide, ArrowUpNarrowWide, Search, Plus } from 'lucide-react';
import UsersTable from './components/users-table';
import CreateUserDialog from './components/create-user-dialog';

export default function Page() {
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState('lastLogin');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [createUserOpen, setCreateUserOpen] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const sortOptions = [
    { value: 'displayName', label: 'Full Name' },
    { value: 'email', label: 'Email' },
    { value: 'lastLogin', label: 'Last Login' },
    { value: 'role', label: 'Role' },
    { value: 'status', label: 'Account Status' },
  ];

  const handleSearch = () => setQuery(search);
  const handleSortOrder = () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  const handleRefresh = () => setRefreshTrigger(prev => prev + 1);

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
          <Button onClick={() => setCreateUserOpen(true)} className="flex items-center gap-1.5 font-semibold">
            <Plus className="h-4 w-4" />
            <span>Create User</span>
          </Button>
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
          <UsersTable searchQuery={query} sortQuery={sort} sortOrder={sortOrder} refreshTrigger={refreshTrigger} />
        </CardContent>
      </Card>

      <CreateUserDialog isOpen={createUserOpen} onOpenChange={setCreateUserOpen} onCreated={handleRefresh} />
    </div>
  );
}

'use client';

import * as React from 'react';
import { Search, Map as MapIcon, List, Grid, Filter, MapPin, SlidersHorizontal, Zap, Shield, HelpCircle } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { cn } from '@workspace/ui/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu';
import { Badge } from '@workspace/ui/components/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@workspace/ui/components/alert-dialog';

interface SearchHeaderProps {
    viewMode: 'list' | 'grid' | 'map';
    onViewChange: (mode: 'list' | 'grid' | 'map') => void;
    onSearch: (query: string) => void;
    currentQuery?: string;
}

export function SearchHeader({ viewMode, onViewChange, onSearch, currentQuery = '' }: SearchHeaderProps) {
    const [query, setQuery] = React.useState('');
    const [radius, setRadius] = React.useState('10');
    const [siteType, setSiteType] = React.useState('all');
    const [approval, setApproval] = React.useState('all');
    const [isLocationModalOpen, setIsLocationModalOpen] = React.useState(false);

    const handleAllowLocation = () => {
        setIsLocationModalOpen(false);
        // Trigger native prompt
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('Got position:', position.coords.latitude, position.coords.longitude);
                    // Handle the position internally, e.g. set map center or fetch new mock sites
                },
                (error) => {
                    console.error('Location error:', error);
                }
            );
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <div className="sticky top-[16px] z-20 bg-background/80 backdrop-blur-xl border-b border-border/40 pb-4 shadow-sm pt-4 lg:pt-0">
            <div className="flex flex-col gap-4">
                {/* Top Row: Search Input & View Toggle */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full max-w-2xl group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Search by city, postcode, or coordinates..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-10 pr-36 h-12 w-full rounded-2xl bg-muted/40 border-border/50 focus:bg-background shadow-inner text-base transition-all"
                        />
                        <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsLocationModalOpen(true)}
                                className="h-8 px-2.5 text-muted-foreground hover:text-primary hover:bg-muted/60 rounded-xl hidden sm:flex gap-1.5"
                            >
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">Locate Me</span>
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsLocationModalOpen(true)}
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted/60 rounded-xl sm:hidden"
                            >
                                <MapPin className="h-4 w-4" />
                            </Button>
                            <Button type="submit" size="sm" className="h-8 rounded-xl px-4 font-bold shadow-md">
                                Search
                            </Button>
                        </div>
                    </form>

                    {/* View Toggle (Pill) */}
                    <div className="flex items-center p-1 bg-muted/50 rounded-full border border-border/50 shrink-0 self-end sm:self-auto w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => onViewChange('list')}
                            className={cn(
                                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200",
                                viewMode === 'list'
                                    ? "bg-background text-foreground shadow-sm border border-border/40"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            )}
                        >
                            <List className="h-4 w-4" />
                            List
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewChange('grid')}
                            className={cn(
                                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200",
                                viewMode === 'grid'
                                    ? "bg-background text-foreground shadow-sm border border-border/40"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            )}
                        >
                            <Grid className="h-4 w-4" />
                            Grid
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewChange('map')}
                            className={cn(
                                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200",
                                viewMode === 'map'
                                    ? "bg-background text-foreground shadow-sm border border-border/40"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            )}
                        >
                            <MapIcon className="h-4 w-4" />
                            Map
                        </button>
                    </div>
                </div>

                {/* Bottom Row: Filters */}
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
                        <div className="flex items-center gap-2 shrink-0">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mr-1">Filters</span>
                    </div>

                    <Select value={radius} onValueChange={setRadius}>
                        <SelectTrigger className="w-[140px] h-9 rounded-xl bg-background border-border/60 text-xs font-semibold shadow-sm shrink-0">
                            <MapPin className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Radius" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">Within 5km</SelectItem>
                            <SelectItem value="10">Within 10km</SelectItem>
                            <SelectItem value="25">Within 25km</SelectItem>
                            <SelectItem value="50">Within 50km</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={siteType} onValueChange={setSiteType}>
                        <SelectTrigger className="w-[160px] h-9 rounded-xl bg-background border-border/60 text-xs font-semibold shadow-sm shrink-0">
                            <SelectValue placeholder="Site Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Site Types</SelectItem>
                            <SelectItem value="toal">Standard TOAL</SelectItem>
                            <SelectItem value="emergency">Emergency / Recovery</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={approval} onValueChange={setApproval}>
                        <SelectTrigger className="w-[160px] h-9 rounded-xl bg-background border-border/60 text-xs font-semibold shadow-sm shrink-0">
                            <SelectValue placeholder="Approval Model" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Approvals</SelectItem>
                            <SelectItem value="auto">
                                <div className="flex items-center gap-1.5">
                                    <Zap className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500" />
                                    <span>Auto-Approval</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="manual">
                                <div className="flex items-center gap-1.5">
                                    <Shield className="h-3.5 w-3.5 text-blue-500" />
                                    <span>Manual Review</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-9 rounded-xl bg-background border-border/60 text-xs font-semibold shadow-sm shrink-0 px-3">
                                <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
                                Price Range
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[240px] p-4">
                            <DropdownMenuLabel className="px-0 pt-0 pb-3 flex items-center justify-between">
                                <span className="text-sm font-bold">Access Fee Range</span>
                                <Badge variant="secondary" className="font-mono text-[10px]">£0 - £200+</Badge>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="pt-4 pb-2 space-y-4">
                                <input
                                    type="range"
                                    min="0" max="200" step="10"
                                    defaultValue="200"
                                    className="w-full accent-primary"
                                />
                                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                                    <span>£0</span>
                                    <span>£200+</span>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                
                <div className="hidden lg:flex items-center text-sm text-muted-foreground whitespace-nowrap pl-4 shrink-0">
                    Showing results for <strong className="ml-1 text-foreground">"{currentQuery || 'All Locations'}"</strong>
                </div>
            </div>

            <AlertDialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
                <AlertDialogContent className="sm:max-w-md p-6 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    
                    <AlertDialogHeader className="gap-4 relative z-10">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <MapPin className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <AlertDialogTitle className="text-xl font-bold">Find sites closest to you</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-muted-foreground/90 leading-relaxed pt-1">
                                To calculate exact distances and show TOAL sites near your current position, we need access to your device's location. We only use this while you are browsing.
                            </AlertDialogDescription>
                        </div>
                    </AlertDialogHeader>
                    
                    <AlertDialogFooter className="mt-4 sm:justify-between border-none bg-transparent p-0 relative z-10 gap-3 sm:gap-0">
                        <AlertDialogCancel 
                            onClick={() => setIsLocationModalOpen(false)}
                            className="font-bold w-full sm:w-auto"
                        >
                            Not Now
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleAllowLocation}
                            className="font-bold w-full sm:w-auto shadow-md shadow-primary/20"
                        >
                            Allow Location
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    </div>
    );
}

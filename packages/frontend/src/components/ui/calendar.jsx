import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from 'lucide-react';

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    captionLayout = 'label',
    buttonVariant = 'ghost',
    locale,
    formatters,
    components,
    ...props
}) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn(
                'group/calendar rounded-2xl border border-slate-200/70 bg-white/95 p-2 shadow-xl [--cell-radius:calc(var(--radius-md)+2px)] [--cell-size:--spacing(9)] backdrop-blur-sm in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent',
                String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
                String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
                className
            )}
            captionLayout={captionLayout}
            locale={locale}
            formatters={{
                formatMonthDropdown: date => date.toLocaleString(locale?.code, { month: 'short' }),
                ...formatters,
            }}
            classNames={{
                root: cn('w-fit'),
                months: cn('relative flex flex-col gap-2 md:flex-row'),
                month: cn('flex w-full flex-col gap-2 px-1 py-1'),
                nav: cn('absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1'),
                button_previous: cn(
                    buttonVariants({ variant: buttonVariant }),
                    'size-(--cell-size) rounded-xl border border-slate-200 bg-white p-0 text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 aria-disabled:opacity-40'
                ),
                button_next: cn(
                    buttonVariants({ variant: buttonVariant }),
                    'size-(--cell-size) rounded-xl border border-slate-200 bg-white p-0 text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 aria-disabled:opacity-40'
                ),
                month_caption: cn(
                    'flex h-(--cell-size) w-full items-center justify-center px-(--cell-size) pb-1'
                ),
                dropdowns: cn(
                    'flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-bold text-slate-800'
                ),
                dropdown_root: cn('relative rounded-(--cell-radius)'),
                dropdown: cn('absolute inset-0 bg-popover opacity-0'),
                caption_label: cn(
                    'font-bold select-none text-slate-900',
                    captionLayout === 'label'
                        ? 'text-sm'
                        : 'flex items-center gap-1 rounded-(--cell-radius) text-sm [&>svg]:size-3.5 [&>svg]:text-slate-500'
                ),
                table: 'w-full border-collapse',
                weekdays: cn('flex'),
                weekday: cn(
                    'flex-1 rounded-(--cell-radius) py-1 text-[0.72rem] font-bold tracking-[0.08em] text-slate-500 uppercase select-none'
                ),
                week: cn('mt-1 flex w-full'),
                week_number_header: cn('w-(--cell-size) select-none'),
                week_number: cn('text-[0.8rem] text-muted-foreground select-none'),
                day: cn(
                    'group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0.5 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)',
                    props.showWeekNumber
                        ? '[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)'
                        : '[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)'
                ),
                range_start: cn(
                    'relative isolate z-0 rounded-l-(--cell-radius) bg-blue-100/80 after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-blue-100/80'
                ),
                range_middle: cn('rounded-none bg-blue-50/70'),
                range_end: cn(
                    'relative isolate z-0 rounded-r-(--cell-radius) bg-blue-100/80 after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-blue-100/80'
                ),
                today: cn(
                    'rounded-(--cell-radius) ring-1 ring-blue-200 bg-blue-50 text-blue-700 data-[selected=true]:rounded-none'
                ),
                outside: cn('text-slate-300 aria-selected:text-slate-400'),
                disabled: cn('text-slate-300 opacity-45'),
                hidden: cn('invisible'),
                ...classNames,
            }}
            components={{
                Root: ({ className, rootRef, ...props }) => {
                    return (
                        <div
                            data-slot="calendar"
                            ref={rootRef}
                            className={cn(className)}
                            {...props}
                        />
                    );
                },
                Chevron: ({ className, orientation, ...props }) => {
                    if (orientation === 'left') {
                        return <ChevronLeftIcon className={cn('size-4', className)} {...props} />;
                    }

                    if (orientation === 'right') {
                        return <ChevronRightIcon className={cn('size-4', className)} {...props} />;
                    }

                    return <ChevronDownIcon className={cn('size-4', className)} {...props} />;
                },
                DayButton: ({ ...props }) => <CalendarDayButton locale={locale} {...props} />,
                WeekNumber: ({ children, ...props }) => {
                    return (
                        <td {...props}>
                            <div className="flex size-(--cell-size) items-center justify-center text-center">
                                {children}
                            </div>
                        </td>
                    );
                },
                ...components,
            }}
            {...props}
        />
    );
}

function CalendarDayButton({ className, day, modifiers, locale, ...props }) {
    const ref = React.useRef(null);
    React.useEffect(() => {
        if (modifiers.focused) ref.current?.focus();
    }, [modifiers.focused]);

    return (
        <Button
            ref={ref}
            variant="ghost"
            size="icon"
            data-day={day.date.toLocaleDateString(locale?.code)}
            data-selected-single={
                modifiers.selected &&
                !modifiers.range_start &&
                !modifiers.range_end &&
                !modifiers.range_middle
            }
            data-range-start={modifiers.range_start}
            data-range-end={modifiers.range_end}
            data-range-middle={modifiers.range_middle}
            className={cn(
                'relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 rounded-(--cell-radius) border-0 leading-none font-semibold text-slate-700 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-blue-600 data-[range-end=true]:text-white data-[range-end=true]:shadow-sm data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-blue-50/70 data-[range-middle=true]:text-slate-800 data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-blue-600 data-[range-start=true]:text-white data-[range-start=true]:shadow-sm data-[selected-single=true]:bg-blue-600 data-[selected-single=true]:text-white data-[selected-single=true]:shadow-sm data-[selected-single=true]:ring-2 data-[selected-single=true]:ring-blue-600/20 dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70',
                className
            )}
            {...props}
        />
    );
}

export { Calendar, CalendarDayButton };

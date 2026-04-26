import type { Site } from '../../types';
import { SectionTitle } from './SectionTitle';
import { DateTimePicker } from '../DateTimePicker';

interface ValiditySectionProps {
    site: Site;
    isEditing: boolean;
    validityStart: string;
    setValidityStart: (val: string) => void;
    validityStartTime: string;
    setValidityStartTime: (val: string) => void;
    validityEnd: string;
    setValidityEnd: (val: string) => void;
    validityEndTime: string;
    setValidityEndTime: (val: string) => void;
    untilFurtherNotice: boolean;
    setUntilFurtherNotice: (val: boolean) => void;
}

export function ValiditySection({
    site,
    isEditing,
    validityStart,
    setValidityStart,
    validityStartTime,
    setValidityStartTime,
    validityEnd,
    setValidityEnd,
    validityEndTime,
    setValidityEndTime,
    untilFurtherNotice,
    setUntilFurtherNotice,
}: ValiditySectionProps) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <SectionTitle>Validity Period</SectionTitle>
            <div className="space-y-4">
                {isEditing ? (
                    <div className="space-y-4">
                        <DateTimePicker
                            dateValue={validityStart}
                            timeValue={validityStartTime}
                            onDateChange={setValidityStart}
                            onTimeChange={setValidityStartTime}
                            label="Start Date"
                            required
                        />
                        {!untilFurtherNotice && (
                            <DateTimePicker
                                dateValue={validityEnd}
                                timeValue={validityEndTime}
                                onDateChange={setValidityEnd}
                                onTimeChange={setValidityEndTime}
                                label="End Date"
                                required
                            />
                        )}
                        <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                            <input
                                type="checkbox"
                                checked={untilFurtherNotice}
                                onChange={e => setUntilFurtherNotice(e.target.checked)}
                                className="size-4 rounded text-blue-600 focus:ring-blue-600"
                            />
                            <span className="font-bold text-sm text-slate-900">
                                Until Further Notice
                            </span>
                        </label>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                                Active From
                            </p>
                            <p className="text-sm text-slate-800 font-bold">
                                {new Date(site.validityStart).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                })}
                                <span className="text-slate-400 font-medium ml-2">
                                    {new Date(site.validityStart).toLocaleTimeString('en-GB', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                                Active Until
                            </p>
                            <p
                                className={`text-sm font-bold ${!site.validityEnd ? 'text-blue-600' : 'text-slate-800'}`}
                            >
                                {site.validityEnd
                                    ? `${new Date(site.validityEnd).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                                    : 'Until Further Notice'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

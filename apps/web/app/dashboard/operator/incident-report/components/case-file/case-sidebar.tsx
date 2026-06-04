'use client'

import * as React from 'react'
import { Ticket } from '@/app/dashboard/components/incident-report/types'
import { Badge } from '@workspace/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Separator } from '@workspace/ui/components/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@workspace/ui/components/collapsible'
import {
  ChevronDown,
  Info,
  ExternalLink,
  MapPin,
  User,
  ShieldAlert,
  Building2,
  Plane,
  ScrollText,
  Ban,
  Lock,
  CheckCircle2,
  Activity,
  AlertTriangle,
  FileText
} from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import Link from 'next/link'

interface CaseSidebarProps {
  ticket: Ticket
}

export function CaseSidebar({ ticket }: CaseSidebarProps) {
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    'overview': true,
    'operation': false,
    'classification': false,
    'impact': false,
    'evidence': false
  })

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const decisionIcon =
    ticket.decision?.action === 'ban' ? (
      <Ban className="h-4 w-4" />
    ) : ticket.decision?.action === 'temporary_suspend' ? (
      <Lock className="h-4 w-4" />
    ) : ticket.decision?.action === 'warning' ? (
      <ShieldAlert className="h-4 w-4" />
    ) : (
      <CheckCircle2 className="h-4 w-4" />
    )

  return (
    <aside className="space-y-6">
      <Card className="border-none shadow-xl bg-background/50 backdrop-blur-xl overflow-hidden">
        <div className={cn('h-1.5 w-full', ticket.status === 'action_required' ? 'bg-red-600' : 'bg-amber-500')} />
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Case Metadata</span>
            <Badge
              className={cn(
                'text-[9px] font-black uppercase tracking-widest border-none h-5 px-2',
                ticket.status === 'action_required'
                  ? 'bg-red-100 text-red-700'
                  : ticket.status === 'under_review'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700',
              )}
            >
              {ticket.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <CardTitle className="text-2xl font-black tracking-tighter uppercase">
            {ticket.reference}
          </CardTitle>
          <div className="text-xs text-muted-foreground mt-1 font-medium">Created: {new Date(ticket.createdAt).toLocaleDateString()}</div>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          
          {/* OVERVIEW SECTION */}
          <Collapsible open={openSections['overview']} onOpenChange={() => toggleSection('overview')} className="border-t border-border/40">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-muted/10 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                <User className="h-4 w-4" /> Overview & Parties
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", openSections['overview'] && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4 animate-in slide-in-from-top-1">
              <div className="space-y-4 pt-2">
                {ticket.decision && (
                  <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                      {decisionIcon}
                      Decision
                    </div>
                    <div className="text-sm font-bold capitalize">
                      {ticket.decision.action.replace(/_/g, ' ')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ticket.decision.reason}
                    </p>
                  </div>
                )}
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plane className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operator</div>
                      <div className="text-sm font-bold">{ticket.operatorName || 'Unknown'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-amber-700" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Landowner</div>
                      <div className="text-sm font-bold">{ticket.landownerName || 'Unknown'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* OPERATION SECTION */}
          <Collapsible open={openSections['operation']} onOpenChange={() => toggleSection('operation')} className="border-t border-border/40">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-muted/10 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                <Info className="h-4 w-4" /> Operation Details
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", openSections['operation'] && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4 animate-in slide-in-from-top-1">
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground uppercase tracking-widest">Asset Name</span>
                  <span className="font-bold text-foreground text-right">{ticket.siteName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground uppercase tracking-widest">Booking Ref</span>
                  <span className="font-mono font-bold bg-muted/80 px-2 py-0.5 rounded text-[10px]">{ticket.bookingRef || 'N/A'}</span>
                </div>
                <Link href={`/dashboard/operator/bookings/${ticket.bookingId}`} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1 pt-2">
                  View Full Request <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* CLASSIFICATION SECTION */}
          <Collapsible open={openSections['classification']} onOpenChange={() => toggleSection('classification')} className="border-t border-border/40">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-muted/10 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                <AlertTriangle className="h-4 w-4" /> Classification
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", openSections['classification'] && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4 animate-in slide-in-from-top-1">
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Category</span>
                  <div className="text-sm font-bold capitalize">{ticket.category.replace(/_/g, ' ')}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Severity</span>
                  <Badge className={cn("capitalize border-none shadow-none text-xs", 
                    ticket.priority === 'critical' ? 'bg-red-100 text-red-700' : 
                    ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    ticket.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                  )}>
                    {ticket.priority}
                  </Badge>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* IMPACT SECTION */}
          <Collapsible open={openSections['impact']} onOpenChange={() => toggleSection('impact')} className="border-t border-border/40">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-muted/10 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                <Activity className="h-4 w-4" /> Impact Assessment
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", openSections['impact'] && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4 animate-in slide-in-from-top-1">
              <div className="pt-2">
                {ticket.impactAssessment && ticket.impactAssessment.length > 0 ? (
                  <ul className="space-y-2">
                    {ticket.impactAssessment.map((impact, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs font-medium">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        {impact}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-muted-foreground italic">No impact assessment provided.</div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* EVIDENCE SECTION */}
          <Collapsible open={openSections['evidence']} onOpenChange={() => toggleSection('evidence')} className="border-t border-border/40 border-b">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-muted/10 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                <FileText className="h-4 w-4" /> Attached Evidence
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", openSections['evidence'] && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4 animate-in slide-in-from-top-1">
              <div className="pt-2">
                {ticket.thread.flatMap(t => ('attachments' in t ? t.attachments || [] : [])).length > 0 || (ticket as any).relatedDocumentation?.length > 0 ? (
                  <div className="space-y-2">
                    {ticket.thread.flatMap(t => ('attachments' in t ? t.attachments || [] : [])).map((doc, idx) => (
                      <a key={`doc-${idx}`} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                        <span className="text-xs font-medium truncate pr-4">{doc.name}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                      </a>
                    ))}
                    {(ticket as any).relatedDocumentation?.map((doc: any, idx: number) => (
                      <a key={`rel-${idx}`} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                        <span className="text-xs font-medium truncate pr-4">{doc.name}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">No evidence attached.</div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="p-4 flex items-center gap-2 rounded-lg bg-indigo-50/50 border border-indigo-100 text-indigo-700 m-4 mt-6">
            <ScrollText className="h-4 w-4 shrink-0" />
            <p className="text-[10px] font-bold leading-tight">
              This investigation is mediated by the VertiAccess Safety Team. All decisions are final.
            </p>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}

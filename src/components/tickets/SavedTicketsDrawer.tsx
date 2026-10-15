'use client';

import React, { useState, useEffect } from 'react';
import { SavedTicket, getUserTickets, deleteTicket } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  X,
  Bookmark,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Calendar,
  Layers,
  Inbox,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BugAnalysis } from '@/types/bug';

interface SavedTicketsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTicket: (ticket: SavedTicket) => void;
}

export const SavedTicketsDrawer: React.FC<SavedTicketsDrawerProps> = ({
  isOpen,
  onClose,
  onLoadTicket,
}) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SavedTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTickets = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const items = await getUserTickets(user.uid);
      setTickets(items);
    } catch (err) {
      console.error('Error fetching saved tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchTickets();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const filteredTickets = tickets.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      t.severity.toLowerCase().includes(q) ||
      (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
    );
  });

  const handleDelete = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (!confirm('Are you sure you want to delete this saved ticket?')) return;

    try {
      await deleteTicket(ticketId, user.uid);
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    } catch (err) {
      console.error('Failed to delete ticket:', err);
    }
  };

  const handleCopyJira = (ticket: SavedTicket, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ticket.jiraMarkdown) return;
    navigator.clipboard.writeText(ticket.jiraMarkdown);
    setCopiedId(ticket.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center shadow-sm">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Saved Jira Tickets & Test Suites</h3>
                <Badge variant="cyan" size="sm">
                  Firestore
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                {user?.email || 'Logged in user'}&apos;s saved reproduction packets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/30">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by issue title, summary, or severity..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
        </div>

        {/* Tickets List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs font-mono">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading saved tickets from Firestore...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
              <Inbox className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No saved tickets found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                When you generate a developer packet in the workbench, click &quot;Save Ticket to Profile&quot; to keep it here.
              </p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => {
                  onLoadTicket(ticket);
                  onClose();
                }}
                className="group p-4 bg-slate-950 hover:bg-slate-850/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all cursor-pointer shadow-sm relative"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        ticket.severity === 'critical'
                          ? 'rose'
                          : ticket.severity === 'high'
                          ? 'amber'
                          : 'cyan'
                      }
                      size="sm"
                    >
                      {ticket.severity}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {formatDate(ticket.createdAt)}
                    </span>
                  </div>

                  {ticket.aiModel && (
                    <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{ticket.aiModel.includes('(') ? ticket.aiModel.split('(')[1].replace(')', '') : 'Gemini'}</span>
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1 mb-1">
                  {ticket.title}
                </h4>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {ticket.summary}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-xs">
                  <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1 group-hover:underline">
                    <span>Load in Workbench</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      title="Copy Jira Markdown"
                      onClick={(e) => handleCopyJira(ticket, e)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      {copiedId === ticket.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      title="Delete saved ticket"
                      onClick={(e) => handleDelete(ticket.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Firestore Sync Active</span>
          </span>
          <span>{tickets.length} Saved Ticket{tickets.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
};

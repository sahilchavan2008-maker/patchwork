'use client';

import React, { useState, useRef } from 'react';
import { RawReport, AttachmentType } from '@/types/bug';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  FileText,
  UploadCloud,
  Mic,
  Sparkles,
  Paperclip,
  X,
  FileCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntakeFormProps {
  onAnalyze: (report: RawReport) => Promise<void> | void;
  isLoading?: boolean;
}

const SAMPLE_PRESETS: { label: string; text: string; attachment?: { name: string; type: AttachmentType } }[] = [
  {
    label: 'Checkout Concurrency Race',
    text: `Whenever a customer opens two checkout tabs and pays in tab 2, switching back to tab 1 and clicking "Place Order" instantly kicks them out to the login page and revokes their session cookie. In the browser console we see a 401 Unauthorized from /api/checkout/finalize and the user complains their cart was emptied.`,
    attachment: { name: 'checkout_race_screenshot.png', type: 'screenshot' },
  },
  {
    label: 'Voice Note Transcript',
    text: `Voice note from QA (00:43): "Hey team, testing the billing modal on Chrome on Windows. When you enter a card with 3DS verification and close the popup window halfway through, the primary modal remains frozen in an infinite spinner and doesn't unlock the submit button even if you click Cancel."`,
    attachment: { name: 'qa_voice_recording.m4a', type: 'recording' },
  },
  {
    label: 'Mobile Safari Blank Screen',
    text: `Users on iOS 18 Safari report that upon tapping "Save Profile Changes", the screen flashes white and fails to display the success toast. Refreshing shows that the data was actually saved in Postgres, but the client router crashed.`,
    attachment: { name: 'safari_console.log', type: 'log' },
  },
];

export const IntakeForm: React.FC<IntakeFormProps> = ({
  onAnalyze,
  isLoading = false,
}) => {
  const [rawText, setRawText] = useState('');
  const [attachment, setAttachment] = useState<{
    name: string;
    type: AttachmentType;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      setErrorMessage('Please enter a bug description or load a sample scenario.');
      return;
    }
    setErrorMessage(null);
    onAnalyze({
      rawText: rawText.trim(),
      attachmentName: attachment?.name,
      attachmentType: attachment?.type || 'none',
    });
  };

  const handlePresetSelect = (preset: typeof SAMPLE_PRESETS[0]) => {
    setRawText(preset.text);
    if (preset.attachment) {
      setAttachment(preset.attachment);
    } else {
      setAttachment(null);
    }
    setErrorMessage(null);
  };

  const handleSimulatedFileUpload = (name: string, type: AttachmentType) => {
    setAttachment({ name, type });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let type: AttachmentType = 'screenshot';
      if (extension === 'log' || extension === 'txt') type = 'log';
      else if (extension === 'mp3' || extension === 'm4a' || extension === 'wav') type = 'recording';
      else if (extension === 'har') type = 'har';

      setAttachment({
        name: file.name,
        type,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="cyan" size="sm">
              Raw Bug Ingest
            </Badge>
            <Badge variant="indigo" size="sm">
              Phase 2 Engine
            </Badge>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Raw Bug Intake & Voice Note Parser</span>
            <FileText className="w-5 h-5 text-indigo-400" />
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Drop unstructured bug descriptions, customer support tickets, or audio transcripts. Patchwork will isolate ambiguities and reconstruct reproduction vectors.
          </p>
        </div>

        {/* Quick presets */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(p)}
                className="px-2.5 py-1 text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition-colors font-mono"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card accent="indigo">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">
                Unstructured Report / Voice Note Transcript
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-mono">
                {rawText.length} characters
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                rows={6}
                placeholder="Paste customer report, Slack message, QA voice note transcript, or crash details here..."
                className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono leading-relaxed"
              />
              {errorMessage && (
                <div className="flex items-center space-x-1.5 text-xs text-rose-400 mt-1 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Mock Screenshot / Attachment Drop Area */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Attachment / Screenshot / Log Artifact
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                className="hidden"
              />

              {attachment ? (
                <div className="p-4 bg-slate-950/80 border border-cyan-500/40 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 flex items-center justify-center">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-semibold text-slate-100">
                        {attachment.name}
                      </div>
                      <div className="text-[11px] text-cyan-400 font-mono capitalize">
                        Type: {attachment.type} artifact attached
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      setAttachment({ name: file.name, type: 'screenshot' });
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150',
                    isDragOver
                      ? 'border-cyan-400 bg-cyan-950/20'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70'
                  )}
                >
                  <UploadCloud className="w-8 h-8 mx-auto text-slate-500 mb-2 group-hover:text-cyan-400" />
                  <p className="text-xs font-medium text-slate-300">
                    Drop screenshots, HAR files, or server logs here, or{' '}
                    <span className="text-cyan-400 underline">browse files</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Supports PNG, JPG, MP4, HAR, LOG up to 25MB
                  </p>

                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimulatedFileUpload('repro_checkout_trace.har', 'har');
                      }}
                      className="text-[10px] px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-400 hover:text-slate-200"
                    >
                      + Attach Mock HAR
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimulatedFileUpload('error_stack_dump.log', 'log');
                      }}
                      className="text-[10px] px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-400 hover:text-slate-200"
                    >
                      + Attach Mock Log
                    </button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>Ambiguity engine will isolate unknowns before developer dispatch.</span>
            </div>

            <Button
              type="submit"
              variant="cyan"
              size="lg"
              isLoading={isLoading}
              className="px-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze Report</span>
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

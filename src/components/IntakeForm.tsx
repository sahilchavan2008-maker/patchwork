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
  Image as ImageIcon,
  Activity,
  FileCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntakeFormProps {
  onAnalyze: (report: RawReport) => Promise<void> | void;
  isLoading?: boolean;
}

const SAMPLE_PRESETS: {
  label: string;
  text: string;
  attachment?: { name: string; type: AttachmentType; size?: string };
}[] = [
  {
    label: 'Checkout Concurrency Race',
    text: `Whenever a customer opens two checkout tabs and pays in tab 2, switching back to tab 1 and clicking "Place Order" instantly kicks them out to the login page and revokes their session cookie. In the browser console we see a 401 Unauthorized from /api/checkout/finalize and the user complains their cart was emptied.`,
    attachment: { name: 'checkout_race_screenshot.png', type: 'screenshot', size: '1.2 MB' },
  },
  {
    label: 'Voice Note Transcript',
    text: `Voice note from QA (00:43): "Hey team, testing the billing modal on Chrome on Windows. When you enter a card with 3DS verification and close the popup window halfway through, the primary modal remains frozen in an infinite spinner and doesn't unlock the submit button even if you click Cancel."`,
    attachment: { name: 'qa_voice_recording.m4a', type: 'recording', size: '3.8 MB' },
  },
  {
    label: 'Mobile Safari Blank Screen',
    text: `Users on iOS 18 Safari report that upon tapping "Save Profile Changes", the screen flashes white and fails to display the success toast. Refreshing shows that the data was actually saved in Postgres, but the client router crashed.`,
    attachment: { name: 'safari_console.log', type: 'log', size: '420 KB' },
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
    size?: string;
    previewUrl?: string;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const determineFileType = (fileName: string): AttachmentType => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext || '')) return 'screenshot';
    if (['log', 'txt'].includes(ext || '')) return 'log';
    if (['har', 'json'].includes(ext || '')) return 'har';
    if (['mp3', 'm4a', 'wav', 'mp4', 'mov', 'webm'].includes(ext || '')) return 'recording';
    return 'screenshot';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleProcessFile = async (file: File) => {
    const type = determineFileType(file.name);
    const sizeStr = formatFileSize(file.size);
    let previewUrl: string | undefined = undefined;

    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
    }

    setAttachment({
      name: file.name,
      type,
      size: sizeStr,
      previewUrl,
    });
    setErrorMessage(null);

    // If file is text-based (.log, .txt, .har) and user hasn't typed anything yet, populate a helpful diagnostic summary
    if (['log', 'txt', 'har', 'json'].some((ext) => file.name.toLowerCase().endsWith(ext))) {
      try {
        const textContent = await file.text();
        if (!rawText.trim() && textContent) {
          const lines = textContent.split('\n').filter((l) => l.trim().length > 0);
          const excerpt = lines.slice(0, 5).join('\n');
          setRawText(`Attached diagnostic dump from ${file.name}:\n${excerpt}`);
        }
      } catch (err) {
        console.warn('Could not read text from file:', err);
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleProcessFile(file);
    }
  };

  const handleSimulatedFileUpload = (name: string, type: AttachmentType, size: string, autoContext: string) => {
    setAttachment({
      name,
      type,
      size,
    });
    setErrorMessage(null);

    // If user text is currently empty, prefill diagnostic summary
    if (!rawText.trim()) {
      setRawText(autoContext);
    }
  };

  const handleRemoveAttachment = () => {
    if (attachment?.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const textToSubmit = rawText.trim() || (attachment ? `Analysis of attached ${attachment.type} artifact: ${attachment.name}` : '');

    if (!textToSubmit) {
      setErrorMessage('Please enter a bug description, drop an attachment, or select a preset scenario.');
      return;
    }

    setErrorMessage(null);
    onAnalyze({
      rawText: textToSubmit,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type || 'none',
      attachmentSize: attachment?.size,
    });
  };

  const handlePresetSelect = (preset: typeof SAMPLE_PRESETS[0]) => {
    setRawText(preset.text);
    if (preset.attachment) {
      setAttachment({
        name: preset.attachment.name,
        type: preset.attachment.type,
        size: preset.attachment.size || '1.1 MB',
      });
    } else {
      setAttachment(null);
    }
    setErrorMessage(null);
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
            <span>Raw Bug Intake & Diagnostic Artifact Ingest</span>
            <FileText className="w-5 h-5 text-indigo-400" />
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Drop unstructured bug descriptions, customer support tickets, HAR network archives, or stack traces. Patchwork will isolate ambiguities and reconstruct reproduction vectors.
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
                Unstructured Report / Voice Note Transcript / Log Notes
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
                <div className="flex items-center space-x-1.5 text-xs text-rose-400 mt-1 font-medium bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/50">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Mock Screenshot / Attachment Drop Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Attachment / Screenshot / Log Artifact
                </label>
                <span className="text-[11px] text-slate-500 font-mono">Max size 25MB</span>
              </div>

              {/* Native Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*,.log,.txt,.har,.json,.mp4,.m4a,.mp3,.wav"
                className="hidden"
              />

              {attachment ? (
                /* Active Attached File Display */
                <div className="p-4 bg-slate-950/90 border border-cyan-500/60 rounded-xl flex items-center justify-between shadow-lg shadow-cyan-950/40">
                  <div className="flex items-center space-x-3.5">
                    {attachment.previewUrl ? (
                      <div className="w-12 h-12 rounded-lg border border-slate-700 overflow-hidden shrink-0 bg-slate-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={attachment.previewUrl}
                          alt="Attachment preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 flex items-center justify-center shrink-0">
                        {attachment.type === 'screenshot' && <ImageIcon className="w-5 h-5" />}
                        {attachment.type === 'har' && <Activity className="w-5 h-5 text-amber-400" />}
                        {attachment.type === 'log' && <FileCode className="w-5 h-5 text-indigo-400" />}
                        {attachment.type === 'recording' && <Mic className="w-5 h-5 text-rose-400" />}
                        {attachment.type === 'none' && <FileCheck className="w-5 h-5" />}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-slate-100">
                          {attachment.name}
                        </span>
                        <Badge variant="cyan" size="sm">
                          {attachment.type}
                        </Badge>
                        {attachment.size && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({attachment.size})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Ready for ambiguity scanning</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Remove attachment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Drop Zone When No File Is Attached */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      await handleProcessFile(file);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150',
                    isDragOver
                      ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-950/50'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70'
                  )}
                >
                  <UploadCloud className="w-8 h-8 mx-auto text-slate-500 mb-2 group-hover:text-cyan-400 transition-colors" />
                  <p className="text-xs font-medium text-slate-300">
                    Drop screenshots, HAR files, or server logs here, or{' '}
                    <span className="text-cyan-400 underline font-semibold">browse files</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Supports PNG, JPG, MP4, HAR, LOG up to 25MB
                  </p>

                  <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimulatedFileUpload(
                          'repro_checkout_trace.har',
                          'har',
                          '1.4 MB',
                          'Attached HAR network trace (repro_checkout_trace.har). Inspection indicates repeated POST /api/checkout calls encountering 401 Unauthorized status with token revocation.'
                        );
                      }}
                      className="text-xs px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-amber-300 hover:text-white font-mono transition-colors flex items-center gap-1.5"
                    >
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                      <span>+ Attach Mock HAR</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimulatedFileUpload(
                          'error_stack_dump.log',
                          'log',
                          '280 KB',
                          'Attached server error log (error_stack_dump.log). Stack trace reveals SessionNonceMismatchException: Token nonce was reused at SessionGuard.verifyToken during concurrent request processing.'
                        );
                      }}
                      className="text-xs px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-indigo-300 hover:text-white font-mono transition-colors flex items-center gap-1.5"
                    >
                      <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                      <span>+ Attach Mock Log</span>
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
              className="px-6 font-bold"
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

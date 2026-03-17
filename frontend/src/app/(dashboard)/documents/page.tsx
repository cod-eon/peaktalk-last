"use client";

import React, { useState, useMemo } from 'react';
import { FileText, UploadCloud, File, FileType2, Search, Calendar, Trash2, Loader2, RefreshCcw, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type Document = {
    id: string;
    name: string;
    file_type: string;
    storage_path: string;
    extracted_text: string | null;
    parsed_at: string | null;
    created_at: string;
};

type Draft = {
    id: string;
    document_id: string | null;
    analysis_result: { id: string } | null;
};

type DocumentListResponse = { items: Document[]; total: number };
type DraftListResponse = { items: Draft[]; total: number };

const FILE_FILTERS = ['Все', 'PDF', 'DOCX', 'TXT'] as const;
type FileFilter = (typeof FILE_FILTERS)[number];

function getIconInfo(fileType: string) {
    if (fileType === 'pdf') return { icon: FileText, ext: 'PDF' };
    if (fileType === 'docx' || fileType === 'doc') return { icon: FileType2, ext: 'DOCX' };
    return { icon: File, ext: 'TXT' };
}

function matchesFilter(doc: Document, filter: FileFilter): boolean {
    if (filter === 'Все') return true;
    if (filter === 'PDF') return doc.file_type === 'pdf';
    if (filter === 'DOCX') return doc.file_type === 'docx' || doc.file_type === 'doc';
    if (filter === 'TXT') return doc.file_type === 'txt' || doc.file_type === 'other';
    return true;
}

export default function DocumentsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<FileFilter>('Все');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const { data, isLoading, error, refetch } = useQuery<DocumentListResponse>({
        queryKey: ['documents'],
        queryFn: () => api.get('/documents'),
    });

    const { data: draftsData } = useQuery<DraftListResponse>({
        queryKey: ['drafts-for-docs'],
        queryFn: () => api.get('/drafts?limit=200'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/documents/${id}`),
        onSuccess: () => {
            toast.success('Документ удалён');
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
        onError: (err: Error) => toast.error(err.message || 'Ошибка удаления'),
    });

    // Map document_id → draft_id (with analysis) for quick lookup
    const analysisMap = useMemo(() => {
        const map: Record<string, string> = {};
        for (const d of draftsData?.items ?? []) {
            if (d.document_id && d.analysis_result) {
                map[d.document_id] = d.id;
            }
        }
        return map;
    }, [draftsData]);

    const filtered = useMemo(() => {
        const docs = data?.items ?? [];
        return docs.filter((doc) => {
            const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
            return matchesSearch && matchesFilter(doc, activeFilter);
        });
    }, [data, search, activeFilter]);

    return (
        <div className="pb-10 pt-4 sm:pt-8 w-full max-w-6xl mx-auto px-6 lg:px-10">
            {/* ─── HEADER ─── */}
            <div className="flex flex-col gap-6 mb-10 sm:flex-row sm:items-center sm:justify-between sm:mb-14">
                <div>
                    <div className="font-mono text-[11px] text-[var(--accent-blue)] tracking-[0.1em] uppercase mb-3">
                        БАЗА ЗНАНИЙ
                    </div>
                    <h1 className="font-syne text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 leading-tight tracking-tight m-0">
                        Мои документы
                    </h1>
                </div>
                <Link
                    href="/upload"
                    className="btn-primary w-full sm:w-auto mt-2 sm:mt-0 shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-shadow"
                >
                    <UploadCloud size={16} className="mr-2" />
                    Загрузить документ
                </Link>
            </div>

            {/* ─── SEARCH + FILTER ─── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по названию..."
                        className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] rounded-xl py-3 pl-11 pr-10 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors font-inter"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    {FILE_FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-4 py-3 rounded-xl text-sm font-mono border transition-colors whitespace-nowrap ${
                                activeFilter === f
                                    ? 'bg-[var(--accent-blue)]/10 border-[var(--accent-blue)] text-[var(--accent-blue)]'
                                    : 'bg-[var(--bg-card)] border-[var(--border-main)] text-slate-300 hover:border-[var(--border-light)]'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── CONTENT ─── */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-[var(--accent-blue)] mb-4" />
                    <div className="text-slate-400 font-mono text-sm">Загрузка...</div>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-rose-500 mb-4 bg-rose-500/10 p-4 rounded-full">
                        <File size={28} />
                    </div>
                    <div className="text-slate-200 mb-2">Не удалось загрузить документы</div>
                    <button onClick={() => refetch()} className="btn-secondary rounded-lg mt-4">
                        <RefreshCcw size={14} className="mr-2" /> Попробовать снова
                    </button>
                </div>
            ) : filtered.length === 0 && !search ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[var(--border-main)] rounded-2xl bg-[var(--bg-surface)]">
                    <div className="text-slate-500 mb-4 bg-[var(--bg-card)] p-4 rounded-full">
                        <UploadCloud size={28} />
                    </div>
                    <div className="text-slate-200 mb-2 font-syne text-xl">Нет загруженных документов</div>
                    <div className="text-slate-500 text-sm mb-6 max-w-sm">
                        Загрузите материалы, чтобы ИИ мог проанализировать их
                    </div>
                    <Link href="/upload" className="btn-primary rounded-lg">
                        <UploadCloud size={14} className="mr-2" /> Загрузить файл
                    </Link>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-slate-400 font-mono text-sm">Ничего не найдено по запросу «{search}»</p>
                    <button onClick={() => setSearch('')} className="mt-3 text-xs text-[var(--accent-blue)] hover:underline">
                        Сбросить поиск
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((doc) => {
                        const { icon: Icon, ext } = getIconInfo(doc.file_type);
                        const isDeleting = deleteMutation.isPending && deleteMutation.variables === doc.id;
                        const analysisDraftId = analysisMap[doc.id];
                        const isParsed = !!doc.parsed_at;

                        const CardContent = (
                            <div
                                className={`bg-[var(--bg-card)] border rounded-2xl p-5 flex flex-col h-full relative overflow-hidden group transition-colors duration-200 ${
                                    isDeleting ? 'opacity-50' : ''
                                } ${
                                    analysisDraftId
                                        ? 'border-[var(--border-main)] hover:border-[var(--accent-blue)]/50 cursor-pointer'
                                        : 'border-[var(--border-main)] hover:border-[var(--border-light)]'
                                }`}
                            >
                                <div className="absolute -right-10 -top-10 w-32 h-32 bg-[var(--accent-blue)]/5 rounded-full blur-2xl group-hover:bg-[var(--accent-blue)]/10 transition-colors duration-500 pointer-events-none" />

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="w-11 h-11 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-light)] flex items-center justify-center text-slate-400 group-hover:text-[var(--accent-blue)] transition-colors duration-200">
                                        <Icon size={22} strokeWidth={1.5} />
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setDeleteTarget(doc.id);
                                        }}
                                        disabled={isDeleting}
                                        className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10 cursor-pointer"
                                    >
                                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    </button>
                                </div>

                                <div className="mb-4 relative z-10 flex-1">
                                    <h3 className="font-syne text-base font-semibold text-slate-100 mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors duration-200" title={doc.name}>
                                        {doc.name}
                                    </h3>
                                    <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest bg-[var(--bg-surface-alt)] px-2 py-0.5 rounded border border-[var(--border-light)]">
                                        {ext}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border-light)]/50 relative z-10">
                                    <div className="flex items-center gap-1.5 text-slate-500 font-mono text-xs">
                                        <Calendar size={11} />
                                        {format(new Date(doc.created_at), 'dd.MM.yyyy')}
                                    </div>
                                    {analysisDraftId ? (
                                        <div className="flex items-center gap-1 font-mono text-[10px] text-[var(--accent-blue)]">
                                            Разбор <ArrowRight size={10} />
                                        </div>
                                    ) : isParsed ? (
                                        <div className="font-mono text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            Распознан
                                        </div>
                                    ) : (
                                        <div className="font-mono text-[10px] text-slate-500">
                                            Не распознан
                                        </div>
                                    )}
                                </div>
                            </div>
                        );

                        return analysisDraftId ? (
                            <Link key={doc.id} href={`/analysis/${analysisDraftId}`} className="block h-full">
                                {CardContent}
                            </Link>
                        ) : (
                            <div key={doc.id} className="h-full">
                                {CardContent}
                            </div>
                        );
                    })}
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteTarget !== null}
                title="Удалить документ?"
                message="Это действие невозможно отменить. Документ будет удалён безвозвратно."
                confirmLabel="Удалить"
                onConfirm={() => {
                    if (deleteTarget) deleteMutation.mutate(deleteTarget);
                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}

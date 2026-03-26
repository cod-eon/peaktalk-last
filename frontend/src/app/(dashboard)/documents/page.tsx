"use client";

import React, { useState, useMemo } from 'react';
import { FileText, UploadCloud, File, Search, Trash2, Loader2, RefreshCcw, ArrowRight, X, AlignLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

type Doc = {
    id: string;
    name: string;
    source: string;
    file_type: string;
    storage_path: string | null;
    parsed_at: string | null;
    created_at: string;
};

type DocListResponse = { items: Doc[]; total: number };

const FILTERS = ['Все', 'Файлы', 'Тексты'] as const;
type Filter = (typeof FILTERS)[number];

function getExt(doc: Doc): string {
    if (doc.source === 'text') return 'ТЕКСТ';
    const ext = doc.name.split('.').pop()?.toUpperCase() ?? '';
    if (ext === 'PDF') return 'PDF';
    if (ext === 'DOC') return 'DOCX';
    if (['DOCX', 'TXT'].includes(ext)) return ext;
    return 'ФАЙЛ';
}

function DocIcon({ doc }: { doc: Doc }) {
    if (doc.source === 'text') return <AlignLeft size={14} className="text-[var(--text-dim)] shrink-0" />;
    const ext = doc.name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return <FileText size={14} className="text-[var(--text-dim)] shrink-0" />;
    return <File size={14} className="text-[var(--text-dim)] shrink-0" />;
}

export default function DocumentsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<Filter>('Все');
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const { data, isLoading, error, refetch } = useQuery<DocListResponse>({
        queryKey: ['documents'],
        queryFn: () => api.get('/documents'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/documents/${id}`),
        onSuccess: () => {
            toast.success('Удалено');
            setDeleteTarget(null);
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['drafts-dashboard'] });
        },
        onError: (err: Error) => toast.error(err.message || 'Ошибка удаления'),
    });

    const filtered = useMemo(() => {
        const docs = data?.items ?? [];
        return docs.filter((doc) => {
            const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase());
            const matchFilter =
                activeFilter === 'Все' ? true :
                activeFilter === 'Файлы' ? doc.source === 'upload' :
                doc.source === 'text';
            return matchSearch && matchFilter;
        });
    }, [data, search, activeFilter]);

    return (
        <div className="pt-6 sm:pt-8 pb-20 w-full max-w-4xl mx-auto px-4 sm:px-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-6 sm:mb-8">
                <div>
                    <h1 className="font-syne text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-main)] leading-tight tracking-tight mb-1">
                        Мои тексты
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 hidden sm:block">Управление загруженными материалами и черновиками</p>
                </div>
                <Link
                    href="/upload"
                    className="btn-primary shrink-0 gap-1.5 px-3 sm:px-4 py-2 text-sm min-h-[44px]"
                >
                    <Plus size={14} />
                    <span className="hidden sm:inline">Загрузить текст</span>
                    <span className="sm:hidden">Загрузить</span>
                </Link>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
                <div className="relative w-full sm:max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по названию..."
                        className="w-full bg-white border border-gray-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 rounded-md py-2.5 pl-9 pr-8 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors min-h-[44px]"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X size={13} />
                        </button>
                    )}
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-3">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        {FILTERS.map((f) => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-3 py-1.5 rounded-md text-sm transition-all min-h-[36px] ${
                                    activeFilter === f
                                        ? 'bg-white shadow-sm text-gray-900 font-medium'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {data && (
                        <span className="text-xs text-[var(--text-dim)] sm:ml-auto">{filtered.length} / {data.total}</span>
                    )}
                </div>
            </div>

            {/* States */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20 gap-3 text-[var(--text-dim)]">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm">Загрузка...</span>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-sm text-gray-500 mb-4">Не удалось загрузить материалы</p>
                    <button onClick={() => refetch()} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                        <RefreshCcw size={14} /> Попробовать снова
                    </button>
                </div>
            ) : (data?.items ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-[var(--border-main)] rounded-2xl">
                    <UploadCloud size={32} className="text-[var(--text-dim)] mb-4 opacity-40" />
                    <p className="text-sm font-medium text-[var(--text-main)] mb-1">Пока нет материалов</p>
                    <p className="text-xs text-[var(--text-dim)] mb-6">Загрузите файл или создайте текстовый документ</p>
                    <Link href="/upload" className="btn-primary gap-2 text-sm">
                        <Plus size={14} /> Загрузить текст
                    </Link>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-sm text-[var(--text-dim)]">Ничего не найдено по «{search}»</p>
                    <button onClick={() => setSearch('')} className="mt-2 text-xs text-orange-500 hover:underline">Сбросить</button>
                </div>
            ) : (
                <>
                    {/* Table — desktop, Card list — mobile */}
                    <div className="bg-white border border-[var(--border-main)] rounded-2xl overflow-hidden">
                        {/* Head — desktop only */}
                        <div className="hidden sm:grid grid-cols-[1fr_80px_110px_120px] bg-gray-50 border-b border-gray-100 px-5 py-2.5">
                            {['НАЗВАНИЕ', 'ФОРМАТ', 'ДАТА', 'ДЕЙСТВИЕ'].map((col) => (
                                <span key={col} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{col}</span>
                            ))}
                        </div>

                        {/* Rows */}
                        {filtered.map((doc) => {
                            const ext = getExt(doc);
                            const isDeleting = deleteMutation.isPending && deleteMutation.variables === doc.id;

                            return (
                                <div
                                    key={doc.id}
                                    className={`border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors group ${isDeleting ? 'opacity-40' : ''}`}
                                >
                                    {/* Mobile card layout */}
                                    <div className="flex items-center gap-3 px-4 py-3.5 sm:hidden">
                                        <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                                            <DocIcon doc={doc} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-[var(--text-main)] truncate" title={doc.name}>
                                                {doc.name}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                    {ext}
                                                </span>
                                                <span className="text-[11px] text-[var(--text-dim)]">
                                                    {format(new Date(doc.created_at), 'dd.MM.yyyy')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Link
                                                href={`/analysis/${doc.id}`}
                                                className="text-xs font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors min-h-[44px] px-2 flex items-center"
                                            >
                                                Разбор <ArrowRight size={12} />
                                            </Link>
                                            <button
                                                onClick={() => setDeleteTarget({ id: doc.id, name: doc.name })}
                                                disabled={isDeleting}
                                                className="text-gray-300 hover:text-red-400 transition-colors min-h-[44px] px-1 flex items-center"
                                                aria-label="Удалить"
                                            >
                                                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Desktop table row */}
                                    <div className="hidden sm:grid grid-cols-[1fr_80px_110px_120px] items-center px-5 py-3.5">
                                        {/* Name */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <DocIcon doc={doc} />
                                            <span className="text-sm font-medium text-[var(--text-main)] truncate" title={doc.name}>
                                                {doc.name}
                                            </span>
                                        </div>

                                        {/* Format badge */}
                                        <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit">
                                            {ext}
                                        </span>

                                        {/* Date */}
                                        <span className="text-sm text-[var(--text-dim)]">
                                            {format(new Date(doc.created_at), 'dd.MM.yyyy')}
                                        </span>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={`/analysis/${doc.id}`}
                                                className="text-sm font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors whitespace-nowrap"
                                            >
                                                Разбор <ArrowRight size={13} />
                                            </Link>
                                            <button
                                                onClick={() => setDeleteTarget({ id: doc.id, name: doc.name })}
                                                disabled={isDeleting}
                                                className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                aria-label="Удалить"
                                            >
                                                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Delete confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
                    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">Удалить материал?</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            «{deleteTarget.name}» будет удалён. Это действие нельзя отменить.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                                disabled={deleteMutation.isPending}
                                className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

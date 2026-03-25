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
        <div className="pt-8 pb-20 w-full max-w-4xl mx-auto px-6">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="font-syne text-2xl sm:text-3xl font-bold text-[var(--text-main)] leading-tight tracking-tight mb-1">
                        Мои тексты
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Управление загруженными материалами и черновиками</p>
                </div>
                <Link
                    href="/upload"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors shrink-0"
                >
                    <Plus size={14} />
                    Загрузить текст
                </Link>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative max-w-xs w-full">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по названию..."
                        className="w-full bg-white border border-gray-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 rounded-lg py-2 pl-9 pr-8 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X size={13} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-3 py-1.5 rounded-md text-sm transition-all ${
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
                    <span className="ml-auto text-xs text-[var(--text-dim)]">{filtered.length} / {data.total}</span>
                )}
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
                    <Link href="/upload" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors">
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
                    {/* Table */}
                    <div className="bg-white border border-[var(--border-main)] rounded-2xl overflow-hidden">
                        {/* Head */}
                        <div className="grid grid-cols-[1fr_80px_110px_120px] bg-gray-50 border-b border-gray-100 px-5 py-2.5">
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
                                    className={`grid grid-cols-[1fr_80px_110px_120px] items-center px-5 py-3.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors group ${isDeleting ? 'opacity-40' : ''}`}
                                >
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

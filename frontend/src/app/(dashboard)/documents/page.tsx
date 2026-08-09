"use client";

import React, { useState, useMemo } from 'react';
import { FileText, UploadCloud, File, Search, Trash2, Loader2, RefreshCcw, ArrowRight, X, AlignLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns/format';
import { toast } from 'sonner';

type Doc = {
    id: string;
    name: string;
    source: string;
    file_type: string;
    storage_path: string | null;
    parsed_at: string | null;
    created_at: string;
    draft_id: string | null;
};

type DocListResponse = { items: Doc[]; total: number };

const FILTERS = ['Все', 'Файлы', 'Текст'] as const;
const DOCUMENTS_PAGE_SIZE = 12;
type Filter = (typeof FILTERS)[number];

function getExtBadgeClass(doc: Doc): string {
    const ext = getExt(doc);
    if (ext === 'PDF') return 'bg-red-50 text-red-600 border border-red-100';
    if (ext === 'DOCX' || ext === 'DOC') return 'bg-blue-50 text-blue-600 border border-blue-100';
    if (ext === 'ТЕКСТ') return 'bg-violet-50 text-violet-600 border border-violet-100';
    return 'bg-gray-100 text-gray-500';
}

function getExt(doc: Doc): string {
    if (doc.source === 'text') return 'ТЕКСТ';
    const ext = doc.name.split('.').pop()?.toUpperCase() ?? '';
    if (ext === 'PDF') return 'PDF';
    if (ext === 'DOC') return 'DOC';
    if (['DOCX', 'TXT'].includes(ext)) return ext;
    return 'ФАЙЛ';
}

function DocIcon({ doc }: { doc: Doc }) {
    if (doc.source === 'text') return <AlignLeft size={14} className="text-neutral-400 shrink-0" />;
    const ext = doc.name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return <FileText size={14} className="text-neutral-400 shrink-0" />;
    return <File size={14} className="text-neutral-400 shrink-0" />;
}

export default function DocumentsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<Filter>('Все');
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const { data, isLoading, error, refetch } = useQuery<DocListResponse>({
        queryKey: ['documents'],
        queryFn: () => api.get('/documents?limit=200'),
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

    const totalPages = Math.max(1, Math.ceil(filtered.length / DOCUMENTS_PAGE_SIZE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const pageStart = (safeCurrentPage - 1) * DOCUMENTS_PAGE_SIZE;
    const pagedDocuments = filtered.slice(pageStart, pageStart + DOCUMENTS_PAGE_SIZE);

    const hasDocuments = (data?.items?.length ?? 0) > 0;

    return (
        <div className="pt-6 sm:pt-10 pb-16 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-6 sm:mb-8">
                <div>
                    <h1 className="font-inter text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 leading-tight tracking-tight mb-1">
                        Материалы
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1 hidden sm:block">Исходные файлы, тезисы и разборы для подготовки к рабочим встречам</p>
                </div>
                <Link
                    href="/upload"
                    className="inline-flex items-center shrink-0 gap-1.5 px-3 sm:px-4 py-2 text-sm min-h-[44px] rounded-none bg-[#171717] hover:bg-black text-white font-medium transition-colors"
                >
                    <Plus size={14} />
                    <span className="hidden sm:inline">Новый материал</span>
                    <span className="sm:hidden">Новый</span>
                </Link>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
                <div className="relative w-full sm:max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Поиск по материалам..."
                        className="w-full bg-white border border-neutral-200 rounded-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-200 py-2.5 pl-9 pr-8 text-sm text-neutral-800 placeholder-neutral-400 outline-none transition-colors min-h-[44px]"
                    />
                    {!search && (
                        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-none font-mono pointer-events-none">
                            /
                        </kbd>
                    )}
                    {search && (
                        <button onClick={() => {
                            setSearch('');
                            setCurrentPage(1);
                        }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X size={13} />
                        </button>
                    )}
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-3">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-none p-1">
                        {FILTERS.map((f) => (
                            <button
                                key={f}
                                onClick={() => {
                                    setActiveFilter(f);
                                    setCurrentPage(1);
                                }}
                                className={`px-3 py-1.5 rounded-none text-sm transition-all min-h-[36px] ${
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
                        <span className="text-xs text-neutral-400 sm:ml-auto">
                            {filtered.length ? `${pageStart + 1}–${Math.min(pageStart + DOCUMENTS_PAGE_SIZE, filtered.length)} из ${filtered.length}` : `0 из ${data.total}`}
                        </span>
                    )}
                </div>
            </div>

            {/* States */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20 gap-3 text-neutral-400">
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
            ) : !hasDocuments ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-neutral-200 rounded-none">
                    <div className="w-16 h-16 bg-neutral-50 border border-neutral-200 rounded-none flex items-center justify-center mb-5">
                        <UploadCloud size={28} className="text-neutral-400" />
                    </div>
                    <p className="text-sm font-medium text-neutral-900 mb-1">Пока нет рабочих материалов</p>
                    <p className="text-xs text-neutral-400 mb-6">Добавьте тезисы, memo, КП или черновик защиты решения</p>
                    <Link href="/upload" className="inline-flex items-center gap-2 text-sm bg-[#171717] hover:bg-black text-white font-medium rounded-none px-4 py-2 transition-colors">
                        <Plus size={14} /> Новый материал
                    </Link>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    {search ? (
                        <>
                            <p className="text-sm text-neutral-400">Ничего не найдено по «{search}»</p>
                            <button onClick={() => {
                                setSearch('');
                                setCurrentPage(1);
                            }} className="mt-2 text-xs text-neutral-600 hover:text-neutral-900 hover:underline">Сбросить поиск</button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-neutral-400">В этой категории нет документов</p>
                            <button onClick={() => {
                                setActiveFilter('Все');
                                setCurrentPage(1);
                            }} className="mt-2 text-xs text-neutral-600 hover:text-neutral-900 hover:underline">Показать все</button>
                        </>
                    )}
                </div>
            ) : (
                <>
                    {/* Table — desktop, Card list — mobile */}
                    <div className="bg-white border border-neutral-200 rounded-none overflow-hidden">
                        {/* Head — desktop only */}
                        <div className="hidden sm:grid grid-cols-[1fr_80px_110px_120px] bg-gray-50 border-b border-gray-100 px-5 py-2.5">
                            {['МАТЕРИАЛ', 'ФОРМАТ', 'ДАТА', 'PRESSURE SCAN'].map((col) => (
                                <span key={col} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{col}</span>
                            ))}
                        </div>

                        {/* Rows */}
                        {pagedDocuments.map((doc) => {
                            const ext = getExt(doc);
                            const isDeleting = deleteMutation.isPending && deleteMutation.variables === doc.id;

                            return (
                                <div
                                    key={doc.id}
                                    className={`relative border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors group ${isDeleting ? 'opacity-40' : ''}`}
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {/* Mobile card layout */}
                                    <div className="flex items-center gap-3 px-4 py-3.5 sm:hidden">
                                        <div className="w-9 h-9 rounded-none bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                                            <DocIcon doc={doc} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 min-w-0 mb-1">
                                                <div className="text-sm font-medium text-neutral-900 truncate" title={doc.name}>
                                                    {doc.name}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-medium text-neutral-400 uppercase">
                                                    {ext}
                                                </span>
                                                <span className="text-[11px] text-neutral-400">
                                                    {format(new Date(doc.created_at), 'dd.MM.yyyy')}
                                                </span>
                                                {doc.draft_id && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-none">
                                                        Pressure scan
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Link
                                                href={doc.draft_id ? `/analysis/${doc.draft_id}` : `/upload`}
                                                className="text-xs font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors min-h-[44px] px-2"
                                            >
                                                {doc.draft_id ? 'Открыть scan' : 'Разобрать'} <ArrowRight size={12} />
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
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-sm font-medium text-neutral-900 truncate" title={doc.name}>
                                                    {doc.name}
                                                </span>
                                                {doc.draft_id && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-none shrink-0">
                                                        Pressure scan
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Format badge */}
                                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-none w-fit ${getExtBadgeClass(doc)}`}>
                                            {ext}
                                        </span>

                                        {/* Date */}
                                        <span className="text-sm text-neutral-400">
                                            {format(new Date(doc.created_at), 'dd.MM.yyyy')}
                                        </span>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={doc.draft_id ? `/analysis/${doc.draft_id}` : `/upload`}
                                                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors whitespace-nowrap"
                                            >
                                                {doc.draft_id ? 'Открыть scan' : 'Разобрать'} <ArrowRight size={13} />
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
                    {filtered.length > DOCUMENTS_PAGE_SIZE && (
                        <div className="mt-4 border border-neutral-200 bg-white p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-400">
                                {pageStart + 1}–{Math.min(pageStart + DOCUMENTS_PAGE_SIZE, filtered.length)} из {filtered.length}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={safeCurrentPage <= 1}
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    className="min-h-[40px] border border-neutral-200 px-3 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
                                >
                                    Назад
                                </button>
                                <div className="hidden sm:flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((page) => page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1)
                                        .map((page, index, pages) => (
                                            <React.Fragment key={page}>
                                                {index > 0 && page - pages[index - 1] > 1 && <span className="px-2 text-neutral-400">…</span>}
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`min-w-10 min-h-[40px] border px-3 font-mono text-[11px] font-bold transition-colors ${
                                                        page === safeCurrentPage
                                                            ? 'border-neutral-900 bg-neutral-900 text-white'
                                                            : 'border-neutral-200 text-neutral-500 hover:border-neutral-900 hover:text-neutral-900'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            </React.Fragment>
                                        ))}
                                </div>
                                <button
                                    type="button"
                                    disabled={safeCurrentPage >= totalPages}
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                    className="min-h-[40px] border border-neutral-200 px-3 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
                                >
                                    Далее
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Delete confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
                    <div className="bg-white rounded-none shadow-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">Удалить материал?</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            «{deleteTarget.name}» будет удалён. Это действие нельзя отменить.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2 rounded-none border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                                disabled={deleteMutation.isPending}
                                className="flex-1 px-4 py-2 rounded-none bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
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

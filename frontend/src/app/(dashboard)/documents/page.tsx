"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, UploadCloud, File, FileType2, Search, MoreVertical, Calendar, Trash2, Loader2, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

type Document = {
    id: string;
    name: string;
    file_type: string;
    storage_path: string;
    extracted_text: string | null;
    parsed_at: string | null;
    created_at: string;
};

type DocumentListResponse = {
    items: Document[];
    total: number;
};

export default function DocumentsPage() {
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch } = useQuery<DocumentListResponse>({
        queryKey: ['documents'],
        queryFn: () => api.get('/documents')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/documents/${id}`),
        onSuccess: () => {
            toast.success('Документ удален');
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
        onError: (err) => {
            toast.error(err.message || 'Ошибка удаления документа');
        }
    });

    const documents = data?.items || [];

    const getIconInfo = (fileType: string) => {
        if (fileType === 'pdf') return { icon: FileText, ext: '.pdf', typeName: 'PDF' };
        if (fileType === 'docx' || fileType === 'doc') return { icon: FileType2, ext: `.${fileType}`, typeName: 'Word' };
        return { icon: File, ext: '.txt', typeName: 'Text' };
    };

    return (
        <div className="pb-10 pt-4 sm:pt-8 w-full max-w-6xl mx-auto px-6 lg:px-10 overflow-hidden">
            {/* ─── HEADER SECTION ─── */}
            <div className="flex flex-col gap-6 mb-10 sm:flex-row sm:items-center sm:justify-between sm:mb-14">
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="font-mono text-[11px] text-[var(--accent-blue)] tracking-[0.1em] uppercase mb-3 flex items-center gap-2"
                    >
                        БАЗА ЗНАНИЙ
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="font-syne text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 leading-tight tracking-tight m-0"
                    >
                        Мои документы
                    </motion.h1>
                </div>
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="w-full sm:w-auto"
                >
                    <Link href="/upload" className="btn-primary w-full sm:w-auto mt-2 sm:mt-0 shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-shadow">
                        <UploadCloud size={16} className="mr-2" />
                        Загрузить документ
                    </Link>
                </motion.div>
            </div>

            {/* ─── SEARCH AND FILTER BAR ─── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 mb-8"
            >
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Поиск по документам..." 
                        className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all font-inter"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--border-light)] rounded-xl text-sm font-inter text-slate-300 transition-colors whitespace-nowrap">
                        Все типы
                    </button>
                    <button className="px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--border-light)] rounded-xl text-sm font-inter text-slate-300 transition-colors whitespace-nowrap">
                        Недавние
                    </button>
                </div>
            </motion.div>

            {/* ─── DOCUMENTS GRID ─── */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-[var(--accent-blue)] mb-4" />
                    <div className="text-slate-400 font-mono text-sm">Загрузка документов...</div>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-rose-500 mb-4 bg-rose-500/10 p-4 rounded-full">
                        <File size={32} />
                    </div>
                    <div className="text-slate-200 mb-2">Не удалось загрузить документы</div>
                    <div className="text-slate-500 text-sm mb-6">{error.message}</div>
                    <button onClick={() => refetch()} className="btn-secondary rounded-lg">
                        <RefreshCcw size={16} className="mr-2" />
                        Попробовать снова
                    </button>
                </div>
            ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[var(--border-main)] rounded-2xl bg-[var(--bg-surface)]">
                    <div className="text-slate-500 mb-4 bg-[var(--bg-card)] p-4 rounded-full">
                        <UploadCloud size={32} />
                    </div>
                    <div className="text-slate-200 mb-2 font-syne text-xl">Нет загруженных документов</div>
                    <div className="text-slate-500 text-sm mb-6 max-w-sm">
                        Загрузите свои материалы, чтобы ИИ мог проанализировать их и подготовить вас к выступлению
                    </div>
                    <Link href="/upload" className="btn-primary rounded-lg">
                        <UploadCloud size={16} className="mr-2" />
                        Загрузить файл
                    </Link>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                    {documents.map((doc) => {
                        const { icon: Icon, ext, typeName } = getIconInfo(doc.file_type);
                        const isDeleting = deleteMutation.isPending && deleteMutation.variables === doc.id;
                        
                        return (
                            <div 
                                key={doc.id}
                                className={`bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--border-light)] ${isDeleting ? 'opacity-50' : 'hover:bg-[var(--bg-surface-hover)]'} p-5 rounded-2xl transition-all duration-300 group relative overflow-hidden flex flex-col`}
                            >
                                {/* Decorative element */}
                                <div className="absolute -right-10 -top-10 w-32 h-32 bg-[var(--accent-blue)]/5 rounded-full blur-2xl group-hover:bg-[var(--accent-blue)]/10 transition-colors duration-500 pointer-events-none"></div>
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-light)] flex items-center justify-center text-slate-400 group-hover:text-[var(--accent-blue)] transition-colors">
                                        <Icon size={24} strokeWidth={1.5} />
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (confirm('Удалить документ?')) {
                                                deleteMutation.mutate(doc.id);
                                            }
                                        }}
                                        disabled={isDeleting}
                                        className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10 cursor-pointer"
                                        title="Удалить"
                                    >
                                        {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                    </button>
                                </div>

                                <div className="mb-4 relative z-10 flex-1">
                                    <h3 className="font-syne text-lg font-semibold text-slate-100 mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors" title={doc.name}>
                                        {doc.name}
                                    </h3>
                                    <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mt-2 flex gap-2">
                                        <span className="bg-[var(--bg-surface-alt)] px-2 py-0.5 rounded border border-[var(--border-light)]">{typeName}</span>
                                        <span className="bg-[var(--bg-surface-alt)] px-2 py-0.5 rounded border border-[var(--border-light)]">{ext}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border-light)]/50 relative z-10">
                                    <div className="flex items-center gap-1.5 text-slate-400 font-inter text-xs">
                                        <Calendar size={12} />
                                        <span>{format(new Date(doc.created_at), 'dd MMM yyyy')}</span>
                                    </div>
                                    {doc.parsed_at && (
                                        <div className="font-mono text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            Распознано
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}

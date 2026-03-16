"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Type, Terminal, Activity, Zap, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function UploadPage() {
    const router = useRouter();
    const [mode, setMode] = useState<'file' | 'text'>('file');
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const startAnalysis = async () => {
        if (mode === 'file' && !file) return;
        if (mode === 'text' && !text.trim()) return;

        setIsProcessing(true);
        setLogs(['> Инициализация AI-движка PeakTalk...']);

        try {
            let documentId = null;
            let rawText = text;

            // 1. Upload document if in file mode
            if (mode === 'file' && file) {
                setLogs(prev => [...prev, '> Загрузка документа на сервер...']);
                const formData = new FormData();
                formData.append('file', file);
                formData.append('file_type', 'other');

                const uploadRes = await api.request('/documents/upload', {
                    method: 'POST',
                    body: formData
                });
                
                documentId = uploadRes.id;
                
                // If the parser was synchronous, it will have extracted text
                if (uploadRes.extracted_text) {
                    rawText = uploadRes.extracted_text;
                    setLogs(prev => [...prev, '> Текст успешно распознан из документа.']);
                } else {
                    setLogs(prev => [...prev, '> Документ загружен. Текст пуст или в процессе (лимит 50МБ).']);
                    throw new Error('Не удалось извлечь текст из документа - файл слишком большой или формат не поддерживается');
                }
            }

            if (rawText.length < 10) {
                throw new Error('Текст слишком короткий, минимум 10 символов.');
            }

            // 2. Create draft
            setLogs(prev => [...prev, '> Создание черновика речи...']);
            const draftTitle = mode === 'file' ? file?.name : 'Текстовый черновик ' + new Date().toLocaleTimeString();
            
            const draftRes = await api.post('/drafts', {
                title: draftTitle,
                raw_text: rawText,
                document_id: documentId
            });

            const draftId = draftRes.id;

            // 3. Request Analysis
            setLogs(prev => [...prev, '> Запуск глубокого семантического анализа (Gemini)...']);
            setLogs(prev => [...prev, '> Поиск стилистических и риторических уязвимостей...']);
            
            await api.post(`/drafts/${draftId}/analyze`);
            
            setLogs(prev => [...prev, '> Формирование рекомендаций...']);
            setLogs(prev => [...prev, '> Анализ завершен. Перенаправление...']);
            
            setTimeout(() => {
                router.push(`/analysis/${draftId}`);
            }, 1000);

        } catch (error: any) {
            console.error('Analysis error:', error);
            setLogs(prev => [...prev, `> ОШИБКА: ${error.message || 'Внутренняя ошибка сервера'}`]);
            toast.error(error.message || 'Ошибка обработки');
            setTimeout(() => setIsProcessing(false), 3000);
        }
    };

    return (
        <div className="flex w-full flex-col justify-start px-6 md:pl-6 md:pr-[calc(72px+1.5rem)] py-12 md:py-20 max-w-4xl mx-auto relative z-10 box-border">
            
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-5xl font-syne font-bold text-slate-100 mb-4 tracking-tight shadow-sm">
                    Новый разбор
                </h1>
                <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                    Загрузите ваш сценарий или вставьте текст напрямую. ИИ проанализирует логику, найдет слабые места и подготовит вопросы для стресс-теста.
                </p>
            </div>

            <AnimatePresence mode="wait">
                {!isProcessing ? (
                    <motion.div
                        key="upload-zone"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-2xl mx-auto"
                    >
                        {/* ─── UPLOAD WORKSPACE ─── */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.3)] backdrop-blur-md">
                            
                            {/* Tabs */}
                            <div className="flex w-full border-b border-[var(--border-main)] bg-[var(--bg-surface)]">
                                <button
                                    onClick={() => setMode('file')}
                                    className={`flex-1 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                        mode === 'file' 
                                            ? 'text-blue-400 border-b-2 border-blue-500 bg-[var(--bg-surface-hover)]' 
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-[var(--bg-surface-alt)]'
                                    }`}
                                >
                                    <FileText size={16} /> Документ (PDF, DOCX)
                                </button>
                                <button
                                    onClick={() => setMode('text')}
                                    className={`flex-1 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                        mode === 'text' 
                                            ? 'text-blue-400 border-b-2 border-blue-500 bg-[var(--bg-surface-hover)]' 
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-[var(--bg-surface-alt)]'
                                    }`}
                                >
                                    <Type size={16} /> Текст
                                </button>
                            </div>

                            <div className="relative h-[320px]">
                                <AnimatePresence mode="wait" initial={false}>
                                    {mode === 'file' ? (
                                        <motion.div
                                            key="mode-file"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute inset-0 p-6"
                                        >
                                            <div
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                className={`h-full w-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                                                    isDragging 
                                                        ? 'border-blue-500 bg-blue-500/10 scale-[0.98]' 
                                                        : 'border-[var(--border-light)] hover:border-[var(--border-main)] hover:bg-[var(--bg-surface-alt)]'
                                                }`}
                                                onClick={() => !file && fileInputRef.current?.click()}
                                            >
                                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".txt,.pdf,.docx,.md" />
                                                
                                                {file ? (
                                                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                                                            <CheckCircle2 size={32} />
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-slate-200 font-mono text-sm mb-1 max-w-[240px] truncate">{file.name}</div>
                                                            <div className="text-slate-500 font-sans text-xs">{(file.size / 1024).toFixed(1)} КБ</div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                            className="mt-2 text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 transition-colors"
                                                        >
                                                            Загрузить другой файл
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center pointer-events-none">
                                                        <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-blue-500/20 text-blue-400' : 'bg-[var(--bg-surface)] border border-[var(--border-light)] text-slate-400'}`}>
                                                            <UploadCloud size={28} strokeWidth={1.5} />
                                                        </div>
                                                        <h3 className="text-slate-200 font-medium mb-1">Перетащите файл сюда</h3>
                                                        <p className="text-slate-500 text-xs mb-6 text-center max-w-[240px]">Или кликните, чтобы выбрать на устройстве</p>
                                                        
                                                        <div className="flex gap-2 flex-wrap justify-center">
                                                            {['PDF', 'DOCX', 'TXT'].map((ext) => (
                                                                <span key={ext} className="px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded font-mono text-[10px] text-slate-400 tracking-wider">
                                                                    {ext}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="mode-text"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute inset-0 p-6 flex flex-col"
                                        >
                                            <textarea
                                                value={text}
                                                onChange={(e) => setText(e.target.value)}
                                                placeholder="Вставьте текст вашего выступления (рекомендуется от 500 символов)..."
                                                className="w-full flex-1 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 resize-none outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-inter leading-relaxed"
                                            />
                                            <div className="flex justify-between items-center mt-3 px-1">
                                                <span className={`text-xs font-mono font-medium ${text.length > 0 ? 'text-blue-400' : 'text-slate-500'}`}>
                                                    {text.length} символов
                                                </span>
                                                <button onClick={() => setText('')} className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">Очистить</button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Action Bar */}
                            <div className="flex justify-between items-center border-t border-[var(--border-main)] p-5 bg-[var(--bg-surface)]">
                                <div className="text-xs text-slate-500 hidden sm:block">
                                    Ваши данные надежно защищены (152-ФЗ)
                                </div>
                                <button
                                    onClick={startAnalysis}
                                    disabled={
                                        (mode === 'file' && !file) || 
                                        (mode === 'text' && text.length < 50)
                                    }
                                    className="w-full sm:w-auto btn-primary relative px-6 py-2.5"
                                >
                                    <span className="flex items-center gap-2">
                                        <Zap size={16} /> Начать анализ
                                    </span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* ─── TERMINAL PROCESSING STATE ─── */
                    <motion.div
                        key="processing-zone"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-2xl mx-auto"
                    >
                        <div className="bg-[#0A0A0E] border border-blue-500/30 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.15)] flex flex-col">
                            {/* Terminal Header */}
                            <div className="px-5 py-3 border-b border-zinc-800/80 bg-[#111115] flex items-center">
                                <div className="flex gap-2 mr-4 opacity-70">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                                <div className="mx-auto flex items-center gap-2 font-mono text-xs text-slate-500">
                                    <Terminal size={14} className="text-blue-500/70" /> peaktalk/engine
                                </div>
                                <div className="w-[52px]" />
                            </div>

                            {/* Terminal Body */}
                            <div className="p-6 md:p-8 h-[300px] font-mono text-xs md:text-sm flex flex-col gap-3 overflow-hidden text-slate-300">
                                {logs.map((log, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`${log.includes('Внимание') ? 'text-yellow-400' : log.includes('завершен') ? 'text-green-400' : 'text-slate-300'}`}
                                    >
                                        {log}
                                    </motion.div>
                                ))}

                                {logs.length > 0 && !logs[logs.length - 1].includes('завершен') && (
                                    <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                                        <div className="w-2 h-4 bg-blue-400 mt-1" />
                                    </motion.div>
                                )}
                            </div>

                            {/* Processing Progress Bar */}
                            <div className="h-1 w-full bg-[#111115]">
                                <motion.div
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${(logs.length / 6) * 100}%` }}
                                    transition={{ ease: "linear" }}
                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                />
                            </div>
                        </div>

                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-8 text-center flex items-center justify-center gap-2 font-mono text-xs text-slate-500"
                        >
                            <Activity size={14} className="animate-spin-slow text-blue-500" />
                            AI анализирует контекст... Пожалуйста, подождите.
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

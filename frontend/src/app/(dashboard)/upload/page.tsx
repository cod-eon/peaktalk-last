"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Type, Terminal, Activity, Zap, CheckCircle2, Sparkles } from 'lucide-react';
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

    const DEMO_PITCH = `Привет! Я — Илья, фаундер стартапа PeakTalk. Мы делаем AI-тренажер для спикеров, который решает проблему страха публичных выступлений. 
По статистике, 75% людей боятся выступать. Из-за этого стартаперы проваливают питчи, а эксперты боятся просить повышение. 
Наш продукт — это B2C SaaS. Пользователь загружает текст своей речи, а наш ИИ-судья, например "строгий инвестор", задает каверзные вопросы по логике и структуре.
Мы уже запустили MVP и у нас более 500 активных пользователей. Сейчас мы ищем инвестиции в размере 10 миллионов рублей для масштабирования маркетинга и выхода на B2B рынок корпоративного обучения. Буду рад ответить на вопросы!`;

    const setDemoText = () => {
        setMode('text');
        setText(DEMO_PITCH);
    };

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
        <div className="flex w-full flex-col justify-start px-4 sm:px-6 py-8 sm:py-12 md:py-20 max-w-4xl mx-auto relative z-10 box-border">

            {/* Header */}
            <div className="text-center mb-6 sm:mb-10">
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-syne font-bold text-[var(--text-main)] mb-3 sm:mb-4 tracking-tight">
                    Прокачай свой материал
                </h1>
                <p className="text-[var(--text-muted)] text-sm md:text-base max-w-lg mx-auto leading-relaxed px-2">
                    Загрузи сценарий или черновик. Мы проверим его на прочность, найдем логические дыры и подготовим вопросы для стресс-теста.
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
                        <div className="bg-white border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
                            
                            {/* Tabs */}
                            <div className="flex w-full border-b border-[var(--border-main)] bg-[var(--bg-surface)]">
                                <button
                                    onClick={() => setMode('file')}
                                    className={`flex-1 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                        mode === 'file'
                                            ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)] bg-[var(--bg-surface-hover)]'
                                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-alt)]'
                                    }`}
                                >
                                    <FileText size={16} /> Документ (PDF, DOCX)
                                </button>
                                <button
                                    onClick={() => setMode('text')}
                                    className={`flex-1 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                        mode === 'text'
                                            ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)] bg-[var(--bg-surface-hover)]'
                                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-alt)]'
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
                                                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-bg)] scale-[0.98]' 
                                                        : 'border-[var(--border-light)] hover:border-[var(--border-main)] hover:bg-[var(--bg-surface-alt)]'
                                                }`}
                                                onClick={() => !file && fileInputRef.current?.click()}
                                            >
                                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".txt,.pdf,.docx,.md" />
                                                
                                                {file ? (
                                                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                                                        <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary-bg)] border border-[var(--accent-primary-glow)] flex items-center justify-center text-[var(--accent-primary)] shadow-[0_0_20px_var(--accent-primary-glow)]">
                                                            <CheckCircle2 size={32} />
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-[var(--text-main)] font-mono text-sm mb-1 max-w-[240px] truncate">{file.name}</div>
                                                            <div className="text-[var(--text-dim)] font-sans text-xs">{(file.size / 1024).toFixed(1)} КБ</div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                            className="mt-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] underline underline-offset-4 transition-colors"
                                                        >
                                                            Загрузить другой файл
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center pointer-events-none">
                                                        <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-[var(--accent-primary-bg)] text-[var(--accent-primary)]' : 'bg-[var(--bg-surface)] border border-[var(--border-light)] text-[var(--text-muted)]'}`}>
                                                            <UploadCloud size={28} strokeWidth={1.5} />
                                                        </div>
                                                        <h3 className="text-[var(--text-main)] font-medium mb-1">Брось черновик сюда</h3>
                                                        <p className="text-[var(--text-dim)] text-xs mb-6 text-center max-w-[240px]">(AI разберется, или просто кликни)</p>
                                                        
                                                        <div className="flex gap-2 flex-wrap justify-center">
                                                            {['PDF', 'DOCX', 'TXT'].map((ext) => (
                                                                <span key={ext} className="px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded font-mono text-[10px] text-[var(--text-muted)] tracking-wider">
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
                                                className="w-full flex-1 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-xl p-4 text-sm text-[var(--text-main)] placeholder:text-[var(--text-dim)] resize-none outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary-glow)] transition-all font-inter leading-relaxed"
                                            />
                                            <div className="flex justify-between items-center mt-3 px-1">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-mono font-medium ${text.length > 0 ? 'text-[var(--accent-primary)]' : 'text-[var(--text-dim)]'}`}>
                                                        {text.length} символов
                                                    </span>
                                                    {text.length === 0 && (
                                                        <button 
                                                            onClick={setDemoText} 
                                                            className="text-[11px] text-orange-600 hover:text-orange-700 transition-colors bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-md font-medium border border-orange-200/60"
                                                        >
                                                            Вставить демо-питч
                                                        </button>
                                                    )}
                                                </div>
                                                <button onClick={() => setText('')} className="text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors font-medium">Очистить</button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Action Bar */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-t border-[var(--border-main)] p-4 sm:p-5 bg-[var(--bg-surface)] gap-3">
                                <div className="text-xs text-[var(--text-dim)] hidden sm:block">
                                    Ваши данные надежно защищены
                                </div>
                                <div className="flex flex-col items-center sm:items-end gap-1.5 w-full sm:w-auto">
                                    <button
                                        onClick={startAnalysis}
                                        disabled={
                                            (mode === 'file' && !file) ||
                                            (mode === 'text' && text.length < 50)
                                        }
                                        className="w-full sm:w-auto btn-primary relative px-6 py-2.5 min-h-[44px]"
                                    >
                                        <span className="flex items-center gap-2 justify-center">
                                            <Zap size={16} /> Сделать текст сильнее
                                        </span>
                                    </button>
                                    <span className="text-[10px] text-[var(--text-dim)] font-medium flex items-center gap-1">
                                        <Sparkles size={10} className="text-orange-400" />
                                        Потребует 1 анализ
                                    </span>
                                </div>
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
                        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-[var(--shadow-soft)] flex flex-col">
                            {/* Log Viewer Header */}
                            <div className="px-5 py-3 border-b border-[var(--border-main)] bg-[var(--bg-surface-alt)] flex items-center">
                                <div className="flex gap-2 mr-4 opacity-50">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                                <div className="mx-auto flex items-center gap-2 font-mono text-xs text-[var(--text-dim)]">
                                    <Terminal size={14} className="text-[var(--accent-primary)]/70" /> peaktalk/engine
                                </div>
                                <div className="w-[52px]" />
                            </div>

                            {/* Log Viewer Body */}
                            <div className="p-6 md:p-8 h-[300px] font-mono text-xs md:text-sm flex flex-col gap-3 overflow-hidden">
                                {logs.map((log, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`${log.includes('ОШИБКА') ? 'text-[var(--color-error)]' : log.includes('завершен') ? 'text-[var(--color-success)]' : 'text-[var(--text-dim)]'}`}
                                    >
                                        {log}
                                    </motion.div>
                                ))}

                                {logs.length > 0 && !logs[logs.length - 1].includes('завершен') && (
                                    <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                                        <div className="w-2 h-4 bg-[var(--accent-primary)] mt-1" />
                                    </motion.div>
                                )}
                            </div>

                            {/* Processing Progress Bar */}
                            <div className="h-1 w-full bg-[var(--bg-surface-alt)]">
                                <motion.div
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${(logs.length / 6) * 100}%` }}
                                    transition={{ ease: "linear" }}
                                    className="h-full bg-[var(--accent-primary)]"
                                />
                            </div>
                        </div>

                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-8 text-center flex items-center justify-center gap-2 font-mono text-xs text-[var(--text-dim)]"
                        >
                            <Activity size={14} className="animate-spin-slow text-[var(--accent-primary)]" />
                            AI анализирует контекст... Пожалуйста, подождите.
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

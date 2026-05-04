"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Type, Terminal, Activity, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const ALLOWED_FILE_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'md'] as const;
const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;

export default function UploadPage() {
    const router = useRouter();
    const [mode, setMode] = useState<'file' | 'text'>('file');
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const DEMO_PITCH = `Привет! Я — Илья, основатель PeakTalk. Мы делаем ИИ-симулятор сложных рабочих разговоров, который помогает проверять аргументацию до важной встречи.
По статистике, 75% людей боятся выступать. Из-за этого руководители и эксперты хуже защищают решения, бюджеты и инициативы.
Наш продукт — это сервис с индивидуальной покупкой. Пользователь загружает текст своей речи, а наш ИИ-судья, например "строгий инвестор", задает каверзные вопросы по логике и структуре.
Мы уже запустили первую версию и у нас более 500 активных пользователей. Сейчас мы ищем инвестиции в размере 10 миллионов рублей для масштабирования маркетинга и выхода на корпоративный рынок корпоративного обучения. Буду рад ответить на вопросы!`;

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
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile: File) => {
        const extension = selectedFile.name.split('.').pop()?.toLowerCase() ?? '';

        if (!ALLOWED_FILE_EXTENSIONS.includes(extension as typeof ALLOWED_FILE_EXTENSIONS[number])) {
            toast.error('Неподдерживаемый тип файла. Разрешены PDF, DOC, DOCX, TXT и MD.');
            return;
        }

        if (selectedFile.size > MAX_UPLOAD_SIZE_BYTES) {
            toast.error('Файл превышает лимит 50 МБ.');
            return;
        }

        setFile(selectedFile);
    };

    const startAnalysis = async () => {
        if (mode === 'file' && !file) return;
        if (mode === 'text' && !text.trim()) return;

        setIsProcessing(true);
        setLogs(['> Инициализация ИИ-движка PeakTalk...']);

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

            // 1b. Create document for text mode
            if (mode === 'text') {
                setLogs(prev => [...prev, '> Сохранение текстового документа...']);
                const draftTitle = 'Текстовый документ ' + new Date().toLocaleDateString('ru-RU');
                const docRes = await api.post('/documents/from-text', {
                    title: draftTitle,
                    text: rawText,
                });
                documentId = docRes.id;
            }

            if (rawText.length < 10) {
                throw new Error('Текст слишком короткий, минимум 10 символов.');
            }

            // 2. Create draft
            setLogs(prev => [...prev, '> Создание черновика речи...']);
            const draftTitle = mode === 'file' ? (file?.name ?? 'Документ') : 'Анализ текста ' + new Date().toLocaleTimeString('ru-RU');

            const draftRes = await api.post('/drafts', {
                title: draftTitle,
                raw_text: rawText,
                document_id: documentId
            });

            const draftId = draftRes.id;

            // 3. Request Analysis
            setLogs(prev => [...prev, '> Запуск глубокого семантического анализа (Cloud.ru AI)...']);
            setLogs(prev => [...prev, '> Поиск стилистических и риторических уязвимостей...']);

            await api.post(`/drafts/${draftId}/analyze`);

            setLogs(prev => [...prev, '> Формирование рекомендаций...']);
            setLogs(prev => [...prev, '> Анализ завершен. Перенаправление...']);

            setTimeout(() => {
                router.push(`/analysis/${draftId}`);
            }, 1000);

        } catch (error: unknown) {
            console.error('Analysis error:', error);
            const message = error instanceof Error ? error.message : 'Ошибка обработки';
            setLogs(prev => [...prev, `> ОШИБКА: ${message}`]);
            toast.error(message);
            setTimeout(() => setIsProcessing(false), 3000);
        }
    };

    return (
        <div className="flex w-full flex-col justify-start px-4 sm:px-6 pt-6 sm:pt-10 pb-20 max-w-6xl mx-auto relative z-10 box-border font-inter">

            {/* Header */}
            <div className="text-center mb-6 sm:mb-10">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-inter font-black text-[#111827] mb-3 sm:mb-4 tracking-tight">
                    Проверить материал
                </h1>
                <p className="text-[#73706A] text-sm md:text-base max-w-lg mx-auto leading-relaxed px-2">
                    Загрузите сценарий или черновик. PeakTalk проверит аргументацию, найдёт логические разрывы и подготовит вопросы для стресс-теста.
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
                        <div className="bg-white border border-neutral-200 rounded-none overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.03)]">

                            {/* Tabs */}
                            <div className="flex w-full border-b border-neutral-200 bg-white">
                                <button
                                    onClick={() => setMode('file')}
                                    className={`flex-1 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                        mode === 'file'
                                            ? 'text-neutral-900 border-b-2 border-neutral-900 bg-neutral-50'
                                            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                                    }`}
                                >
                                    <FileText size={16} /> Документ (PDF, DOC, DOCX, TXT, MD)
                                </button>
                                <button
                                    onClick={() => setMode('text')}
                                    className={`flex-1 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                        mode === 'text'
                                            ? 'text-neutral-900 border-b-2 border-neutral-900 bg-neutral-50'
                                            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
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
                                                className={`h-full w-full flex flex-col items-center justify-center rounded-none border-2 border-dashed transition-all cursor-pointer ${
                                                    isDragging
                                                        ? 'border-neutral-900 bg-neutral-50 scale-[0.98]'
                                                        : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                                                }`}
                                                onClick={() => !file && fileInputRef.current?.click()}
                                            >
                                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".txt,.pdf,.doc,.docx,.md" />

                                                {file ? (
                                                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                                                        <div className="w-16 h-16 rounded-none bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900">
                                                            <CheckCircle2 size={32} />
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-neutral-900 font-mono text-sm mb-1 max-w-[240px] truncate">{file.name}</div>
                                                            <div className="text-neutral-400 font-sans text-xs">{(file.size / 1024).toFixed(1)} КБ</div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                            className="mt-2 text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-4 transition-colors"
                                                        >
                                                            Загрузить другой файл
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center pointer-events-none">
                                                        <div className={`p-4 rounded-none mb-4 transition-colors ${isDragging ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-50 border border-neutral-200 text-neutral-500'}`}>
                                                            <UploadCloud size={28} strokeWidth={1.5} />
                                                        </div>
                                                        <h3 className="text-neutral-900 font-medium mb-1">Загрузите черновик</h3>
                                                        <p className="text-neutral-400 text-xs mb-6 text-center max-w-[240px]">Перетащите файл сюда или выберите его вручную</p>

                                                        <div className="flex gap-2 flex-wrap justify-center">
                                                            {['PDF', 'DOCX', 'TXT'].map((ext) => (
                                                                <span key={ext} className="px-2 py-1 rounded-none bg-neutral-50 border border-neutral-200 font-mono text-[10px] text-neutral-500 tracking-wider">
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
                                                className="w-full flex-1 bg-neutral-50 border border-neutral-200 rounded-none p-4 text-sm text-neutral-900 placeholder:text-neutral-400 resize-none outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300 transition-all font-inter leading-relaxed"
                                            />
                                            <div className="flex justify-between items-center mt-3 px-1">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-mono font-medium ${text.length > 0 ? 'text-neutral-900' : 'text-neutral-400'}`}>
                                                        {text.length} символов
                                                    </span>
                                                    {text.length === 0 && (
                                                        <button
                                                            onClick={setDemoText}
                                                            className="text-[11px] text-neutral-600 hover:text-neutral-900 transition-colors bg-neutral-50 hover:bg-neutral-100 rounded-none px-2.5 py-1.5 font-medium border border-neutral-200"
                                                        >
                                                            Вставить демо-спич
                                                        </button>
                                                    )}
                                                </div>
                                                <button onClick={() => setText('')} className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors font-medium">Очистить</button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Action Bar */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-t border-neutral-200 p-4 sm:p-5 bg-white gap-3">
                                <div className="text-xs text-neutral-400 hidden sm:block">
                                    Ваши данные надежно защищены
                                </div>
                                <div className="flex flex-col items-center sm:items-end gap-1.5 w-full sm:w-auto">
                                    <button
                                        onClick={startAnalysis}
                                        disabled={
                                            (mode === 'file' && !file) ||
                                            (mode === 'text' && text.length < 50)
                                        }
                                        className="w-full sm:w-auto bg-[#171717] hover:bg-black text-white font-medium relative rounded-none px-6 py-2.5 min-h-[44px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <span className="flex items-center gap-2 justify-center">
                                            <ShieldCheck size={16} /> Запустить проверку
                                        </span>
                                    </button>
                                    <span className="text-[10px] text-neutral-400 font-medium flex items-center gap-1">
                                        <ShieldCheck size={10} className="text-neutral-400" />
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
                        <div className="bg-white border border-neutral-200 rounded-none overflow-hidden flex flex-col shadow-[0_12px_32px_rgba(0,0,0,0.03)]">
                            {/* Log Viewer Header */}
                            <div className="px-5 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center">
                                <div className="flex gap-2 mr-4 opacity-50">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                                <div className="mx-auto flex items-center gap-2 font-mono text-xs text-neutral-400">
                                    <Terminal size={14} className="text-neutral-500" /> peaktalk/engine
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
                                        className={`${log.includes('ОШИБКА') ? 'text-red-500' : log.includes('завершен') ? 'text-emerald-500' : 'text-neutral-400'}`}
                                    >
                                        {log}
                                    </motion.div>
                                ))}

                                {logs.length > 0 && !logs[logs.length - 1].includes('завершен') && (
                                    <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                                        <div className="w-2 h-4 bg-neutral-900 mt-1" />
                                    </motion.div>
                                )}
                            </div>

                            {/* Processing Progress Bar */}
                            <div className="h-1 w-full bg-neutral-100">
                                <motion.div
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${(logs.length / 6) * 100}%` }}
                                    transition={{ ease: "linear" }}
                                    className="h-full bg-neutral-900"
                                />
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-8 text-center flex items-center justify-center gap-2 font-mono text-xs text-neutral-400"
                        >
                            <Activity size={14} className="animate-spin-slow text-neutral-500" />
                            AI анализирует контекст... Пожалуйста, подождите.
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

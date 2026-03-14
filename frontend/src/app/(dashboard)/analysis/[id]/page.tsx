"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, TerminalSquare, ListFilter, Sparkles } from 'lucide-react';

type Issue = {
    id: number;
    lineIndex: number;
    type: string;
    title: string;
    description: string;
    suggestion: string;
    color: string;
    highlightText: string;
};

// Генерация фейкового документа
const initialTextLines = [
    "Всем привет.",
    "Эээ, ну, наша компания занимается", // line 1 -> water
    "инновационными разработками в области ИИ.", // line 2 -> cliche
    "Мы считаем, что наш продукт уникален.",
    "Я думаю, что мы можем стать лидерами рынка,", // line 4 -> insecure
    "потому что у нас хорошая команда.", // line 5 -> weak_arg
    "Наши алгоритмы обрабатывают огромные массивы данных в реальном времени.",
    "Конкуренты пока не могут предложить ничего подобного.",
    "В принципе, мы готовы к пилоту.", // line 8 -> water
];

for (let i = 10; i < 45; i++) {
    initialTextLines.push(`Это стандартная строка текста сценария #${i}, здесь диктор развивает свою мысль.`);
}
initialTextLines.push("В общем и целом, вот такие результаты. Эээ, спасибо."); // line 45 (index) -> water

const mockIssues: Issue[] = [
    {
        id: 1, lineIndex: 1, type: 'water', title: 'Мусор в начале фразы',
        description: 'Слова-паразиты на старте выдают сильное волнение и сразу сбивают ритм выступления.',
        suggestion: 'Удалить «Эээ, ну,» и начать сразу с сути.',
        color: '#ef4444', highlightText: 'Эээ, ну,'
    },
    {
        id: 2, lineIndex: 2, type: 'cliche', title: 'Штамп и канцелярит',
        description: '«Инновационные разработки» — это пустой звук для инвестора. Опишите конкретную технологию или пользу.',
        suggestion: '«разрабатываем LLM-агентов для автоматизации B2B-продаж»',
        color: '#f97316', highlightText: 'инновационными разработками'
    },
    {
        id: 3, lineIndex: 4, type: 'insecure', title: 'Маркер неуверенности',
        description: 'В питче непозволительно звучать неуверенно. Говорите о будущем в утвердительном ключе.',
        suggestion: '«Мы займем 15% рынка за 2 года...»',
        color: '#a855f7', highlightText: 'Я думаю, что мы можем'
    },
    {
        id: 4, lineIndex: 5, type: 'weak', title: 'Слабый аргумент',
        description: '«Хорошая команда» — абстракция. Инвестор хочет знать, почему именно эти люди сделают миллиардную компанию.',
        suggestion: '«команда из 5 сеньоров-разработчиков ex-Яндекс и ex-Авито»',
        color: '#eab308', highlightText: 'хорошая команда'
    },
    {
        id: 5, lineIndex: 8, type: 'water', title: 'Обесценивание утверждения',
        description: 'Оборот «В принципе» заранее готовит слушателя к тому, что есть подвох.',
        suggestion: '«Мы полностью готовы к пилоту»',
        color: '#ef4444', highlightText: 'В принципе,'
    },
    {
        id: 6, lineIndex: initialTextLines.length - 1, type: 'water', title: 'Размытая концовка',
        description: 'Конец питча должен содержать четкий Call-to-Action (призыв к действию), а не скомканное прощание.',
        suggestion: '«Мы ищем $500k за 10%. Готов показать демо»',
        color: '#f97316', highlightText: 'В общем и целом, вот такие результаты. Эээ, спасибо.'
    }
];

export default function AnalysisPage() {
    const [activeIssueId, setActiveIssueId] = useState<number | null>(1);
    const [showRightPanel, setShowRightPanel] = useState(false);

    // Refs для скролла
    const lineRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    useEffect(() => {
        const isDesktop = window.matchMedia('(min-width: 768px)').matches;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (isDesktop) setShowRightPanel(true);
    }, []);

    const scrollToLine = (index: number) => {
        const el = lineRefs.current[index];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleIssueClick = (id: number, lineIndex: number) => {
        setActiveIssueId(activeIssueId === id ? null : id);
        if (activeIssueId !== id) {
            scrollToLine(lineIndex);
        }
    };

    const renderTextLine = (text: string, highlightText: string, color: string, isActive: boolean) => {
        const parts = text.split(highlightText);
        if (parts.length < 2) return text;

        return (
            <>
                {parts[0]}
                <span
                    className="transition-all duration-200"
                    style={{
                        backgroundColor: isActive ? `${color}40` : `${color}20`,
                        borderBottom: `1px solid ${isActive ? color : `${color}80`}`,
                        color: 'white',
                    }}
                >
                    {highlightText}
                </span>
                {parts[1]}
            </>
        );
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[var(--bg-main)]">
            {/* ─── TOOLBAR / HEADER ─── */}
            <div className="h-14 border-b border-[var(--border-main)] flex items-center justify-between px-4 sm:px-6 bg-[var(--bg-surface)] shrink-0 gap-2">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[var(--text-main)] font-mono text-[13px]">
                        <TerminalSquare size={16} className="text-blue-500" />
                        <span>pitch_v2.md</span>
                    </div>
                    <div className="hidden sm:block h-4 w-px bg-[var(--border-main)]" />
                    <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)]">
                        Score: <span className="text-emerald-500 font-semibold">82/100</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className="md:hidden flex items-center gap-1.5 border border-[var(--border-light)] text-[var(--text-main)] px-2.5 py-1.5 rounded"
                        onClick={() => setShowRightPanel(!showRightPanel)}
                    >
                        <ListFilter size={14} /> <span className="text-xs font-mono">Ошибки</span>
                    </button>
                    <div className="hidden sm:block font-mono text-[11px] text-[var(--text-dim)] uppercase tracking-wider mr-2">
                        Найдено {mockIssues.length}
                    </div>
                    <button className="btn-primary px-4 py-1.5 text-xs flex items-center gap-1.5">
                        <Sparkles size={14} /> Применить всё
                    </button>
                </div>
            </div>

            {/* ─── MAIN WORKSPACE ─── */}
            <div className="flex flex-1 min-h-0 overflow-hidden relative">

                {/* ─── LEFT: TEXT EDITOR (CODE VIEW) ─── */}
                <div className="flex-1 overflow-y-auto bg-[var(--bg-main)] relative scroll-smooth">
                    <div className="py-8 pb-32 font-mono text-xs sm:text-sm leading-[1.8]">

                        {initialTextLines.map((text, index) => {
                            const issue = mockIssues.find(i => i.lineIndex === index);
                            const isActive = activeIssueId === issue?.id;

                            return (
                                <React.Fragment key={index}>
                                    {/* Строка текста */}
                                    <div
                                        ref={el => { lineRefs.current[index] = el; }}
                                        onClick={() => issue && handleIssueClick(issue.id, index)}
                                        className={`flex px-3 sm:px-6 transition-colors duration-200 ${
                                            isActive ? 'bg-white/5' : (issue ? 'bg-white/5 hover:bg-white/10' : 'bg-transparent')
                                        } ${issue ? 'cursor-pointer' : 'cursor-default'}`}
                                    >
                                        <div className={`w-8 sm:w-10 shrink-0 text-right pr-2 sm:pr-4 select-none text-[11px] sm:text-[13px] transition-colors duration-200 ${
                                            isActive ? 'text-[var(--text-main)]' : (issue ? 'text-[var(--text-muted)]' : 'text-[var(--text-dim)] opacity-30')
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div className={`flex-1 ${issue ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                                            {issue ? renderTextLine(text, issue.highlightText, issue.color, isActive) : text}
                                        </div>
                                    </div>

                                    {/* INLINE IDE PEEK WIDGET */}
                                    <AnimatePresence>
                                        {issue && isActive && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div 
                                                    className="my-2 ml-10 sm:ml-16 mr-3 sm:mr-6 rounded-r-md p-3 sm:p-4 bg-[var(--bg-surface)] shadow-lg relative z-10"
                                                    style={{
                                                        border: `1px solid ${issue.color}40`,
                                                        borderLeft: `3px solid ${issue.color}`,
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <AlertCircle size={14} color={issue.color} />
                                                        <h4 className="font-inter text-sm font-semibold text-white m-0">{issue.title}</h4>
                                                    </div>

                                                    <p className="font-inter text-[13px] text-[var(--text-muted)] mb-4 leading-relaxed">
                                                        {issue.description}
                                                    </p>

                                                    <div className="bg-[var(--bg-main)] border border-[var(--border-main)] rounded p-3">
                                                        <div className="flex items-center gap-1.5 mb-1.5 text-[var(--text-dim)] text-[10px] uppercase tracking-wider">
                                                            Предложенный фикс
                                                        </div>
                                                        <div className="flex justify-between items-start">
                                                            <div className="font-mono text-[13px] text-emerald-400 flex-1 pr-4">
                                                                {issue.suggestion}
                                                            </div>
                                                            <button className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded font-mono text-[11px] cursor-pointer flex items-center gap-1.5 transition-colors hover:bg-emerald-500/20 shrink-0">
                                                                <Check size={14} /> Fix
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </React.Fragment>
                            );
                        })}

                    </div>
                </div>

                {/* ─── RIGHT: PROBLEMS SIDEBAR (VS Code Style) ─── */}
                <AnimatePresence>
                    {showRightPanel && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 340, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="fixed md:relative right-0 top-14 md:top-0 bottom-0 w-[min(340px,85vw)] max-w-full md:max-w-none border-l border-[var(--border-main)] bg-[var(--bg-surface)] flex flex-col z-20 shadow-2xl md:shadow-none bg-opacity-95 md:bg-opacity-100 backdrop-blur-xl md:backdrop-blur-none"
                        >
                            <div className="px-5 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
                                <span className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-[0.1em]">Diagnostics</span>
                                <button className="md:hidden bg-transparent border-none text-[var(--text-dim)]" onClick={() => setShowRightPanel(false)}>
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {mockIssues.map(issue => {
                                    const isActive = activeIssueId === issue.id;
                                    return (
                                        <div
                                            key={issue.id}
                                            onClick={() => handleIssueClick(issue.id, issue.lineIndex)}
                                            className={`p-3 px-5 border-b border-[var(--border-light)] cursor-pointer transition-colors relative ${
                                                isActive ? 'bg-[var(--bg-surface-hover)]' : 'bg-transparent'
                                            }`}
                                        >
                                            {isActive && (
                                                <motion.div layoutId="sidebar-active-indicator" className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: issue.color }} />
                                            )}
                                            <div className="flex items-start gap-2.5">
                                                <AlertCircle size={14} color={issue.color} className="mt-0.5 shrink-0" />
                                                <div>
                                                    <div className={`font-inter text-[13px] mb-1 ${isActive ? 'text-white font-semibold' : 'text-[var(--text-main)] font-normal'}`}>
                                                        {issue.title}
                                                    </div>
                                                    <div className="flex gap-2 font-mono text-[11px] text-[var(--text-dim)]">
                                                        <span>[Ln {issue.lineIndex + 1}]</span>
                                                        <span className="truncate max-w-[200px]">
                                                            {issue.highlightText}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}

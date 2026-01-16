import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Settings,
    Play,
    Heart,
    HeartOff,
    Trophy,
    X,
    RotateCcw,
    Zap
} from 'lucide-react';
import {
    MathBattleSettings,
    DEFAULT_SETTINGS,
    GameQuestion,
    OperatorType,
    generateQuestion
} from './types';

// 设置面板组件
function SettingsPanel({
    isOpen,
    settings,
    onSettingsChange,
    onClose,
    onStart
}: {
    isOpen: boolean;
    settings: MathBattleSettings;
    onSettingsChange: (settings: MathBattleSettings) => void;
    onClose: () => void;
    onStart: () => void;
}) {
    if (!isOpen) return null;

    const updateOperator = (
        op: 'addition' | 'subtraction' | 'multiplication' | 'division',
        field: 'enabled' | 'min' | 'max',
        value: boolean | number
    ) => {
        onSettingsChange({
            ...settings,
            [op]: { ...settings[op], [field]: value }
        });
    };

    const operators = [
        { key: 'addition' as const, label: '加法', symbol: '+' },
        { key: 'subtraction' as const, label: '减法', symbol: '-' },
        { key: 'multiplication' as const, label: '乘法', symbol: '×' },
        { key: 'division' as const, label: '除法', symbol: '÷' }
    ];

    const hasEnabledOperator = operators.some(op => settings[op.key].enabled);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">游戏设置</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 运算符设置 */}
                <div className="space-y-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-600">选择运算</h3>
                    {operators.map(op => (
                        <div key={op.key} className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold">
                                        {op.symbol}
                                    </span>
                                    <span className="font-medium">{op.label}</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings[op.key].enabled}
                                        onChange={(e) => updateOperator(op.key, 'enabled', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                            </div>
                            {settings[op.key].enabled && (
                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                                    <span className="text-sm text-gray-500">范围:</span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={settings[op.key].max}
                                        value={settings[op.key].min}
                                        onChange={(e) => updateOperator(op.key, 'min', parseInt(e.target.value) || 0)}
                                        className="w-16 px-2 py-1 border rounded-lg text-center"
                                    />
                                    <span className="text-gray-400">~</span>
                                    <input
                                        type="number"
                                        min={settings[op.key].min}
                                        max={99}
                                        value={settings[op.key].max}
                                        onChange={(e) => updateOperator(op.key, 'max', parseInt(e.target.value) || 0)}
                                        className="w-16 px-2 py-1 border rounded-lg text-center"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* 速度设置 */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">前进速度</h3>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">慢</span>
                        <input
                            type="range"
                            min={1}
                            max={10}
                            value={settings.speed}
                            onChange={(e) => onSettingsChange({ ...settings, speed: parseInt(e.target.value) })}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <span className="text-sm text-gray-500">快</span>
                        <span className="w-8 text-center font-medium text-blue-500">{settings.speed}</span>
                    </div>
                </div>

                <button
                    onClick={onStart}
                    disabled={!hasEnabledOperator}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <Play size={24} />
                    开始游戏
                </button>
                {!hasEnabledOperator && (
                    <p className="text-red-500 text-sm text-center mt-2">请至少选择一种运算</p>
                )}
            </div>
        </div>
    );
}

// 游戏结果弹窗
function GameOverDialog({
    score,
    onRestart,
    onSettings,
    onBack
}: {
    score: number;
    onRestart: () => void;
    onSettings: () => void;
    onBack: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center mx-4 max-w-sm">
                <div className="text-6xl mb-4">
                    {score >= 50 ? '🏆' : score >= 20 ? '⭐' : '💪'}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">游戏结束</h2>
                <p className="text-gray-600 mb-4">你坚持了</p>
                <p className="text-5xl font-bold text-blue-500 mb-6">{score}</p>
                <p className="text-gray-500 mb-6">继续加油！</p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onRestart}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={20} />
                        再来一局
                    </button>
                    <button
                        onClick={onSettings}
                        className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2"
                    >
                        <Settings size={20} />
                        调整设置
                    </button>
                    <button
                        onClick={onBack}
                        className="w-full py-3 border border-gray-300 text-gray-600 rounded-xl font-medium"
                    >
                        返回
                    </button>
                </div>
            </div>
        </div>
    );
}

// 游戏主体组件
function GameStage({
    settings,
    onGameOver
}: {
    settings: MathBattleSettings;
    onGameOver: (score: number, playTime: number) => void;
}) {
    const [lives, setLives] = useState(3);
    const [currentValue, setCurrentValue] = useState(1);
    const [score, setScore] = useState(0);
    const [phase, setPhase] = useState<'moving' | 'selectOp' | 'showNum' | 'selectAnswer'>('selectOp');
    const [question, setQuestion] = useState<GameQuestion | null>(null);
    const [operatorOptions, setOperatorOptions] = useState<OperatorType[]>([]);
    const [selectedOperator, setSelectedOperator] = useState<OperatorType | null>(null);
    const [position, setPosition] = useState(0);
    const [showCorrect, setShowCorrect] = useState<boolean | null>(null);
    const [answerPositions, setAnswerPositions] = useState<{ correct: 'left' | 'right' }>({ correct: 'left' });
    const startTimeRef = useRef(Date.now());
    const animationRef = useRef<number>();

    // 生成运算符选项
    const generateOperatorOptions = useCallback(() => {
        const enabledOps: OperatorType[] = [];
        if (settings.addition.enabled) enabledOps.push('+');
        if (settings.subtraction.enabled) enabledOps.push('-');
        if (settings.multiplication.enabled) enabledOps.push('×');
        if (settings.division.enabled) enabledOps.push('÷');

        // 随机选择2个不同的运算符（如果可用的话）
        if (enabledOps.length >= 2) {
            const shuffled = [...enabledOps].sort(() => Math.random() - 0.5);
            setOperatorOptions(shuffled.slice(0, 2));
        } else {
            setOperatorOptions([...enabledOps, ...enabledOps]);
        }
    }, [settings]);

    // 初始化
    useEffect(() => {
        generateOperatorOptions();
        setPhase('selectOp');
    }, [generateOperatorOptions]);

    // 自动前进动画
    useEffect(() => {
        if (phase === 'moving') {
            const speed = settings.speed * 2;
            const animate = () => {
                setPosition(prev => {
                    if (prev >= 100) {
                        setPhase('selectOp');
                        generateOperatorOptions();
                        return 0;
                    }
                    return prev + speed * 0.1;
                });
                animationRef.current = requestAnimationFrame(animate);
            };
            animationRef.current = requestAnimationFrame(animate);
            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            };
        }
    }, [phase, settings.speed, generateOperatorOptions]);

    // 选择运算符
    const handleSelectOperator = (op: OperatorType) => {
        setSelectedOperator(op);

        // 根据选择的运算符生成问题
        const tempSettings = { ...settings };
        // 临时只启用选择的运算符
        Object.keys(tempSettings).forEach(key => {
            if (key !== 'speed' && key !== op.replace('+', 'addition').replace('-', 'subtraction').replace('×', 'multiplication').replace('÷', 'division')) {
                // @ts-ignore
                if (tempSettings[key]?.enabled !== undefined) {
                    // @ts-ignore
                    tempSettings[key] = { ...tempSettings[key], enabled: false };
                }
            }
        });

        // 重新启用选择的运算符
        if (op === '+') tempSettings.addition.enabled = true;
        if (op === '-') tempSettings.subtraction.enabled = true;
        if (op === '×') tempSettings.multiplication.enabled = true;
        if (op === '÷') tempSettings.division.enabled = true;

        const q = generateQuestion(currentValue, tempSettings);
        if (q) {
            setQuestion(q);
            setAnswerPositions({ correct: Math.random() > 0.5 ? 'left' : 'right' });
            setPhase('showNum');
            // 显示数字后自动进入选择答案阶段
            setTimeout(() => {
                setPhase('selectAnswer');
            }, 1000);
        }
    };

    // 选择答案
    const handleSelectAnswer = (isCorrect: boolean) => {
        setShowCorrect(isCorrect);

        setTimeout(() => {
            if (isCorrect) {
                setCurrentValue(question!.correctAnswer);
                setScore(prev => prev + 1);
            } else {
                setLives(prev => {
                    const newLives = prev - 1;
                    if (newLives <= 0) {
                        const playTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
                        onGameOver(score, playTime);
                    }
                    return newLives;
                });
            }

            setShowCorrect(null);
            setQuestion(null);
            setSelectedOperator(null);
            setPhase('moving');
        }, 1000);
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-b from-blue-900 via-purple-900 to-indigo-900 overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute inset-0">
                {/* 星星背景 */}
                {[...Array(30)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`
                        }}
                    />
                ))}
                {/* 移动的线条 */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                    style={{ transform: `translateX(-${100 - position}%)` }}
                />
            </div>

            {/* 顶部状态栏 */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                {/* 生命值 */}
                <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="transition-all">
                            {i < lives ? (
                                <Heart size={32} className="text-red-500 fill-red-500" />
                            ) : (
                                <HeartOff size={32} className="text-gray-600" />
                            )}
                        </div>
                    ))}
                </div>

                {/* 当前数值 */}
                <div className="bg-white/20 backdrop-blur rounded-2xl px-6 py-2">
                    <span className="text-3xl font-bold text-white">{currentValue}</span>
                </div>

                {/* 得分 */}
                <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur rounded-2xl px-4 py-2">
                    <Trophy size={24} className="text-yellow-400" />
                    <span className="text-xl font-bold text-white">{score}</span>
                </div>
            </div>

            {/* 游戏主区域 */}
            <div className="absolute inset-0 flex items-center justify-center pt-20">
                {/* 选择运算符 */}
                {phase === 'selectOp' && (
                    <div className="flex gap-8">
                        {operatorOptions.map((op, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectOperator(op)}
                                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 text-white text-4xl font-bold shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
                            >
                                {op}
                            </button>
                        ))}
                    </div>
                )}

                {/* 显示数字 */}
                {phase === 'showNum' && question && (
                    <div className="text-center">
                        <div className="text-6xl font-bold text-white mb-4 animate-bounce">
                            {selectedOperator} {question.operand}
                        </div>
                        <p className="text-2xl text-white/60">
                            {currentValue} {selectedOperator} {question.operand} = ?
                        </p>
                    </div>
                )}

                {/* 选择答案 */}
                {phase === 'selectAnswer' && question && (
                    <div className="text-center">
                        <p className="text-2xl text-white/80 mb-8">
                            {currentValue} {selectedOperator} {question.operand} = ?
                        </p>
                        <div className="flex gap-8">
                            <button
                                onClick={() => handleSelectAnswer(answerPositions.correct === 'left')}
                                disabled={showCorrect !== null}
                                className={`w-32 h-32 rounded-2xl text-4xl font-bold shadow-lg transition-all
                                    ${showCorrect !== null
                                        ? answerPositions.correct === 'left'
                                            ? 'bg-green-500'
                                            : 'bg-red-500'
                                        : 'bg-gradient-to-br from-green-400 to-emerald-500 hover:scale-110'
                                    } text-white flex items-center justify-center`}
                            >
                                {answerPositions.correct === 'left' ? question.correctAnswer : question.wrongAnswer}
                            </button>
                            <button
                                onClick={() => handleSelectAnswer(answerPositions.correct === 'right')}
                                disabled={showCorrect !== null}
                                className={`w-32 h-32 rounded-2xl text-4xl font-bold shadow-lg transition-all
                                    ${showCorrect !== null
                                        ? answerPositions.correct === 'right'
                                            ? 'bg-green-500'
                                            : 'bg-red-500'
                                        : 'bg-gradient-to-br from-orange-400 to-red-500 hover:scale-110'
                                    } text-white flex items-center justify-center`}
                            >
                                {answerPositions.correct === 'right' ? question.correctAnswer : question.wrongAnswer}
                            </button>
                        </div>
                    </div>
                )}

                {/* 移动中 */}
                {phase === 'moving' && (
                    <div className="text-center">
                        <Zap size={64} className="text-yellow-400 animate-pulse mx-auto mb-4" />
                        <p className="text-xl text-white/60">前进中...</p>
                    </div>
                )}
            </div>

            {/* 答案反馈 */}
            {showCorrect !== null && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`text-9xl ${showCorrect ? 'text-green-400' : 'text-red-400'} animate-ping`}>
                        {showCorrect ? '✓' : '✗'}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MathBattlePage() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState<MathBattleSettings>(DEFAULT_SETTINGS);
    const [showSettings, setShowSettings] = useState(true);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const startTimeRef = useRef<number>(0);

    // 开始游戏
    const handleStart = () => {
        setShowSettings(false);
        setGameStarted(true);
        setGameOver(false);
        startTimeRef.current = Date.now();
    };

    // 游戏结束
    const handleGameOver = async (score: number, playTime: number) => {
        setFinalScore(score);
        setGameOver(true);
        setGameStarted(false);

        // 上报数据
        await fetch('/api/games/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameId: 'mathBattle',
                score,
                playTime
            })
        });
    };

    // 返回
    const goBack = async () => {
        if (startTimeRef.current > 0) {
            const playTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
            await fetch('/api/games/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId: 'mathBattle',
                    score: finalScore,
                    playTime
                })
            });
        }
        navigate('/games');
    };

    // 游戏中
    if (gameStarted) {
        return <GameStage settings={settings} onGameOver={handleGameOver} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
            {/* 顶部栏 */}
            <div className="p-4 flex items-center justify-between">
                <button
                    onClick={goBack}
                    className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    数字大战
                </h1>
                <div className="w-10" />
            </div>

            {/* 游戏介绍 */}
            <div className="p-6 text-center">
                <div className="text-6xl mb-4">🎮</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">欢迎来到数字大战</h2>
                <p className="text-gray-600 mb-4">
                    选择运算符，计算结果，挑战你的数学能力！
                </p>
                <div className="bg-white rounded-xl p-4 shadow-md inline-block text-left">
                    <p className="text-sm text-gray-600 mb-2">🎯 游戏规则：</p>
                    <ul className="text-sm text-gray-500 space-y-1">
                        <li>• 开局数字为 1</li>
                        <li>• 选择运算符后计算结果</li>
                        <li>• 答对继续，答错扣血</li>
                        <li>• 三滴血扣完游戏结束</li>
                    </ul>
                </div>
            </div>

            {/* 设置面板 */}
            <SettingsPanel
                isOpen={showSettings}
                settings={settings}
                onSettingsChange={setSettings}
                onClose={() => setShowSettings(false)}
                onStart={handleStart}
            />

            {/* 游戏结束弹窗 */}
            {gameOver && (
                <GameOverDialog
                    score={finalScore}
                    onRestart={handleStart}
                    onSettings={() => {
                        setGameOver(false);
                        setShowSettings(true);
                    }}
                    onBack={goBack}
                />
            )}

            {/* 开始按钮（设置面板关闭时显示） */}
            {!showSettings && !gameOver && (
                <div className="fixed bottom-8 left-0 right-0 flex justify-center">
                    <button
                        onClick={() => setShowSettings(true)}
                        className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-bold text-lg shadow-lg flex items-center gap-2"
                    >
                        <Settings size={24} />
                        游戏设置
                    </button>
                </div>
            )}
        </div>
    );
}

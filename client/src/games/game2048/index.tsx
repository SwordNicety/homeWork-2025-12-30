import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    RotateCcw,
    Save,
    Settings,
    Trophy,
    Pause,
    Play,
    X
} from 'lucide-react';
import { Game2048Logic, TileData, Game2048SaveData } from './Game2048';
import { StyleGroup, DEFAULT_STYLE_GROUP, getTileStyle } from './styles';

// 方块组件
function Tile({
    tile,
    gridSize,
    styleGroup
}: {
    tile: TileData;
    gridSize: number;
    styleGroup: StyleGroup;
}) {
    const style = getTileStyle(tile.value, styleGroup);
    const cellSize = 100 / gridSize;
    const fontSize = gridSize <= 4 ? 'text-3xl' : gridSize <= 5 ? 'text-2xl' : gridSize <= 6 ? 'text-xl' : 'text-lg';

    return (
        <div
            className={`absolute flex items-center justify-center font-bold rounded-lg transition-all duration-100 ${fontSize}
                ${tile.isNew ? 'animate-pop-in' : ''} 
                ${tile.mergedFrom ? 'animate-merge' : ''}`}
            style={{
                width: `calc(${cellSize}% - 8px)`,
                height: `calc(${cellSize}% - 8px)`,
                left: `calc(${tile.col * cellSize}% + 4px)`,
                top: `calc(${tile.row * cellSize}% + 4px)`,
                backgroundColor: style.backgroundImage ? undefined : style.backgroundColor,
                backgroundImage: style.backgroundImage ? `url(${style.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: style.textColor,
                zIndex: tile.mergedFrom ? 10 : 1
            }}
        >
            {!style.backgroundImage && tile.value}
        </div>
    );
}

// 空格子组件
function EmptyCell({ styleGroup }: { styleGroup: StyleGroup }) {
    return (
        <div
            className="rounded-lg"
            style={{
                backgroundColor: styleGroup.emptyTileColor || '#cdc1b4',
                aspectRatio: '1'
            }}
        />
    );
}

// 设置面板组件
function SettingsPanel({
    isOpen,
    onClose,
    gridSize,
    onGridSizeChange,
    styleGroups,
    currentStyleGroup,
    onStyleGroupChange
}: {
    isOpen: boolean;
    onClose: () => void;
    gridSize: number;
    onGridSizeChange: (size: number) => void;
    styleGroups: StyleGroup[];
    currentStyleGroup: StyleGroup;
    onStyleGroupChange: (styleGroup: StyleGroup) => void;
}) {
    if (!isOpen) return null;

    const gridSizes = [4, 5, 6, 7, 8];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">游戏设置</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 格子大小设置 */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">格子大小</h3>
                    <div className="flex flex-wrap gap-2">
                        {gridSizes.map(size => (
                            <button
                                key={size}
                                onClick={() => onGridSizeChange(size)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${gridSize === size
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {size}x{size}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">更改格子大小将重新开始游戏</p>
                </div>

                {/* 样式组设置 */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">方块样式</h3>
                    <div className="space-y-2">
                        {styleGroups.map(styleGroup => (
                            <button
                                key={styleGroup.id}
                                onClick={() => onStyleGroupChange(styleGroup)}
                                className={`w-full p-3 rounded-lg text-left transition-colors ${currentStyleGroup.id === styleGroup.id
                                        ? 'bg-orange-100 border-2 border-orange-500'
                                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                    }`}
                            >
                                <div className="font-medium text-gray-800">{styleGroup.name}</div>
                                {styleGroup.description && (
                                    <div className="text-xs text-gray-500">{styleGroup.description}</div>
                                )}
                                {/* 预览小方块 */}
                                <div className="flex gap-1 mt-2">
                                    {[2, 4, 8, 16, 32].map(value => {
                                        const style = getTileStyle(value, styleGroup);
                                        return (
                                            <div
                                                key={value}
                                                className="w-6 h-6 rounded text-[8px] flex items-center justify-center font-bold"
                                                style={{
                                                    backgroundColor: style.backgroundColor,
                                                    color: style.textColor
                                                }}
                                            >
                                                {value}
                                            </div>
                                        );
                                    })}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                >
                    确定
                </button>
            </div>
        </div>
    );
}

// 游戏结束/胜利弹窗
function GameOverlay({
    type,
    score,
    onRestart,
    onContinue,
    onClose
}: {
    type: 'win' | 'gameover';
    score: number;
    onRestart: () => void;
    onContinue?: () => void;
    onClose: () => void;
}) {
    return (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl z-20">
            <div className="bg-white rounded-2xl p-6 text-center mx-4">
                {type === 'win' ? (
                    <>
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-amber-600 mb-2">恭喜你!</h2>
                        <p className="text-gray-600 mb-4">你达到了2048!</p>
                    </>
                ) : (
                    <>
                        <div className="text-6xl mb-4">😢</div>
                        <h2 className="text-2xl font-bold text-gray-700 mb-2">游戏结束</h2>
                    </>
                )}
                <p className="text-lg text-gray-700 mb-6">
                    最终得分: <span className="font-bold text-orange-500">{score}</span>
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onRestart}
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                    >
                        重新开始
                    </button>
                    {type === 'win' && onContinue && (
                        <button
                            onClick={onContinue}
                            className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                        >
                            继续游戏
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                        返回
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Game2048Page() {
    const navigate = useNavigate();
    const gameRef = useRef<Game2048Logic | null>(null);
    const startTimeRef = useRef<number>(0);

    const [gameState, setGameState] = useState<{
        grid: (TileData | null)[][];
        score: number;
        bestScore: number;
        gameOver: boolean;
        won: boolean;
        gridSize: number;
    } | null>(null);

    const [gridSize, setGridSize] = useState(4);
    const [styleGroups, setStyleGroups] = useState<StyleGroup[]>([DEFAULT_STYLE_GROUP]);
    const [currentStyleGroup, setCurrentStyleGroup] = useState<StyleGroup>(DEFAULT_STYLE_GROUP);
    const [showSettings, setShowSettings] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showOverlay, setShowOverlay] = useState<'win' | 'gameover' | null>(null);

    // 初始化游戏
    useEffect(() => {
        initGame();
    }, []);

    // 键盘控制
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!gameRef.current || showSettings || showOverlay) return;

            let direction: 'up' | 'down' | 'left' | 'right' | null = null;

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    direction = 'up';
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    direction = 'down';
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    direction = 'left';
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    direction = 'right';
                    break;
            }

            if (direction) {
                e.preventDefault();
                move(direction);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showSettings, showOverlay]);

    // 触摸控制
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current || !gameRef.current || showOverlay) return;

        const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
        const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;

        const minSwipeDistance = 50;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            move(deltaX > 0 ? 'right' : 'left');
        } else if (Math.abs(deltaY) > minSwipeDistance) {
            move(deltaY > 0 ? 'down' : 'up');
        }

        touchStartRef.current = null;
    };

    // 初始化游戏
    const initGame = async () => {
        setLoading(true);
        startTimeRef.current = Date.now();

        try {
            // 加载样式组
            const stylesRes = await fetch('/api/games/2048/styles');
            if (stylesRes.ok) {
                const stylesData = await stylesRes.json();
                if (stylesData.success && stylesData.data.length > 0) {
                    setStyleGroups(stylesData.data);
                    setCurrentStyleGroup(stylesData.data[0]);
                }
            }

            // 尝试加载存档
            const saveRes = await fetch('/api/games/save/game2048');
            const saveData = await saveRes.json();

            if (saveData.success && saveData.data?.gameData) {
                const saved = saveData.data.gameData as Game2048SaveData;
                gameRef.current = new Game2048Logic(saved.gridSize);
                gameRef.current.loadFromSave(saved);
                setGridSize(saved.gridSize);
            } else {
                gameRef.current = new Game2048Logic(gridSize);
            }

            // 加载历史最高分
            const statsRes = await fetch('/api/games/stats/game2048');
            const statsData = await statsRes.json();
            if (statsData.success && statsData.data) {
                gameRef.current.updateBestScore(statsData.data.highestScore || 0);
            }

            updateGameState();
        } catch (error) {
            console.error('初始化游戏失败:', error);
            gameRef.current = new Game2048Logic(gridSize);
            updateGameState();
        } finally {
            setLoading(false);
        }
    };

    // 更新游戏状态
    const updateGameState = useCallback(() => {
        if (!gameRef.current) return;
        const state = gameRef.current.getState();
        setGameState(state);

        // 检查游戏状态
        if (state.won && !showOverlay) {
            setShowOverlay('win');
        } else if (state.gameOver && !showOverlay) {
            setShowOverlay('gameover');
            reportGameEnd();
        }
    }, [showOverlay]);

    // 移动
    const move = (direction: 'up' | 'down' | 'left' | 'right') => {
        if (!gameRef.current) return;

        const moved = gameRef.current.move(direction);
        if (moved) {
            updateGameState();
        }
    };

    // 重新开始
    const restart = async () => {
        if (!gameRef.current) return;

        // 先上报当前游戏
        await reportGameEnd();

        // 删除存档
        await fetch('/api/games/save/game2048', { method: 'DELETE' });

        // 重置游戏
        gameRef.current.reset();
        startTimeRef.current = Date.now();
        setShowOverlay(null);
        updateGameState();
    };

    // 继续游戏(达到2048后)
    const continueGame = () => {
        if (!gameRef.current) return;
        gameRef.current.continueGame();
        setShowOverlay(null);
        updateGameState();
    };

    // 保存游戏
    const saveGame = async () => {
        if (!gameRef.current) return;

        const saveData = gameRef.current.getSaveData();
        await fetch('/api/games/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameId: 'game2048',
                gameData: saveData
            })
        });

        alert('游戏已保存');
    };

    // 上报游戏结束
    const reportGameEnd = async () => {
        if (!gameRef.current) return;

        const playTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const score = gameRef.current.getScore();

        await fetch('/api/games/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameId: 'game2048',
                score,
                playTime
            })
        });
    };

    // 返回
    const goBack = async () => {
        // 保存游戏
        if (gameRef.current && !gameState?.gameOver) {
            await saveGame();
        }
        // 上报数据
        await reportGameEnd();
        navigate('/games');
    };

    // 更改格子大小
    const handleGridSizeChange = async (newSize: number) => {
        if (newSize === gridSize) return;

        // 先上报当前游戏
        await reportGameEnd();

        // 删除存档
        await fetch('/api/games/save/game2048', { method: 'DELETE' });

        setGridSize(newSize);
        if (gameRef.current) {
            gameRef.current.setGridSize(newSize);
            startTimeRef.current = Date.now();
            updateGameState();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
            {/* 顶部栏 */}
            <div className="p-4 flex items-center justify-between">
                <button
                    onClick={goBack}
                    className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">2048</h1>
                <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                    <Settings size={24} className="text-gray-700" />
                </button>
            </div>

            {/* 分数区域 */}
            <div className="px-4 mb-4">
                <div className="flex justify-center gap-4">
                    <div className="bg-amber-600 text-white px-6 py-3 rounded-xl text-center min-w-[100px]">
                        <div className="text-xs opacity-80">分数</div>
                        <div className="text-2xl font-bold">{gameState?.score || 0}</div>
                    </div>
                    <div className="bg-amber-700 text-white px-6 py-3 rounded-xl text-center min-w-[100px]">
                        <div className="text-xs opacity-80">最高分</div>
                        <div className="text-2xl font-bold">{gameState?.bestScore || 0}</div>
                    </div>
                </div>
            </div>

            {/* 操作按钮 */}
            <div className="px-4 mb-4 flex justify-center gap-3">
                <button
                    onClick={restart}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                    <RotateCcw size={18} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">重新开始</span>
                </button>
                <button
                    onClick={saveGame}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                    <Save size={18} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">存盘</span>
                </button>
            </div>

            {/* 游戏板 */}
            <div className="px-4 flex justify-center">
                <div
                    className="relative rounded-2xl p-2 w-full max-w-[500px] aspect-square"
                    style={{ backgroundColor: currentStyleGroup.boardBackground || '#bbada0' }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* 背景网格 */}
                    <div
                        className="grid gap-2 w-full h-full"
                        style={{
                            gridTemplateColumns: `repeat(${gridSize}, 1fr)`
                        }}
                    >
                        {Array(gridSize * gridSize).fill(null).map((_, i) => (
                            <EmptyCell key={i} styleGroup={currentStyleGroup} />
                        ))}
                    </div>

                    {/* 方块层 */}
                    <div className="absolute inset-2">
                        {gameState?.grid.flat().filter(Boolean).map(tile => (
                            <Tile
                                key={tile!.id}
                                tile={tile!}
                                gridSize={gridSize}
                                styleGroup={currentStyleGroup}
                            />
                        ))}
                    </div>

                    {/* 游戏结束/胜利遮罩 */}
                    {showOverlay && (
                        <GameOverlay
                            type={showOverlay}
                            score={gameState?.score || 0}
                            onRestart={restart}
                            onContinue={showOverlay === 'win' ? continueGame : undefined}
                            onClose={goBack}
                        />
                    )}
                </div>
            </div>

            {/* 操作提示 */}
            <div className="mt-6 text-center text-gray-500 text-sm">
                <p>使用方向键或滑动屏幕移动方块</p>
                <p>相同数字相撞会合并</p>
            </div>

            {/* 设置面板 */}
            <SettingsPanel
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                gridSize={gridSize}
                onGridSizeChange={handleGridSizeChange}
                styleGroups={styleGroups}
                currentStyleGroup={currentStyleGroup}
                onStyleGroupChange={setCurrentStyleGroup}
            />

            {/* 动画样式 */}
            <style>{`
                @keyframes pop-in {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes merge {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                .animate-pop-in {
                    animation: pop-in 0.2s ease-out;
                }
                .animate-merge {
                    animation: merge 0.2s ease-out;
                }
            `}</style>
        </div>
    );
}

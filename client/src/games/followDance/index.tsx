import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Upload,
    Play,
    Pause,
    Trash2,
    Camera,
    CameraOff,
    Music,
    Sparkles,
    X,
    Plus,
    Video
} from 'lucide-react';
import { DanceTemplate, getDanceTemplates, uploadDanceTemplate, deleteDanceTemplate } from './types';

// 上传模板对话框
function UploadDialog({
    isOpen,
    onClose,
    onUpload
}: {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (name: string, video: File, cover?: File) => Promise<void>;
}) {
    const [name, setName] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setVideoFile(null);
            setCoverFile(null);
            setVideoPreview(null);
            setCoverPreview(null);
        }
    }, [isOpen]);

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!name || !videoFile) return;

        setUploading(true);
        try {
            await onUpload(name, videoFile, coverFile || undefined);
            onClose();
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">上传跳舞模板</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 模板名称 */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        模板名称
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="请输入模板名称"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                </div>

                {/* 视频上传 */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        跳舞视频 *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
                        {videoPreview ? (
                            <div className="relative">
                                <video
                                    src={videoPreview}
                                    className="w-full rounded-lg"
                                    controls
                                />
                                <button
                                    onClick={() => {
                                        setVideoFile(null);
                                        setVideoPreview(null);
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center cursor-pointer py-8">
                                <Video size={48} className="text-gray-400 mb-2" />
                                <span className="text-gray-500">点击上传视频</span>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* 封面上传（可选） */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        封面图（可选）
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
                        {coverPreview ? (
                            <div className="relative">
                                <img
                                    src={coverPreview}
                                    className="w-full h-32 object-cover rounded-lg"
                                    alt="封面预览"
                                />
                                <button
                                    onClick={() => {
                                        setCoverFile(null);
                                        setCoverPreview(null);
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center cursor-pointer py-4">
                                <Upload size={32} className="text-gray-400 mb-2" />
                                <span className="text-gray-500 text-sm">点击上传封面</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCoverChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!name || !videoFile || uploading}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium disabled:opacity-50"
                >
                    {uploading ? '上传中...' : '确认上传'}
                </button>
            </div>
        </div>
    );
}

// 模板卡片组件
function TemplateCard({
    template,
    onSelect,
    onDelete
}: {
    template: DanceTemplate;
    onSelect: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden group">
            {/* 封面/视频缩略图 */}
            <div
                className="relative aspect-video bg-gradient-to-br from-pink-100 to-purple-100 cursor-pointer"
                onClick={onSelect}
            >
                {template.coverUrl ? (
                    <img
                        src={template.coverUrl}
                        alt={template.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Music size={48} className="text-pink-300" />
                    </div>
                )}
                {/* 播放按钮 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={28} className="text-pink-500 ml-1" />
                    </div>
                </div>
            </div>
            {/* 信息 */}
            <div className="p-3 flex items-center justify-between">
                <span className="font-medium text-gray-800">{template.name}</span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="p-1.5 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}

// 跳舞界面
function DanceStage({
    template,
    onBack,
    onEnd
}: {
    template: DanceTemplate;
    onBack: () => void;
    onEnd: (playTime: number) => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const cameraRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const startTimeRef = useRef<number>(0);
    const [showEffects, setShowEffects] = useState(true);

    // 开启摄像头
    const enableCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });
            if (cameraRef.current) {
                cameraRef.current.srcObject = stream;
                setCameraEnabled(true);
                setCameraError(null);
            }
        } catch (error) {
            console.error('无法访问摄像头:', error);
            setCameraError('无法访问摄像头，请检查权限设置');
        }
    };

    // 关闭摄像头
    const disableCamera = () => {
        if (cameraRef.current?.srcObject) {
            const stream = cameraRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            cameraRef.current.srcObject = null;
        }
        setCameraEnabled(false);
    };

    // 组件挂载时自动开启摄像头，卸载时清理
    useEffect(() => {
        // 自动开启摄像头
        enableCamera();
        
        return () => {
            disableCamera();
        };
    }, []);

    // 播放控制
    const togglePlay = () => {
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
            if (startTimeRef.current === 0) {
                startTimeRef.current = Date.now();
            }
        }
        setIsPlaying(!isPlaying);
    };

    // 视频结束
    const handleVideoEnd = () => {
        setIsPlaying(false);
        const playTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        onEnd(playTime);
    };

    // 返回
    const handleBack = () => {
        disableCamera();
        if (startTimeRef.current > 0) {
            const playTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
            onEnd(playTime);
        } else {
            onBack();
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900">
            {/* 背景特效 */}
            {showEffects && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* 闪烁的星星 */}
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-pulse"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${1 + Math.random() * 2}s`
                            }}
                        >
                            <Sparkles size={16 + Math.random() * 16} className="text-yellow-300/50" />
                        </div>
                    ))}
                    {/* 渐变光晕 */}
                    <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
            )}

            {/* 顶部栏 */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                <button
                    onClick={handleBack}
                    className="p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/30"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-white">{template.name}</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowEffects(!showEffects)}
                        className={`p-2 rounded-full ${showEffects ? 'bg-yellow-500' : 'bg-white/20'} text-white`}
                    >
                        <Sparkles size={24} />
                    </button>
                    <button
                        onClick={cameraEnabled ? disableCamera : enableCamera}
                        className={`p-2 rounded-full ${cameraEnabled ? 'bg-green-500' : 'bg-white/20'} text-white`}
                    >
                        {cameraEnabled ? <Camera size={24} /> : <CameraOff size={24} />}
                    </button>
                </div>
            </div>

            {/* 主内容区 */}
            <div className="h-full pt-16 pb-24 px-4 flex gap-4">
                {/* 摄像头画面 */}
                <div className="flex-1 rounded-2xl overflow-hidden bg-black/30 backdrop-blur relative">
                    {cameraEnabled ? (
                        <video
                            ref={cameraRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/60">
                            <CameraOff size={64} className="mb-4" />
                            <p>{cameraError || '点击右上角开启摄像头'}</p>
                        </div>
                    )}
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-white text-sm">
                        我的舞姿
                    </div>
                </div>

                {/* 模板视频 */}
                <div className="flex-1 rounded-2xl overflow-hidden bg-black/30 backdrop-blur relative">
                    <video
                        ref={videoRef}
                        src={template.videoUrl}
                        className="w-full h-full object-cover"
                        onEnded={handleVideoEnd}
                        playsInline
                    />
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-white text-sm">
                        跟我学
                    </div>
                </div>
            </div>

            {/* 底部控制栏 */}
            <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center">
                <button
                    onClick={togglePlay}
                    className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform"
                >
                    {isPlaying ? <Pause size={36} /> : <Play size={36} className="ml-1" />}
                </button>
            </div>
        </div>
    );
}

export default function FollowDancePage() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<DanceTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<DanceTemplate | null>(null);
    const startTimeRef = useRef<number>(0);

    // 加载模板
    useEffect(() => {
        loadTemplates();
        startTimeRef.current = Date.now();
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        const data = await getDanceTemplates();
        setTemplates(data);
        setLoading(false);
    };

    // 上传模板
    const handleUpload = async (name: string, video: File, cover?: File) => {
        const result = await uploadDanceTemplate(name, video, cover);
        if (result) {
            await loadTemplates();
        }
    };

    // 删除模板
    const handleDelete = async (templateId: string) => {
        if (confirm('确定要删除这个模板吗？')) {
            const success = await deleteDanceTemplate(templateId);
            if (success) {
                await loadTemplates();
            }
        }
    };

    // 结束跳舞
    const handleDanceEnd = async (playTime: number) => {
        // 上报游戏数据
        await fetch('/api/games/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameId: 'followDance',
                score: playTime,  // 使用播放时间作为分数
                playTime
            })
        });
        setSelectedTemplate(null);
    };

    // 返回
    const goBack = async () => {
        const playTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (playTime > 0) {
            await fetch('/api/games/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId: 'followDance',
                    score: 0,
                    playTime
                })
            });
        }
        navigate('/games');
    };

    // 显示跳舞界面
    if (selectedTemplate) {
        return (
            <DanceStage
                template={selectedTemplate}
                onBack={() => setSelectedTemplate(null)}
                onEnd={handleDanceEnd}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50">
            {/* 顶部栏 */}
            <div className="p-4 flex items-center justify-between">
                <button
                    onClick={goBack}
                    className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    跟随跳舞
                </h1>
                <button
                    onClick={() => setShowUpload(true)}
                    className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white shadow-lg hover:shadow-xl transition-shadow"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* 内容区 */}
            <div className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Music size={64} className="mb-4 opacity-50" />
                        <p className="text-lg mb-4">还没有跳舞模板</p>
                        <button
                            onClick={() => setShowUpload(true)}
                            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium"
                        >
                            上传第一个模板
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {templates.map(template => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                onSelect={() => setSelectedTemplate(template)}
                                onDelete={() => handleDelete(template.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* 上传对话框 */}
            <UploadDialog
                isOpen={showUpload}
                onClose={() => setShowUpload(false)}
                onUpload={handleUpload}
            />
        </div>
    );
}

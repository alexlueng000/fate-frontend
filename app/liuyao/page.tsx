'use client';

export default function LiuyaoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">六爻玄机</h1>
          <p className="text-gray-600">传统六爻占卜，AI 智能解卦</p>
        </div>

        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">🎲</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">功能开发中</h2>
          <p className="text-gray-500">
            六爻玄机功能即将上线，敬请期待
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-6">
            <div className="text-3xl mb-3">🔢</div>
            <h3 className="font-semibold text-gray-800 mb-2">数字起卦</h3>
            <p className="text-sm text-gray-600">输入数字快速起卦</p>
          </div>
          <div className="card p-6">
            <div className="text-3xl mb-3">🪙</div>
            <h3 className="font-semibold text-gray-800 mb-2">铜钱起卦</h3>
            <p className="text-sm text-gray-600">模拟传统摇卦方式</p>
          </div>
          <div className="card p-6">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-gray-800 mb-2">AI 解卦</h3>
            <p className="text-sm text-gray-600">智能分析卦象含义</p>
          </div>
        </div>
      </div>
    </div>
  );
}

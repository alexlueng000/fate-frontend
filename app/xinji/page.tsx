'use client';

export default function XinjiPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">心镜灯</h1>
          <p className="text-gray-600">记录你的情绪，与自己对话</p>
        </div>

        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">📖</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">功能开发中</h2>
          <p className="text-gray-500">
            心镜灯功能即将上线，敬请期待
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-6">
            <div className="text-3xl mb-3">🌱</div>
            <h3 className="font-semibold text-gray-800 mb-2">今日心迹</h3>
            <p className="text-sm text-gray-600">记录当下的感受和情绪</p>
          </div>
          <div className="card p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-800 mb-2">一周图</h3>
            <p className="text-sm text-gray-600">可视化你的情绪变化</p>
          </div>
          <div className="card p-6">
            <div className="text-3xl mb-3">💭</div>
            <h3 className="font-semibold text-gray-800 mb-2">深度对话</h3>
            <p className="text-sm text-gray-600">与内心深入交流</p>
          </div>
        </div>
      </div>
    </div>
  );
}

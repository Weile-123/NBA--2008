import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { clearGameStorage } from '../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare state: State;
  declare props: Props;
  declare setState: (state: Partial<State> | ((prevState: State) => Partial<State>)) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    if (window.confirm('确定要清空本地缓存并重新加载游戏吗？这可以修复损坏的存档数据。')) {
      clearGameStorage();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#121621] border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">页面遇到了运行错误</h2>
              <p className="text-xs text-slate-400">
                抱歉，组件渲染出现异常。这可能是由于存档数据异常或系统崩溃引起的。
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#080a0f] border border-red-900/40 rounded-xl p-3 text-left overflow-auto max-h-32 text-[11px] font-mono text-red-300">
                {this.state.error.toString()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition shadow-lg shadow-amber-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                刷新页面
              </button>

              <button
                onClick={this.handleResetStorage}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-bold text-xs transition"
              >
                <RotateCcw className="w-4 h-4" />
                重置/修复数据
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

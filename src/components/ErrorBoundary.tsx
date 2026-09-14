import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryMessage: string | null;
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
      recoveryMessage: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, recoveryMessage: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRecovery = async () => {
    if (window.ColorboxAI?.closeWebview) {
      try {
        const response = await window.ColorboxAI.closeWebview({ channel: 'bridge' });
        if (response?.code !== 200) {
          this.setState({ recoveryMessage: response?.message || '暂时无法退出页面，请手动关闭后重新进入游戏。' });
        }
      } catch {
        this.setState({ recoveryMessage: '暂时无法退出页面，请手动关闭后重新进入游戏。' });
      }
      return;
    }

    // Browser preview fallback. The Hupu App path above never navigates to a
    // release-specific resource URL, which avoids exposing a raw 404 response.
    window.location.reload();
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
                抱歉，页面资源加载或组件渲染出现异常。你的本地存档不会因此被删除。
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#080a0f] border border-red-900/40 rounded-xl p-3 text-left overflow-auto max-h-32 text-[11px] font-mono text-red-300">
                {this.state.error.toString()}
              </div>
            )}

            {this.state.recoveryMessage && (
              <p className="text-xs text-amber-300">{this.state.recoveryMessage}</p>
            )}

            <div className="pt-2">
              <button
                onClick={this.handleRecovery}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition shadow-lg shadow-amber-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                {window.ColorboxAI?.closeWebview ? '退出并重新进入' : '安全重新加载'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

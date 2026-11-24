import { useState } from 'react';
import { login, register } from '../api/auth.js';

const NAV_ITEMS = ['创作', '编排', '排练', '资料库', '灵感集'];

export default function Landing({ user, onAuth, onTryDemo, onResume, onLogout }) {
  const [mode, setMode] = useState('login'); // login | register
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const signedIn = Boolean(user);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'register') {
        await register(username, password);
      } else {
        await login(username, password);
      }
      await onAuth();
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="landing-page">
      <header className="landing-topbar">
        <div className="landing-brand">
          <span className="landing-brand-mark" aria-hidden="true">
            开
          </span>
          <b>开排</b>
          <span className="landing-brand-sub">AI 戏剧编导工作台</span>
        </div>
        <nav className="landing-nav" aria-label="封面导航">
          {NAV_ITEMS.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </nav>
      </header>

      <div className="landing-body">
        <section className="landing-hero">
          <span className="landing-kicker">DRAMA AI STUDIO</span>
          <h1 className="landing-title">开排</h1>
          <p className="landing-slogan">把零散想法，变成可执行的排演材料</p>
          <p className="landing-desc">
            AI 助力创意构思、文本拆解与排演规划，让每一个灵感，都有落地的路径。
          </p>
          <div className="landing-actions">
            {signedIn ? (
              <button type="button" className="btn-seal landing-main-cta" onClick={onResume}>
                进入工作台 →
              </button>
            ) : (
              <button type="button" className="btn-seal landing-main-cta" onClick={onTryDemo}>
                一键体验 →
              </button>
            )}
          </div>
          <ul className="landing-features">
            <li>
              <b>AI 创意激发</b>
              <span>从想法到大纲，快速生成创作方向</span>
            </li>
            <li>
              <b>智能文本拆解</b>
              <span>角色、场景、动作，一键结构化</span>
            </li>
            <li>
              <b>排演规划</b>
              <span>分镜、调度、动线，轻松编排</span>
            </li>
          </ul>
        </section>

        <section className="landing-auth-card">
          {signedIn ? (
            <div className="landing-welcome">
              <span className="field-label">当前身份</span>
              <b className="landing-welcome-name">{user.username}</b>
              <p className="landing-desc">欢迎回来，你的作品已保存在本机服务端。</p>
              <button type="button" className="btn-seal landing-submit" onClick={onResume}>
                进入工作台
              </button>
              <button type="button" className="text-action landing-guest" onClick={onLogout}>
                退出登录
              </button>
            </div>
          ) : (
            <>
              <div className="landing-auth-tabs">
                <button
                  type="button"
                  className={mode === 'login' ? 'is-active' : ''}
                  onClick={() => setMode('login')}
                >
                  登录
                </button>
                <button
                  type="button"
                  className={mode === 'register' ? 'is-active' : ''}
                  onClick={() => setMode('register')}
                >
                  注册
                </button>
              </div>

              <form onSubmit={handleSubmit} className="landing-form">
                <label>
                  <span className="field-label">用户名</span>
                  <input
                    className="field landing-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </label>
                <label>
                  <span className="field-label">密码</span>
                  <input
                    className="field landing-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                </label>
                {error && (
                  <p role="alert" className="landing-error">
                    {error}
                  </p>
                )}
                <button type="submit" className="btn-seal landing-submit" disabled={busy}>
                  {busy ? '请稍候…' : mode === 'login' ? '登录' : '注册并进入'}
                </button>
              </form>

              <button type="button" className="text-action landing-guest" onClick={onTryDemo}>
                不登录，先看只读演示
              </button>
              <p className="landing-local-note">
                账号与作品由本地服务端保存，清除服务数据将丢失。
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

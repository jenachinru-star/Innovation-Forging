import { useState } from 'react';
import { login, register } from '../api/auth.js';
import FilmCameraIcon from './FilmCameraIcon.jsx';
import landingBg from '../assets/visual/landing-bg.jpg';

export default function Landing({ user, onAuth, onResume, onLogout }) {
  const [mode, setMode] = useState('login'); // login | register
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const signedIn = Boolean(user);

  // 未登录主按钮：切到注册并滚动、聚焦到登录卡片
  function goRegister() {
    setMode('register');
    const card = document.querySelector('.landing-auth-card');
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(
      () => document.querySelector('.landing-auth-card input')?.focus(),
      300
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'register') {
        await register(username, password, remember);
      } else {
        await login(username, password, remember);
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
      <div className="landing-bg" aria-hidden="true">
        <img className="landing-bg-img" src={landingBg} alt="" />
      </div>
      <div className="landing-mask" aria-hidden="true" />

      <header className="landing-topbar">
        <div className="landing-brand">
          <FilmCameraIcon className="landing-brand-icon" />
          <b>开排</b>
          <span className="landing-brand-sub">AI 戏剧编导工作台</span>
        </div>
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
              <button type="button" className="btn-seal landing-main-cta" onClick={goRegister}>
                注册并开始 →
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
                <label className="landing-remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>记住我（30 天内免登录）</span>
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

              <p className="landing-local-note">
                账号与作品由本地服务端保存，清除服务数据将丢失。
              </p>
            </>
          )}
        </section>
      </div>

      <p className="landing-decor landing-decor-left">故事，排练，重逢</p>
      <p className="landing-decor landing-decor-right">
        <span className="landing-decor-cn">让创作，更简单</span>
        <span className="landing-decor-en">Make Creation Easier</span>
      </p>
    </div>
  );
}

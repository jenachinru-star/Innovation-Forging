import { describe, it, expect, afterEach, vi } from 'vitest';
import { SAMPLE_TEXT } from '@director/shared/samples/oneAct.js';

async function loadEngine() {
  vi.resetModules();
  return import('./index.js');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('engine', () => {
  it('fetch 拒绝时 parseScript 回退本地解析并切换 sourceMode=local', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const engine = await loadEngine();

    const { scriptData } = await engine.parseScript(SAMPLE_TEXT);

    expect(scriptData.scenes.length).toBe(3);
    expect(engine.getSourceMode()).toBe('local');
  });

  it('fetch 返回合法结果时保持 sourceMode=ai 且不触发本地解析', async () => {
    const remote = {
      scriptData: { scenes: [{ id: 'sc-1' }], characters: [], relationships: [] },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => remote,
    });
    vi.stubGlobal('fetch', fetchMock);
    const engine = await loadEngine();

    const result = await engine.parseScript(SAMPLE_TEXT);

    expect(result).toEqual(remote);
    expect(engine.getSourceMode()).toBe('ai');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('未获得作品级 AI 授权时不发送剧本到外部接口', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const engine = await loadEngine();

    const { scriptData } = await engine.parseScript(SAMPLE_TEXT, { allowRemote: false });

    expect(scriptData.scenes.length).toBe(3);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(engine.getSourceMode()).toBe('local');
  });

  it('本地兜底时 aliasMap 会把别名替换为规范名', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const engine = await loadEngine();

    const { scriptData } = await engine.parseScript(SAMPLE_TEXT, {
      aliasMap: { 阿岚: '阿兰' },
    });

    const names = scriptData.characters.map((c) => c.name);
    expect(names).toContain('阿兰');
    expect(names).not.toContain('阿岚');

    const sceneNames = scriptData.scenes.flatMap((s) => s.characters);
    expect(sceneNames).toContain('阿兰');
    expect(sceneNames).not.toContain('阿岚');
    expect(engine.getSourceMode()).toBe('local');
  });

  it('本地兜底时 aliasMap 会覆盖 scenes[].presentCharacters', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const engine = await loadEngine();

    const { scriptData } = await engine.parseScript(SAMPLE_TEXT, {
      aliasMap: { 阿岚: '阿兰' },
    });

    expect(
      scriptData.scenes.some((s) => s.presentCharacters.includes('阿兰'))
    ).toBe(true);
    const presentNames = scriptData.scenes.flatMap((s) => s.presentCharacters);
    expect(presentNames).not.toContain('阿岚');
  });

  it('离线时 generateScript 抛出中文错误', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const engine = await loadEngine();

    await expect(engine.generateScript('x')).rejects.toThrow('离线状态无法生成剧本');
  });

  it('离线时 txt 上传回退本地读取并切换 sourceMode=local', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const engine = await loadEngine();

    const file = new File(
      ['人物：老陈、阿岚\n\n第一场 客厅\n\n老陈：你终于回来了。'],
      'x.txt',
      { type: 'text/plain' }
    );
    const result = await engine.extractUpload(file);

    expect(result.scriptText).toContain('你终于回来了');
    expect(engine.getSourceMode()).toBe('local');
  });

  it('离线时可读取 Fountain 文本', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const engine = await loadEngine();

    const result = await engine.extractUpload(
      new File(['Title: 钥匙\n\nINT. 客厅\n\n老陈\n你终于回来了。'], 'x.fountain')
    );
    expect(result.scriptText).toContain('你终于回来了');
  });

  it('离线时未知扩展名抛出中文错误', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const engine = await loadEngine();

    await expect(engine.extractUpload(new File(['x'], 'x.exe'))).rejects.toThrow(
      '本地模式支持'
    );
  });
});

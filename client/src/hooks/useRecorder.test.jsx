import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useRecorder from './useRecorder.js';

class FakeMediaRecorder {
  static isTypeSupported() {
    return true;
  }
  constructor(stream, options = {}) {
    this.stream = stream;
    this.mimeType = options.mimeType || 'audio/webm';
    this.state = 'inactive';
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['x'], { type: this.mimeType }) });
    this.onstop?.();
  }
}

describe('useRecorder 对象 URL 生命周期', () => {
  let created;
  let revoked;

  beforeEach(() => {
    created = [];
    revoked = [];
    let n = 0;
    globalThis.MediaRecorder = FakeMediaRecorder;
    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop() {} }] })),
      },
    });
    URL.createObjectURL = vi.fn(() => {
      n += 1;
      const url = `blob:rec-${n}`;
      created.push(url);
      return url;
    });
    URL.revokeObjectURL = vi.fn((url) => revoked.push(url));
  });

  afterEach(() => {
    delete globalThis.MediaRecorder;
  });

  async function record(result) {
    await act(async () => {
      await result.current.start();
    });
    let out;
    await act(async () => {
      out = await result.current.stop();
    });
    return out;
  }

  it('再次录音不会销毁上一条录音的地址，卸载时才统一释放', async () => {
    const { result, unmount } = renderHook(() => useRecorder());

    const first = await record(result);
    const second = await record(result);

    expect(first.url).toBe('blob:rec-1');
    expect(second.url).toBe('blob:rec-2');
    // 历史讨论里保存着第一条的地址，它在会话内必须保持可播放
    expect(revoked).not.toContain('blob:rec-1');

    unmount();
    expect(revoked).toEqual(expect.arrayContaining(['blob:rec-1', 'blob:rec-2']));
  });
});

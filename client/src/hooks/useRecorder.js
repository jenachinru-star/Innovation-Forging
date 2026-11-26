import { useCallback, useEffect, useRef, useState } from 'react';

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/aac',
];

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

export function formatClock(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function useRecorder() {
  const supported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  const [status, setStatus] = useState('idle'); // idle | recording | paused
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const stopResolveRef = useRef(null);
  // 历史讨论还在引用之前录音的地址，会话内全部保留，卸载时统一释放
  const objectUrlsRef = useRef([]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (!supported) {
      setError('当前浏览器不支持录音');
      return;
    }
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        const url = URL.createObjectURL(blob);
        objectUrlsRef.current.push(url);
        stopResolveRef.current?.({ blob, url, type });
        stopResolveRef.current = null;
        releaseStream();
      };

      recorder.start(250);
      setSeconds(0);
      setStatus('recording');
      clearTimer();
      timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
    } catch (err) {
      releaseStream();
      setError(err?.name === 'NotAllowedError' ? '麦克风权限被拒绝' : '录音启动失败');
    }
  }, [supported, releaseStream]);

  const pause = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause();
      setStatus('paused');
      clearTimer();
    }
  }, []);

  const resume = useCallback(() => {
    if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume();
      setStatus('recording');
      timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
    }
  }, []);

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }
      stopResolveRef.current = resolve;
      clearTimer();
      recorder.stop();
      setStatus('idle');
    });
  }, []);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    stopResolveRef.current = null;
    clearTimer();
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    setStatus('idle');
    setSeconds(0);
  }, []);

  useEffect(
    () => () => {
      clearTimer();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    },
    []
  );

  return { supported, status, seconds, error, start, pause, resume, stop, cancel };
}

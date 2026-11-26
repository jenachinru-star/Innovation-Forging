/**
 * 上游 AI 服务失败时的统一响应：完整错误只进服务端日志，
 * 客户端只拿到通用提示，避免把上游返回的密钥片段、配额或内部地址透传到浏览器。
 */
export function sendUpstreamError(res, message, err) {
  console.error(`[upstream] ${message}:`, err);
  return res.status(502).json({ error: message });
}

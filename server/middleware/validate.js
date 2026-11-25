/**
 * zod 校验中间件。
 * - 解析失败：400，返回 { error, details }；error 取第一条 issue 的中文 message。
 * - 解析成功：把 strip/transform 后的干净数据回写到 req[source]，再进入路由。
 */
export function validate(schema, source = 'body') {
  return function validateMiddleware(req, res, next) {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issues = result.error.issues || [];
      const first = issues[0];
      return res.status(400).json({
        error: first?.message || '请求参数不合法',
        details: issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    req[source] = result.data;
    return next();
  };
}

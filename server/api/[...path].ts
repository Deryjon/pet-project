export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const proxyTarget = String(config.apiProxyTarget || "").replace(/\/+$/, "");

  if (!proxyTarget) {
    setResponseStatus(event, 503);
    return {
      error: "API proxy target is not configured",
      message: "Set NUXT_API_PROXY_TARGET to your backend base URL, for example http://127.0.0.1:8000/api",
      path: getRequestURL(event).pathname,
    };
  }

  const path = getRouterParam(event, "path") || "";
  const targetUrl = `${proxyTarget}/${path}`;
  const method = event.node.req.method || "GET";
  const query = getQuery(event);
  const headers = getRequestHeaders(event);
  delete headers.host;
  delete headers.connection;
  delete headers["content-length"];

  const body = ["GET", "HEAD"].includes(method) ? undefined : await readBody(event);

  try {
    const response = await $fetch.raw(targetUrl, {
      method,
      query,
      body,
      headers,
    });

    setResponseStatus(event, response.status, response.statusText);

    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() === "content-length") {
        continue;
      }
      setHeader(event, key, value);
    }

    return response._data;
  } catch (error: any) {
    const statusCode = error?.response?.status || 502;
    setResponseStatus(event, statusCode);
    return error?.response?._data || {
      error: "API proxy request failed",
      message: error?.message || "Unknown proxy error",
      targetUrl,
    };
  }
});

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error3) {
    if (error3 instanceof FetchBaseError) {
      throw error3;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error3.message}`, "system", error3);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error3) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error3.message}`, "system", error3);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = dataUriToBuffer$1(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error3 = new AbortError("The operation was aborted.");
      reject(error3);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error3);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error3);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error3) {
                reject(error3);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
        reject(error3);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
          reject(error3);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), (error3) => {
              reject(error3);
            });
          } else {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), (error3) => {
              reject(error3);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, src, dataUriToBuffer$1, Readable, wm, Blob, fetchBlob, Blob$1, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    src = dataUriToBuffer;
    dataUriToBuffer$1 = src;
    ({ Readable } = import_stream.default);
    wm = new WeakMap();
    Blob = class {
      constructor(blobParts = [], options2 = {}) {
        let size = 0;
        const parts = blobParts.map((element) => {
          let buffer;
          if (element instanceof Buffer) {
            buffer = element;
          } else if (ArrayBuffer.isView(element)) {
            buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
          } else if (element instanceof ArrayBuffer) {
            buffer = Buffer.from(element);
          } else if (element instanceof Blob) {
            buffer = element;
          } else {
            buffer = Buffer.from(typeof element === "string" ? element : String(element));
          }
          size += buffer.length || buffer.size || 0;
          return buffer;
        });
        const type = options2.type === void 0 ? "" : String(options2.type).toLowerCase();
        wm.set(this, {
          type: /[^\u0020-\u007E]/.test(type) ? "" : type,
          size,
          parts
        });
      }
      get size() {
        return wm.get(this).size;
      }
      get type() {
        return wm.get(this).type;
      }
      async text() {
        return Buffer.from(await this.arrayBuffer()).toString();
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of this.stream()) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        return Readable.from(read(wm.get(this).parts));
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = wm.get(this).parts.values();
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
            blobParts.push(chunk);
            added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
            relativeStart = 0;
            if (added >= span) {
              break;
            }
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        Object.assign(wm.get(blob), { size: span, parts: blobParts });
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    fetchBlob = Blob;
    Blob$1 = fetchBlob;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && object[NAME] === "AbortSignal";
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (err) => {
            const error3 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
            this[INTERNALS$2].error = error3;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new Blob$1([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw err;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const err = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_CHAR" });
        throw err;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback) {
        for (const name of this.keys()) {
          callback(this.get(name), name);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status || 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal !== null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@sveltejs/adapter-vercel/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-vercel/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/emailjs-com/cjs/store/store.js
var require_store = __commonJS({
  "node_modules/emailjs-com/cjs/store/store.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.store = void 0;
    exports.store = {
      _origin: "https://api.emailjs.com"
    };
  }
});

// node_modules/emailjs-com/cjs/methods/init/init.js
var require_init = __commonJS({
  "node_modules/emailjs-com/cjs/methods/init/init.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.init = void 0;
    var store_1 = require_store();
    var init2 = (userID, origin = "https://api.emailjs.com") => {
      store_1.store._userID = userID;
      store_1.store._origin = origin;
    };
    exports.init = init2;
  }
});

// node_modules/emailjs-com/cjs/utils/validateParams.js
var require_validateParams = __commonJS({
  "node_modules/emailjs-com/cjs/utils/validateParams.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateParams = void 0;
    var validateParams = (userID, serviceID, templateID) => {
      if (!userID) {
        throw "The user ID is required. Visit https://dashboard.emailjs.com/admin/integration";
      }
      if (!serviceID) {
        throw "The service ID is required. Visit https://dashboard.emailjs.com/admin";
      }
      if (!templateID) {
        throw "The template ID is required. Visit https://dashboard.emailjs.com/admin/templates";
      }
      return true;
    };
    exports.validateParams = validateParams;
  }
});

// node_modules/emailjs-com/cjs/models/EmailJSResponseStatus.js
var require_EmailJSResponseStatus = __commonJS({
  "node_modules/emailjs-com/cjs/models/EmailJSResponseStatus.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EmailJSResponseStatus = void 0;
    var EmailJSResponseStatus = class {
      constructor(httpResponse) {
        this.status = httpResponse.status;
        this.text = httpResponse.responseText;
      }
    };
    exports.EmailJSResponseStatus = EmailJSResponseStatus;
  }
});

// node_modules/emailjs-com/cjs/api/sendPost.js
var require_sendPost = __commonJS({
  "node_modules/emailjs-com/cjs/api/sendPost.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sendPost = void 0;
    var EmailJSResponseStatus_1 = require_EmailJSResponseStatus();
    var store_1 = require_store();
    var sendPost = (url, data, headers = {}) => {
      return new Promise((resolve2, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener("load", ({ target }) => {
          const responseStatus = new EmailJSResponseStatus_1.EmailJSResponseStatus(target);
          if (responseStatus.status === 200 || responseStatus.text === "OK") {
            resolve2(responseStatus);
          } else {
            reject(responseStatus);
          }
        });
        xhr.addEventListener("error", ({ target }) => {
          reject(new EmailJSResponseStatus_1.EmailJSResponseStatus(target));
        });
        xhr.open("POST", store_1.store._origin + url, true);
        Object.keys(headers).forEach((key) => {
          xhr.setRequestHeader(key, headers[key]);
        });
        xhr.send(data);
      });
    };
    exports.sendPost = sendPost;
  }
});

// node_modules/emailjs-com/cjs/methods/send/send.js
var require_send = __commonJS({
  "node_modules/emailjs-com/cjs/methods/send/send.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.send = void 0;
    var store_1 = require_store();
    var validateParams_1 = require_validateParams();
    var sendPost_1 = require_sendPost();
    var send = (serviceID, templateID, templatePrams, userID) => {
      const uID = userID || store_1.store._userID;
      validateParams_1.validateParams(uID, serviceID, templateID);
      const params = {
        lib_version: "3.2.0",
        user_id: uID,
        service_id: serviceID,
        template_id: templateID,
        template_params: templatePrams
      };
      return sendPost_1.sendPost("/api/v1.0/email/send", JSON.stringify(params), {
        "Content-type": "application/json"
      });
    };
    exports.send = send;
  }
});

// node_modules/emailjs-com/cjs/methods/sendForm/sendForm.js
var require_sendForm = __commonJS({
  "node_modules/emailjs-com/cjs/methods/sendForm/sendForm.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sendForm = void 0;
    var store_1 = require_store();
    var validateParams_1 = require_validateParams();
    var sendPost_1 = require_sendPost();
    var findHTMLForm = (form) => {
      let currentForm;
      if (typeof form === "string") {
        currentForm = document.querySelector(form);
      } else {
        currentForm = form;
      }
      if (!currentForm || currentForm.nodeName !== "FORM") {
        throw "The 3rd parameter is expected to be the HTML form element or the style selector of form";
      }
      return currentForm;
    };
    var sendForm = (serviceID, templateID, form, userID) => {
      const uID = userID || store_1.store._userID;
      const currentForm = findHTMLForm(form);
      validateParams_1.validateParams(uID, serviceID, templateID);
      const formData = new FormData(currentForm);
      formData.append("lib_version", "3.2.0");
      formData.append("service_id", serviceID);
      formData.append("template_id", templateID);
      formData.append("user_id", uID);
      return sendPost_1.sendPost("/api/v1.0/email/send-form", formData);
    };
    exports.sendForm = sendForm;
  }
});

// node_modules/emailjs-com/cjs/index.js
var require_cjs = __commonJS({
  "node_modules/emailjs-com/cjs/index.js"(exports) {
    init_shims();
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sendForm = exports.send = exports.init = void 0;
    var init_1 = require_init();
    Object.defineProperty(exports, "init", { enumerable: true, get: function() {
      return init_1.init;
    } });
    var send_1 = require_send();
    Object.defineProperty(exports, "send", { enumerable: true, get: function() {
      return send_1.send;
    } });
    var sendForm_1 = require_sendForm();
    Object.defineProperty(exports, "sendForm", { enumerable: true, get: function() {
      return sendForm_1.sendForm;
    } });
    exports.default = {
      init: init_1.init,
      send: send_1.send,
      sendForm: sendForm_1.sendForm
    };
  }
});

// node_modules/scrollreveal/dist/scrollreveal.js
var require_scrollreveal = __commonJS({
  "node_modules/scrollreveal/dist/scrollreveal.js"(exports, module2) {
    init_shims();
    (function(global, factory) {
      typeof exports === "object" && typeof module2 !== "undefined" ? module2.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = global || self, global.ScrollReveal = factory());
    })(exports, function() {
      "use strict";
      var defaults = {
        delay: 0,
        distance: "0",
        duration: 600,
        easing: "cubic-bezier(0.5, 0, 0, 1)",
        interval: 0,
        opacity: 0,
        origin: "bottom",
        rotate: {
          x: 0,
          y: 0,
          z: 0
        },
        scale: 1,
        cleanup: false,
        container: document.documentElement,
        desktop: true,
        mobile: true,
        reset: false,
        useDelay: "always",
        viewFactor: 0,
        viewOffset: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        },
        afterReset: function afterReset() {
        },
        afterReveal: function afterReveal() {
        },
        beforeReset: function beforeReset() {
        },
        beforeReveal: function beforeReveal() {
        }
      };
      function failure() {
        document.documentElement.classList.remove("sr");
        return {
          clean: function clean2() {
          },
          destroy: function destroy2() {
          },
          reveal: function reveal2() {
          },
          sync: function sync2() {
          },
          get noop() {
            return true;
          }
        };
      }
      function success() {
        document.documentElement.classList.add("sr");
        if (document.body) {
          document.body.style.height = "100%";
        } else {
          document.addEventListener("DOMContentLoaded", function() {
            document.body.style.height = "100%";
          });
        }
      }
      var mount = { success, failure };
      function isDomNode(x) {
        return typeof window.Node === "object" ? x instanceof window.Node : x !== null && typeof x === "object" && typeof x.nodeType === "number" && typeof x.nodeName === "string";
      }
      function isDomNodeList(x) {
        var prototypeToString = Object.prototype.toString.call(x);
        var regex = /^\[object (HTMLCollection|NodeList|Object)\]$/;
        return typeof window.NodeList === "object" ? x instanceof window.NodeList : x !== null && typeof x === "object" && typeof x.length === "number" && regex.test(prototypeToString) && (x.length === 0 || isDomNode(x[0]));
      }
      function tealight(target, context) {
        if (context === void 0) {
          context = document;
        }
        if (target instanceof Array) {
          return target.filter(isDomNode);
        }
        if (isDomNode(target)) {
          return [target];
        }
        if (isDomNodeList(target)) {
          return Array.prototype.slice.call(target);
        }
        if (typeof target === "string") {
          try {
            var query = context.querySelectorAll(target);
            return Array.prototype.slice.call(query);
          } catch (err) {
            return [];
          }
        }
        return [];
      }
      function isObject(x) {
        return x !== null && x instanceof Object && (x.constructor === Object || Object.prototype.toString.call(x) === "[object Object]");
      }
      function each(collection, callback) {
        if (isObject(collection)) {
          var keys = Object.keys(collection);
          return keys.forEach(function(key) {
            return callback(collection[key], key, collection);
          });
        }
        if (collection instanceof Array) {
          return collection.forEach(function(item, i) {
            return callback(item, i, collection);
          });
        }
        throw new TypeError("Expected either an array or object literal.");
      }
      function logger(message) {
        var details = [], len = arguments.length - 1;
        while (len-- > 0)
          details[len] = arguments[len + 1];
        if (this.constructor.debug && console) {
          var report = "%cScrollReveal: " + message;
          details.forEach(function(detail) {
            return report += "\n \u2014 " + detail;
          });
          console.log(report, "color: #ea654b;");
        }
      }
      function rinse() {
        var this$1 = this;
        var struct = function() {
          return {
            active: [],
            stale: []
          };
        };
        var elementIds = struct();
        var sequenceIds = struct();
        var containerIds = struct();
        try {
          each(tealight("[data-sr-id]"), function(node) {
            var id = parseInt(node.getAttribute("data-sr-id"));
            elementIds.active.push(id);
          });
        } catch (e) {
          throw e;
        }
        each(this.store.elements, function(element) {
          if (elementIds.active.indexOf(element.id) === -1) {
            elementIds.stale.push(element.id);
          }
        });
        each(elementIds.stale, function(staleId) {
          return delete this$1.store.elements[staleId];
        });
        each(this.store.elements, function(element) {
          if (containerIds.active.indexOf(element.containerId) === -1) {
            containerIds.active.push(element.containerId);
          }
          if (element.hasOwnProperty("sequence")) {
            if (sequenceIds.active.indexOf(element.sequence.id) === -1) {
              sequenceIds.active.push(element.sequence.id);
            }
          }
        });
        each(this.store.containers, function(container) {
          if (containerIds.active.indexOf(container.id) === -1) {
            containerIds.stale.push(container.id);
          }
        });
        each(containerIds.stale, function(staleId) {
          var stale = this$1.store.containers[staleId].node;
          stale.removeEventListener("scroll", this$1.delegate);
          stale.removeEventListener("resize", this$1.delegate);
          delete this$1.store.containers[staleId];
        });
        each(this.store.sequences, function(sequence2) {
          if (sequenceIds.active.indexOf(sequence2.id) === -1) {
            sequenceIds.stale.push(sequence2.id);
          }
        });
        each(sequenceIds.stale, function(staleId) {
          return delete this$1.store.sequences[staleId];
        });
      }
      function format2(source) {
        if (source.constructor !== Array) {
          throw new TypeError("Expected array.");
        }
        if (source.length === 16) {
          return source;
        }
        if (source.length === 6) {
          var matrix = identity();
          matrix[0] = source[0];
          matrix[1] = source[1];
          matrix[4] = source[2];
          matrix[5] = source[3];
          matrix[12] = source[4];
          matrix[13] = source[5];
          return matrix;
        }
        throw new RangeError("Expected array with either 6 or 16 values.");
      }
      function identity() {
        var matrix = [];
        for (var i = 0; i < 16; i++) {
          i % 5 == 0 ? matrix.push(1) : matrix.push(0);
        }
        return matrix;
      }
      function multiply(m, x) {
        var fm = format2(m);
        var fx = format2(x);
        var product = [];
        for (var i = 0; i < 4; i++) {
          var row = [fm[i], fm[i + 4], fm[i + 8], fm[i + 12]];
          for (var j = 0; j < 4; j++) {
            var k = j * 4;
            var col = [fx[k], fx[k + 1], fx[k + 2], fx[k + 3]];
            var result = row[0] * col[0] + row[1] * col[1] + row[2] * col[2] + row[3] * col[3];
            product[i + k] = result;
          }
        }
        return product;
      }
      function parse(source) {
        if (typeof source === "string") {
          var match = source.match(/matrix(3d)?\(([^)]+)\)/);
          if (match) {
            var raw = match[2].split(", ").map(parseFloat);
            return format2(raw);
          }
        }
        return identity();
      }
      function rotateX(angle) {
        var theta = Math.PI / 180 * angle;
        var matrix = identity();
        matrix[5] = matrix[10] = Math.cos(theta);
        matrix[6] = matrix[9] = Math.sin(theta);
        matrix[9] *= -1;
        return matrix;
      }
      function rotateY(angle) {
        var theta = Math.PI / 180 * angle;
        var matrix = identity();
        matrix[0] = matrix[10] = Math.cos(theta);
        matrix[2] = matrix[8] = Math.sin(theta);
        matrix[2] *= -1;
        return matrix;
      }
      function rotateZ(angle) {
        var theta = Math.PI / 180 * angle;
        var matrix = identity();
        matrix[0] = matrix[5] = Math.cos(theta);
        matrix[1] = matrix[4] = Math.sin(theta);
        matrix[4] *= -1;
        return matrix;
      }
      function scale(scalar, scalarY) {
        var matrix = identity();
        matrix[0] = scalar;
        matrix[5] = typeof scalarY === "number" ? scalarY : scalar;
        return matrix;
      }
      function translateX(distance) {
        var matrix = identity();
        matrix[12] = distance;
        return matrix;
      }
      function translateY(distance) {
        var matrix = identity();
        matrix[13] = distance;
        return matrix;
      }
      var getPrefixedCssProp = function() {
        var properties = {};
        var style2 = document.documentElement.style;
        function getPrefixedCssProperty(name, source) {
          if (source === void 0)
            source = style2;
          if (name && typeof name === "string") {
            if (properties[name]) {
              return properties[name];
            }
            if (typeof source[name] === "string") {
              return properties[name] = name;
            }
            if (typeof source["-webkit-" + name] === "string") {
              return properties[name] = "-webkit-" + name;
            }
            throw new RangeError('Unable to find "' + name + '" style property.');
          }
          throw new TypeError("Expected a string.");
        }
        getPrefixedCssProperty.clearCache = function() {
          return properties = {};
        };
        return getPrefixedCssProperty;
      }();
      function style(element) {
        var computed = window.getComputedStyle(element.node);
        var position = computed.position;
        var config2 = element.config;
        var inline = {};
        var inlineStyle = element.node.getAttribute("style") || "";
        var inlineMatch = inlineStyle.match(/[\w-]+\s*:\s*[^;]+\s*/gi) || [];
        inline.computed = inlineMatch ? inlineMatch.map(function(m) {
          return m.trim();
        }).join("; ") + ";" : "";
        inline.generated = inlineMatch.some(function(m) {
          return m.match(/visibility\s?:\s?visible/i);
        }) ? inline.computed : inlineMatch.concat(["visibility: visible"]).map(function(m) {
          return m.trim();
        }).join("; ") + ";";
        var computedOpacity = parseFloat(computed.opacity);
        var configOpacity = !isNaN(parseFloat(config2.opacity)) ? parseFloat(config2.opacity) : parseFloat(computed.opacity);
        var opacity = {
          computed: computedOpacity !== configOpacity ? "opacity: " + computedOpacity + ";" : "",
          generated: computedOpacity !== configOpacity ? "opacity: " + configOpacity + ";" : ""
        };
        var transformations = [];
        if (parseFloat(config2.distance)) {
          var axis = config2.origin === "top" || config2.origin === "bottom" ? "Y" : "X";
          var distance = config2.distance;
          if (config2.origin === "top" || config2.origin === "left") {
            distance = /^-/.test(distance) ? distance.substr(1) : "-" + distance;
          }
          var ref = distance.match(/(^-?\d+\.?\d?)|(em$|px$|%$)/g);
          var value = ref[0];
          var unit = ref[1];
          switch (unit) {
            case "em":
              distance = parseInt(computed.fontSize) * value;
              break;
            case "px":
              distance = value;
              break;
            case "%":
              distance = axis === "Y" ? element.node.getBoundingClientRect().height * value / 100 : element.node.getBoundingClientRect().width * value / 100;
              break;
            default:
              throw new RangeError("Unrecognized or missing distance unit.");
          }
          if (axis === "Y") {
            transformations.push(translateY(distance));
          } else {
            transformations.push(translateX(distance));
          }
        }
        if (config2.rotate.x) {
          transformations.push(rotateX(config2.rotate.x));
        }
        if (config2.rotate.y) {
          transformations.push(rotateY(config2.rotate.y));
        }
        if (config2.rotate.z) {
          transformations.push(rotateZ(config2.rotate.z));
        }
        if (config2.scale !== 1) {
          if (config2.scale === 0) {
            transformations.push(scale(2e-4));
          } else {
            transformations.push(scale(config2.scale));
          }
        }
        var transform = {};
        if (transformations.length) {
          transform.property = getPrefixedCssProp("transform");
          transform.computed = {
            raw: computed[transform.property],
            matrix: parse(computed[transform.property])
          };
          transformations.unshift(transform.computed.matrix);
          var product = transformations.reduce(multiply);
          transform.generated = {
            initial: transform.property + ": matrix3d(" + product.join(", ") + ");",
            final: transform.property + ": matrix3d(" + transform.computed.matrix.join(", ") + ");"
          };
        } else {
          transform.generated = {
            initial: "",
            final: ""
          };
        }
        var transition = {};
        if (opacity.generated || transform.generated.initial) {
          transition.property = getPrefixedCssProp("transition");
          transition.computed = computed[transition.property];
          transition.fragments = [];
          var delay = config2.delay;
          var duration = config2.duration;
          var easing = config2.easing;
          if (opacity.generated) {
            transition.fragments.push({
              delayed: "opacity " + duration / 1e3 + "s " + easing + " " + delay / 1e3 + "s",
              instant: "opacity " + duration / 1e3 + "s " + easing + " 0s"
            });
          }
          if (transform.generated.initial) {
            transition.fragments.push({
              delayed: transform.property + " " + duration / 1e3 + "s " + easing + " " + delay / 1e3 + "s",
              instant: transform.property + " " + duration / 1e3 + "s " + easing + " 0s"
            });
          }
          var hasCustomTransition = transition.computed && !transition.computed.match(/all 0s|none 0s/);
          if (hasCustomTransition) {
            transition.fragments.unshift({
              delayed: transition.computed,
              instant: transition.computed
            });
          }
          var composed = transition.fragments.reduce(function(composition, fragment, i) {
            composition.delayed += i === 0 ? fragment.delayed : ", " + fragment.delayed;
            composition.instant += i === 0 ? fragment.instant : ", " + fragment.instant;
            return composition;
          }, {
            delayed: "",
            instant: ""
          });
          transition.generated = {
            delayed: transition.property + ": " + composed.delayed + ";",
            instant: transition.property + ": " + composed.instant + ";"
          };
        } else {
          transition.generated = {
            delayed: "",
            instant: ""
          };
        }
        return {
          inline,
          opacity,
          position,
          transform,
          transition
        };
      }
      function applyStyle(el, declaration) {
        declaration.split(";").forEach(function(pair) {
          var ref = pair.split(":");
          var property = ref[0];
          var value = ref.slice(1);
          if (property && value) {
            el.style[property.trim()] = value.join(":");
          }
        });
      }
      function clean(target) {
        var this$1 = this;
        var dirty;
        try {
          each(tealight(target), function(node) {
            var id = node.getAttribute("data-sr-id");
            if (id !== null) {
              dirty = true;
              var element = this$1.store.elements[id];
              if (element.callbackTimer) {
                window.clearTimeout(element.callbackTimer.clock);
              }
              applyStyle(element.node, element.styles.inline.generated);
              node.removeAttribute("data-sr-id");
              delete this$1.store.elements[id];
            }
          });
        } catch (e) {
          return logger.call(this, "Clean failed.", e.message);
        }
        if (dirty) {
          try {
            rinse.call(this);
          } catch (e) {
            return logger.call(this, "Clean failed.", e.message);
          }
        }
      }
      function destroy() {
        var this$1 = this;
        each(this.store.elements, function(element) {
          applyStyle(element.node, element.styles.inline.generated);
          element.node.removeAttribute("data-sr-id");
        });
        each(this.store.containers, function(container) {
          var target = container.node === document.documentElement ? window : container.node;
          target.removeEventListener("scroll", this$1.delegate);
          target.removeEventListener("resize", this$1.delegate);
        });
        this.store = {
          containers: {},
          elements: {},
          history: [],
          sequences: {}
        };
      }
      function deepAssign(target) {
        var sources = [], len = arguments.length - 1;
        while (len-- > 0)
          sources[len] = arguments[len + 1];
        if (isObject(target)) {
          each(sources, function(source) {
            each(source, function(data, key) {
              if (isObject(data)) {
                if (!target[key] || !isObject(target[key])) {
                  target[key] = {};
                }
                deepAssign(target[key], data);
              } else {
                target[key] = data;
              }
            });
          });
          return target;
        } else {
          throw new TypeError("Target must be an object literal.");
        }
      }
      function isMobile(agent) {
        if (agent === void 0)
          agent = navigator.userAgent;
        return /Android|iPhone|iPad|iPod/i.test(agent);
      }
      var nextUniqueId = function() {
        var uid = 0;
        return function() {
          return uid++;
        };
      }();
      function initialize() {
        var this$1 = this;
        rinse.call(this);
        each(this.store.elements, function(element) {
          var styles = [element.styles.inline.generated];
          if (element.visible) {
            styles.push(element.styles.opacity.computed);
            styles.push(element.styles.transform.generated.final);
            element.revealed = true;
          } else {
            styles.push(element.styles.opacity.generated);
            styles.push(element.styles.transform.generated.initial);
            element.revealed = false;
          }
          applyStyle(element.node, styles.filter(function(s2) {
            return s2 !== "";
          }).join(" "));
        });
        each(this.store.containers, function(container) {
          var target = container.node === document.documentElement ? window : container.node;
          target.addEventListener("scroll", this$1.delegate);
          target.addEventListener("resize", this$1.delegate);
        });
        this.delegate();
        this.initTimeout = null;
      }
      function animate(element, force) {
        if (force === void 0)
          force = {};
        var pristine = force.pristine || this.pristine;
        var delayed = element.config.useDelay === "always" || element.config.useDelay === "onload" && pristine || element.config.useDelay === "once" && !element.seen;
        var shouldReveal = element.visible && !element.revealed;
        var shouldReset = !element.visible && element.revealed && element.config.reset;
        if (force.reveal || shouldReveal) {
          return triggerReveal.call(this, element, delayed);
        }
        if (force.reset || shouldReset) {
          return triggerReset.call(this, element);
        }
      }
      function triggerReveal(element, delayed) {
        var styles = [
          element.styles.inline.generated,
          element.styles.opacity.computed,
          element.styles.transform.generated.final
        ];
        if (delayed) {
          styles.push(element.styles.transition.generated.delayed);
        } else {
          styles.push(element.styles.transition.generated.instant);
        }
        element.revealed = element.seen = true;
        applyStyle(element.node, styles.filter(function(s2) {
          return s2 !== "";
        }).join(" "));
        registerCallbacks.call(this, element, delayed);
      }
      function triggerReset(element) {
        var styles = [
          element.styles.inline.generated,
          element.styles.opacity.generated,
          element.styles.transform.generated.initial,
          element.styles.transition.generated.instant
        ];
        element.revealed = false;
        applyStyle(element.node, styles.filter(function(s2) {
          return s2 !== "";
        }).join(" "));
        registerCallbacks.call(this, element);
      }
      function registerCallbacks(element, isDelayed) {
        var this$1 = this;
        var duration = isDelayed ? element.config.duration + element.config.delay : element.config.duration;
        var beforeCallback = element.revealed ? element.config.beforeReveal : element.config.beforeReset;
        var afterCallback = element.revealed ? element.config.afterReveal : element.config.afterReset;
        var elapsed = 0;
        if (element.callbackTimer) {
          elapsed = Date.now() - element.callbackTimer.start;
          window.clearTimeout(element.callbackTimer.clock);
        }
        beforeCallback(element.node);
        element.callbackTimer = {
          start: Date.now(),
          clock: window.setTimeout(function() {
            afterCallback(element.node);
            element.callbackTimer = null;
            if (element.revealed && !element.config.reset && element.config.cleanup) {
              clean.call(this$1, element.node);
            }
          }, duration - elapsed)
        };
      }
      function sequence(element, pristine) {
        if (pristine === void 0)
          pristine = this.pristine;
        if (!element.visible && element.revealed && element.config.reset) {
          return animate.call(this, element, { reset: true });
        }
        var seq = this.store.sequences[element.sequence.id];
        var i = element.sequence.index;
        if (seq) {
          var visible = new SequenceModel(seq, "visible", this.store);
          var revealed = new SequenceModel(seq, "revealed", this.store);
          seq.models = { visible, revealed };
          if (!revealed.body.length) {
            var nextId = seq.members[visible.body[0]];
            var nextElement = this.store.elements[nextId];
            if (nextElement) {
              cue.call(this, seq, visible.body[0], -1, pristine);
              cue.call(this, seq, visible.body[0], 1, pristine);
              return animate.call(this, nextElement, { reveal: true, pristine });
            }
          }
          if (!seq.blocked.head && i === [].concat(revealed.head).pop() && i >= [].concat(visible.body).shift()) {
            cue.call(this, seq, i, -1, pristine);
            return animate.call(this, element, { reveal: true, pristine });
          }
          if (!seq.blocked.foot && i === [].concat(revealed.foot).shift() && i <= [].concat(visible.body).pop()) {
            cue.call(this, seq, i, 1, pristine);
            return animate.call(this, element, { reveal: true, pristine });
          }
        }
      }
      function Sequence(interval) {
        var i = Math.abs(interval);
        if (!isNaN(i)) {
          this.id = nextUniqueId();
          this.interval = Math.max(i, 16);
          this.members = [];
          this.models = {};
          this.blocked = {
            head: false,
            foot: false
          };
        } else {
          throw new RangeError("Invalid sequence interval.");
        }
      }
      function SequenceModel(seq, prop, store) {
        var this$1 = this;
        this.head = [];
        this.body = [];
        this.foot = [];
        each(seq.members, function(id, index2) {
          var element = store.elements[id];
          if (element && element[prop]) {
            this$1.body.push(index2);
          }
        });
        if (this.body.length) {
          each(seq.members, function(id, index2) {
            var element = store.elements[id];
            if (element && !element[prop]) {
              if (index2 < this$1.body[0]) {
                this$1.head.push(index2);
              } else {
                this$1.foot.push(index2);
              }
            }
          });
        }
      }
      function cue(seq, i, direction, pristine) {
        var this$1 = this;
        var blocked = ["head", null, "foot"][1 + direction];
        var nextId = seq.members[i + direction];
        var nextElement = this.store.elements[nextId];
        seq.blocked[blocked] = true;
        setTimeout(function() {
          seq.blocked[blocked] = false;
          if (nextElement) {
            sequence.call(this$1, nextElement, pristine);
          }
        }, seq.interval);
      }
      function reveal(target, options2, syncing) {
        var this$1 = this;
        if (options2 === void 0)
          options2 = {};
        if (syncing === void 0)
          syncing = false;
        var containerBuffer = [];
        var sequence$$1;
        var interval = options2.interval || defaults.interval;
        try {
          if (interval) {
            sequence$$1 = new Sequence(interval);
          }
          var nodes = tealight(target);
          if (!nodes.length) {
            throw new Error("Invalid reveal target.");
          }
          var elements = nodes.reduce(function(elementBuffer, elementNode) {
            var element = {};
            var existingId = elementNode.getAttribute("data-sr-id");
            if (existingId) {
              deepAssign(element, this$1.store.elements[existingId]);
              applyStyle(element.node, element.styles.inline.computed);
            } else {
              element.id = nextUniqueId();
              element.node = elementNode;
              element.seen = false;
              element.revealed = false;
              element.visible = false;
            }
            var config2 = deepAssign({}, element.config || this$1.defaults, options2);
            if (!config2.mobile && isMobile() || !config2.desktop && !isMobile()) {
              if (existingId) {
                clean.call(this$1, element);
              }
              return elementBuffer;
            }
            var containerNode = tealight(config2.container)[0];
            if (!containerNode) {
              throw new Error("Invalid container.");
            }
            if (!containerNode.contains(elementNode)) {
              return elementBuffer;
            }
            var containerId;
            {
              containerId = getContainerId(containerNode, containerBuffer, this$1.store.containers);
              if (containerId === null) {
                containerId = nextUniqueId();
                containerBuffer.push({ id: containerId, node: containerNode });
              }
            }
            element.config = config2;
            element.containerId = containerId;
            element.styles = style(element);
            if (sequence$$1) {
              element.sequence = {
                id: sequence$$1.id,
                index: sequence$$1.members.length
              };
              sequence$$1.members.push(element.id);
            }
            elementBuffer.push(element);
            return elementBuffer;
          }, []);
          each(elements, function(element) {
            this$1.store.elements[element.id] = element;
            element.node.setAttribute("data-sr-id", element.id);
          });
        } catch (e) {
          return logger.call(this, "Reveal failed.", e.message);
        }
        each(containerBuffer, function(container) {
          this$1.store.containers[container.id] = {
            id: container.id,
            node: container.node
          };
        });
        if (sequence$$1) {
          this.store.sequences[sequence$$1.id] = sequence$$1;
        }
        if (syncing !== true) {
          this.store.history.push({ target, options: options2 });
          if (this.initTimeout) {
            window.clearTimeout(this.initTimeout);
          }
          this.initTimeout = window.setTimeout(initialize.bind(this), 0);
        }
      }
      function getContainerId(node) {
        var collections = [], len = arguments.length - 1;
        while (len-- > 0)
          collections[len] = arguments[len + 1];
        var id = null;
        each(collections, function(collection) {
          each(collection, function(container) {
            if (id === null && container.node === node) {
              id = container.id;
            }
          });
        });
        return id;
      }
      function sync() {
        var this$1 = this;
        each(this.store.history, function(record) {
          reveal.call(this$1, record.target, record.options, true);
        });
        initialize.call(this);
      }
      var polyfill = function(x) {
        return (x > 0) - (x < 0) || +x;
      };
      var mathSign = Math.sign || polyfill;
      var polyfill$1 = function() {
        var clock = Date.now();
        return function(callback) {
          var currentTime = Date.now();
          if (currentTime - clock > 16) {
            clock = currentTime;
            callback(currentTime);
          } else {
            setTimeout(function() {
              return polyfill$1(callback);
            }, 0);
          }
        };
      }();
      var miniraf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || polyfill$1;
      function getGeometry(target, isContainer) {
        var height = isContainer ? target.node.clientHeight : target.node.offsetHeight;
        var width = isContainer ? target.node.clientWidth : target.node.offsetWidth;
        var offsetTop = 0;
        var offsetLeft = 0;
        var node = target.node;
        do {
          if (!isNaN(node.offsetTop)) {
            offsetTop += node.offsetTop;
          }
          if (!isNaN(node.offsetLeft)) {
            offsetLeft += node.offsetLeft;
          }
          node = node.offsetParent;
        } while (node);
        return {
          bounds: {
            top: offsetTop,
            right: offsetLeft + width,
            bottom: offsetTop + height,
            left: offsetLeft
          },
          height,
          width
        };
      }
      function getScrolled(container) {
        var top, left;
        if (container.node === document.documentElement) {
          top = window.pageYOffset;
          left = window.pageXOffset;
        } else {
          top = container.node.scrollTop;
          left = container.node.scrollLeft;
        }
        return { top, left };
      }
      function isElementVisible(element) {
        if (element === void 0)
          element = {};
        var container = this.store.containers[element.containerId];
        if (!container) {
          return;
        }
        var viewFactor = Math.max(0, Math.min(1, element.config.viewFactor));
        var viewOffset = element.config.viewOffset;
        var elementBounds = {
          top: element.geometry.bounds.top + element.geometry.height * viewFactor,
          right: element.geometry.bounds.right - element.geometry.width * viewFactor,
          bottom: element.geometry.bounds.bottom - element.geometry.height * viewFactor,
          left: element.geometry.bounds.left + element.geometry.width * viewFactor
        };
        var containerBounds = {
          top: container.geometry.bounds.top + container.scroll.top + viewOffset.top,
          right: container.geometry.bounds.right + container.scroll.left - viewOffset.right,
          bottom: container.geometry.bounds.bottom + container.scroll.top - viewOffset.bottom,
          left: container.geometry.bounds.left + container.scroll.left + viewOffset.left
        };
        return elementBounds.top < containerBounds.bottom && elementBounds.right > containerBounds.left && elementBounds.bottom > containerBounds.top && elementBounds.left < containerBounds.right || element.styles.position === "fixed";
      }
      function delegate(event, elements) {
        var this$1 = this;
        if (event === void 0)
          event = { type: "init" };
        if (elements === void 0)
          elements = this.store.elements;
        miniraf(function() {
          var stale = event.type === "init" || event.type === "resize";
          each(this$1.store.containers, function(container) {
            if (stale) {
              container.geometry = getGeometry.call(this$1, container, true);
            }
            var scroll = getScrolled.call(this$1, container);
            if (container.scroll) {
              container.direction = {
                x: mathSign(scroll.left - container.scroll.left),
                y: mathSign(scroll.top - container.scroll.top)
              };
            }
            container.scroll = scroll;
          });
          each(elements, function(element) {
            if (stale || element.geometry === void 0) {
              element.geometry = getGeometry.call(this$1, element);
            }
            element.visible = isElementVisible.call(this$1, element);
          });
          each(elements, function(element) {
            if (element.sequence) {
              sequence.call(this$1, element);
            } else {
              animate.call(this$1, element);
            }
          });
          this$1.pristine = false;
        });
      }
      function isTransformSupported() {
        var style2 = document.documentElement.style;
        return "transform" in style2 || "WebkitTransform" in style2;
      }
      function isTransitionSupported() {
        var style2 = document.documentElement.style;
        return "transition" in style2 || "WebkitTransition" in style2;
      }
      var version = "4.0.9";
      var boundDelegate;
      var boundDestroy;
      var boundReveal;
      var boundClean;
      var boundSync;
      var config;
      var debug;
      var instance;
      function ScrollReveal(options2) {
        if (options2 === void 0)
          options2 = {};
        var invokedWithoutNew = typeof this === "undefined" || Object.getPrototypeOf(this) !== ScrollReveal.prototype;
        if (invokedWithoutNew) {
          return new ScrollReveal(options2);
        }
        if (!ScrollReveal.isSupported()) {
          logger.call(this, "Instantiation failed.", "This browser is not supported.");
          return mount.failure();
        }
        var buffer;
        try {
          buffer = config ? deepAssign({}, config, options2) : deepAssign({}, defaults, options2);
        } catch (e) {
          logger.call(this, "Invalid configuration.", e.message);
          return mount.failure();
        }
        try {
          var container = tealight(buffer.container)[0];
          if (!container) {
            throw new Error("Invalid container.");
          }
        } catch (e) {
          logger.call(this, e.message);
          return mount.failure();
        }
        config = buffer;
        if (!config.mobile && isMobile() || !config.desktop && !isMobile()) {
          logger.call(this, "This device is disabled.", "desktop: " + config.desktop, "mobile: " + config.mobile);
          return mount.failure();
        }
        mount.success();
        this.store = {
          containers: {},
          elements: {},
          history: [],
          sequences: {}
        };
        this.pristine = true;
        boundDelegate = boundDelegate || delegate.bind(this);
        boundDestroy = boundDestroy || destroy.bind(this);
        boundReveal = boundReveal || reveal.bind(this);
        boundClean = boundClean || clean.bind(this);
        boundSync = boundSync || sync.bind(this);
        Object.defineProperty(this, "delegate", { get: function() {
          return boundDelegate;
        } });
        Object.defineProperty(this, "destroy", { get: function() {
          return boundDestroy;
        } });
        Object.defineProperty(this, "reveal", { get: function() {
          return boundReveal;
        } });
        Object.defineProperty(this, "clean", { get: function() {
          return boundClean;
        } });
        Object.defineProperty(this, "sync", { get: function() {
          return boundSync;
        } });
        Object.defineProperty(this, "defaults", { get: function() {
          return config;
        } });
        Object.defineProperty(this, "version", { get: function() {
          return version;
        } });
        Object.defineProperty(this, "noop", { get: function() {
          return false;
        } });
        return instance ? instance : instance = this;
      }
      ScrollReveal.isSupported = function() {
        return isTransformSupported() && isTransitionSupported();
      };
      Object.defineProperty(ScrollReveal, "debug", {
        get: function() {
          return debug || false;
        },
        set: function(value) {
          return debug = typeof value === "boolean" ? value : debug;
        }
      });
      ScrollReveal();
      return ScrollReveal;
    });
  }
});

// .svelte-kit/vercel/entry.js
__export(exports, {
  default: () => entry_default
});
init_shims();

// node_modules/@sveltejs/kit/dist/node.js
init_shims();

// node_modules/@sveltejs/kit/dist/adapter-utils.js
init_shims();
function isContentTypeTextual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}

// node_modules/@sveltejs/kit/dist/node.js
function getRawBody(req) {
  return new Promise((fulfil, reject) => {
    const h = req.headers;
    if (!h["content-type"]) {
      return fulfil("");
    }
    req.on("error", reject);
    const length = Number(h["content-length"]);
    if (isNaN(length) && h["transfer-encoding"] == null) {
      return fulfil("");
    }
    let data = new Uint8Array(length || 0);
    if (length > 0) {
      let offset = 0;
      req.on("data", (chunk) => {
        const new_len = offset + Buffer.byteLength(chunk);
        if (new_len > length) {
          return reject({
            status: 413,
            reason: 'Exceeded "Content-Length" limit'
          });
        }
        data.set(chunk, offset);
        offset = new_len;
      });
    } else {
      req.on("data", (chunk) => {
        const new_data = new Uint8Array(data.length + chunk.length);
        new_data.set(data, 0);
        new_data.set(chunk, data.length);
        data = new_data;
      });
    }
    req.on("end", () => {
      const [type] = (h["content-type"] || "").split(/;\s*/);
      if (isContentTypeTextual(type)) {
        const encoding = h["content-encoding"] || "utf-8";
        return fulfil(new TextDecoder(encoding).decode(data));
      }
      fulfil(data);
    });
  });
}

// .svelte-kit/output/server/app.js
init_shims();

// node_modules/@sveltejs/kit/dist/ssr.js
init_shims();
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
async function render_endpoint(request, route, match) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler) {
    return;
  }
  const params = route.params(match);
  const response = await handler({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return;
  }
  if (typeof response !== "object") {
    return error(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = headers["content-type"];
  const is_type_textual = isContentTypeTextual(type);
  if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
    return error(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
  } else {
    normalized_body = body;
  }
  return { status, body: normalized_body, headers };
}
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
Promise.resolve();
var subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
var s$1 = JSON.stringify;
async function render_response({
  branch,
  options: options2,
  $session,
  page_config,
  status,
  error: error3,
  page
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error3) {
    error3.stack = options2.get_stack(error3);
  }
  if (page_config.ssr) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error4) => {
      throw new Error(`Failed to serialize session data: ${error4.message}`);
    })},
				host: ${page && page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error3)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page && page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page && page.path)},
						query: new URLSearchParams(${page ? s$1(page.query.toString()) : ""}),
						params: ${page && s$1(page.params)}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url="${url}"`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error3) {
  if (!error3)
    return null;
  let serialized = try_serialize(error3);
  if (!serialized) {
    const { name, message, stack } = error3;
    serialized = try_serialize({ ...error3, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  const has_error_status = loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
  if (loaded.error || has_error_status) {
    const status = loaded.status;
    if (!loaded.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error3 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    if (!(error3 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error3}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error3 };
    }
    return { status, error: error3 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
var s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  context,
  prerender_enabled,
  is_leaf,
  is_error,
  status,
  error: error3
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded;
  const page_proxy = new Proxy(page, {
    get: (target, prop, receiver) => {
      if (prop === "query" && prerender_enabled) {
        throw new Error("Cannot access query on a page with prerendering enabled");
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  if (module2.load) {
    const load_input = {
      page: page_proxy,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url.split("?")[0]);
        let response;
        const filename = resolved.replace(options2.paths.assets, "").slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? { "content-type": asset.type } : {}
          }) : await fetch(`http://${page.host}/${asset.file}`, opts);
        } else if (resolved.startsWith("/") && !resolved.startsWith("//")) {
          const relative = resolved;
          const headers = { ...opts.headers };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body,
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url, opts);
          response = await options2.hooks.serverFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape(body)}}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: { ...context }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error3;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  if (!loaded) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    uses_credentials
  };
}
var escaped = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped) {
      result += escaped[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
var absolute = /^([a-z]+:)?\/?\//;
function resolve(base2, path) {
  const base_match = absolute.exec(base2);
  const path_match = absolute.exec(path);
  if (!base_match) {
    throw new Error(`bad base path: "${base2}"`);
  }
  const baseparts = path_match ? [] : base2.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path.slice(path_match[0].length).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
function coalesce_to_error(err) {
  return err instanceof Error ? err : new Error(JSON.stringify(err));
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error3 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    context: {},
    prerender_enabled: is_prerender_enabled(options2, default_error, state),
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      context: loaded ? loaded.context : {},
      prerender_enabled: is_prerender_enabled(options2, default_error, state),
      is_leaf: false,
      is_error: true,
      status,
      error: error3
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error3,
      branch,
      page
    });
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4, request);
    return {
      status: 500,
      headers: {},
      body: error4.stack
    };
  }
}
function is_prerender_enabled(options2, node, state) {
  return options2.prerender && (!!node.module.prerender || !!state.prerender && state.prerender.all);
}
async function respond$1(opts) {
  const { request, options: options2, state, $session, route } = opts;
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id ? options2.load_component(id) : void 0));
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4, request);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  let page_config = get_page_config(leaf, options2);
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {},
      body: ""
    };
  }
  let branch = [];
  let status = 200;
  let error3;
  ssr:
    if (page_config.ssr) {
      let context = {};
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              ...opts,
              node,
              context,
              prerender_enabled: is_prerender_enabled(options2, node, state),
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            if (loaded.loaded.redirect) {
              return {
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              };
            }
            if (loaded.loaded.error) {
              ({ status, error: error3 } = loaded.loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e, request);
            status = 500;
            error3 = e;
          }
          if (loaded && !error3) {
            branch.push(loaded);
          }
          if (error3) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  const error_loaded = await load_node({
                    ...opts,
                    node: error_node,
                    context: node_loaded.context,
                    prerender_enabled: is_prerender_enabled(options2, error_node, state),
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error3
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  page_config = get_page_config(error_node.module, options2);
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e = coalesce_to_error(err);
                  options2.handle_error(e, request);
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error3
            });
          }
        }
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      ...opts,
      page_config,
      status,
      error: error3,
      branch: branch.filter(Boolean)
    });
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4, request);
    return await respond_with_error({
      ...opts,
      status: 500,
      error: error4
    });
  }
}
function get_page_config(leaf, options2) {
  return {
    ssr: "ssr" in leaf ? !!leaf.ssr : options2.ssr,
    router: "router" in leaf ? !!leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? !!leaf.hydrate : options2.hydrate
  };
}
async function render_page(request, route, match, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  const $session = await options2.hooks.getSession(request);
  const response = await respond$1({
    request,
    options: options2,
    state,
    $session,
    route,
    page
  });
  if (response) {
    return response;
  }
  if (state.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
var ReadOnlyFormData = class {
  #map;
  constructor(map) {
    this.#map = map;
  }
  get(key) {
    const value = this.#map.get(key);
    return value && value[0];
  }
  getAll(key) {
    return this.#map.get(key);
  }
  has(key) {
    return this.#map.has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key] of this.#map)
      yield key;
  }
  *values() {
    for (const [, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield value[i];
      }
    }
  }
};
function parse_body(raw, headers) {
  if (!raw || typeof raw !== "string")
    return raw;
  const [type, ...directives] = headers["content-type"].split(/;\s*/);
  switch (type) {
    case "text/plain":
      return raw;
    case "application/json":
      return JSON.parse(raw);
    case "application/x-www-form-urlencoded":
      return get_urlencoded(raw);
    case "multipart/form-data": {
      const boundary = directives.find((directive) => directive.startsWith("boundary="));
      if (!boundary)
        throw new Error("Missing boundary");
      return get_multipart(raw, boundary.slice("boundary=".length));
    }
    default:
      throw new Error(`Invalid Content-Type ${type}`);
  }
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    const headers = {};
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      headers[name] = value;
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: options2.paths.base + path + (q ? `?${q}` : "")
        }
      };
    }
  }
  const headers = lowercase_keys(incoming.headers);
  const request = {
    ...incoming,
    headers,
    body: parse_body(incoming.rawBody, headers),
    params: {},
    locals: {}
  };
  try {
    return await options2.hooks.handle({
      request,
      resolve: async (request2) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request2),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            branch: []
          });
        }
        const decoded = decodeURI(request2.path);
        for (const route of options2.manifest.routes) {
          const match = route.pattern.exec(decoded);
          if (!match)
            continue;
          const response = route.type === "endpoint" ? await render_endpoint(request2, route, match) : await render_page(request2, route, match, options2, state);
          if (response) {
            if (response.status === 200) {
              if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
                const etag = `"${hash(response.body || "")}"`;
                if (request2.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: ""
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        const $session = await options2.hooks.getSession(request2);
        return await respond_with_error({
          request: request2,
          options: options2,
          state,
          $session,
          status: 404,
          error: new Error(`Not found: ${request2.path}`)
        });
      }
    });
  } catch (err) {
    const e = coalesce_to_error(err);
    options2.handle_error(e, request);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}

// .svelte-kit/output/server/app.js
var import_emailjs_com = __toModule(require_cjs());
var import_scrollreveal = __toModule(require_scrollreveal());
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
Promise.resolve();
var escaped2 = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape2(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped2[match]);
}
var missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
var on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape2(value)) : `"${value}"`}`}`;
}
function afterUpdate() {
}
var css$1 = {
  code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AAsDC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page } = $$props;
  let { components } = $$props;
  let { props_0 = null } = $$props;
  let { props_1 = null } = $$props;
  let { props_2 = null } = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css$1);
  {
    stores.page.set(page);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${``}`;
});
var base = "";
var assets = "";
function set_paths(paths) {
  base = paths.base;
  assets = paths.assets || base;
}
function set_prerendering(value) {
}
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
var template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.png" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n		<link href="https://unpkg.com/boxicons@2.0.7/css/boxicons.min.css" rel="stylesheet">\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + `</div>
	<script>


		/*===== MENU SHOW =====*/
		const showMenu = (toggleId, navId) =>{
			const toggle = document.getElementById(toggleId),
				nav = document.getElementById(navId)

			if(toggle && nav){
				toggle.addEventListener('click', ()=>{
					nav.classList.toggle('show')
				})
			}
		}
		showMenu('nav-toggle','nav-menu')
		showMenu('podcast-toggle','podcast-menu')

		/*===== ACTIVE AND REMOVE MENU =====*/
		const navLink = document.querySelectorAll('.nav__link');
		const podcastLink = document.querySelectorAll('.podcast__link');

		function linkAction(){


			/*Active link*/
			navLink.forEach(n => n.classList.remove('active'));
			podcastLink.forEach(n => n.classList.remove('active'));
			this.classList.add('active');

			/*Remove menu mobile*/
			const navMenu = document.getElementById('nav-menu')
			const podcastMenu = document.getElementById('podcast-menu')

			podcastMenu.classList.remove('show')
			navMenu.classList.remove('show')
		}
		podcastLink.forEach(n => n.addEventListener('click', linkAction));
		navLink.forEach(n => n.addEventListener('click', linkAction));


		window.FontAwesomeKitConfig = {"asyncLoading":{"enabled":true},"autoA11y":{"enabled":true},"baseUrl":"https://ka-f.fontawesome.com","baseUrlKit":"https://kit.fontawesome.com","detectConflictsUntil":null,"iconUploads":{},"id":33820844,"license":"pro","method":"js","minify":{"enabled":true},"token":"182f39d401","v4FontFaceShim":{"enabled":true},"v4shim":{"enabled":true},"version":"6.0.0-beta1"};
		!function(t){"function"==typeof define&&define.amd?define("kit-loader",t):t()}((function(){"use strict";function t(e){return(t="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(e)}function e(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function n(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,r)}return n}function r(t){for(var r=1;r<arguments.length;r++){var o=null!=arguments[r]?arguments[r]:{};r%2?n(Object(o),!0).forEach((function(n){e(t,n,o[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(o)):n(Object(o)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(o,e))}))}return t}function o(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){if("undefined"==typeof Symbol||!(Symbol.iterator in Object(t)))return;var n=[],r=!0,o=!1,i=void 0;try{for(var c,a=t[Symbol.iterator]();!(r=(c=a.next()).done)&&(n.push(c.value),!e||n.length!==e);r=!0);}catch(t){o=!0,i=t}finally{try{r||null==a.return||a.return()}finally{if(o)throw i}}return n}(t,e)||function(t,e){if(!t)return;if("string"==typeof t)return i(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);"Object"===n&&t.constructor&&(n=t.constructor.name);if("Map"===n||"Set"===n)return Array.from(t);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return i(t,e)}(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function i(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=new Array(e);n<e;n++)r[n]=t[n];return r}function c(t,e){var n=e&&e.addOn||"",r=e&&e.baseFilename||t.license+n,o=e&&e.minify?".min":"",i=e&&e.fileSuffix||t.method,c=e&&e.subdir||t.method;return t.baseUrl+"/releases/"+("latest"===t.version?"latest":"v".concat(t.version))+"/"+c+"/"+r+o+"."+i}function a(t){return t.baseUrlKit+"/"+t.token+"/"+t.id+"/kit-upload.css"}function u(t,e){var n=e||["fa"],r="."+Array.prototype.join.call(n,",."),o=t.querySelectorAll(r);Array.prototype.forEach.call(o,(function(e){var n=e.getAttribute("title");e.setAttribute("aria-hidden","true");var r=!e.nextElementSibling||!e.nextElementSibling.classList.contains("sr-only");if(n&&r){var o=t.createElement("span");o.innerHTML=n,o.classList.add("sr-only"),e.parentNode.insertBefore(o,e.nextSibling)}}))}var f,s=function(){},d="undefined"!=typeof global&&void 0!==global.process&&"function"==typeof global.process.emit,l="undefined"==typeof setImmediate?setTimeout:setImmediate,h=[];function m(){for(var t=0;t<h.length;t++)h[t][0](h[t][1]);h=[],f=!1}function p(t,e){h.push([t,e]),f||(f=!0,l(m,0))}function y(t){var e=t.owner,n=e._state,r=e._data,o=t[n],i=t.then;if("function"==typeof o){n="fulfilled";try{r=o(r)}catch(t){w(i,t)}}b(i,r)||("fulfilled"===n&&v(i,r),"rejected"===n&&w(i,r))}function b(e,n){var r;try{if(e===n)throw new TypeError("A promises callback cannot return that same promise.");if(n&&("function"==typeof n||"object"===t(n))){var o=n.then;if("function"==typeof o)return o.call(n,(function(t){r||(r=!0,n===t?g(e,t):v(e,t))}),(function(t){r||(r=!0,w(e,t))})),!0}}catch(t){return r||w(e,t),!0}return!1}function v(t,e){t!==e&&b(t,e)||g(t,e)}function g(t,e){"pending"===t._state&&(t._state="settled",t._data=e,p(S,t))}function w(t,e){"pending"===t._state&&(t._state="settled",t._data=e,p(O,t))}function A(t){t._then=t._then.forEach(y)}function S(t){t._state="fulfilled",A(t)}function O(t){t._state="rejected",A(t),!t._handled&&d&&global.process.emit("unhandledRejection",t._data,t)}function j(t){global.process.emit("rejectionHandled",t)}function E(t){if("function"!=typeof t)throw new TypeError("Promise resolver "+t+" is not a function");if(this instanceof E==!1)throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");this._then=[],function(t,e){function n(t){w(e,t)}try{t((function(t){v(e,t)}),n)}catch(t){n(t)}}(t,this)}E.prototype={constructor:E,_state:"pending",_then:null,_data:void 0,_handled:!1,then:function(t,e){var n={owner:this,then:new this.constructor(s),fulfilled:t,rejected:e};return!e&&!t||this._handled||(this._handled=!0,"rejected"===this._state&&d&&p(j,this)),"fulfilled"===this._state||"rejected"===this._state?p(y,n):this._then.push(n),n.then},catch:function(t){return this.then(null,t)}},E.all=function(t){if(!Array.isArray(t))throw new TypeError("You must pass an array to Promise.all().");return new E((function(e,n){var r=[],o=0;function i(t){return o++,function(n){r[t]=n,--o||e(r)}}for(var c,a=0;a<t.length;a++)(c=t[a])&&"function"==typeof c.then?c.then(i(a),n):r[a]=c;o||e(r)}))},E.race=function(t){if(!Array.isArray(t))throw new TypeError("You must pass an array to Promise.race().");return new E((function(e,n){for(var r,o=0;o<t.length;o++)(r=t[o])&&"function"==typeof r.then?r.then(e,n):e(r)}))},E.resolve=function(e){return e&&"object"===t(e)&&e.constructor===E?e:new E((function(t){t(e)}))},E.reject=function(t){return new E((function(e,n){n(t)}))};var _="function"==typeof Promise?Promise:E;function P(t,e){var n=e.fetch,r=e.XMLHttpRequest,o=e.token,i=t;return"URLSearchParams"in window?(i=new URL(t)).searchParams.set("token",o):i=i+"?token="+encodeURIComponent(o),i=i.toString(),new _((function(t,e){if("function"==typeof n)n(i,{mode:"cors",cache:"default"}).then((function(t){if(t.ok)return t.text();throw new Error("")})).then((function(e){t(e)})).catch(e);else if("function"==typeof r){var o=new r;o.addEventListener("loadend",(function(){this.responseText?t(this.responseText):e(new Error(""))}));["abort","error","timeout"].map((function(t){o.addEventListener(t,(function(){e(new Error(""))}))})),o.open("GET",i),o.send()}else{e(new Error(""))}}))}function C(t,e,n){var r=t;return[[/(url\\("?)\\.\\.\\/\\.\\.\\/\\.\\./g,function(t,n){return"".concat(n).concat(e)}],[/(url\\("?)\\.\\.\\/webfonts/g,function(t,r){return"".concat(r).concat(e,"/releases/v").concat(n,"/webfonts")}],[/(url\\("?)https:\\/\\/kit-free([^.])*\\.fontawesome\\.com/g,function(t,n){return"".concat(n).concat(e)}]].forEach((function(t){var e=o(t,2),n=e[0],i=e[1];r=r.replace(n,i)})),r}function F(t,e){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:function(){},o=e.document||o,i=u.bind(u,o,["fa","fab","fas","far","fal","fad","fak"]),f=Object.keys(t.iconUploads||{}).length>0;t.autoA11y.enabled&&n(i);var s=[{id:"fa-main",addOn:void 0}];t.v4shim.enabled&&s.push({id:"fa-v4-shims",addOn:"-v4-shims"}),t.v4FontFaceShim.enabled&&s.push({id:"fa-v4-font-face",addOn:"-v4-font-face"}),f&&s.push({id:"fa-kit-upload",customCss:!0});var d=s.map((function(n){return new _((function(o,i){P(n.customCss?a(t):c(t,{addOn:n.addOn,minify:t.minify.enabled}),e).then((function(i){o(U(i,r(r({},e),{},{baseUrl:t.baseUrl,version:t.version,id:n.id,contentFilter:function(t,e){return C(t,e.baseUrl,e.version)}})))})).catch(i)}))}));return _.all(d)}function U(t,e){var n=e.contentFilter||function(t,e){return t},r=document.createElement("style"),o=document.createTextNode(n(t,e));return r.appendChild(o),r.media="all",e.id&&r.setAttribute("id",e.id),e&&e.detectingConflicts&&e.detectionIgnoreAttr&&r.setAttributeNode(document.createAttribute(e.detectionIgnoreAttr)),r}function k(t,e){e.autoA11y=t.autoA11y.enabled,"pro"===t.license&&(e.autoFetchSvg=!0,e.fetchSvgFrom=t.baseUrl+"/releases/"+("latest"===t.version?"latest":"v".concat(t.version))+"/svgs",e.fetchUploadedSvgFrom=t.uploadsUrl);var n=[];return t.v4shim.enabled&&n.push(new _((function(n,o){P(c(t,{addOn:"-v4-shims",minify:t.minify.enabled}),e).then((function(t){n(I(t,r(r({},e),{},{id:"fa-v4-shims"})))})).catch(o)}))),n.push(new _((function(n,o){P(c(t,{minify:t.minify.enabled}),e).then((function(t){var o=I(t,r(r({},e),{},{id:"fa-main"}));n(function(t,e){var n=e&&void 0!==e.autoFetchSvg?e.autoFetchSvg:void 0,r=e&&void 0!==e.autoA11y?e.autoA11y:void 0;void 0!==r&&t.setAttribute("data-auto-a11y",r?"true":"false");n&&(t.setAttributeNode(document.createAttribute("data-auto-fetch-svg")),t.setAttribute("data-fetch-svg-from",e.fetchSvgFrom),t.setAttribute("data-fetch-uploaded-svg-from",e.fetchUploadedSvgFrom));return t}(o,e))})).catch(o)}))),_.all(n)}function I(t,e){var n=document.createElement("SCRIPT"),r=document.createTextNode(t);return n.appendChild(r),n.referrerPolicy="strict-origin",e.id&&n.setAttribute("id",e.id),e&&e.detectingConflicts&&e.detectionIgnoreAttr&&n.setAttributeNode(document.createAttribute(e.detectionIgnoreAttr)),n}function L(t){var e,n=[],r=document,o=r.documentElement.doScroll,i=(o?/^loaded|^c/:/^loaded|^i|^c/).test(r.readyState);i||r.addEventListener("DOMContentLoaded",e=function(){for(r.removeEventListener("DOMContentLoaded",e),i=1;e=n.shift();)e()}),i?setTimeout(t,0):n.push(t)}function T(t){"undefined"!=typeof MutationObserver&&new MutationObserver(t).observe(document,{childList:!0,subtree:!0})}try{if(window.FontAwesomeKitConfig){var x=window.FontAwesomeKitConfig,M={detectingConflicts:x.detectConflictsUntil&&new Date<=new Date(x.detectConflictsUntil),detectionIgnoreAttr:"data-fa-detection-ignore",fetch:window.fetch,token:x.token,XMLHttpRequest:window.XMLHttpRequest,document:document},D=document.currentScript,N=D?D.parentElement:document.head;(function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return"js"===t.method?k(t,e):"css"===t.method?F(t,e,(function(t){L(t),T(t)})):void 0})(x,M).then((function(t){t.map((function(t){try{N.insertBefore(t,D?D.nextSibling:null)}catch(e){N.appendChild(t)}})),M.detectingConflicts&&D&&L((function(){D.setAttributeNode(document.createAttribute(M.detectionIgnoreAttr));var t=function(t,e){var n=document.createElement("script");return e&&e.detectionIgnoreAttr&&n.setAttributeNode(document.createAttribute(e.detectionIgnoreAttr)),n.src=c(t,{baseFilename:"conflict-detection",fileSuffix:"js",subdir:"js",minify:t.minify.enabled}),n}(x,M);document.body.appendChild(t)}))})).catch((function(t){console.error("".concat("Font Awesome Kit:"," ").concat(t))}))}}catch(t){console.error("".concat("Font Awesome Kit:"," ").concat(t))}}));

	<\/script>
	</body>
</html>
`;
var options = null;
var default_settings = { paths: { "base": "", "assets": "" } };
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  const hooks = get_hooks(user_hooks);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: assets + "/_app/start-2f6c57d2.js",
      css: [assets + "/_app/assets/start-d5b4de3e.css"],
      js: [assets + "/_app/start-2f6c57d2.js", assets + "/_app/chunks/vendor-e31dae41.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => assets + "/_app/" + entry_lookup[id],
    get_stack: (error22) => String(error22),
    handle_error: (error22, request) => {
      hooks.handleError({ error: error22, request });
      error22.stack = options.get_stack(error22);
    },
    hooks,
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    prerender: true,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
var empty = () => ({});
var manifest = {
  assets: [{ "file": "favicon.png", "size": 1571, "type": "image/png" }],
  layout: "src/routes/__layout.svelte",
  error: ".svelte-kit/build/components/error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    }
  ]
};
var get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
  handleError: hooks.handleError || (({ error: error22 }) => console.error(error22.stack)),
  serverFetch: hooks.serverFetch || fetch
});
var module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error2;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index;
  })
};
var metadata_lookup = { "src/routes/__layout.svelte": { "entry": "pages/__layout.svelte-58389f94.js", "css": [], "js": ["pages/__layout.svelte-58389f94.js", "chunks/vendor-e31dae41.js", "chunks/Footer-91c42fdc.js"], "styles": [] }, ".svelte-kit/build/components/error.svelte": { "entry": "error.svelte-6df2b7f5.js", "css": [], "js": ["error.svelte-6df2b7f5.js", "chunks/vendor-e31dae41.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "pages/index.svelte-d85f0a18.js", "css": ["assets/pages/index.svelte-4ddb377c.css"], "js": ["pages/index.svelte-d85f0a18.js", "chunks/vendor-e31dae41.js", "chunks/Footer-91c42fdc.js"], "styles": [] } };
async function load_component(file) {
  const { entry, css: css2, js, styles } = metadata_lookup[file];
  return {
    module: await module_lookup[file](),
    entry: assets + "/_app/" + entry,
    css: css2.map((dep) => assets + "/_app/" + dep),
    js: js.map((dep) => assets + "/_app/" + dep),
    styles
  };
}
function render(request, {
  prerender
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender });
}
var Nav = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<header class="${"l-header"}"><nav class="${"nav bd-grid"}"><div><a href="${"#home"}" class="${"nav__logo"}">Lalit\xA9</a></div>

		<div class="${"nav__menu"}" id="${"nav-menu"}"><ul class="${"nav__list"}"><li class="${"nav__item"}"><a href="${"#home"}" class="${"nav__link active"}">Home</a></li>
				<li class="${"nav__item"}"><a href="${"#about"}" class="${"nav__link"}">About</a>
					<i></i></li>
				<li class="${"nav__item"}"><a href="${"#skills"}" class="${"nav__link"}">Skills</a></li>
				<li class="${"nav__item"}"><a href="${"#contact"}" class="${"nav__link"}">Contact</a></li></ul></div>

		<div class="${"nav__toggle"}" id="${"nav-toggle"}"><i class="${"bx bx-menu"}"></i></div></nav></header>`;
});
var Footer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<footer class="${"footer"}"><p class="${"footer__title"}">Lalit\xA9</p>
	<div class="${"footer__social"}"><a href="${"https://galileoxp.com/"}" style="${"font-size: 24px; position: relative; top:2px;"}" class="${"footer__icon"}">G</a>
		<a href="${"https://dev.to/lalit64"}" class="${"footer__icon"}"><i class="${"fab fa-dev"}"></i></a>
		<a href="${"https://www.github.com/Lalit64"}" class="${"footer__icon"}"><i class="${"fab fa-github"}"></i></a>
		<a href="${"#contact"}" class="${"footer__icon"}"><i class="${"fas fa-phone"}"></i></a></div>
	<p>\xA92020 copyright all right reserved</p></footer>`;
});
var _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Nav, "Nav").$$render($$result, {}, {}, {})}
${slots.default ? slots.default({}) : ``}
${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});
var __layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout
});
function load({ error: error22, status }) {
  return { props: { error: error22, status } };
}
var Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { status } = $$props;
  let { error: error22 } = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error22 !== void 0)
    $$bindings.error(error22);
  return `<h1>${escape2(status)}</h1>

<pre>${escape2(error22.message)}</pre>



${error22.frame ? `<pre>${escape2(error22.frame)}</pre>` : ``}
${error22.stack ? `<pre>${escape2(error22.stack)}</pre>` : ``}`;
});
var error2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Error$1,
  load
});
var HomeImg = "/_app/assets/home__img-fa8e1a81.png";
var Home = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<main class="${"l-main"}">
	<section class="${"home bd-grid"}" id="${"home"}"><div class="${"home__data"}"><h1 class="${"home__title"}">Hi,<br>I&#39;m <span class="${"home__title-color"}">Lalit</span><br>I am a Programmer
			</h1>
			<a href="${"/#contact"}" class="${"button"}">Contact</a>
			<div class="${"home__img"}"><img${add_attribute("src", HomeImg, 0)} alt="${""}"></div></div>

		<div class="${"home__social"}"><a href="${"https://galileoxp.com/"}" id="${"G"}" class="${"home__social-icon"}"><h2><b style="${"font-size: 24px;"}">G</b></h2></a>
			<a href="${"https://dev.to/lalit64"}" class="${"home__social-icon"}"><h2 style="${"font-size: 22px;"}"><i class="${"fab fa-dev"}"></i></h2></a>
			<a href="${"https://dev.to/lalit64"}" class="${"home__social-icon"}"><h2 style="${"font-size: 22px;"}"><i class="${"fab fa-github"}"></i></h2></a>
			<a href="${"https://dev.to/lalit64"}" class="${"home__social-icon"}"><h2 style="${"font-size: 22px;"}"><i class="${"fas fa-phone"}"></i></h2></a></div></section></main>`;
});
var AboutImg = "/_app/assets/about__img-33a8cd05.jpg";
var About = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<section class="${"about section"}" id="${"about"}"><h2 class="${"section-title"}">About<br></h2>

	<div class="${"about__container bd-grid"}"><div class="${"about__img"}"><img${add_attribute("src", AboutImg, 0)} alt="${""}"></div>

		<div><h2 class="${"about__subtitle"}">I&#39;m Lalit</h2>
			<p class="${"about__text"}">My Name is Lalit Yalamanchili. I am an amateur web designer. I
				started programming when I was around about 6yrs old. I used a
				programme called Scratch. It uses block with javascript built into
				them to help you learn how to code. I now use Html and Python. I
				have cool projects with Html such as this one.
			</p></div></div></section>`;
});
var Skills = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<section class="${"skills section"}" id="${"skills"}"><h2 class="${"section-title skills-title"}">Skills<br></h2>

	<div class="${"skills__container bd-grid"}"><div class="${"skills__div"}"><h2 class="${"skills__subtitle"}">Amateur Skills</h2>
			<p class="${"skills__text"}">I am an amateur at popular programming languages.</p>
			<div class="${"skills__data"}"><div class="${"skills__names"}"><i class="${"fab fa-python skills__icon"}"></i>
					<span class="${"skills__name"}">Python</span></div>
				<div class="${"skills__bar skills__python"}"></div>
				<div><span class="${"skills__percentage"}"><br>94%</span></div></div>
			<div class="${"skills__data"}"><div class="${"skills__names"}"><i class="${"fab fa-html5 skills__icon"}"></i>
					<span class="${"skills__name"}">HTML5</span></div>
				<div class="${"skills__bar skills__html"}"></div>
				<div><span class="${"skills__percentage"}"><br>89%</span></div></div>
			<div class="${"skills__data"}"><div class="${"skills__names"}"><i class="${"fab fa-css3-alt skills__icon"}"></i>
					<span class="${"skills__name"}">CSS3</span></div>
				<div class="${"skills__bar skills__css"}"></div>
				<div><span class="${"skills__percentage"}"><br>52%</span></div></div>
			<div class="${"skills__data"}"><div class="${"skills__names"}"><i class="${"fab fa-js-square skills__icon"}"></i>
					<span class="${"skills__name"}">JAVASCRIPT</span></div>
				<div class="${"skills__bar skills__js"}"></div>
				<div><span class="${"skills__percentage"}"><br>72%</span></div></div>
			<div class="${"skills__data"}"><div class="${"skills__names"}"><i class="${"fad fa-paint-brush skills__icon"}"></i>
					<span class="${"skills__name"}">UX/UI</span></div>
				<div class="${"skills__bar skills__ux"}"></div>
				<div><span class="${"skills__percentage"}"><br>67%</span></div></div></div>

		<div><img src="${"https://lalit.co.za/assets/img/skills.svg"}" alt="${""}" class="${"skills__img"}"></div></div></section>`;
});
var Contact = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<main class="${"bd-grid"}" style="${""}"><section class="${"contact section"}" id="${"contact"}"><h2 class="${"section-title contact-title"}">Contact<br></h2>

		<div class="${"contact__container bd-grid"}"><form class="${"contact__form"}"><input type="${"text"}" placeholder="${"Name"}" name="${"name"}" class="${"contact__input"}">
				<input type="${"email"}" placeholder="${"Email"}" class="${"contact__input"}" name="${"email"}">
				
				<textarea name="${"message"}" style="${"resize: none; font-family: Poppins, sans-serif;"}" id="${""}" placeholder="${"Message"}" cols="${"0"}" rows="${"10"}" class="${"contact__input"}"></textarea>
				<input type="${"submit"}" value="${"Send"}" class="${"contact__button button"}"></form></div></section></main>`;
});
var css = {
  code: "@import '../assets/css/styles.css';",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\n\\timport Home from '../assets/components/Home.svelte';\\n\\timport About from '../assets/components/About.svelte';\\n\\timport Skills from '../assets/components/Skills.svelte';\\n\\timport Contact from '../assets/components/Contact.svelte';\\n\\timport Footer from '../assets/components/Footer.svelte';\\n\\timport { onMount } from 'svelte';\\n\\timport ScrollReveal from 'scrollreveal';\\n\\n\\tonMount(() => {\\n\\t\\twindow.sr = ScrollReveal({\\n\\t\\t\\torigin: 'top',\\n\\t\\t\\tdistance: '80px',\\n\\t\\t\\tduration: 2000,\\n\\t\\t\\treset: true\\n\\t\\t});\\n\\n\\t\\twindow.sr.reveal('.home__title', {});\\n\\t\\twindow.sr.reveal('.button', { delay: 200 });\\n\\t\\twindow.sr.reveal('.home__img', { delay: 400 });\\n\\t\\twindow.sr.reveal('.home__social-icon', { interval: 200 });\\n\\n\\t\\t/*SCROLL ABOUT*/\\n\\t\\twindow.sr.reveal('.about__img', {});\\n\\t\\twindow.sr.reveal('.about__subtitle', { delay: 400 });\\n\\t\\twindow.sr.reveal('.about__text', { delay: 400 });\\n\\n\\t\\t/*SCROLL SKILLS*/\\n\\t\\twindow.sr.reveal('.skills__subtitle', {});\\n\\t\\twindow.sr.reveal('.skills__text', {});\\n\\t\\twindow.sr.reveal('.skills__data', { interval: 200 });\\n\\t\\twindow.sr.reveal('.skills__img', { delay: 600 });\\n\\n\\t\\t/*SCROLL WORK*/\\n\\t\\twindow.sr.reveal('.work__img', { interval: 200 });\\n\\n\\t\\t/*SCROLL CONTACT*/\\n\\t\\twindow.sr.reveal('.contact__input', { interval: 200 });\\n\\t});\\n<\/script>\\n\\n<Home />\\n<About />\\n<Skills />\\n<Contact />\\n<Footer />\\n\\n<style>\\n\\t@import '../assets/css/styles.css';\\n</style>\\n"],"names":[],"mappings":"AAgDC,QAAQ,0BAA0B,CAAC"}`
};
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `${validate_component(Home, "Home").$$render($$result, {}, {}, {})}
${validate_component(About, "About").$$render($$result, {}, {}, {})}
${validate_component(Skills, "Skills").$$render($$result, {}, {}, {})}
${validate_component(Contact, "Contact").$$render($$result, {}, {}, {})}
${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes
});

// .svelte-kit/vercel/entry.js
init();
var entry_default = async (req, res) => {
  const { pathname, searchParams } = new URL(req.url || "", "http://localhost");
  let body;
  try {
    body = await getRawBody(req);
  } catch (err) {
    res.statusCode = err.status || 400;
    return res.end(err.reason || "Invalid request body");
  }
  const rendered = await render({
    method: req.method,
    headers: req.headers,
    path: pathname,
    query: searchParams,
    rawBody: body
  });
  if (rendered) {
    const { status, headers, body: body2 } = rendered;
    return res.writeHead(status, headers).end(body2);
  }
  return res.writeHead(404).end();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
/*! @license Rematrix v0.3.0

		Copyright 2018 Julian Lloyd.

		Permission is hereby granted, free of charge, to any person obtaining a copy
		of this software and associated documentation files (the "Software"), to deal
		in the Software without restriction, including without limitation the rights
		to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
		copies of the Software, and to permit persons to whom the Software is
		furnished to do so, subject to the following conditions:

		The above copyright notice and this permission notice shall be included in
		all copies or substantial portions of the Software.

		THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
		IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
		LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
		OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
		THE SOFTWARE.
	*/
/*! @license ScrollReveal v4.0.9

	Copyright 2021 Fisssion LLC.

	Licensed under the GNU General Public License 3.0 for
	compatible open source projects and non-commercial use.

	For commercial sites, themes, projects, and applications,
	keep your source code private/proprietary by purchasing
	a commercial license from https://scrollrevealjs.org/
*/
/*! @license Tealight v0.3.6

		Copyright 2018 Fisssion LLC.

		Permission is hereby granted, free of charge, to any person obtaining a copy
		of this software and associated documentation files (the "Software"), to deal
		in the Software without restriction, including without limitation the rights
		to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
		copies of the Software, and to permit persons to whom the Software is
		furnished to do so, subject to the following conditions:

		The above copyright notice and this permission notice shall be included in all
		copies or substantial portions of the Software.

		THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
		IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
		LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
		OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
		SOFTWARE.

	*/
/*! @license is-dom-node v1.0.4

		Copyright 2018 Fisssion LLC.

		Permission is hereby granted, free of charge, to any person obtaining a copy
		of this software and associated documentation files (the "Software"), to deal
		in the Software without restriction, including without limitation the rights
		to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
		copies of the Software, and to permit persons to whom the Software is
		furnished to do so, subject to the following conditions:

		The above copyright notice and this permission notice shall be included in all
		copies or substantial portions of the Software.

		THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
		IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
		LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
		OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
		SOFTWARE.

	*/
/*! @license is-dom-node-list v1.2.1

		Copyright 2018 Fisssion LLC.

		Permission is hereby granted, free of charge, to any person obtaining a copy
		of this software and associated documentation files (the "Software"), to deal
		in the Software without restriction, including without limitation the rights
		to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
		copies of the Software, and to permit persons to whom the Software is
		furnished to do so, subject to the following conditions:

		The above copyright notice and this permission notice shall be included in all
		copies or substantial portions of the Software.

		THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
		IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
		LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
		OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
		SOFTWARE.

	*/
/*! @license miniraf v1.0.1

		Copyright 2018 Fisssion LLC.

		Permission is hereby granted, free of charge, to any person obtaining a copy
		of this software and associated documentation files (the "Software"), to deal
		in the Software without restriction, including without limitation the rights
		to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
		copies of the Software, and to permit persons to whom the Software is
		furnished to do so, subject to the following conditions:

		The above copyright notice and this permission notice shall be included in all
		copies or substantial portions of the Software.

		THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
		IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
		LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
		OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
		SOFTWARE.

	*/

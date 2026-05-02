const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..", "..");
const routesEntry = path.join(projectRoot, "src", "routes", "index.js");
const outputFile = path.join(projectRoot, "payload.txt");
const apiPrefix = "/api/v1";

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function resolveRequire(fromFile, requirePath) {
  if (!requirePath.startsWith(".")) return null;
  const candidate = path.resolve(path.dirname(fromFile), requirePath);
  const jsFile = `${candidate}.js`;
  const indexFile = path.join(candidate, "index.js");
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  if (fs.existsSync(jsFile)) return jsFile;
  if (fs.existsSync(indexFile)) return indexFile;
  return null;
}

function parseRequireMap(fileContent) {
  const requireMap = {};
  const requireRegex = /const\s+(\w+)\s*=\s*require\(\s*["'](.+?)["']\s*\);/g;
  let match;
  while ((match = requireRegex.exec(fileContent)) !== null) requireMap[match[1]] = match[2];
  return requireMap;
}

function extractFunctionBodiesByConst(content) {
  const map = {};
  const startRegex = /const\s+(\w+)\s*=\s*asyncHandler\(\s*async\s*\(\s*req\s*,\s*res\s*\)\s*=>\s*{/g;
  let match;
  while ((match = startRegex.exec(content)) !== null) {
    const name = match[1];
    const bodyStart = startRegex.lastIndex;
    let depth = 1;
    let i = bodyStart;
    while (i < content.length && depth > 0) {
      const ch = content[i];
      if (ch === "{") depth += 1;
      if (ch === "}") depth -= 1;
      i += 1;
    }
    map[name] = content.slice(bodyStart, i - 1);
    startRegex.lastIndex = i;
  }
  return map;
}

function extractAsyncFunctionBodies(content) {
  const map = {};
  const startRegex = /async function\s+(\w+)\s*\([^)]*\)\s*{/g;
  let match;
  while ((match = startRegex.exec(content)) !== null) {
    const name = match[1];
    const bodyStart = startRegex.lastIndex;
    let depth = 1;
    let i = bodyStart;
    while (i < content.length && depth > 0) {
      const ch = content[i];
      if (ch === "{") depth += 1;
      if (ch === "}") depth -= 1;
      i += 1;
    }
    map[name] = content.slice(bodyStart, i - 1);
    startRegex.lastIndex = i;
  }
  return map;
}

function captureFields(body, sourceName) {
  const fields = new Set();
  const propRegex = new RegExp(`req\\.${sourceName}\\.([A-Za-z_$][\\w$]*)`, "g");
  let match;
  while ((match = propRegex.exec(body)) !== null) fields.add(match[1]);

  const destructureRegex = new RegExp(`const\\s*\\{([^}]+)\\}\\s*=\\s*req\\.${sourceName}`, "g");
  while ((match = destructureRegex.exec(body)) !== null) {
    match[1]
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => v.split(":")[0].trim())
      .map((v) => v.split("=")[0].trim())
      .filter(Boolean)
      .forEach((v) => fields.add(v));
  }

  return {
    fields: Array.from(fields).sort(),
    wholeObject: new RegExp(`req\\.${sourceName}(?!\\.)`).test(body),
  };
}

function parseJsonKeys(objectLiteralText) {
  const keys = new Set();
  const keyRegex = /([A-Za-z_$][\w$]*)\s*:/g;
  let m;
  while ((m = keyRegex.exec(objectLiteralText)) !== null) keys.add(m[1]);
  return Array.from(keys).sort();
}

function analyzeControllerFunction(body) {
  const reqBody = captureFields(body, "body");
  const reqQuery = captureFields(body, "query");
  const reqParams = captureFields(body, "params");
  const responses = [];
  const responseRegex = /res\.status\((\d+)\)\.json\(\s*({[\s\S]*?})\s*\)/g;
  let responseMatch;
  while ((responseMatch = responseRegex.exec(body)) !== null) {
    responses.push({ status: Number(responseMatch[1]), keys: parseJsonKeys(responseMatch[2]) });
  }

  const serviceCallMatch = body.match(/(\w+Service)\.(\w+)\s*\(/);
  const serviceCall = serviceCallMatch
    ? { serviceVar: serviceCallMatch[1], functionName: serviceCallMatch[2] }
    : null;

  return {
    request: {
      bodyFields: reqBody.fields,
      hasBodyObject: reqBody.wholeObject,
      queryFields: reqQuery.fields,
      hasQueryObject: reqQuery.wholeObject,
      pathParams: reqParams.fields,
    },
    responses,
    serviceCall,
  };
}

function parseControllerFile(controllerFilePath) {
  const content = readFile(controllerFilePath);
  const functions = extractFunctionBodiesByConst(content);
  const info = {};
  Object.keys(functions).forEach((name) => {
    info[name] = analyzeControllerFunction(functions[name]);
  });
  return { info, requireMap: parseRequireMap(content) };
}

function analyzeValidatorFunction(validatorBody) {
  const fields = new Set();
  const fieldFromMessage = /Field `([^`]+)`/g;
  let match;
  while ((match = fieldFromMessage.exec(validatorBody)) !== null) fields.add(match[1]);

  const payloadFieldRegex = /payload\.([A-Za-z_$][\w$]*)/g;
  while ((match = payloadFieldRegex.exec(validatorBody)) !== null) fields.add(match[1]);

  if (fields.has("email") && /personalInformation/.test(validatorBody)) {
    fields.delete("email");
    fields.add("personalInformation.email");
  }
  if (fields.has("phone") && /personalInformation/.test(validatorBody)) {
    fields.delete("phone");
    fields.add("personalInformation.phone");
  }

  const mandatory = new Set();
  const requiredMsgRegex = /errors\.push\("([^"]+)"\)/g;
  while ((match = requiredMsgRegex.exec(validatorBody)) !== null) {
    const msg = match[1];
    if (/required|Provide either|Provide only|at least one/i.test(msg)) mandatory.add(msg);
  }

  return {
    allFields: Array.from(fields).sort(),
    mandatory: Array.from(mandatory),
  };
}

function buildValidatorCatalog() {
  const modelFiles = [
    path.join(projectRoot, "src", "modules", "auth", "models", "auth.model.js"),
    path.join(projectRoot, "src", "modules", "tickets", "models", "ticket.model.js"),
  ];
  const catalog = {};
  modelFiles.forEach((file) => {
    const content = readFile(file);
    const fnBodies = extractAsyncFunctionBodies(content);
    const syncFnRegex = /function\s+(\w+)\s*\([^)]*\)\s*{/g;
    let match;
    while ((match = syncFnRegex.exec(content)) !== null) {
      const name = match[1];
      if (fnBodies[name]) continue;
      const bodyStart = syncFnRegex.lastIndex;
      let depth = 1;
      let i = bodyStart;
      while (i < content.length && depth > 0) {
        const ch = content[i];
        if (ch === "{") depth += 1;
        if (ch === "}") depth -= 1;
        i += 1;
      }
      const body = content.slice(bodyStart, i - 1);
      syncFnRegex.lastIndex = i;
      if (/validate/i.test(name)) catalog[name] = analyzeValidatorFunction(body);
    }
  });
  return catalog;
}

function parseServiceFile(serviceFilePath) {
  const content = readFile(serviceFilePath);
  const fnBodies = extractAsyncFunctionBodies(content);
  const map = {};
  Object.keys(fnBodies).forEach((serviceFnName) => {
    const body = fnBodies[serviceFnName];
    const validateCall = body.match(/(validate\w+)\s*\(\s*payload(?:\s*,\s*\{\s*partial:\s*true\s*\})?/);
    if (validateCall) {
      map[serviceFnName] = {
        validator: validateCall[1],
        partial: /\{\s*partial:\s*true\s*\}/.test(validateCall[0]),
      };
    }
  });
  return { map, requireMap: parseRequireMap(content) };
}

function normalizePath(parts) {
  const joined = parts.join("/");
  return joined.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

function parseRouteFile(routeFilePath, basePath, visited, caches) {
  const resolvedPath = path.resolve(routeFilePath);
  if (visited.has(`${resolvedPath}::${basePath}`)) return [];
  visited.add(`${resolvedPath}::${basePath}`);

  const content = readFile(resolvedPath);
  const requireMap = parseRequireMap(content);
  const endpoints = [];

  const useRegex = /router\.use\(\s*["']([^"']+)["']\s*,\s*(\w+)\s*\)/g;
  let useMatch;
  while ((useMatch = useRegex.exec(content)) !== null) {
    const mountPath = useMatch[1];
    const routerVar = useMatch[2];
    const child = resolveRequire(resolvedPath, requireMap[routerVar] || "");
    if (!child) continue;
    endpoints.push(
      ...parseRouteFile(child, normalizePath([basePath, mountPath]), visited, caches),
    );
  }

  const routeRegex = /router\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']\s*,\s*([\s\S]*?)\);/g;
  let routeMatch;
  while ((routeMatch = routeRegex.exec(content)) !== null) {
    const method = routeMatch[1].toUpperCase();
    const localPath = routeMatch[2];
    const handlers = routeMatch[3].split(",").map((v) => v.trim()).filter(Boolean);
    const controllerHandler = handlers.find((h) => h.includes("."));
    const authRequired = handlers.includes("authenticateToken");

    let controllerMeta = null;
    if (controllerHandler) {
      const [controllerVar, controllerFn] = controllerHandler.split(".");
      const controllerPath = resolveRequire(resolvedPath, requireMap[controllerVar] || "");
      if (controllerPath) {
        if (!caches.controllers[controllerPath]) {
          caches.controllers[controllerPath] = parseControllerFile(controllerPath);
        }
        const controllerParsed = caches.controllers[controllerPath];
        controllerMeta = {
          ...controllerParsed.info[controllerFn],
          controllerPath,
          controllerFn,
          controllerRequireMap: controllerParsed.requireMap,
        };
      }
    }

    endpoints.push({
      method,
      path: normalizePath([apiPrefix, basePath, localPath]),
      authRequired,
      request: controllerMeta?.request || {
        bodyFields: [],
        hasBodyObject: false,
        queryFields: [],
      },
      responses: controllerMeta?.responses || [],
      controllerMeta,
    });
  }

  return endpoints;
}

function buildBodySpec(endpoint, caches) {
  const fallback = {
    allFields: endpoint.request.bodyFields,
    mandatory: [],
    optional: endpoint.request.bodyFields,
  };
  if (!endpoint.controllerMeta || !endpoint.controllerMeta.serviceCall) return fallback;

  const { serviceVar, functionName } = endpoint.controllerMeta.serviceCall;
  const serviceRequirePath = endpoint.controllerMeta.controllerRequireMap[serviceVar];
  const servicePath = serviceRequirePath
    ? resolveRequire(endpoint.controllerMeta.controllerPath, serviceRequirePath)
    : null;
  if (!servicePath) return fallback;

  if (!caches.services[servicePath]) caches.services[servicePath] = parseServiceFile(servicePath);
  const serviceMeta = caches.services[servicePath].map[functionName];
  if (!serviceMeta) return fallback;

  const validatorSpec = caches.validators[serviceMeta.validator];
  if (!validatorSpec) return fallback;

  if (serviceMeta.partial) {
    return {
      allFields: validatorSpec.allFields,
      mandatory: ["at least one field to update"],
      optional: validatorSpec.allFields,
    };
  }

  const mandatory = validatorSpec.mandatory.length ? validatorSpec.mandatory : [];
  return {
    allFields: validatorSpec.allFields,
    mandatory,
    optional: validatorSpec.allFields,
  };
}

function renderBodyLine(endpoint, caches) {
  if (endpoint.request.bodyFields.length === 0 && !endpoint.request.hasBodyObject) {
    return "Body: none";
  }

  const spec = buildBodySpec(endpoint, caches);
  const all = spec.allFields.length ? spec.allFields.join(", ") : "dynamic object";
  const mandatory = spec.mandatory.length ? spec.mandatory.join(" | ") : "none";
  const optional = spec.optional.length ? spec.optional.join(", ") : "none";
  return `Body: fields=[${all}] | mandatory=[${mandatory}] | optional=[${optional}]`;
}

function generate() {
  const caches = {
    controllers: {},
    services: {},
    validators: buildValidatorCatalog(),
  };

  const endpoints = parseRouteFile(routesEntry, "", new Set(), caches).sort((a, b) => {
    if (a.path === b.path) return a.method.localeCompare(b.method);
    return a.path.localeCompare(b.path);
  });

  const lines = [
    "Backend API Payload & Response Reference",
    `Generated at: ${new Date().toISOString()}`,
    "",
    `Total endpoints: ${endpoints.length}`,
    "",
  ];

  endpoints.forEach((endpoint, idx) => {
    lines.push(`${idx + 1}. Endpoint: ${endpoint.method} ${endpoint.path}`);
    lines.push(renderBodyLine(endpoint, caches));
    if (endpoint.responses.length === 0) {
      lines.push("Response: not inferred");
    } else {
      lines.push(
        `Response: ${endpoint.responses
          .map((r) => `${r.status} -> ${r.keys.length ? r.keys.join(", ") : "no object keys found"}`)
          .join(" | ")}`,
      );
    }
    lines.push("");
  });

  fs.writeFileSync(outputFile, lines.join("\n"), "utf8");
  console.log(`Generated ${outputFile} with ${endpoints.length} endpoints.`);
}

generate();

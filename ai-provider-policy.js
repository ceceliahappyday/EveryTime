(function (root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) module.exports = policy;
  root.AiProviderPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const SYSTEM_PROMPT = "你是 EveryTime 的任务数据助手。只根据用户提供的任务、日程和工时数据回答。不要编造数据；找不到时明确说没有找到。用简洁清晰的中文回答，优先列出任务名称、状态、日期和工时。你只能做任务查询、定位未完成任务和指定期间工作总结。";

  const PROVIDERS = {
    openai: {
      id: "openai",
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      protocol: "openai-chat",
      defaultModel: "gpt-4.1-mini",
      fallbackModels: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini", "gpt-4o", "o4-mini"]
    },
    openrouter: {
      id: "openrouter",
      name: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      protocol: "openai-chat",
      defaultModel: "openai/gpt-4.1-mini",
      fallbackModels: [
        "openai/gpt-4.1-mini",
        "openai/gpt-4o-mini",
        "anthropic/claude-sonnet-4",
        "google/gemini-2.5-flash",
        "deepseek/deepseek-chat"
      ]
    },
    anthropic: {
      id: "anthropic",
      name: "Anthropic",
      baseUrl: "https://api.anthropic.com/v1",
      protocol: "anthropic-messages",
      defaultModel: "claude-sonnet-4-0",
      fallbackModels: ["claude-sonnet-4-0", "claude-3-5-haiku-latest", "claude-3-5-sonnet-latest", "claude-3-haiku-20240307"]
    },
    groq: {
      id: "groq",
      name: "Groq",
      baseUrl: "https://api.groq.com/openai/v1",
      protocol: "openai-chat",
      defaultModel: "llama-3.3-70b-versatile",
      fallbackModels: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "openai/gpt-oss-20b", "qwen/qwen3-32b"]
    },
    deepseek: {
      id: "deepseek",
      name: "DeepSeek",
      baseUrl: "https://api.deepseek.com",
      protocol: "openai-chat",
      defaultModel: "deepseek-chat",
      fallbackModels: ["deepseek-chat", "deepseek-reasoner"]
    },
    moonshot: {
      id: "moonshot",
      name: "Moonshot / Kimi",
      baseUrl: "https://api.moonshot.cn/v1",
      protocol: "openai-chat",
      defaultModel: "moonshot-v1-auto",
      fallbackModels: ["moonshot-v1-auto", "moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k", "kimi-latest"]
    },
    siliconflow: {
      id: "siliconflow",
      name: "SiliconFlow",
      baseUrl: "https://api.siliconflow.cn/v1",
      protocol: "openai-chat",
      defaultModel: "deepseek-ai/DeepSeek-V3",
      fallbackModels: [
        "deepseek-ai/DeepSeek-V3",
        "deepseek-ai/DeepSeek-R1",
        "Qwen/Qwen2.5-72B-Instruct",
        "THUDM/glm-4-9b-chat"
      ]
    },
    dashscope: {
      id: "dashscope",
      name: "通义千问（兼容模式）",
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      protocol: "openai-chat",
      defaultModel: "qwen-plus",
      fallbackModels: ["qwen-plus", "qwen-turbo", "qwen-max", "qwen-long"]
    },
    gemini: {
      id: "gemini",
      name: "Google Gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      protocol: "gemini",
      defaultModel: "gemini-2.5-flash",
      fallbackModels: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-1.5-flash"]
    }
  };

  const AMBIGUOUS_SK_PROVIDERS = ["openai", "deepseek", "moonshot", "siliconflow", "dashscope"];

  function normalizeKey(apiKey = "") {
    return String(apiKey || "").trim();
  }

  function detectProviderId(apiKey = "") {
    const key = normalizeKey(apiKey);
    if (!key) return "";
    if (/^sk-or-/i.test(key)) return "openrouter";
    if (/^sk-ant-/i.test(key)) return "anthropic";
    if (/^gsk_/i.test(key)) return "groq";
    if (/^AIza/i.test(key)) return "gemini";
    if (/^sk-/i.test(key)) return "openai";
    return "openai";
  }

  function isAmbiguousSkKey(apiKey = "") {
    const key = normalizeKey(apiKey);
    return /^sk-/i.test(key) && !/^sk-or-/i.test(key) && !/^sk-ant-/i.test(key);
  }

  function getProvider(providerId = "") {
    return PROVIDERS[providerId] || null;
  }

  function resolveProvider({ apiKey = "", providerId = "" } = {}) {
    const detectedId = detectProviderId(apiKey);
    const preferredId = String(providerId || "").trim();
    let id = preferredId || detectedId || "openai";
    if (preferredId && !PROVIDERS[preferredId]) id = detectedId || "openai";
    if (isAmbiguousSkKey(apiKey) && preferredId && AMBIGUOUS_SK_PROVIDERS.includes(preferredId)) {
      id = preferredId;
    }
    if (!isAmbiguousSkKey(apiKey) && detectedId) id = detectedId;
    const provider = PROVIDERS[id] || PROVIDERS.openai;
    return {
      ...provider,
      detectedId,
      ambiguous: isAmbiguousSkKey(apiKey),
      selectableProviderIds: isAmbiguousSkKey(apiKey) ? AMBIGUOUS_SK_PROVIDERS.slice() : [provider.id]
    };
  }

  function providerOptionsForKey(apiKey = "") {
    if (isAmbiguousSkKey(apiKey)) {
      return AMBIGUOUS_SK_PROVIDERS.map(id => ({ id, name: PROVIDERS[id].name }));
    }
    const detected = detectProviderId(apiKey);
    if (!detected || !PROVIDERS[detected]) return Object.values(PROVIDERS).map(item => ({ id: item.id, name: item.name }));
    return [{ id: detected, name: PROVIDERS[detected].name }];
  }

  function looksLikeChatModel(id = "") {
    const value = String(id || "").toLowerCase();
    if (!value) return false;
    if (/(embedding|whisper|tts|dall-e|image|moderation|realtime|audio|transcribe|computer-use)/.test(value)) return false;
    return true;
  }

  function normalizeModelEntries(rawModels = [], provider) {
    const ids = [];
    const seen = new Set();
    (rawModels || []).forEach(item => {
      const id = typeof item === "string" ? item : (item?.id || item?.name || "");
      if (!id || seen.has(id) || !looksLikeChatModel(id)) return;
      seen.add(id);
      ids.push(id);
    });
    if (!ids.length && provider?.fallbackModels) ids.push(...provider.fallbackModels);
    return ids;
  }

  function parseOpenAiModelList(payload) {
    return (payload?.data || payload?.models || []).map(item => item?.id || item?.name || item).filter(Boolean);
  }

  function parseGeminiModelList(payload) {
    return (payload?.models || [])
      .filter(item => (item?.supportedGenerationMethods || []).includes("generateContent"))
      .map(item => String(item?.name || "").replace(/^models\//, ""))
      .filter(Boolean);
  }

  function buildModelsRequest(provider, apiKey) {
    const key = normalizeKey(apiKey);
    if (provider.protocol === "anthropic-messages") {
      return {
        url: `${provider.baseUrl}/models`,
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01"
        },
        fallbackOnly: false
      };
    }
    if (provider.protocol === "gemini") {
      return {
        url: `${provider.baseUrl}/models?key=${encodeURIComponent(key)}`,
        headers: {},
        fallbackOnly: false,
        parser: "gemini"
      };
    }
    return {
      url: `${provider.baseUrl.replace(/\/$/, "")}/models`,
      headers: {
        Authorization: `Bearer ${key}`
      },
      fallbackOnly: false
    };
  }

  function buildChatRequest({ provider, apiKey, model, question = "", rangeLabel = "", context = {} } = {}) {
    const key = normalizeKey(apiKey);
    const userText = `用户问题：${String(question || "").slice(0, 4000)}\n\n数据范围：${String(rangeLabel || "未指定")}\n\n应用数据：${JSON.stringify(context || {}).slice(0, 120000)}`;
    const chosenModel = String(model || provider.defaultModel || "").trim() || provider.defaultModel;

    if (provider.protocol === "anthropic-messages") {
      return {
        url: `${provider.baseUrl}/messages`,
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01"
        },
        body: {
          model: chosenModel,
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userText }]
        }
      };
    }

    if (provider.protocol === "gemini") {
      return {
        url: `${provider.baseUrl}/models/${encodeURIComponent(chosenModel)}:generateContent?key=${encodeURIComponent(key)}`,
        headers: { "content-type": "application/json" },
        body: {
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userText }] }]
        }
      };
    }

    return {
      url: `${provider.baseUrl.replace(/\/$/, "")}/chat/completions`,
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: {
        model: chosenModel,
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userText }
        ]
      }
    };
  }

  function extractChatText(payload, provider) {
    if (!payload) return "";
    if (provider?.protocol === "anthropic-messages") {
      return (payload.content || []).map(part => part?.text || "").filter(Boolean).join("\n").trim();
    }
    if (provider?.protocol === "gemini") {
      return (payload.candidates || [])
        .flatMap(item => item?.content?.parts || [])
        .map(part => part?.text || "")
        .filter(Boolean)
        .join("\n")
        .trim();
    }
    const choice = payload.choices?.[0];
    if (typeof choice?.message?.content === "string") return choice.message.content.trim();
    if (Array.isArray(choice?.message?.content)) {
      return choice.message.content.map(part => part?.text || part?.content || "").filter(Boolean).join("\n").trim();
    }
    if (typeof payload?.output_text === "string") return payload.output_text.trim();
    return (payload?.output || []).flatMap(item => item.content || [])
      .map(item => item.text || item.value || "")
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return {
    SYSTEM_PROMPT,
    PROVIDERS,
    AMBIGUOUS_SK_PROVIDERS,
    normalizeKey,
    detectProviderId,
    isAmbiguousSkKey,
    getProvider,
    resolveProvider,
    providerOptionsForKey,
    looksLikeChatModel,
    normalizeModelEntries,
    parseOpenAiModelList,
    parseGeminiModelList,
    buildModelsRequest,
    buildChatRequest,
    extractChatText
  };
});

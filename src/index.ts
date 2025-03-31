#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fetch from "node-fetch";
import { z } from "zod";
import fs, { readFileSync } from "fs";
import _ from "lodash";
import mqtt from "mqtt";
import { pathToFileURL } from "url";

import { createFilePath } from "./utils.js";

let SUPOS_API_URL =
  process.env.SUPOS_API_URL;
let SUPOS_API_KEY =
  process.env.SUPOS_API_KEY;
let SUPOS_MQTT_URL =
  process.env.SUPOS_MQTT_URL;

// Command line argument parsing
if (process.argv.length >= 5) {
  const args = process.argv.slice(-3);
  if (args.length !== 0) {
    SUPOS_API_URL = args?.[0];
    SUPOS_API_KEY = args?.[1];
    SUPOS_MQTT_URL = args?.[2];
  }
}

if (!SUPOS_API_URL) {
  console.error("SUPOS_API_URL environment variable is not set");
  process.exit(1);
}

if (!SUPOS_API_KEY) {
  console.error("SUPOS_API_KEY environment variable is not set");
  process.exit(1);
}

const filePath = createFilePath();
const fileUri = pathToFileURL(filePath).href;

async function getModelTopicDetail(topic: string): Promise<any> {
  const url = `${SUPOS_API_URL}/open-api/supos/uns/model?topic=${encodeURIComponent(
    topic
  )}`;

  const response = await fetch(url, {
    headers: {
      apiKey: `${SUPOS_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`SupOS API error: ${response.statusText}`);
  }

  return await response.json();
}

async function getModelTopicTree(params: {
  key?: string;
  showRec?: string;
  type?: string;
}): Promise<any> {
  let searchParams = {};
  if (params) {
    searchParams = _.pickBy(params, !_.isNil);
  }
  const paramsUrl = new URLSearchParams("");
  _.forOwn(searchParams, function (value, key) {
    paramsUrl.append(key, encodeURIComponent(value));
  });

  const url = `${SUPOS_API_URL}/open-api/supos/uns/tree?${paramsUrl.toString()}`;

  const response = await fetch(url, {
    headers: {
      apiKey: `${SUPOS_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`SupOS API error: ${response.statusText}`);
  }

  return await response.json();
}

function getAllTopicRealtimeData() {
  // 缓存实时数据，定时写入缓存文件
  const cache = new Map();
  let timer: any = null;

  const options = {
    clean: true,
    connectTimeout: 4000,
    clientId: "emqx_topic_all",
    rejectUnauthorized: false,
    reconnectPeriod: 0, // 不进行重连
  };

  const connectUrl = SUPOS_MQTT_URL;
  if (!connectUrl) {
    return;
  }

  const client = mqtt.connect(connectUrl, options);

  client.on("connect", function () {
    client.subscribe("#", function (err) {
      // console.log("err", err);
    });
  });

  client.on("message", function (topic, message) {
    cache.set(topic, message.toString());
  });

  client.on("error", function (error) {
    // console.log("error", error);
  });
  client.on("close", function () {
    if (timer) {
      clearInterval(timer);
    }
  });
  // 每 5 秒批量写入一次
  timer = setInterval(() => {
    const cacheJson = JSON.stringify(
      Object.fromEntries(Array.from(cache)),
      null,
      2
    );
    // 将更新后的数据写入 JSON 文件
    fs.writeFile(
      filePath,
      cacheJson,
      {
        encoding: "utf-8",
      },
      (error) => {
        if (error) {
          fs.writeFile(
            filePath,
            JSON.stringify({ msg: "写入数据失败" }, null, 2),
            { encoding: "utf-8" },
            () => {}
          );
        }
      }
    );
  }, 5000);
}

function getTopicRealtimeData(subscribeTopic: string) {
  return new Promise((resolve) => {
    const options = {
      clean: true,
      connectTimeout: 4000,
      clientId: "emqx_topic_single",
      rejectUnauthorized: false,
      reconnectPeriod: 0, // 不进行重连
    };

    const connectUrl = SUPOS_MQTT_URL;

    if (!connectUrl) {
      resolve(`订阅${subscribeTopic}失败`);
      return;
    }

    const client = mqtt.connect(connectUrl, options);

    client.on("connect", function () {
      client.subscribe(`${subscribeTopic}`, function (err) {
        if (err) {
          resolve(`订阅${subscribeTopic}失败`);
        }
      });
    });
    client.on("message", function (topic, message) {
      // console.log({ topic, message: message.toString() });
      resolve(message.toString());
      client.end();
    });

    client.on("error", function (error) {
      // console.log("error", error);
      resolve(`MQTT 错误: ${error.message}`);
      client.end();
    });
    client.on("close", function () {
      // console.log("close");
      resolve(`订阅${subscribeTopic}失败`);
    });

    setTimeout(() => {
      resolve(`订阅超时: ${subscribeTopic}可能不存在或者其他异常`);
      client.end();
    }, 30000);
  });
}

function createMcpServer() {
  const server = new McpServer(
    {
      name: "mcp-server-supos",
      version: "0.0.1",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Static resource
  server.resource("all-topic-realtime-data", fileUri, async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: readFileSync(filePath, { encoding: "utf-8" }),
      },
    ],
  }));

  server.tool(
    "get-model-topic-tree",
    {
      key: z
        .string()
        .optional()
        .describe("Fuzzy search keyword for child nodes"),
      showRec: z.boolean().optional().describe("Is show recommend topic"),
      type: z
        .string()
        .optional()
        .describe("Search type: 1--Text search, 2--Tag search"),
    },
    async (args: any) => {
      const trees = await getModelTopicTree({
        key: _.isNil(args.key) ? "" : `${args.key}`,
        showRec: _.isNil(args.showRec) ? "false" : `${args.showRec}`,
        type: _.isNil(args.type) ? "1" : `${args.type}`,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(trees) }],
      };
    }
  );

  server.tool(
    "get-model-topic-detail",
    { topic: z.string() },
    async (args: any) => {
      const detail = await getModelTopicDetail(args.topic);
      return {
        content: [{ type: "text", text: `${JSON.stringify(detail)}` }],
      };
    }
  );

  server.tool("get-all-topic-realtime-data", {}, async () => {
    return {
      content: [
        {
          type: "text",
          text: readFileSync(filePath, { encoding: "utf-8" }),
        },
      ],
    };
  });

  server.tool(
    "get-topic-realtime-data",
    { topic: z.string() },
    async (args: any) => {
      const realtimeData = await getTopicRealtimeData(`${args.topic}`);
      return {
        content: [{ type: "text", text: `${realtimeData}` }],
      };
    }
  );

  async function runServer() {
    const transport = new StdioServerTransport();
    const serverConnect = await server.connect(transport);
    console.error("SupOS MCP Server running on stdio");
    return serverConnect;
  }

  runServer().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });
}

async function main() {
  try {
    createMcpServer();
    getAllTopicRealtimeData();
  } catch (error) {
    console.error("Error in main():", error);
    process.exit(1);
  }
}

main();

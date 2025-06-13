#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fetch from "node-fetch";
import { z } from "zod";
import fs, { readFileSync } from "fs";
import _ from "lodash";
import mqtt from "mqtt";
import { pathToFileURL } from "url";
import { PgClient, PgConfig } from "./pgClient.js";
import { parse as parsePgUrl } from "pg-connection-string";

import { createFilePath } from "./utils.js";

let SUPOS_API_URL = process.env.SUPOS_API_URL;
let SUPOS_API_KEY = process.env.SUPOS_API_KEY;
let SUPOS_MQTT_URL = process.env.SUPOS_MQTT_URL;
let SUPOS_PG_URL = process.env.SUPOS_PG_URL;
let pgConfig: PgConfig | undefined = undefined;

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

if (SUPOS_PG_URL) {
  // 解析postgresql://user:password@host:port/db-name
  const parsed = parsePgUrl(SUPOS_PG_URL);
  pgConfig = {
    user: parsed.user || "",
    host: parsed.host || "",
    database: parsed.database || "",
    password: parsed.password || "",
    port: parsed.port ? parseInt(parsed.port) : 5432,
  };
}

const filePath = createFilePath();
const fileUri = pathToFileURL(filePath).href;

async function getModelTopicDetail(topic: string): Promise<any> {
  const url = `${SUPOS_API_URL}/open-api/supos/uns/model?topic=${encodeURIComponent(topic)}`;

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

// async function graphqlQuery(
//   graphqlDatabase: string,
//   fields: any[],
//   whereCT: { start: string; end: string },
//   limit: number
// ): Promise<any> {
//   const url = `${SUPOS_API_URL}/hasura/home/v1/graphql`;
//   const fieldsString = fields.map((field) => `${field.name}`).join("\n");
//   let whereCTString = `{}`;
//   if (whereCT.start && whereCT.end) {
//     whereCTString = `{_ct: {_lt: "${whereCT.end}", _gt: "${whereCT.start}"}}`;
//   }
//   const query = `
//     query MyQuery {
//     ${graphqlDatabase}(order_by: {_id: desc}, limit: ${limit},where: ${whereCTString}) {
//       _ct
//       _id
//       ${fieldsString}
//     }
//     }`;

//   const response = await fetch(url, {
//     method: "POST",
//     headers: {
//       apiKey: `${SUPOS_API_KEY}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       query: query,
//       variables: {},
//     }),
//   });

//   if (!response.ok) {
//     throw new Error(`SupOS API error: ${response.statusText}`);
//   }

//   return await response.json();
// }

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
    const cacheJson = JSON.stringify(Object.fromEntries(Array.from(cache)), null, 2);
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

async function querySqlByPg(sql: string, params?: any[]) {
  if (!pgConfig) {
    return "未配置SUPOS_PG_URL环境变量";
  }
  const client = new PgClient(pgConfig);
  try {
    const result = await client.query(sql, params);
    await client.disconnect();
    return result;
  } catch (err: any) {
    await client.disconnect();
    return err.message;
  }
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
      key: z.string().optional().describe("Fuzzy search keyword for child nodes"),
      showRec: z.boolean().optional().describe("Is show recommend topic"),
      type: z.string().optional().describe("Search type: 1--Text search, 2--Tag search"),
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

  server.tool("get-model-topic-detail", { topic: z.string() }, async (args: any) => {
    const detail = await getModelTopicDetail(args.topic);
    return {
      content: [{ type: "text", text: `${JSON.stringify(detail)}` }],
    };
  });

  // server.tool(
  //   "get-topic-history-data-by-graphql",
  //   {
  //     topic: z.string().describe("Topic name"),
  //     limit: z.number().optional().describe("Limit number of records"),
  //     startTime: z
  //       .string()
  //       .optional()
  //       .describe(
  //         `Start time in ISO 8601 format, e.g., 2025-04-13T00:00:00Z. If not specified, defaults to one week before the current time: ${new Date(
  //           new Date().getTime() - 7 * 24 * 60 * 60 * 1000
  //         ).toISOString()}`
  //       ),
  //     endTime: z
  //       .string()
  //       .optional()
  //       .describe(
  //         `End time in ISO 8601 format, e.g., 2025-04-20T23:59:59Z. If not specified, defaults to the current time: ${new Date().toISOString()}`
  //       ),
  //   },
  //   async (args: any) => {
  //     const detail = await getModelTopicDetail(args.topic);
  //     const database = detail?.data?.alias || "";
  //     const fields = detail?.data?.fields || [];
  //     if (database) {
  //       const history = await graphqlQuery(
  //         database,
  //         fields,
  //         { start: args.startTime, end: args.endTime },
  //         args.limit || 10
  //       );
  //       return {
  //         content: [{ type: "text", text: `${JSON.stringify(history)}` }],
  //       };
  //     } else {
  //       return {
  //         content: [{ type: "text", text: "Failed to query alias" }],
  //       };
  //     }
  //   }
  // );

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

  server.tool("get-topic-realtime-data", { topic: z.string() }, async (args: any) => {
    const realtimeData = await getTopicRealtimeData(`${args.topic}`);
    return {
      content: [{ type: "text", text: `${realtimeData}` }],
    };
  });

  server.tool(
    "pg-query-sql",
    {
      sql: z.string().describe("The SQL statement to be executed"),
      params: z.array(z.any()).optional().describe("SQL parameter array, optional"),
    },
    async (args: any) => {
      const result = await querySqlByPg(args.sql, args.params);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "get-topic-history-data-by-pg",
    {
      prompt: z
        .string()
        .describe("用户输入的查询topic历史数据的提示语，注意和get-topic-query-sql所需的提示语区分"),
    },
    async (args: any) => {
      return {
        content: [
          {
            type: "text",
            text: `分析用户输入的prompt：${args.prompt}，如果用户需要查询某个topic的历史数据，可以采用以下流程进行：先查询topic的详情，获取表名和属性字段等，再生成sql语句进行pg数据库查询，其中_ct代表是createTime字段`,
          },
        ],
      };
    }
  );

  server.tool(
    "get-topic-query-sql",
    {
      prompt: z.string().describe("用户输入的查询topic sql语句的提示语"),
    },
    async (args: any) => {
      return {
        content: [
          {
            type: "text",
            text: `分析用户输入的prompt：${args.prompt}，如果用户需要根据topic生成查询sql，可以采用以下流程进行：先查询topic的详情，获取表名和属性字段等，再生成sql语句，其中_ct是默认的createTime字段`,
          },
        ],
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

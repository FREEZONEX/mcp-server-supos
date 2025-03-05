#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fetch from "node-fetch";
import { z } from "zod";
import _ from "lodash";

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

const SUPOS_API_KEY =
  process.env.SUPOS_API_KEY;
const SUPOS_API_URL =
  process.env.SUPOS_API_URL || "http://office.unibutton.com:11488";

if (!SUPOS_API_KEY) {
  console.error("SUPOS_API_KEY environment variable is not set");
  process.exit(1);
}

type TreeNode = {
  name: string;
  countChildren: number;
  path: string;
  children: TreeNode[];
};

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

// server.prompt("Show all topic", async () => {
//   const treeNotes: TreeNode =
//     (await getModelTopicTree({ key: "" }))?.data || {};
//   return {
//     messages: [
//       {
//         role: "user",
//         content: {
//           type: "text",
//           text: JSON.stringify(treeNotes),
//         },
//       },
//       {
//         role: "user",
//         content: {
//           type: "text",
//           text: "请根据以上数据生成json文件,且支持下载,并将数据可视化展示",
//         },
//       },
//     ],
//   };
//   // return {
//   //   prompts: [
//   //     {
//   //       name: "summarize_treeNotes",
//   //       description: "获取树节点资源",
//   //     }
//   //   ]
//   // };
// });

server.tool(
  "get-model-topic-tree",
  {
    key: z.string().optional().describe("Fuzzy search keyword for child nodes"),
    showRec: z.boolean().optional().describe("Is show recommend topic"),
    type: z
      .string()
      .optional()
      .describe("Search type: 1--Text search, 2--Tag search"),
  },
  async (args) => {
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

server.tool("get-model-topic-detail", {topic: z.string()}, async (args) => {
  const detail = await getModelTopicDetail(args.topic);
  return {
    content: [{ type: "text", text: `${JSON.stringify(detail)}` }],
  };
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SupOS MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

# supOS MCP Server

MCP 服务器用于supOS open-api，支持查询topic树结构，topic详情等。
本服务基于typescript-sdk开发，需要具备Node.js环境

## Tools

1. `get-model-topic-tree`
   - 查询topic 树结构菜单数据
   - 输入:
     - `key` (string): Fuzzy search keyword for child nodes
     - `showRec` (string): Number of records to display
     - `type` (string): Search type: 1--Text search, 2--Tag search
   - 返回: topic 树结构菜单数据

2. `get-model-topic-detail`
   - 获取某个topic详情
   - 输入:
     - `topic` (string): The topic path corresponding to the model
   - 返回: 某个topic详情

## Setup

### 获取apiKey
登录[supOS社区版](http://office.unibutton.com:11488/)，进入DataModeling菜单 -> 查看某个具体的topic详情，找到Data Operation -> Fetch，复制ApiKey

### 使用 Claude Desktop
这里以Claude Desktop App为例，想了解其他支持的客户端可访问[Model Context Protocol Client](https://modelcontextprotocol.io/clients)。

添加以下内容到`claude_desktop_config.json`，可使用以下两种方式使用该服务:

### 1.使用 mcp-server-supos
 - NPX

```json
{
  "mcpServers": {
    "supos": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-server-supos"
      ],
      "env": {
        "SUPOS_API_KEY": "<API_KEY>",
        "SUPOS_API_URL": "<API_URL>"
      }
    }
  }
}
```

- 由于Windows环境下`npx`执行可能有环境变量的问题，可以先本地安装`mcp-server-supos`包，再用`node`本地执行：

```bash
npm install mcp-server-supos -g
```

```json
{
  "mcpServers": {
    "supos": {
      "command": "node",
      "args": [
        "C://Users//xxx//AppData//Roaming//npm//node_modules//mcp-server-supos//dist//index.js"
      ],
      "env": {
        "SUPOS_API_KEY": "<API_KEY>",
        "SUPOS_API_URL": "<API_URL>"
      }
    }
  }
}
```

### 2.下载该项目本地执行

Install
```bash
npm ci
```

Build
```bash
npm run build
```

```json
{
  "mcpServers": {
    "supos": {
      "command": "node",
      "args": [
        "<本地项目地址>//dist//index.js"
      ],
      "env": {
        "SUPOS_API_KEY": "<API_KEY>",
        "SUPOS_API_URL": "<API_URL>"
      }
    }
  }
}
```

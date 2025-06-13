[English][readme-en-link] | **简体中文**

# supOS MCP Server

本MCP服务器是基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) 协议提供的 `typescript-sdk` 进行开发，可以让任何支持MCP协议的客户端使用它。

它提供了一系列supOS的open-api，例如：查询topic树结构，topic详情等。

<a href="https://glama.ai/mcp/servers/7ayh12mg77">
   <img width="380" height="200" src="https://glama.ai/mcp/servers/7ayh12mg77/badge" alt="supOS Server MCP server" />
 </a>

## 支持的API

### Tools

1. `get-topic-tree`

   - 查询 topic 树结构菜单数据
   - 输入:
     - `key` (string): Fuzzy search keyword for child nodes
     - `showRec` (boolean): Number of records to display
     - `type` (string): Search type: 1--Text search, 2--Tag search
   - 返回: topic 树结构菜单数据

2. `get-topic-detail`
   - 获取某个topic详情
   - 输入:
     - `topic` (string): The topic path corresponding to the model
   - 返回: 某个topic详情
3. `get-topic-realtime-data`
   - 获取某个topic的实时数据
   - 输入:
     - `topic` (string): The topic path corresponding to the model
   - 返回: 某个topic实时数据
4. `get-all-topic-realtime-data`
   - 获取所有topic的实时数据并分析
   - 返回: 所有topic实时数据
5. `pg-query-sql`
   - 对pg数据库进行sql查询
   - 输入:
     - `sql` (string): The SQL statement to be executed
     - `params` (array): SQL parameter array, optional
   - 返回：sql查询结果
6. `get-topic-history-data-by-pg`
   - 获取某个topic的历史数据
   - 输入:
     - `prompt` (string): The prompt message input by the user for querying the historical data of the topic
   - 返回：查询topic历史数据的分步流程提示语，便于分步调用工具获取历史数据
7. `get-topic-query-sql`
   - 获取查询某个topic的sql语句
   - 输入:
     - `prompt` (string): The prompt of the sql statement input by the user for querying the topic
   - 返回：查询topic的分步流程提示语，便于分步调用工具并生成sql语句

**_接下来跟随文档一起使用吧_**

## 开始使用

### 系统要求

- Node.js

### 安装客户端

目前支持MCP协议的客户端已有很多，比如桌面端应用 `Claude for Desktop`，或者IDE的一些插件等（`VSCode` 的 `Cline` 插件），想了解已支持的客户端可访问 [Model Context Protocol Client](https://modelcontextprotocol.io/clients)。

这里以 `Claude for Desktop` 为例。

- 下载 [Claude for Desktop](https://claude.ai/download)。
- 为 `Claude for Desktop` 配置所需的MCP 服务器。

- - 在文本编辑器中打开您的 `Claude for Desktop` 配置：`~/Library/Application Support/Claude/claude_desktop_config.json`。
- - 也可以通过 `File -> Setting -> Developer` 点击 `Edit Config` 找到该配置文件位置：
    ![alt text](./public/image.png)
    ![alt text](./public/image-1.png)
    ![alt text](./public/image-6.png)
- - 打开配置文件后，添加以下内容到 `claude_desktop_config.json`中，并重启应用:  
    _注意：每次修改该配置文件后都需要重启应用才会生效。_

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
                "SUPOS_API_URL": "<API_URL>",
                "SUPOS_MQTT_URL": "<MQTT_URL>",
                "SUPOS_PG_URL": "<PG_URL>"
              }
            }
          }
        }
        ```

- - 其中 `API_URL` 是可访问的 supOS社区版 地址，您可以从 [这里](https://supos.ai/trial) 进行尝试。`API_KEY` 是 open-api 访问所需的密钥。`MQTT_URL`可通过访问 `UNS -> MqttBroker -> Listeners` 查看可订阅的地址。`PG_URL` 是访问 pg 数据库所需的 url，格式：`postgresql://user:password@host:port/db-name`

**注意：以上配置MCP服务器是借助 `npx` 拉取 `mcp-server-supos` npm包并在本地运行的方式给客户端提供服务。但 `npx` 在 `Windows` 系统下读取环境变量 `env` 配置时可能会出错，因此可以采用下面方式解决：**

### 本地运行服务

以下两种方式选择一种即可：

- 本地安装 `mcp-server-supos`，并通过node运行

1. Install

```bash
npm install mcp-server-supos -g
```

2. 找到安装的包路径，例如： `"C://Users//<USER_NAME>//AppData//Roaming//npm//node_modules//mcp-server-supos//dist//index.js"`

3. 修改 `claude_desktop_config.json` 的配置，并重启应用

```json
{
  "mcpServers": {
    "supos": {
      "command": "node",
      "args": [
        "C://Users//<USER_NAME>//AppData//Roaming//npm//node_modules//mcp-server-supos//dist//index.js"
      ],
      "env": {
        "SUPOS_API_KEY": "<API_KEY>",
        "SUPOS_API_URL": "<API_URL>",
        "SUPOS_MQTT_URL": "<MQTT_URL>",
        "SUPOS_PG_URL": "<PG_URL>"
      }
    }
  }
}
```

- 下载本仓库源码本地编译执行

1. 复制仓库:

```bash
git clone https://github.com/FREEZONEX/mcp-server-supos.git
```

2. 安装依赖

```bash
npm ci
```

3. 编译

```bash
npm run build
```

4. 修改 `claude_desktop_config.json` 的配置，并重启应用

```json
{
  "mcpServers": {
    "supos": {
      "command": "node",
      "args": ["<本地项目地址>//dist//index.js"],
      "env": {
        "SUPOS_API_KEY": "<API_KEY>",
        "SUPOS_API_URL": "<API_URL>",
        "SUPOS_MQTT_URL": "<MQTT_URL>",
        "SUPOS_PG_URL": "<PG_URL>"
      }
    }
  }
}
```

### 结语

以上就是使用该服务的全部教程，配置成功后可在以下面板中看到对应的服务和工具等：
![alt text](./public/image-2.png)
![alt text](./public/image-3.png)
![alt text](./public/image-4.png)

### 最后的最后

supOS社区版 已集成 `CopilotKit` 作者开源的 [open-mcp-client](https://github.com/CopilotKit/open-mcp-client)，并内置了 `mcp-server-supos` 服务，且支持ts版本的 `agent`。

## 许可证

本项目采用 Apache License 2.0 许可证 - 查看 [LICENSE](./LICENSE) 文件了解详情。

<!-- Links -->

[readme-en-link]: ./README.md

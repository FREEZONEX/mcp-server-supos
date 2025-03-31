# supOS MCP Server

本MCP服务器是基于Model Context Protocol (MCP)[https://modelcontextprotocol.io/introduction]协议提供的typescript-sdk进行开发，可以让任何支持MCP协议的客户端使用它。
它提供了一系列supOS open-api的功能，例如：查询topic树结构，topic详情等。

接下来跟随文档一起使用吧

# 系统要求
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
3. `get-topic-realtime-data`
   - 获取某个topic的实时数据
   - 输入:
     - `topic` (string): The topic path corresponding to the model
   - 返回: 某个topic实时数据
4. `get-all-topic-realtime-data`
   - 获取所有topic的实时数据并分析
   - 返回: 所有topic实时数据

***接下来跟随文档一起使用吧***

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
*注意：每次修改该配置文件后都需要重启应用才会生效。*

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
            "SUPOS_MQTT_URL": "<MQTT_URL>"
          }
        }
      }
    }
    ```
- - 其中 `API_URL` 是可访问的[supOS社区版](https://supos-demo.supos.app/)地址。`API_KEY` 可通过登录社区版后，进入 `DataModeling -> 查看某个具体的topic详情 -> Data Operation -> Fetch`，找到对应的ApiKey复制即可，`MQTT_URL`可通过访问 `UNS -> MqttBroker -> Listeners` 查看可订阅的地址。

- NODE

由于Windows环境下`npx`执行可能有环境变量的问题，可以先本地安装`mcp-server-supos`包，再用`node`本地执行：

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
        "SUPOS_API_URL": "<API_URL>",
        "SUPOS_MQTT_URL": "<MQTT_URL>"
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
        "SUPOS_API_URL": "<API_URL>",
        "SUPOS_MQTT_URL": "<MQTT_URL>"
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
[supOS社区版](https://supos-demo.supos.app/) 已集成 `CopilotKit` 作者开源的 [open-mcp-client](https://github.com/CopilotKit/open-mcp-client)，并内置了 `mcp-server-supos` 服务，且支持ts版本的 `agent`，源码可访问 [supOS-CE-McpClient](https://github.com/FREEZONEX/supOS-CE-McpClient)。
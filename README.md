**English** | [中文][readme-zh-link]

# supOS MCP Server

[![smithery badge](https://smithery.ai/badge/@FREEZONEX/mcp-server-supos)](https://smithery.ai/server/@FREEZONEX/mcp-server-supos)

This MCP server is developed based on the `typescript-sdk` provided by the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) protocol, allowing any client that supports the MCP protocol to use it.

It provides a series of supOS open-apis, such as querying topic tree structure, topic details, etc.

<a href="https://glama.ai/mcp/servers/7ayh12mg77">
   <img width="380" height="200" src="https://glama.ai/mcp/servers/7ayh12mg77/badge" alt="supOS Server MCP server" />
 </a>

## Supported APIs

### Tools

1. `get-topic-tree`

   - Query topic tree structure menu data
   - Input:
     - `key` (string): Fuzzy search keyword for child nodes
     - `showRec` (boolean): Number of records to display
     - `type` (string): Search type: 1--Text search, 2--Tag search
   - Returns: topic tree structure menu data

2. `get-topic-detail`

   - Get details of a specific topic
   - Input:
     - `topic` (string): The topic path corresponding to the model
   - Returns: details of a specific topic

3. `get-topic-realtime-data`

   - Get real-time data of a specific topic
   - Input:
     - `topic` (string): The topic path corresponding to the model
   - Returns: real-time data of a specific topic

4. `get-all-topic-realtime-data`

   - Get and analyze real-time data of all topics
   - Returns: real-time data of all topics

5. `pg-query-sql`

   - Execute SQL queries on the pg database
   - Input:
     - `sql` (string): The SQL statement to be executed
     - `params` (array): SQL parameter array, optional
   - Returns: SQL query result

6. `get-topic-history-data-by-pg`

   - Get historical data of a specific topic
   - Input:
     - `prompt` (string): The prompt message input by the user for querying the historical data of the topic
   - Returns: Step-by-step prompt for querying topic historical data, convenient for step-by-step tool calls to obtain historical data

7. `get-topic-query-sql`

   - Get the SQL statement for querying a specific topic
   - Input:
     - `prompt` (string): The prompt of the SQL statement input by the user for querying the topic
   - Returns: Step-by-step prompt for querying the topic, convenient for step-by-step tool calls and generating SQL statements

**_Let's follow the documentation to start using it_**

## Getting Started

### System Requirements

- Node.js

### Installing Client

Currently, there are many clients that support the MCP protocol, such as desktop applications like `Claude for Desktop`, or IDE plugins (like the `Cline` plugin for `VSCode`). To learn about supported clients, visit [Model Context Protocol Client](https://modelcontextprotocol.io/clients).

Here we'll use `Claude for Desktop` as an example.

- Download [Claude for Desktop](https://claude.ai/download).
- Configure the required MCP server for `Claude for Desktop`.

- - Open your `Claude for Desktop` configuration in a text editor: `~/Library/Application Support/Claude/claude_desktop_config.json`.
- - You can also find this configuration file location by clicking `Edit Config` in `File -> Setting -> Developer`:
    ![alt text](./public/image.png)
    ![alt text](./public/image-1.png)
    ![alt text](./public/image-6.png)
- - After opening the configuration file, add the following content to `claude_desktop_config.json` and restart the application:  
    _Note: The application needs to be restarted after each modification of this configuration file for changes to take effect._

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

- - Where `API_URL` is the accessible address of supOS Community Edition, you can try the entry point from [here](https://supos.ai/trial). `API_KEY` is the key required for open-api access. `MQTT_URL` can be found by visiting `UNS -> MqttBroker -> Listeners` to view the subscribable address.`PG_URL` is the URL required to access the pg database, format: `postgresql://user:password@host:port/db-name`

**Note: The above configuration of the MCP server uses `npx` to pull the `mcp-server-supos` npm package and run it locally to provide services to clients. However, `npx` may have issues reading environment variable `env` configurations on `Windows` systems, so the following solutions can be adopted:**

### Running Service Locally

Choose one of the following two methods:

- Install `mcp-server-supos` locally and run it through node

1. Install

```bash
npm install mcp-server-supos -g
```

2. Find the installed package path, for example: `"C://Users//<USER_NAME>//AppData//Roaming//npm//node_modules//mcp-server-supos//dist//index.js"`

3. Modify the configuration in `claude_desktop_config.json` and restart the application

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

- Download and compile the repository source code locally

1. Clone the repository:

```bash
git clone https://github.com/FREEZONEX/mcp-server-supos.git
```

2. Install dependencies

```bash
npm ci
```

3. Build

```bash
npm run build
```

4. Modify the configuration in `claude_desktop_config.json` and restart the application

```json
{
  "mcpServers": {
    "supos": {
      "command": "node",
      "args": ["<local project path>//dist//index.js"],
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

### Conclusion

That's the complete tutorial for using this service. After successful configuration, you can see the corresponding services and tools in the following panels:
![alt text](./public/image-2.png)
![alt text](./public/image-3.png)
![alt text](./public/image-4.png)

### Installing via Smithery

To install supOS MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@FREEZONEX/mcp-server-supos):

```bash
npx -y @smithery/cli install @FREEZONEX/mcp-server-supos --client claude
```

### Final Note

supOS Community Edition has integrated the [open-mcp-client](https://github.com/CopilotKit/open-mcp-client) open-sourced by `CopilotKit` authors, and built-in the `mcp-server-supos` service, supporting ts version `agent`.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](./LICENSE) file for details.

<!-- Links -->

[readme-zh-link]: ./README-zh.md

import fs from "fs";
import path from "path";

export function createFilePath(
  filedir: string = ".cache",
  filename: string = "all_topic_realdata.json"
) {
  // 获取项目根路径
  const rootPath = process.cwd();
  // 获取 __dirname
  // const __filename = fileURLToPath(import.meta.url);
  // const __dirname = path.dirname(__filename);

  // 创建缓存目录
  const filePath = path.resolve(rootPath, filedir, filename);
  // const fileUri = pathToFileURL(filePath).href;

  const dirPath = path.dirname(filePath);

  // 检查目录是否存在，如果不存在则创建
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  return filePath;
}

export function readFileSync(filePath: string, options: any) {
  try {
    return fs.readFileSync(filePath, options);
  } catch (err) {
    return `读取文件时出错: ${err}`;
  }
}

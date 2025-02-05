import {URI} from "vscode-uri";
import {IFolder} from "./handler";
import {FileOperations} from "./file_operations";
import * as LServer from "vscode-languageserver";
import * as abaplint from "@abaplint/core";
import * as path from "path";

export class Setup {
  private readonly connection: LServer.Connection;

  public constructor(connection: LServer.Connection) {
    this.connection = connection;
  }

  public determineFolders(workspaces: LServer.WorkspaceFolder[] | null): IFolder[] {
    const ret: IFolder[] = [];

    if (workspaces) {
      for (const workspace of workspaces) {
        ret.push({
          root: URI.parse(workspace.uri).fsPath,
          glob: "/src/**/*.*"});  // todo, this should be taken from abaplint.json
      }
    }

    this.connection.console.log("Folder overview:");
    for (const folder of ret) {
      this.connection.console.log(folder.root + " " + folder.glob);
    }
    return ret;
  }

  public async readConfig(folders: IFolder[]) {

    const raw = await this.findCustomConfig(folders);
    if (raw && raw !== "") {
      this.connection.console.log("custom abaplint configuration found");
      const config = new abaplint.Config(raw);
      folders[0].glob = config.get().global.files;
      return config;
    }

    this.connection.console.log("no custom abaplint config, using defaults");
    return abaplint.Config.getDefault();
  }

  private async findCustomConfig(folders: IFolder[]): Promise<string | undefined> {
    if (folders.length === 0 || folders[0] === undefined) {
      return undefined;
    }

    const prefix = folders[0].root + path.sep;

    try {
      return await FileOperations.readFile(prefix + "abaplint.json");
    // eslint-disable-next-line no-empty
    } catch {}

    try {
      return await FileOperations.readFile(prefix + "abaplint.jsonc");
    // eslint-disable-next-line no-empty
    } catch {}

    try {
      return await FileOperations.readFile(prefix + "abaplint.json5");
    // eslint-disable-next-line no-empty
    } catch {}

    return undefined;
  }

}
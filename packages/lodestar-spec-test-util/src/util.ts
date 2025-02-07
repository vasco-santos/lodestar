import fs from "fs";
import {loadYaml} from "@chainsafe/lodestar-utils";

export function isDirectory(path: string): boolean {
  return fs.lstatSync(path).isDirectory();
}

export function loadYamlFile(path: string): object {
  return loadYaml(fs.readFileSync(path, "utf8"));
}

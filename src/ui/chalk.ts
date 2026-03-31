import chalk from "chalk";

// Bancolombia brand: #FDDA24 (yellow), #003DA5 (blue)
export const bancoYellow = chalk.hex("#FDDA24");
export const bancoYellowBold = chalk.hex("#FDDA24").bold;
export const bancoBlue = chalk.hex("#003DA5");
export const bancoBlueBold = chalk.hex("#003DA5").bold;

// Semantic colors
export const success = chalk.green;
export const error = chalk.red;
export const warn = chalk.yellow;
export const hint = chalk.cyan;
export const dim = chalk.dim;
export const bold = chalk.bold;

// Status indicators
export const ok = (msg: string) => `  ${success("\u2713")} ${msg}`;
export const fail = (msg: string) => `  ${error("error")} ${msg}`;
export const warning = (msg: string) => `  ${warn("warning")} ${msg}`;
export const info = (msg: string) => `  ${dim("\u2022")} ${msg}`;

export { chalk };

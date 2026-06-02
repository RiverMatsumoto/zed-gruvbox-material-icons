import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { generateManifest } from "material-icon-theme";
import { join } from "node:path";
import { getTheme } from "./theme";
import type { IconTheme } from "./types/icon-theme";

const EXTENSION_NAME = "Gruvbox Material Icon Theme";
const EXTENSION_AUTHOR = "River M";
const ICON_THEME_SCHEMA = "https://zed.dev/schema/icon_themes/v0.3.0.json";

const manifest = generateManifest();
const zedIconTheme = getTheme(manifest);

// Copy icons from node_modules to the icons directory
const iconsSourceDir = join(
  __dirname,
  "../node_modules/material-icon-theme/icons",
);
const iconsDestDir = join(__dirname, "../icons");
if (!existsSync(iconsDestDir)) {
  mkdirSync(iconsDestDir, { recursive: true });
}
readdirSync(iconsSourceDir).forEach((file) => {
  const sourceFile = join(iconsSourceDir, file);
  const destFile = join(iconsDestDir, file);
  copyFileSync(sourceFile, destFile);
});

const extensionRoot = join(__dirname, "..");

const iconExists = (path: string | undefined): path is string =>
  Boolean(path && existsSync(join(extensionRoot, path.replace("./", ""))));

const pruneUnavailableIcons = (theme: IconTheme): IconTheme => {
  const file_icons = Object.fromEntries(
    Object.entries(theme.file_icons).filter(([, icon]) => iconExists(icon.path)),
  );
  const validIconKeys = new Set(Object.keys(file_icons));

  return {
    ...theme,
    file_icons,
    file_suffixes: Object.fromEntries(
      Object.entries(theme.file_suffixes).filter(([, iconKey]) =>
        validIconKeys.has(iconKey),
      ),
    ),
    file_stems: Object.fromEntries(
      Object.entries(theme.file_stems).filter(([, iconKey]) =>
        validIconKeys.has(iconKey),
      ),
    ),
    named_directory_icons: Object.fromEntries(
      Object.entries(theme.named_directory_icons).filter(([, icon]) =>
        iconExists(icon.collapsed) && iconExists(icon.expanded),
      ),
    ),
  };
};

const zedManifest = {
  $schema: ICON_THEME_SCHEMA,
  name: EXTENSION_NAME,
  author: EXTENSION_AUTHOR,
  themes: [pruneUnavailableIcons(zedIconTheme)],
};

writeFileSync(
  join(__dirname, "../icon_themes", "gruvbox-material-icon-theme.json"),
  `${JSON.stringify(zedManifest, null, 2)}\n`,
);

console.log("Gruvbox Material Icon Theme icons copied successfully.");

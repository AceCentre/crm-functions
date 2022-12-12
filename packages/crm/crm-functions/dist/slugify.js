"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = void 0;
const slugify = (input) => input
    .toLowerCase()
    .split(" ")
    .map((x) => x.trim())
    .join("-");
exports.slugify = slugify;

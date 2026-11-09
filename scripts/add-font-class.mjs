#!/usr/bin/env node
// Menambahkan class `font-sans` (Inter, lihat tailwind.config.js) ke className setiap
// <Text> dan <TextInput> milik "react-native" di berkas .tsx.
//
// Pemakaian:
//   node scripts/add-font-class.mjs            -> simulasi (tidak mengubah berkas)
//   node scripts/add-font-class.mjs --write    -> menulis perubahan
//   node scripts/add-font-class.mjs path/lain  -> folder selain "src"
//
// Memakai parser TypeScript (bukan regex), jadi tahan terhadap atribut multi-baris dan
// className berbentuk string, template, atau ternary berisi string. Bentuk lain
// (mis. className={className} atau cn(...)) tidak diubah otomatis dan dilaporkan.
// Idempoten: elemen yang sudah punya font-sans dilewati. Jalankan setelah commit.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, sep } from "node:path";
import ts from "typescript";

const args = process.argv.slice(2);
const write = args.includes("--write");
const root = args.find((a) => !a.startsWith("--")) ?? "src";
const WRAPPED = ["Text", "TextInput"];
const CLASS = "font-sans";

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (full.endsWith(".tsx")) yield full;
  }
}

// Nama lokal yang terikat ke Text/TextInput dari react-native (termasuk alias dan namespace)
function collectBindings(sf) {
  const locals = new Set();
  const namespaces = new Set();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st)) continue;
    if (!ts.isStringLiteral(st.moduleSpecifier) || st.moduleSpecifier.text !== "react-native") continue;
    const nb = st.importClause?.namedBindings;
    if (!nb || st.importClause?.isTypeOnly) continue;
    if (ts.isNamespaceImport(nb)) namespaces.add(nb.name.text);
    else {
      for (const el of nb.elements) {
        if (el.isTypeOnly) continue;
        if (WRAPPED.includes((el.propertyName ?? el.name).text)) locals.add(el.name.text);
      }
    }
  }
  return { locals, namespaces };
}

function isRnTextTag(tag, { locals, namespaces }) {
  if (ts.isIdentifier(tag)) return locals.has(tag.text);
  return (
    ts.isPropertyAccessExpression(tag) &&
    ts.isIdentifier(tag.expression) &&
    namespaces.has(tag.expression.text) &&
    WRAPPED.includes(tag.name.text)
  );
}

const hasClass = (text) => text.split(/\s+/).includes(CLASS);

// Menyisipkan `font-sans ` di awal literal; false bila bentuknya tidak dikenali
function prepend(expr, sf, edits) {
  if (ts.isParenthesizedExpression(expr)) return prepend(expr.expression, sf, edits);
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    if (!hasClass(expr.text)) {
      edits.push({ pos: expr.getStart(sf) + 1, text: expr.text.trim() ? `${CLASS} ` : CLASS });
    }
    return true;
  }
  if (ts.isTemplateExpression(expr)) {
    if (!hasClass(expr.head.text)) edits.push({ pos: expr.head.getStart(sf) + 1, text: `${CLASS} ` });
    return true;
  }
  if (ts.isConditionalExpression(expr)) {
    return prepend(expr.whenTrue, sf, edits) && prepend(expr.whenFalse, sf, edits);
  }
  return false;
}

const changed = [];
const manual = [];
let elementCount = 0;

for (const file of walk(root)) {
  const path = file.split(sep).join("/");
  const source = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const bindings = collectBindings(sf);
  if (bindings.locals.size === 0 && bindings.namespaces.size === 0) continue;

  const edits = [];
  let elements = 0;
  const where = (node) => `${path}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`;

  const visit = (node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && isRnTextTag(node.tagName, bindings)) {
      const props = node.attributes.properties;
      const attr = props.find((p) => ts.isJsxAttribute(p) && p.name.getText(sf) === "className");
      const spread = props.some((p) => ts.isJsxSpreadAttribute(p));

      if (!attr) {
        // Disisipkan tepat setelah nama tag, sebelum atribut lain
        edits.push({ pos: node.tagName.getEnd(), text: ` className="${CLASS}"` });
        elements++;
        if (spread) manual.push(`${where(node)}: ada {...props}; periksa apakah props membawa className`);
      } else {
        const init = attr.initializer;
        const target = init && ts.isJsxExpression(init) ? init.expression : init;
        const local = [];
        if (target && prepend(target, sf, local)) {
          if (local.length) elements++;
          edits.push(...local);
        } else {
          manual.push(`${where(node)}: className berbentuk ekspresi (${target ? ts.SyntaxKind[target.kind] : "kosong"}); tambahkan "${CLASS}" manual`);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  if (edits.length === 0) continue;
  let next = source;
  for (const e of edits.sort((a, b) => b.pos - a.pos)) next = next.slice(0, e.pos) + e.text + next.slice(e.pos);
  changed.push(`${path} (${elements} elemen)`);
  elementCount += elements;
  if (write) writeFileSync(file, next, "utf8");
}

console.log(write ? "MODE TULIS\n" : "SIMULASI (tidak ada berkas diubah; tambahkan --write untuk menerapkan)\n");
console.log(`Berkas ${write ? "diubah" : "akan diubah"}: ${changed.length} (total ${elementCount} elemen)`);
for (const f of changed) console.log(`  + ${f}`);
if (manual.length) {
  console.log(`\nPerlu ditangani manual: ${manual.length}`);
  for (const m of manual) console.log(`  ! ${m}`);
}

#!/usr/bin/env node
// MD SDD Hub · hook de Claude Code (UserPromptSubmit / SessionStart).
// Si la persona ha editado .md desde MD SDD Hub y la IA aún no los ha revisado,
// imprime un recordatorio que Claude Code añade al contexto. Sin avisos, no imprime nada.
// Idioma: el del kit instalado en el proyecto (.sdd.json o la marca «lang» de .skills/sdd/SKILL.md).
'use strict';
const fs = require('fs');
const path = require('path');

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const dir = path.join(root, '.sdd', 'review');
let lang = 'es';
try { if (/lang en/.test(fs.readFileSync(path.join(root, '.skills', 'sdd', 'SKILL.md'), 'utf8'))) lang = 'en'; } catch {}
try { const m = JSON.parse(fs.readFileSync(path.join(root, '.sdd.json'), 'utf8')); if (m.lang === 'en' || m.lang === 'es') lang = m.lang; } catch {}

let files = [];
try {
  files = fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'))
    .map((e) => e.name);
} catch {
  process.exit(0);
}
if (!files.length) process.exit(0);

const T = {
  es: {
    change: (n) => `${n} cambio${n === 1 ? '' : 's'}`,
    more: (n) => `- … y ${n} más`,
    head: (n) => `[MD SDD Hub] La persona ha modificado documentos desde MD SDD Hub y hay ${n} aviso(s) pendiente(s) de revisión:\n`,
    tail: '\nAntes de seguir con trabajo relacionado, revísalos siguiendo .skills/sdd/revision.md ' +
      '(lee el diff y el archivo actual, ajusta spec/tareas, escribe «## Resultado de la revisión» y mueve el aviso a .sdd/review/hecho/). ' +
      'Si la persona te pide otra cosa urgente, menciónale que hay revisiones pendientes. Responde siempre en español.\n',
  },
  en: {
    change: (n) => `${n} change${n === 1 ? '' : 's'}`,
    more: (n) => `- … and ${n} more`,
    head: (n) => `[MD SDD Hub] The user modified documents from MD SDD Hub and there are ${n} notice(s) pending review:\n`,
    tail: '\nBefore continuing with related work, review them following .skills/sdd/review.md ' +
      '(read the diff and the current file, adjust the spec/tasks, write "## Review result" and move the notice to .sdd/review/done/). ' +
      'If the user asks for something else urgent, mention that there are pending reviews. Always answer in English.\n',
  },
}[lang];

const lines = files.slice(0, 15).map((name) => {
  let target = '';
  try {
    const text = fs.readFileSync(path.join(dir, name), 'utf8');
    const m = text.match(/^- (?:Archivo|File): `([^`]+)`/m);
    const changes = (text.match(/^## (?:Cambio|Change) · /gm) || []).length;
    target = m ? ` → ${m[1]} (${T.change(changes)})` : '';
  } catch {}
  return `- .sdd/review/${name}${target}`;
});
if (files.length > 15) lines.push(T.more(files.length - 15));

process.stdout.write(T.head(files.length) + lines.join('\n') + T.tail);

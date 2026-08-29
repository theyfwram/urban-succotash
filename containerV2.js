// Discord Components V2 ("Container V2") message builder.
// Every bot message is rendered as a Container (type 17) with an accent color,
// text display (type 10), optional separator, and an action row of buttons.

import { IS_COMPONENTS_V2 } from "./constants.js";

export function textDisplay(content) {
  return { type: 10, content: String(content ?? "") };
}

export function separator(divider = true, spacing = "default") {
  return { type: 14, divider, spacing };
}

const STYLE_MAP = { primary: 1, secondary: 2, success: 3, danger: 4, link: 5 };

export function button(btn) {
  const style = STYLE_MAP[btn.style] || 1;
  const b = { type: 2, label: btn.label, style };
  if (btn.url) {
    b.style = 5;
    b.url = btn.url;
  } else if (btn.custom_id) {
    b.custom_id = btn.custom_id;
  }
  if (btn.emoji) b.emoji = typeof btn.emoji === "string" ? { name: btn.emoji } : btn.emoji;
  if (btn.disabled) b.disabled = true;
  return b;
}

export function actionRow(components) {
  return { type: 1, components };
}

export function container({ accentColor, components, spoiler }) {
  const c = { type: 17, components };
  if (accentColor != null) c.accent_color = accentColor;
  if (spoiler) c.spoiler = true;
  return c;
}

// Build a full Components V2 message payload from a template object.
// template: { title, description, footer, color, emoji, buttons: [{label,style,custom_id,url,emoji}] }
export function buildContainerMessage(template = {}) {
  const inner = [];
  const header = [];
  if (template.emoji) header.push(template.emoji);
  if (template.title) header.push(template.title);
  if (header.length) inner.push(textDisplay(`## ${header.join(" ")}`));
  if (template.description) inner.push(textDisplay(template.description));
  if (template.footer) {
    inner.push(separator(true, "small"));
    inner.push(textDisplay(template.footer));
  }
  if (Array.isArray(template.buttons) && template.buttons.length) {
    inner.push(actionRow(template.buttons.map(button)));
  }
  return {
    flags: IS_COMPONENTS_V2,
    components: [container({ accentColor: template.color ?? 5814273, components: inner })]
  };
}

// Build an interaction response (type 4) wrapping a Container V2 message.
export function containerResponse(template) {
  const msg = buildContainerMessage(template);
  return { type: 4, data: { flags: msg.flags, components: msg.components } };
}

// Replace {placeholders} in title/description/footer.
export function fillTemplate(template, vars = {}) {
  const fill = (s) => String(s ?? "").replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
  return {
    ...template,
    title: fill(template.title),
    description: fill(template.description),
    footer: fill(template.footer)
  };
}